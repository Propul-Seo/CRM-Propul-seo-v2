// admin-portal-resend-invite — Sprint A.2a
// Renvoie un magic link au client existant.
//
// Body : { projectId: string }
// Garde : admin only
// Pré-conditions : projet existe, portal_client_email IS NOT NULL

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

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

interface ResendRequest {
  projectId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Méthode non autorisée' }, 405)

  try {
    const guard = await requireAdmin(req)
    if (guard instanceof Response) return guard
    const { supabaseAdmin, supabaseUser } = guard

    const body: ResendRequest = await req.json()
    const projectId = body.projectId?.trim()
    if (!projectId) return jsonResponse({ success: false, error: 'projectId requis' }, 400)

    const { data: project, error: fetchError } = await supabaseAdmin
      .from('projects_v2')
      .select('id, name, portal_client_email')
      .eq('id', projectId)
      .single()

    if (fetchError || !project) return jsonResponse({ success: false, error: 'Projet introuvable' }, 404)
    if (!project.portal_client_email) {
      return jsonResponse({ success: false, error: 'Aucun portail actif pour ce projet.' }, 409)
    }

    const origin = req.headers.get('origin') ?? ''
    const redirectTo = origin ? `${origin}/espace-client/setup-password` : undefined

    // signInWithOtp envoie un magic link par email au user existant.
    // auth.admin.generateLink génère seulement le lien sans l'envoyer (bug initial).
    // shouldCreateUser=false : on refuse de créer un nouveau user (sécurité).
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    if (!anonKey || !supabaseUrl) {
      return jsonResponse({ success: false, error: 'Config Supabase manquante' }, 500)
    }
    const supabaseAnon = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error: linkError } = await supabaseAnon.auth.signInWithOtp({
      email: project.portal_client_email,
      options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
    })

    if (linkError) return jsonResponse({ success: false, error: linkError.message }, 400)

    const { error: updateError } = await supabaseUser
      .from('projects_v2')
      .update({ portal_last_invite_sent_at: new Date().toISOString() })
      .eq('id', projectId)

    if (updateError) {
      console.error('Update portal_last_invite_sent_at failed:', updateError.message)
    }

    return jsonResponse({ success: true, data: { projectId, email: project.portal_client_email } }, 200)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('admin-portal-resend-invite error:', msg)
    return jsonResponse({ success: false, error: msg }, 500)
  }
})
