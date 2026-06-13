import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ToggleStatusRequest {
  targetUserId: string; // users table id
  active: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Méthode non autorisée' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verify caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentification requise' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user: callerUser }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Utilisateur non authentifié' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Check admin
    const { data: callerProfile } = await supabaseAdmin
      .from('users')
      .select('role, email')
      .eq('auth_user_id', callerUser.id)
      .single()

    const isCallerAdmin = callerProfile?.role === 'admin' || callerProfile?.email === 'team@propulseo-site.com'
    if (!isCallerAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Accès refusé - Administrateur uniquement' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const { targetUserId, active }: ToggleStatusRequest = await req.json()

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID utilisateur requis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get the target user to find auth_user_id
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('users')
      .select('auth_user_id, email')
      .eq('id', targetUserId)
      .single()

    if (targetError || !targetUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Utilisateur cible introuvable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Prevent disabling admin account
    if (targetUser.email === 'team@propulseo-site.com' && !active) {
      return new Response(
        JSON.stringify({ success: false, error: 'Impossible de désactiver le compte administrateur principal' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Update users table
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ is_active: active, updated_at: new Date().toISOString() })
      .eq('id', targetUserId)

    if (updateError) {
      throw new Error(`Erreur mise à jour profil: ${updateError.message}`)
    }

    // Ban/unban in Supabase Auth
    if (targetUser.auth_user_id) {
      if (!active) {
        // Ban user (prevents login)
        await supabaseAdmin.auth.admin.updateUserById(targetUser.auth_user_id, {
          ban_duration: '876000h' // ~100 years
        })
      } else {
        // Unban user
        await supabaseAdmin.auth.admin.updateUserById(targetUser.auth_user_id, {
          ban_duration: 'none'
        })
      }
    }

    console.log(`Utilisateur ${targetUser.email} ${active ? 'activé' : 'désactivé'}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Utilisateur ${active ? 'activé' : 'désactivé'} avec succès`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('admin-toggle-user-status error:', errorMessage)

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
