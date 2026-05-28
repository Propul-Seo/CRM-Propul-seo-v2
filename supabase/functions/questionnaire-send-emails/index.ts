// questionnaire-send-emails — Sprint B.2 / Phase 2
// Envoie 2 emails après soumission du questionnaire /diagnostic :
//   - #31 qualif-confirmation au lead (client)
//   - #32 new-lead-alert à l'équipe interne
//
// Migration 2026-05-27 : passage au helper _shared/brevo.ts (templates versionnés,
// dedupe via propulspace.transactional_emails_sent).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendTransactional } from '../_shared/brevo.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
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
  preferred_contact_method: string | null;
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

    const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: lead, error: fetchErr } = await supa
      .from('qualification_leads_v2')
      .select('id, full_name, email, phone, company_name, business_sector, project_type, budget_range, desired_timeline, main_goal, preferred_contact_method')
      .eq('id', body.lead_id)
      .single();

    if (fetchErr || !lead) {
      return new Response(JSON.stringify({ error: 'lead not found', detail: fetchErr?.message }), {
        status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const l = lead as Lead;
    const firstName = (l.full_name ?? '').split(' ')[0] || 'bonjour';

    // #31 qualif-confirmation → client
    const clientResult = await sendTransactional({
      templateKey: 'qualif-confirmation',
      to: { email: l.email, name: l.full_name ?? undefined },
      params: {
        first_name: firstName,
        preferred_contact_method: l.preferred_contact_method ?? 'email',
      },
      dedupeKey: `${l.id}-lead`,
    });

    // #32 new-lead-alert → équipe (sans quality_score pour l'instant, à brancher si présent en DB)
    const teamResult = await sendTransactional({
      templateKey: 'new-lead-alert',
      to: { email: TEAM_EMAIL, name: 'Équipe Propul\'SEO' },
      params: {
        company_name: l.company_name ?? '(sans nom)',
        first_name: l.full_name ?? '',
        sector: l.business_sector ?? '',
        budget: l.budget_range ?? '',
        timeline: l.desired_timeline ?? '',
        quality_score: '',
        lead_id: l.id,
        admin_url: `${CRM_BASE_URL}/leads-v3`,
      },
      dedupeKey: `${l.id}-team`,
    });

    return new Response(JSON.stringify({
      ok: clientResult.ok && teamResult.ok,
      client: clientResult,
      team: teamResult,
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[questionnaire-send-emails] exception:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
