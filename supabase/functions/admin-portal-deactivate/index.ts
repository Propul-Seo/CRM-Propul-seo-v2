// admin-portal-deactivate — Sprint A.2a
// Désactive le portail : copie l'email dans portal_previous_client_email,
// NULL portal_client_email, set portal_deactivated_at + raison optionnelle.
//
// Body : { projectId: string, reason?: string }
// Garde : admin only
// Pré-conditions : projet existe, portal_client_email IS NOT NULL
//
// Note : on ne supprime PAS le user dans auth.users (utile s'il est client
// sur un autre projet). Sa session expire au prochain refresh car
// portal_project_id() retourne NULL pour lui.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

const REASON_MAX_LENGTH = 500

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

interface AdminGuardResult {
  supabaseAdmin: SupabaseClient
  supabaseUser: SupabaseClient
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
  if (!authHeader) return jsonResponse({ success: false, error: 'Authentification requise' }, 401)
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
  if (!isAdmin) return jsonResponse({ success: false, error: 'Accès refusé — administrateur uniquement' }, 403)
  return { supabaseAdmin, supabaseUser }
}

interface DeactivateRequest {
  projectId: string
  reason?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Méthode non autorisée' }, 405)

  try {
    const guard = await requireAdmin(req)
    if (guard instanceof Response) return guard
    const { supabaseAdmin, supabaseUser } = guard

    const body: DeactivateRequest = await req.json()
    const projectId = body.projectId?.trim()
    const reason = body.reason?.trim() || null

    if (!projectId) return jsonResponse({ success: false, error: 'projectId requis' }, 400)
    if (reason && reason.length > REASON_MAX_LENGTH) {
      return jsonResponse({
        success: false,
        error: `Raison trop longue (max ${REASON_MAX_LENGTH} caractères)`,
      }, 400)
    }

    const { data: project, error: fetchError } = await supabaseAdmin
      .from('projects_v2')
      .select('id, name, portal_client_email')
      .eq('id', projectId)
      .single()

    if (fetchError || !project) return jsonResponse({ success: false, error: 'Projet introuvable' }, 404)
    if (!project.portal_client_email) {
      return jsonResponse({ success: false, error: 'Aucun portail actif sur ce projet.' }, 409)
    }

    const previousEmail = project.portal_client_email

    const { error: updateError } = await supabaseUser
      .from('projects_v2')
      .update({
        portal_client_email: null,
        portal_previous_client_email: previousEmail,
        portal_deactivated_at: new Date().toISOString(),
        portal_deactivation_reason: reason,
      })
      .eq('id', projectId)

    if (updateError) return jsonResponse({ success: false, error: updateError.message }, 500)

    return jsonResponse({ success: true, data: { projectId, previousEmail } }, 200)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('admin-portal-deactivate error:', msg)
    return jsonResponse({ success: false, error: msg }, 500)
  }
})
