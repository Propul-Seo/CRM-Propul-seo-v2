// portal-create-checkout-session — Sprint B.3.2
// Crée une Stripe Checkout Session pour une facture ou un acompte.
// Le client est authentifié portail (JWT). On vérifie l'ownership via
// propulspace.portal_project_id() côté DB pour ne JAMAIS faire confiance
// au client : le montant et la facture sont relus depuis Supabase, le
// client envoie seulement l'ID cible.
//
// Body : { target: 'invoice' | 'installment', target_id: string }
// Retour : { url: string, session_id: string }
//
// JWT verify : ACTIVÉ (config.toml ou par défaut Supabase).
//
// Env requis :
//   - STRIPE_SECRET_KEY (sk_test_… ou sk_live_…)
//   - VITE_PUBLIC_PORTAL_URL (pour les URL return/cancel) — optionnel,
//     fallback sur header Origin.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

interface RequestBody {
  target: 'invoice' | 'installment'
  target_id: string
}

interface InvoiceRow {
  id: string
  invoice_number: string
  project_id: string
  amount_total: string | number
  currency: string
  status: string
  stripe_customer_id: string | null
  client_snapshot: Record<string, unknown> | null
}

interface InstallmentRow {
  id: string
  invoice_id: string
  installment_number: number
  label: string | null
  amount: string | number
  status: string
  stripe_customer_id: string | null
}

interface AuthContext {
  supabaseAdmin: SupabaseClient
  supabaseUser: SupabaseClient
  portalProjectId: string
  userEmail: string
}

async function authenticate(req: Request): Promise<AuthContext | Response> {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !serviceKey || !anonKey) {
    return jsonResponse({ error: 'Configuration Supabase manquante' }, 500)
  }
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ error: 'Authentification requise' }, 401)

  const supabaseAdmin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const supabaseUser = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: { user }, error } = await supabaseUser.auth.getUser()
  if (error || !user || !user.email) {
    return jsonResponse({ error: 'Utilisateur non authentifié' }, 401)
  }

  // Récupère le portal_project_id via la fonction sécurisée (SECURITY DEFINER)
  // appelée sous le rôle utilisateur. Renvoie NULL si pas client portail.
  const { data: pid, error: pidErr } = await supabaseUser.rpc('portal_project_id_for_email', { p_email: user.email })
  // ↑ Si la RPC n'existe pas en wrapper public, on retombe sur une lecture
  // côté admin avec contrôle email (défense en profondeur).
  let portalProjectId: string | null = null
  if (!pidErr && typeof pid === 'string') {
    portalProjectId = pid
  } else {
    const { data: proj } = await supabaseAdmin
      .from('projects_v2')
      .select('id')
      .eq('portal_client_email', user.email.toLowerCase())
      .maybeSingle()
    portalProjectId = (proj as { id: string } | null)?.id ?? null
  }

  if (!portalProjectId) {
    return jsonResponse({ error: 'Accès portail refusé pour cet utilisateur' }, 403)
  }

  return { supabaseAdmin, supabaseUser, portalProjectId, userEmail: user.email }
}

