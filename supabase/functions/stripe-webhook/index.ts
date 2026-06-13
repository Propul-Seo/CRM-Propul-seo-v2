// stripe-webhook — Sprint B.3.3
// Reçoit les webhooks Stripe et synchronise l'état des factures/acomptes.
//
// Événements traités :
//   - checkout.session.completed → marque la cible (invoice OU installment) en 'paid'.
//     Le trigger DB recalc_invoice_status_from_installments() recalcule
//     automatiquement le statut de la facture parent (paid / partially_paid).
//     Envoie également le template #35 payment-received au client.
//   - payment_intent.payment_failed → log dans audit_log (admin visible).
//
// Idempotence : insertion préalable dans propulspace.stripe_webhook_events
// (UNIQUE sur stripe_event_id). Si déjà reçu → 200 immédiat sans re-traiter.
//
// JWT verify : DOIT ÊTRE DÉSACTIVÉ pour cette fonction (Stripe n'envoie pas
// de JWT). À configurer dans supabase/config.toml ou via dashboard :
//   functions.stripe-webhook.verify_jwt = false
// La sécurité repose sur Stripe.constructEventAsync() qui vérifie la signature
// HMAC avec STRIPE_WEBHOOK_SECRET.
//
// Env requis :
//   - STRIPE_SECRET_KEY
//   - STRIPE_WEBHOOK_SECRET (whsec_…)
//   - BREVO_API_KEY (optionnel — email non envoyé si absent)
//   - PORTAL_BASE_URL (optionnel — défaut https://espace.propulseo-site.com)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { sendTransactional } from '../_shared/brevo.ts'

function plainResponse(body: string, status: number) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain' } })
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  })
}

interface SessionMetadata {
  target_type?: 'invoice' | 'installment'
  target_id?: string
  invoice_id?: string
  project_id?: string
  installment_number?: string
  invoice_number?: string
}

async function markInvoicePaid(
  supabaseAdmin: SupabaseClient,
  invoiceId: string,
  paymentIntentId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .schema('propulspace')
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntentId,
      stripe_paid_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .neq('status', 'paid') // idempotence : ne touche pas si déjà paid
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

async function markInstallmentPaid(
  supabaseAdmin: SupabaseClient,
  installmentId: string,
  paymentIntentId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .schema('propulspace')
    .from('invoice_installments')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntentId,
      stripe_paid_at: new Date().toISOString(),
    })
    .eq('id', installmentId)
    .neq('status', 'paid')
  if (error) return { ok: false, error: error.message }
  // Le trigger trg_recalc_invoice_status met à jour invoices.status automatiquement.
  return { ok: true }
}

