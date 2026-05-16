// Edge Function : envoi des emails de récap après soumission du questionnaire
// de qualification (/diagnostic).
//
// STATUT V1 : STUB. Log la submission + retourne 200.
// La vraie intégration Brevo (templates + envoi équipe + envoi client) est
// branchée en Phase 3, avec la clé API Brevo en secret Edge Function
// (jamais exposée côté client).
//
// Invocation côté front :
//   await supabase.functions.invoke('questionnaire-send-emails',
//     { body: { lead_id: '<uuid>' } });

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  lead_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const body = (await req.json()) as RequestBody;
    if (!body.lead_id) {
      return new Response(JSON.stringify({ error: 'lead_id required' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // TODO Phase 3 : récup du lead via service_role, formatage HTML,
    // appel Brevo /v3/smtp/email avec template "qualification-team" +
    // template "qualification-client".
    console.log('[questionnaire-send-emails] STUB — lead_id:', body.lead_id);

    return new Response(
      JSON.stringify({ ok: true, sent: false, reason: 'V1 stub — Brevo intégré en Phase 3' }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
