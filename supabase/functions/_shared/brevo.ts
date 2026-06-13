// _shared/brevo.ts — Helper d'envoi d'emails transactionnels Brevo
//
// Pattern atomique :
//   1. escHtml(params) anti-XSS
//   2. INSERT 'pending' (UNIQUE bloque les doublons, catch 23505 → skip)
//   3. POST api.brevo.com/v3/smtp/email avec htmlContent
//   4. UPDATE 'sent' + brevo_message_id, OR 'failed' + error_message
//
// Fallback gracieux si BREVO_API_KEY absent (return sent:false sans INSERT).

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { EMAIL_TEMPLATES, TemplateKey, extractSubject } from './email-templates/index.ts';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') ?? '';
const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') ?? 'lyes.triki@propulseo-site.com';
const BREVO_SENDER_NAME = Deno.env.get('BREVO_SENDER_NAME') ?? 'Propul\'SEO';

export interface SendOpts {
  templateKey: TemplateKey;
  to: { email: string; name?: string };
  params: Record<string, string | number | null | undefined>;
  dedupeKey: string;
}

export interface SendResult {
  ok: boolean;
  sent: boolean;
  reason?: string;
  message_id?: string;
  error?: string;
}

// Échappe les caractères HTML pour éviter une injection XSS
// depuis les champs libres (noms clients, titres docs, etc.).
function escHtml(s: string | number | null | undefined): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Interpole {{ params.X }} (avec espaces variables autour de X)
function interpolate(html: string, params: Record<string, string>): string {
  return html.replace(/\{\{\s*params\.([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => params[key] ?? '');
}

// Crée un client Supabase admin (service_role) pour écrire dans la table dedupe.
function getAdminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function sendTransactional(opts: SendOpts): Promise<SendResult> {
  const { templateKey, to, params, dedupeKey } = opts;

  // 1. Fallback BREVO_API_KEY absent
  if (!BREVO_API_KEY) {
    console.log(`[brevo] BREVO_API_KEY non configurée — skip envoi (${templateKey})`);
    return { ok: true, sent: false, reason: 'BREVO_API_KEY not configured' };
  }

  // 2. Échappe les params anti-XSS
  const safeParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    safeParams[k] = escHtml(v);
  }

  // 3. Charge le template + interpole + extrait subject
  const template = EMAIL_TEMPLATES[templateKey];
  if (!template) {
    return { ok: false, sent: false, error: `template ${templateKey} not found` };
  }
  const htmlContent = interpolate(template, safeParams);
  const subject = interpolate(extractSubject(template), safeParams);

  // 4. INSERT 'pending' (atomic dedupe via UNIQUE)
  const admin = getAdminClient();
  const { data: inserted, error: insertErr } = await admin
    .schema('propulspace')
    .from('transactional_emails_sent')
    .insert({
      template_key: templateKey,
      dedupe_key: dedupeKey,
      recipient_email: to.email,
      status: 'pending',
      params_json: params,
    })
    .select('id')
    .single();

  if (insertErr) {
    // 23505 = unique_violation → déjà envoyé
    if (insertErr.code === '23505') {
      console.log(`[brevo] dedupe hit ${templateKey}/${dedupeKey} — skip`);
      return { ok: true, sent: false, reason: 'duplicate' };
    }
    console.error(`[brevo] INSERT failed:`, insertErr);
    return { ok: false, sent: false, error: `db insert: ${insertErr.message}` };
  }
  const rowId = inserted.id;

  // 5. POST Brevo
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
        to: [{ email: to.email, name: to.name }],
        subject,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      const { error: updErr } = await admin.schema('propulspace').from('transactional_emails_sent')
        .update({ status: 'failed', error_message: `Brevo ${res.status}: ${errText}` })
        .eq('id', rowId);
      if (updErr) console.error('[brevo] UPDATE \'failed\' failed:', updErr);
      return { ok: false, sent: false, error: `Brevo ${res.status}: ${errText}` };
    }

    const json = await res.json() as { messageId?: string };
    const { error: updErr } = await admin.schema('propulspace').from('transactional_emails_sent')
      .update({ status: 'sent', brevo_message_id: json.messageId ?? null })
      .eq('id', rowId);
    if (updErr) console.error('[brevo] UPDATE \'sent\' failed (email was delivered but audit trail incorrect):', updErr);

    return { ok: true, sent: true, message_id: json.messageId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const { error: updErr } = await admin.schema('propulspace').from('transactional_emails_sent')
      .update({ status: 'failed', error_message: msg })
      .eq('id', rowId);
    if (updErr) console.error('[brevo] UPDATE \'failed\' (after network exception) failed:', updErr);
    return { ok: false, sent: false, error: msg };
  }
}
