// Edge Function : envoi de l'email équipe après soumission du questionnaire
// de qualification (/diagnostic).
//
// Architecture :
// - Récupère le lead via service_role (bypass RLS)
// - Envoie un email via Brevo API à TEAM_EMAIL
// - Fallback graceful si BREVO_API_KEY non configurée (retourne 200 + sent:false)
//
// Secrets attendus (à set par Lyes) :
//   BREVO_API_KEY        — clé v3 Brevo (Settings → SMTP & API)
//   BREVO_SENDER_EMAIL   — défaut: lyes.triki@propulseo-site.com (sender vérifié)
//   BREVO_SENDER_NAME    — défaut: 'Propulseo'
//   TEAM_EMAIL           — défaut: team@propulseo-site.com
//
// Invocation :
//   await supabase.functions.invoke('questionnaire-send-emails', { body: { lead_id } });

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') ?? '';
const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') ?? 'lyes.triki@propulseo-site.com';
const BREVO_SENDER_NAME = Deno.env.get('BREVO_SENDER_NAME') ?? 'Propulseo';
const TEAM_EMAIL = Deno.env.get('TEAM_EMAIL') ?? 'team@propulseo-site.com';
const CRM_BASE_URL = Deno.env.get('CRM_BASE_URL') ?? 'https://crm.propulseo-site.com';

interface Lead {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  company_name: string | null;
  business_sector: string | null;
  project_type: string | null;
  budget_range: string | null;
  desired_timeline: string | null;
  main_goal: string | null;
  submitted_at: string | null;
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  site:     '🌐 Site web',
  site_erp: '🧩 Site web + ERP',
  erp:      '⚙️ ERP / Outil métier',
};

// Échappe les caractères HTML pour éviter une injection XSS depuis les champs
// libres du questionnaire (un nom comme `<script>...</script>` deviendrait du
// HTML brut dans l'email équipe).
function escHtml(s: string | null | undefined): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildEmailHtml(lead: Lead): string {
  const row = (label: string, value: string | null | undefined) => value
    ? `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">${escHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:500;">${escHtml(value)}</td></tr>`
    : '';
  const projectLabel = lead.project_type ? PROJECT_TYPE_LABELS[lead.project_type] ?? lead.project_type : null;
  const headerTitle = escHtml(lead.company_name ?? lead.full_name ?? lead.email);
  const leadIdSafe = escHtml(lead.id);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Nouveau lead diagnostic</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#0ea5e9 0%,#8b5cf6 50%,#ec4899 100%);padding:24px 32px;color:white;">
      <div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;opacity:0.9;">Nouveau lead diagnostic</div>
      <div style="font-size:22px;font-weight:bold;margin-top:4px;">${headerTitle}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      ${row('Type de projet', projectLabel)}
      ${row('Contact',        lead.full_name)}
      ${row('Email',          lead.email)}
      ${row('Téléphone',      lead.phone)}
      ${row('Entreprise',     lead.company_name)}
      ${row('Secteur',        lead.business_sector)}
      ${row('Budget',         lead.budget_range)}
      ${row('Délai',          lead.desired_timeline)}
      ${row('Objectif',       lead.main_goal)}
    </table>
    <div style="padding:24px 32px;text-align:center;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <a href="${CRM_BASE_URL}/leads-v3" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#8b5cf6);color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Voir le lead dans le CRM →</a>
      <div style="margin-top:16px;font-size:12px;color:#9ca3af;">ID: ${leadIdSafe}</div>
    </div>
  </div>
</body></html>`;
}

async function sendEmail(lead: Lead): Promise<{ ok: boolean; error?: string }> {
  const subject = `🌟 Nouveau lead diagnostic — ${lead.company_name ?? lead.full_name ?? lead.email}`;
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'accept': 'application/json', 'api-key': BREVO_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
      to: [{ email: TEAM_EMAIL }],
      subject,
      htmlContent: buildEmailHtml(lead),
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, error: `Brevo ${res.status}: ${errText}` };
  }
  return { ok: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    const body = (await req.json()) as { lead_id?: string };
    if (!body.lead_id) {
      return new Response(JSON.stringify({ error: 'lead_id required' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (!BREVO_API_KEY) {
      console.log('[questionnaire-send-emails] BREVO_API_KEY non configurée — skip envoi');
      return new Response(
        JSON.stringify({ ok: true, sent: false, reason: 'BREVO_API_KEY not configured (admin must set secret)' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: lead, error: fetchErr } = await supa
      .schema('propulspace')
      .from('qualification_leads')
      .select('id, full_name, email, phone, company_name, business_sector, project_type, budget_range, desired_timeline, main_goal, submitted_at')
      .eq('id', body.lead_id)
      .single();

    if (fetchErr || !lead) {
      return new Response(JSON.stringify({ error: 'lead not found', detail: fetchErr?.message }), {
        status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const result = await sendEmail(lead as Lead);
    if (!result.ok) {
      console.error('[questionnaire-send-emails] envoi échoué:', result.error);
      return new Response(JSON.stringify({ ok: false, sent: false, error: result.error }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: true, sent: true, to: TEAM_EMAIL }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[questionnaire-send-emails] exception:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
