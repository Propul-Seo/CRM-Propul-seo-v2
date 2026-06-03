// admin-docuseal-create-submission — Sprint B.4
// Crée une submission DocuSeal (document à signer) pour un projet.
// Appelée depuis l'UI admin du CRM (à venir Sprint C). Pour V1, peut être
// appelée manuellement via curl pour tester.
//
// Body : {
//   project_id: string,
//   template_id: string,            // ID du template DocuSeal (devis, contrat, etc.)
//   name: string,                   // libellé pour le client ("Contrat de prestation 2026")
//   signature_type: 'quote' | 'contract' | 'addendum' | 'other',
//   signer_email: string,
//   signer_name?: string,
//   send_email?: boolean            // default true, DocuSeal envoie l'email
// }
//
// Retour : { signature_id, signing_url, docuseal_submission_id }
//
// JWT verify : ACTIVÉ (admin only).
//
// Env requis : DOCUSEAL_API_KEY (clé API DocuSeal).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendTransactional } from '../_shared/brevo.ts'

const DOCUSEAL_API_URL = 'https://api.docuseal.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface CreateSubmissionBody {
  probe?: boolean                 // si true → renvoie juste { configured } sans rien créer
  project_id: string
  template_id: string
  name: string
  signature_type: 'quote' | 'contract' | 'addendum' | 'other'
  signer_email: string
  signer_name?: string
  send_email?: boolean
}

async function requireAdmin(req: Request): Promise<{ admin: SupabaseClient; callerId: string } | Response> {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !serviceKey || !anonKey) return jsonResponse({ error: 'Supabase env manquant' }, 500)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ error: 'Auth requise' }, 401)

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const user = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: { user: caller }, error } = await user.auth.getUser()
  if (error || !caller) return jsonResponse({ error: 'Non authentifié' }, 401)

  const { data: profile } = await admin
    .from('users').select('role, email, id')
    .eq('auth_user_id', caller.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.email === 'team@propulseo-site.com'
  if (!isAdmin || !profile) return jsonResponse({ error: 'Admin requis' }, 403)

  return { admin, callerId: profile.id as string }
}

interface DocusealSubmissionResponse {
  id: number
  submitters: Array<{
    id: number
    uuid: string
    email: string
    slug: string
    embed_src?: string
    status: string
  }>
}

async function createDocusealSubmission(
  apiKey: string,
  templateId: string,
  signerEmail: string,
  signerName: string | undefined,
): Promise<{ submissionId: string; signingUrl: string } | { error: string }> {
  const res = await fetch(`${DOCUSEAL_API_URL}/submissions`, {
    method: 'POST',
    headers: {
      'X-Auth-Token': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: Number(templateId),
      // Option A — on envoie notre propre email Brevo (#36), DocuSeal ne doit pas envoyer le sien
      send_email: false,
      submitters: [{
        email: signerEmail,
        name: signerName,
        role: 'Client',
      }],
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    return { error: `DocuSeal API ${res.status}: ${text}` }
  }
  const data = await res.json() as DocusealSubmissionResponse[]
  // L'API retourne un array de submitters au top-level (pas wrappé)
  const arr = Array.isArray(data) ? data : []
  const submitter = arr[0]
  if (!submitter) return { error: 'DocuSeal n\'a pas renvoyé de submitter' }
  const submissionId = String(submitter.id)
  const signingUrl = submitter.embed_src ?? `https://docuseal.com/s/${submitter.slug}`
  return { submissionId, signingUrl }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Méthode non autorisée' }, 405)

  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard
  const { admin, callerId } = guard

  let body: CreateSubmissionBody
  try { body = await req.json() } catch { return jsonResponse({ error: 'Body JSON invalide' }, 400) }

  const apiKey = Deno.env.get('DOCUSEAL_API_KEY')

  // Probe : l'UI admin demande si DocuSeal est configuré (grise le bouton sinon).
  if (body?.probe === true) return jsonResponse({ configured: Boolean(apiKey) }, 200)

  // Dégradation gracieuse : pas de clé → 200 structuré (au lieu d'un 500 opaque).
  if (!apiKey) return jsonResponse({ ok: false, reason: 'not_configured' }, 200)

  if (!body?.project_id || !body.template_id || !body.name || !body.signer_email || !body.signature_type) {
    return jsonResponse({ error: 'Paramètres manquants' }, 400)
  }
  if (!['quote', 'contract', 'addendum', 'other'].includes(body.signature_type)) {
    return jsonResponse({ error: 'signature_type invalide' }, 400)
  }

  // 1. Crée la submission côté DocuSeal (send_email=false — on envoie #36 via Brevo ci-dessous)
  const r = await createDocusealSubmission(apiKey, body.template_id, body.signer_email, body.signer_name)
  if ('error' in r) return jsonResponse({ error: r.error }, 502)

  // 2. Persiste dans propulspace.signatures
  const { data: inserted, error: insertErr } = await admin
    .schema('propulspace')
    .from('signatures')
    .insert({
      project_id: body.project_id,
      signature_type: body.signature_type,
      name: body.name,
      docuseal_submission_id: r.submissionId,
      docuseal_template_id: body.template_id,
      docuseal_signing_url: r.signingUrl,
      status: 'pending',
      sent_at: new Date().toISOString(),
      created_by: callerId,
    })
    .select('id')
    .single()

  if (insertErr) return jsonResponse({ error: `Persist failed: ${insertErr.message}` }, 500)

  // #36 signature-requested — notre template Brevo (DocuSeal email désactivé ci-dessus)
  try {
    await sendTransactional({
      templateKey: 'signature-requested',
      to: { email: body.signer_email, name: body.signer_name },
      params: {
        first_name: (body.signer_name ?? '').split(' ')[0] || '',
        doc_title: body.name,
        doc_type: body.signature_type,
        expires_at: '',  // DocuSeal gère l'expiration, à enrichir si la valeur est disponible localement
        sign_url: r.signingUrl,
      },
      dedupeKey: `${r.submissionId}-requested`,
    })
  } catch (err) {
    console.error('[admin-docuseal-create-submission] envoi #36 signature-requested échec:', err)
  }

  return jsonResponse({
    signature_id: (inserted as { id: string }).id,
    signing_url: r.signingUrl,
    docuseal_submission_id: r.submissionId,
  }, 200)
})
