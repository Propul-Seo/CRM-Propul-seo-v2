// portal-contact-message — Le client envoie un message depuis le portail.
//   1. vérifie que l'appelant est bien le client du projet,
//   2. envoie un email à l'équipe (reply-to = email du client) avec le message
//      et un lien vers le cockpit admin du projet (« voir comme le client »).
//
// Body : { project_id: string, message: string }
// Retour : { ok: true, sent } ou { ok: false, error }
//
// JWT verify : ACTIVÉ (session client portail).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TEAM_EMAIL = 'team@propulseo-site.com'
const CRM_BASE = 'https://crm.propulseo-site.com'
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') ?? ''
const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') ?? 'team@propulseo-site.com'
const BREVO_SENDER_NAME = Deno.env.get('BREVO_SENDER_NAME') ?? "Propul'SEO"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Méthode non autorisée' }, 405)

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !serviceKey || !anonKey) return json({ ok: false, error: 'Config serveur manquante' }, 500)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ ok: false, error: 'Authentification requise' }, 401)

  let body: { project_id?: string; message?: string }
  try { body = await req.json() } catch { return json({ ok: false, error: 'Body JSON invalide' }, 400) }
  const projectId = body.project_id
  const message = (body.message ?? '').trim()
  if (!projectId || !message) return json({ ok: false, error: 'project_id et message requis' }, 400)
  if (message.length > 4000) return json({ ok: false, error: 'Message trop long (max 4000 caractères)' }, 400)

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1. Identité de l'appelant
  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user?.email) return json({ ok: false, error: 'Non authentifié' }, 401)
  const callerEmail = user.email.toLowerCase()

  // 2. Projet + contrôle d'accès (l'appelant DOIT être le client du projet)
  const { data: project } = await admin.from('projects_v2')
    .select('portal_client_email, name').eq('id', projectId).single()
  if (!project || (project.portal_client_email ?? '').toLowerCase() !== callerEmail) {
    return json({ ok: false, error: 'Accès refusé' }, 403)
  }

  // 3. Email à l'équipe (reply-to = client) avec lien cockpit admin.
  if (!BREVO_API_KEY) {
    console.log('[portal-contact-message] BREVO_API_KEY non configurée — skip envoi')
    return json({ ok: true, sent: false, reason: 'BREVO_API_KEY not configured' })
  }

  const cockpitUrl = `${CRM_BASE}/admin/propulspace/clients/${projectId}`
  const safeMsg = escHtml(message).replace(/\n/g, '<br>')
  const projectName = escHtml(project.name ?? 'Projet')
  const htmlContent = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#18181b">
      <p style="font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#7c3aed;font-weight:600;margin:0 0 4px">Nouveau message client</p>
      <h2 style="font-size:18px;margin:0 0 12px">${projectName}</h2>
      <p style="font-size:13px;color:#52525b;margin:0 0 16px">De&nbsp;: <strong>${escHtml(callerEmail)}</strong></p>
      <div style="background:#f4f4f5;border-radius:10px;padding:16px;font-size:14px;line-height:1.55;white-space:pre-wrap">${safeMsg}</div>
      <a href="${cockpitUrl}" style="display:inline-block;margin-top:20px;background:#7c3aed;color:#fff;text-decoration:none;font-weight:600;font-size:13px;padding:10px 18px;border-radius:8px">Ouvrir l'espace client →</a>
      <p style="font-size:12px;color:#a1a1aa;margin-top:16px">Répondez directement à cet email pour écrire au client.</p>
    </div>`

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { accept: 'application/json', 'api-key': BREVO_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
        to: [{ email: TEAM_EMAIL, name: "Équipe Propul'SEO" }],
        replyTo: { email: callerEmail },
        subject: `Message client — ${project.name ?? 'Projet'}`,
        htmlContent,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error('[portal-contact-message] Brevo error', res.status, errText)
      return json({ ok: false, error: "L'envoi a échoué. Réessayez dans un instant." }, 502)
    }
    const result = await res.json() as { messageId?: string }
    return json({ ok: true, sent: true, message_id: result.messageId })
  } catch (err) {
    console.error('[portal-contact-message] exception', err)
    return json({ ok: false, error: "L'envoi a échoué. Réessayez dans un instant." }, 502)
  }
})
