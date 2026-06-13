import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'sales' | 'ops' | 'marketing' | 'developer';
  position?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Configuration Supabase manquante')
    }

    // Admin client (service role)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verify caller identity
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

    // Check caller is admin via DB
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role, email')
      .eq('auth_user_id', callerUser.id)
      .single()

    if (profileError || !callerProfile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Profil appelant introuvable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const isCallerAdmin = callerProfile.role === 'admin' || callerProfile.email === 'team@propulseo-site.com'
    if (!isCallerAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Accès refusé - Administrateur uniquement' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Parse request body
    const { email, password, name, role, position }: CreateUserRequest = await req.json()

    const cleanEmail = email?.trim().toLowerCase()

    // Validate inputs
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email invalide. Format attendu: utilisateur@domaine.com' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!password || password.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Le mot de passe doit contenir au moins 10 caractères' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!name || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Le nom est requis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const validRoles = ['admin', 'manager', 'sales', 'ops', 'marketing', 'developer']
    if (!role || !validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ success: false, error: `Rôle invalide. Valeurs acceptées: ${validRoles.join(', ')}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Step 1: Create auth user (email confirmed, no confirmation email)
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    })

    if (createError) {
      const msg = createError.message.includes('already been registered')
        ? 'Cet email est déjà utilisé'
        : createError.message.includes('invalid format')
        ? 'Format email invalide pour Supabase Auth. Vérifiez le domaine (ex: @gmail.com, @entreprise.fr)'
        : createError.message
      return new Response(
        JSON.stringify({ success: false, error: msg }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!authData.user) {
      throw new Error('Erreur inattendue: utilisateur auth non créé')
    }

    // Step 2: Insert into users table
    const { data: profileData, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_user_id: authData.user.id,
        email: cleanEmail,
        name: name.trim(),
        role,
        position: position?.trim() || null,
        is_active: true,
        can_view_dashboard: true,
        can_view_leads: role !== 'ops',
        can_view_projects: true,
        can_view_communication: true,
        can_view_finance: role === 'admin' || role === 'manager',
        can_view_settings: role === 'admin',
        can_edit_leads: role !== 'ops',
      })
      .select()
      .single()

    if (insertError) {
      // Rollback: delete the auth user if profile insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Erreur lors de la création du profil: ${insertError.message}`)
    }

    console.log('Utilisateur créé:', email)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          userId: profileData.id,
          authUserId: authData.user.id,
          email: profileData.email,
          name: profileData.name,
          role: profileData.role
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('admin-create-user error:', errorMessage)

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