async function getOrCreateCustomer(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  invoiceId: string,
  existingCustomerId: string | null,
  email: string,
  clientSnapshot: Record<string, unknown> | null,
): Promise<string> {
  if (existingCustomerId) return existingCustomerId
  const name = clientSnapshot && typeof clientSnapshot.name === 'string' ? clientSnapshot.name : undefined
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { invoice_id: invoiceId },
  })
  // Persister sur la facture pour réutilisation future.
  // Code review H-2 : .schema('propulspace') obligatoire — sinon UPDATE tape
  // sur public.invoices qui n'existe pas et le customer_id n'est jamais persisté.
  await supabaseAdmin
    .schema('propulspace')
    .from('invoices')
    .update({ stripe_customer_id: customer.id })
    .eq('id', invoiceId)
  return customer.id
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Méthode non autorisée' }, 405)

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) return jsonResponse({ error: 'STRIPE_SECRET_KEY manquante' }, 500)
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20', httpClient: Stripe.createFetchHttpClient() })

  const authResult = await authenticate(req)
  if (authResult instanceof Response) return authResult
  const { supabaseAdmin, portalProjectId, userEmail } = authResult

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Body JSON invalide' }, 400)
  }
  if (!body || !body.target_id || !['invoice', 'installment'].includes(body.target)) {
    return jsonResponse({ error: 'Paramètres invalides' }, 400)
  }

  const origin = req.headers.get('origin') ?? Deno.env.get('VITE_PUBLIC_PORTAL_URL') ?? 'https://espace.propulseo-site.com'
  const returnUrl = `${origin}/espace-client/invoices?paiement=reussi&session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${origin}/espace-client/invoices?paiement=annule`

  // BRANCH 1 : paiement d'une facture entière
  if (body.target === 'invoice') {
    const { data: inv, error } = await supabaseAdmin
      .schema('propulspace')
      .from('invoices')
      .select('id, invoice_number, project_id, amount_total, currency, status, stripe_customer_id, client_snapshot')
      .eq('id', body.target_id)
      .maybeSingle<InvoiceRow>()

    if (error || !inv) return jsonResponse({ error: 'Facture introuvable' }, 404)
    if (inv.project_id !== portalProjectId) return jsonResponse({ error: 'Accès refusé' }, 403)
    if (inv.status === 'paid') return jsonResponse({ error: 'Facture déjà payée' }, 400)
    if (['draft', 'cancelled', 'refunded'].includes(inv.status)) {
      return jsonResponse({ error: 'Facture non payable dans son état actuel' }, 400)
    }

    const customerId = await getOrCreateCustomer(
      stripe, supabaseAdmin, inv.id, inv.stripe_customer_id, userEmail, inv.client_snapshot,
    )

    const amountCents = Math.round(Number(inv.amount_total) * 100)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: inv.currency.toLowerCase(),
          unit_amount: amountCents,
          product_data: {
            name: `Facture ${inv.invoice_number}`,
            description: 'Paiement intégral de la facture',
          },
        },
      }],
      success_url: returnUrl,
      cancel_url: cancelUrl,
      metadata: {
        target_type: 'invoice',
        target_id: inv.id,
        project_id: portalProjectId,
        invoice_number: inv.invoice_number,
      },
    })

    await supabaseAdmin
      .schema('propulspace')
      .from('invoices')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', inv.id)

    return jsonResponse({ url: session.url, session_id: session.id }, 200)
  }

  // BRANCH 2 : paiement d'un acompte
  const { data: inst, error: instErr } = await supabaseAdmin
    .schema('propulspace')
    .from('invoice_installments')
    .select('id, invoice_id, installment_number, label, amount, status, stripe_customer_id')
    .eq('id', body.target_id)
    .maybeSingle<InstallmentRow>()

  if (instErr || !inst) return jsonResponse({ error: 'Acompte introuvable' }, 404)
  if (inst.status === 'paid') return jsonResponse({ error: 'Acompte déjà payé' }, 400)
  if (inst.status === 'cancelled') return jsonResponse({ error: 'Acompte annulé' }, 400)

  // Récupère l'invoice parent pour validation ownership + currency + customer
  const { data: parentInv, error: parentErr } = await supabaseAdmin
    .schema('propulspace')
    .from('invoices')
    .select('id, invoice_number, project_id, currency, status, stripe_customer_id, client_snapshot')
    .eq('id', inst.invoice_id)
    .maybeSingle<InvoiceRow>()

  if (parentErr || !parentInv) return jsonResponse({ error: 'Facture parente introuvable' }, 404)
  if (parentInv.project_id !== portalProjectId) return jsonResponse({ error: 'Accès refusé' }, 403)

  const customerId = await getOrCreateCustomer(
    stripe, supabaseAdmin, parentInv.id, parentInv.stripe_customer_id, userEmail, parentInv.client_snapshot,
  )

  const amountCents = Math.round(Number(inst.amount) * 100)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: parentInv.currency.toLowerCase(),
        unit_amount: amountCents,
        product_data: {
          name: `Acompte ${inst.installment_number} — Facture ${parentInv.invoice_number}`,
          description: inst.label ?? `Acompte n°${inst.installment_number}`,
        },
      },
    }],
    success_url: returnUrl,
    cancel_url: cancelUrl,
    metadata: {
      target_type: 'installment',
      target_id: inst.id,
      invoice_id: parentInv.id,
      project_id: portalProjectId,
      installment_number: String(inst.installment_number),
    },
  })

  await supabaseAdmin
    .schema('propulspace')
    .from('invoice_installments')
    .update({ stripe_checkout_session_id: session.id, stripe_customer_id: customerId })
    .eq('id', inst.id)

  return jsonResponse({ url: session.url, session_id: session.id }, 200)
})