async function logPaymentFailure(
  supabaseAdmin: SupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> {
  // Schéma propulspace.audit_log : project_id, resource_type, resource_id,
  // action, diff (jsonb), ip_address, user_agent, created_at.
  // project_id récupéré depuis metadata si présent.
  const projectIdRaw = paymentIntent.metadata?.project_id
  const projectId = projectIdRaw && typeof projectIdRaw === 'string' ? projectIdRaw : null
  if (!projectId) return // audit_log.project_id est NOT NULL — skip si manquant

  try {
    await supabaseAdmin.schema('propulspace').from('audit_log').insert({
      project_id: projectId,
      resource_type: 'stripe_payment',
      action: 'payment_failed',
      diff: {
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        last_payment_error: paymentIntent.last_payment_error?.message ?? null,
        customer: paymentIntent.customer,
        metadata: paymentIntent.metadata,
      },
    })
  } catch (_e) {
    // best-effort : audit_log peut être absent en dev, on ignore
  }
}

serve(async (req) => {
  if (req.method !== 'POST') return plainResponse('Method not allowed', 405)

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!stripeKey || !webhookSecret) {
    return plainResponse('Stripe env missing', 500)
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
  })

  const signature = req.headers.get('stripe-signature')
  if (!signature) return plainResponse('Missing stripe-signature header', 400)

  const rawBody = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'signature check failed'
    return plainResponse(`Invalid signature: ${msg}`, 400)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return plainResponse('Supabase env missing', 500)

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Idempotence : on tente d'insérer l'event d'abord. Si UNIQUE violation,
  // c'est un replay → on retourne 200 sans rien faire.
  const { error: insertErr } = await supabaseAdmin
    .schema('propulspace')
    .from('stripe_webhook_events')
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event as unknown as Record<string, unknown>,
      processed: false,
    })

  if (insertErr) {
    if (insertErr.code === '23505') {
      // Duplicate event — déjà reçu, on acquitte sans retraiter.
      return jsonResponse({ received: true, idempotent: true }, 200)
    }
    return plainResponse(`DB insert failed: ${insertErr.message}`, 500)
  }

  let processingError: string | null = null

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const metadata = (session.metadata ?? {}) as SessionMetadata
      const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null

      if (metadata.target_type === 'invoice' && metadata.target_id) {
        const r = await markInvoicePaid(supabaseAdmin, metadata.target_id, paymentIntentId)
        if (!r.ok) {
          processingError = r.error ?? 'mark invoice paid failed'
        } else {
          // #35 payment-received — dedupe sur stripe_event_id pour idempotence webhook retry
          try {
            const { data: invoice } = await supabaseAdmin
              .schema('propulspace')
              .from('invoices')
              .select('id, invoice_number, amount_total, paid_at, project_id')
              .eq('id', metadata.target_id)
              .single()

            if (invoice) {
              const { data: project } = await supabaseAdmin
                .from('projects_v2')
                .select('portal_client_email, client_first_name')
                .eq('id', invoice.project_id)
                .single()

              if (project?.portal_client_email) {
                await sendTransactional({
                  templateKey: 'payment-received',
                  to: { email: project.portal_client_email, name: project.client_first_name ?? undefined },
                  params: {
                    first_name: project.client_first_name ?? '',
                    invoice_number: invoice.invoice_number ?? '',
                    amount: Number(invoice.amount_total ?? 0).toFixed(2),
                    paid_at: new Date(invoice.paid_at ?? Date.now()).toLocaleDateString('fr-FR'),
                    receipt_url: `${Deno.env.get('PORTAL_BASE_URL') ?? 'https://espace.propulseo-site.com'}/factures/${invoice.id}`,
                  },
                  dedupeKey: event.id,
                })
              }
            }
          } catch (err) {
            console.error('[stripe-webhook] envoi #35 payment-received échec:', err)
            // Ne pas faire échouer le webhook si l'email échoue (l'invoice est déjà marquée payée).
          }
        }
      } else if (metadata.target_type === 'installment' && metadata.target_id) {
        const r = await markInstallmentPaid(supabaseAdmin, metadata.target_id, paymentIntentId)
        if (!r.ok) {
          processingError = r.error ?? 'mark installment paid failed'
        } else {
          // #35 payment-received pour acompte — on remonte à la facture parent via invoice_id
          try {
            // invoice_id est dans la metadata Stripe (champ dédié) ou dans la table installments
            const parentInvoiceId = metadata.invoice_id ?? null
            if (parentInvoiceId) {
              const { data: invoice } = await supabaseAdmin
                .schema('propulspace')
                .from('invoices')
                .select('id, invoice_number, amount_total, paid_at, project_id')
                .eq('id', parentInvoiceId)
                .single()

              if (invoice) {
                const { data: project } = await supabaseAdmin
                  .from('projects_v2')
                  .select('portal_client_email, client_first_name')
                  .eq('id', invoice.project_id)
                  .single()

                if (project?.portal_client_email) {
                  // Pour un acompte, on récupère le montant de l'installment directement
                  const { data: installment } = await supabaseAdmin
                    .schema('propulspace')
                    .from('invoice_installments')
                    .select('amount, paid_at, installment_number, label')
                    .eq('id', metadata.target_id)
                    .single()

                  await sendTransactional({
                    templateKey: 'payment-received',
                    to: { email: project.portal_client_email, name: project.client_first_name ?? undefined },
                    params: {
                      first_name: project.client_first_name ?? '',
                      invoice_number: invoice.invoice_number
                        ? `${invoice.invoice_number} — acompte ${installment?.installment_number ?? ''}`
                        : '',
                      amount: Number(installment?.amount ?? 0).toFixed(2),
                      paid_at: new Date(installment?.paid_at ?? Date.now()).toLocaleDateString('fr-FR'),
                      receipt_url: `${Deno.env.get('PORTAL_BASE_URL') ?? 'https://espace.propulseo-site.com'}/factures/${invoice.id}`,
                    },
                    dedupeKey: event.id,
                  })
                }
              }
            }
          } catch (err) {
            console.error('[stripe-webhook] envoi #35 payment-received (installment) échec:', err)
            // Ne pas faire échouer le webhook si l'email échoue (l'acompte est déjà marqué payé).
          }
        }
      } else {
        processingError = 'metadata target_type/target_id manquants'
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent
      await logPaymentFailure(supabaseAdmin, pi)
    }
    // Autres events ignorés silencieusement (Stripe enverra des events
    // qu'on n'écoute pas, c'est normal).
  } catch (err) {
    processingError = err instanceof Error ? err.message : 'unknown processing error'
  }

  await supabaseAdmin
    .schema('propulspace')
    .from('stripe_webhook_events')
    .update({
      processed: processingError === null,
      processed_at: new Date().toISOString(),
      processing_error: processingError,
    })
    .eq('stripe_event_id', event.id)

  // Toujours 200 OK à Stripe (sauf signature fail), même si processing erroné :
  // on a stocké l'event et l'admin peut le rejouer manuellement. Stripe
  // retenterait sinon, ce qui n'est pas utile vu l'idempotence DB.
  return jsonResponse({ received: true, processing_error: processingError }, 200)
})
