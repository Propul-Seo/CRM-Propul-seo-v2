// docuseal-webhook — Sprint B.4
// Reçoit les webhooks DocuSeal et synchronise propulspace.signatures.
//
// Events traités :
//   - form.completed     → status = 'signed', signed_at, signed_pdf_url
//   - form.declined      → status = 'declined', declined_at, decline_reason
//   - submission.expired → status = 'expired'
//
// Idempotence : insertion préalable dans propulspace.docuseal_webhook_events
// (UNIQUE sur docuseal_event_id). Si replay → 200 sans retraitement.
//
// JWT verify : DOIT être DÉSACTIVÉ (DocuSeal n'envoie pas de JWT). Sécurité
// via HMAC-SHA256 du body avec DOCUSEAL_WEBHOOK_SECRET (header X-DocuSeal-Signature).
//
// Env requis :
//   - DOCUSEAL_WEBHOOK_SECRET

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

function plain(body: string, status: number) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain' } })
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

interface DocusealEvent {
  event_type: string
  timestamp?: string
  data: {
    id: number | string
    submission_id?: number | string
    status?: string
    audit_log_url?: string
    documents?: Array<{ url: string; name?: string }>
    decline_reason?: string
    declined_at?: string
    completed_at?: string
    expires_at?: string
  }
}

// HMAC-SHA256 hex verification — pattern standard webhook DocuSeal.
async function verifySignature(body: string, signatureHex: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  const expected = Array.from(new Uint8Array(sigBuf))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  // Comparaison constante-temps simple (longueurs égales requises)
  if (expected.length !== signatureHex.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signatureHex.charCodeAt(i)
  }
  return diff === 0
}

async function handleEvent(admin: SupabaseClient, ev: DocusealEvent): Promise<string | null> {
  const submissionId = ev.data.submission_id != null
    ? String(ev.data.submission_id)
    : String(ev.data.id)

  const { data: sig, error: findErr } = await admin
    .schema('propulspace')
    .from('signatures')
    .select('id, status')
    .eq('docuseal_submission_id', submissionId)
    .maybeSingle()

  if (findErr) return `find failed: ${findErr.message}`
  if (!sig) return `signature introuvable pour submission ${submissionId}`

  const updates: Record<string, unknown> = {}

  if (ev.event_type === 'form.completed' || ev.event_type === 'submission.completed') {
    updates.status = 'signed'
    updates.signed_at = ev.data.completed_at ?? new Date().toISOString()
    const pdfUrl = ev.data.documents?.[0]?.url
    if (pdfUrl) updates.docuseal_signed_pdf_url = pdfUrl
  } else if (ev.event_type === 'form.declined' || ev.event_type === 'submission.declined') {
    updates.status = 'declined'
    updates.declined_at = ev.data.declined_at ?? new Date().toISOString()
    if (ev.data.decline_reason) updates.decline_reason = ev.data.decline_reason
  } else if (ev.event_type === 'submission.expired') {
    updates.status = 'expired'
  } else {
    return null // event ignoré silencieusement
  }

  // Idempotence : skip si déjà dans l'état cible
  const sigRow = sig as { id: string; status: string }
  if (sigRow.status === updates.status) return null

  const { error: updErr } = await admin
    .schema('propulspace')
    .from('signatures')
    .update(updates)
    .eq('id', sigRow.id)

  if (updErr) return `update failed: ${updErr.message}`
  return null
}

serve(async (req) => {
  if (req.method !== 'POST') return plain('Method not allowed', 405)

  const secret = Deno.env.get('DOCUSEAL_WEBHOOK_SECRET')
  if (!secret) return plain('DOCUSEAL_WEBHOOK_SECRET manquant', 500)

  const signature = req.headers.get('x-docuseal-signature') ?? req.headers.get('X-DocuSeal-Signature')
  if (!signature) return plain('Missing X-DocuSeal-Signature header', 400)

  const rawBody = await req.text()
  if (!(await verifySignature(rawBody, signature, secret))) {
    return plain('Invalid signature', 400)
  }

  let ev: DocusealEvent
  try { ev = JSON.parse(rawBody) as DocusealEvent } catch { return plain('JSON invalide', 400) }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return plain('Supabase env manquant', 500)
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // DocuSeal ne fournit pas toujours un event_id unique — on synthétise une
  // clé d'idempotence : event_type + submission_id + timestamp.
  const submissionId = ev.data.submission_id != null ? String(ev.data.submission_id) : String(ev.data.id)
  const idempotencyKey = `${ev.event_type}:${submissionId}:${ev.timestamp ?? ev.data.completed_at ?? new Date().toISOString()}`

  const { error: insertErr } = await admin
    .schema('propulspace')
    .from('docuseal_webhook_events')
    .insert({
      docuseal_event_id: idempotencyKey,
      event_type: ev.event_type,
      payload: ev as unknown as Record<string, unknown>,
      processed: false,
    })

  if (insertErr) {
    if (insertErr.code === '23505') return json({ received: true, idempotent: true }, 200)
    return plain(`DB insert failed: ${insertErr.message}`, 500)
  }

  const processingError = await handleEvent(admin, ev)

  await admin
    .schema('propulspace')
    .from('docuseal_webhook_events')
    .update({
      processed: processingError === null,
      processed_at: new Date().toISOString(),
      processing_error: processingError,
    })
    .eq('docuseal_event_id', idempotencyKey)

  return json({ received: true, processing_error: processingError }, 200)
})
