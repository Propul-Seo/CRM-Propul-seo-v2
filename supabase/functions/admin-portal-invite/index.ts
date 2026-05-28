// admin-portal-invite — Sprint A.2a
// Active le portail pour un projet : envoie l'invitation Supabase Auth
// (auth.admin.inviteUserByEmail) au client + update projects_v2.
//
// Body : { projectId: string, email: string }
// Garde : admin only (JWT + public.users role)
// Pré-conditions : projet existe, portal_client_email IS NULL (idempotence)
//
// Note : helper inliné car Edge Runtime ne supporte pas les imports
// hors dossier de la fonction. Pattern dupliqué dans admin-portal-resend-invite
// et admin-portal-deactivate.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

interface AdminGuardResult {
  supabaseAdmin: SupabaseClient
  supabaseUser: SupabaseClient
  callerAuthUid: string
}

async function requireAdmin(req: Request): Promise<AdminGuardResult | Response> {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !serviceKey || !anonKey) {
    return jsonResponse({ success: false, error: 'Configuration Supabase manquante' }, 500)
  }
  const supabaseAdmin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ success: false, error: 'Authentification requise' }, 401)
  }
  const supabaseUser = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: { user: callerUser }, error: authError } = await supabaseUser.auth.getUser()
  if (authError || !callerUser) {
    return jsonResponse({ success: false, error: 'Utilisateur non authentifié' }, 401)
  }
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('role, email')
    .eq('auth_user_id', callerUser.id)
    .single()
  if (profileError || !profile) {
    return jsonResponse({ success: false, error: 'Profil appelant introuvable' }, 403)
  }
  const isAdmin = profile.role === 'admin' || profile.email === 'team@propulseo-site.com'
  if (!isAdmin) {
    return jsonResponse({ success: false, error: 'Accès refusé — administrateur uniquement' }, 403)
  }
  return { supabaseAdmin, supabaseUser, callerAuthUid: callerUser.id }
}

interface InviteRequest {
  projectId: string
  email: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Méthode non autorisée' }, 405)

  try {
    const guard = await requireAdmin(req)
    if (guard instanceof Response) return guard
    const { supabaseAdmin, supabaseUser, callerAuthUid } = guard

    const body: InviteRequest = await req.json()
    const projectId = body.projectId?.trim()
    const email = body.email?.trim().toLowerCase()

    if (!projectId) return jsonResponse({ success: false, error: 'projectId requis' }, 400)
    if (!email || !EMAIL_REGEX.test(email)) {
      return jsonResponse({ success: false, error: 'Email invalide' }, 400)
    }

    const { data: project, error: fetchError } = await supabaseAdmin
      .from('projects_v2')
      .select('id, name, portal_client_email')
      .eq('id', projectId)
      .single()

    if (fetchError || !project) {
      return jsonResponse({ success: false, error: 'Projet introuvable' }, 404)
    }
    if (project.portal_client_email) {
      return jsonResponse({
        success: false,
        error: `Portail déjà actif (${project.portal_client_email}). Désactivez avant de réactiver.`,
      }, 409)
    }

    const origin = req.headers.get('origin') ?? ''
    const redirectTo = origin ? `${origin}/espace-client/setup-password` : undefined

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo })
    if (inviteError) {
      const msg = inviteError.message.includes('already been registered')
        ? 'Cet email a déjà un compte Supabase Auth. Utilisez "Renvoyer le lien d\'accès" ou supprimez le compte côté Supabase.'
        : inviteError.message
      return jsonResponse({ success: false, error: msg }, 400)
    }
    const invitedAuthUid = inviteData?.user?.id ?? null

    const nowIso = new Date().toISOString()
    const { error: updateError } = await supabaseUser
      .from('projects_v2')
      .update({
        portal_client_email: email,
        portal_activated_at: nowIso,
        portal_activated_by: callerAuthUid,
        portal_last_invite_sent_at: nowIso,
        portal_deactivated_at: null,
        portal_deactivation_reason: null,
      })
      .eq('id', projectId)

    if (updateError) {
      // Rollback auth user pour permettre un retry propre (sinon "already registered" au 2e essai).
      console.error('Update projects_v2 failed after invite sent, rolling back auth user:', updateError.message)
      if (invitedAuthUid) {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(invitedAuthUid)
        if (deleteError) {
          console.error('Rollback deleteUser failed:', deleteError.message)
          return jsonResponse({
            success: false,
            error: `Erreur DB et rollback échoué : ${updateError.message}. Supprimez l\'utilisateur ${email} manuellement dans Supabase Auth pour réessayer.`,
          }, 500)
        }
      }
      return jsonResponse({
        success: false,
        error: `Erreur DB : ${updateError.message}. L\'invitation a été annulée, vous pouvez réessayer.`,
      }, 500)
    }

    return jsonResponse({ success: true, data: { projectId, email, projectName: project.name } }, 200)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('admin-portal-invite error:', msg)
    return jsonResponse({ success: false, error: msg }, 500)
  }
})
