// send-portal-email — Façade admin pour envoyer des emails transactionnels
// depuis le front (boutons CRM).
//
// JWT verify : ACTIVÉ (admin only).
//
// Body : { template_key, to: { email, name? }, params, dedupe_key }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendTransactional } from '../_shared/brevo.ts';
import type { TemplateKey } from '../_shared/email-templates/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const ADMIN_TEMPLATES: ReadonlySet<TemplateKey> = new Set([
  'invoice-sent',
  'invoice-reminder',
  'new-deliverable',
]);

interface Body {
  template_key: TemplateKey;
  to: { email: string; name?: string };
  params: Record<string, string | number | null | undefined>;
  dedupe_key: string;
}

async function requireAdmin(req: Request): Promise<{ callerId: string } | Response> {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!url || !anonKey) return jsonResponse({ error: 'Supabase env manquant' }, 500);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse({ error: 'Auth requise' }, 401);

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return jsonResponse({ error: 'JWT invalide' }, 401);

  const { data: isAdmin, error: adminErr } = await userClient.rpc('is_admin');
  if (adminErr || !isAdmin) return jsonResponse({ error: 'Admin requis' }, 403);

  return { callerId: user.id };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof Response) return adminCheck;

  let body: Body;
  try {
    body = await req.json() as Body;
  } catch {
    return jsonResponse({ error: 'JSON invalide' }, 400);
  }

  if (!body.template_key || !body.to?.email || !body.dedupe_key) {
    return jsonResponse({ error: 'template_key, to.email, dedupe_key requis' }, 400);
  }

  if (!ADMIN_TEMPLATES.has(body.template_key)) {
    return jsonResponse({ error: `template_key ${body.template_key} non autorisé pour cette edge` }, 403);
  }

  const result = await sendTransactional({
    templateKey: body.template_key,
    to: body.to,
    params: body.params ?? {},
    dedupeKey: body.dedupe_key,
  });

  return jsonResponse(result, result.ok ? 200 : 500);
});
