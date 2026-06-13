import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email de l'administrateur autorisé
const ADMIN_EMAIL = 'team@propulseo-site.com'

interface UpdatePasswordRequest {
  targetUserId: string;
  newPassword: string;
}

interface UpdatePasswordResponse {
  success: boolean;
  error?: string;
  message?: string;
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Vérifier la méthode HTTP
    if (req.method !== 'POST') {
      throw new Error('Méthode HTTP non autorisée')
    }

    // Récupérer les variables d'environnement Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Configuration Supabase manquante')
    }

    // Créer un client Supabase avec la clé service_role (admin)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Vérifier l'authentification de l'utilisateur qui fait la requête
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authentification requise')
    }

    // Créer un client avec le token de l'utilisateur pour vérifier son identité
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: {
        headers: { Authorization: authHeader }
      }
    })

    // Récupérer l'utilisateur connecté
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !requestingUser) {
      throw new Error('Utilisateur non authentifié')
    }

    // Vérifier que l'utilisateur est l'administrateur autorisé
    if (requestingUser.email !== ADMIN_EMAIL) {
      console.error('❌ Tentative non autorisée de modification de mot de passe par:', requestingUser.email)
      throw new Error('Accès refusé - Administrateur uniquement')
    }

    // Récupérer le corps de la requête
    const { targetUserId, newPassword }: UpdatePasswordRequest = await req.json()

    // Validation des paramètres
    if (!targetUserId) {
      throw new Error('ID utilisateur cible requis')
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères')
    }

    // Vérifier que l'utilisateur cible existe
    const { data: targetUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(targetUserId)

    if (userError || !targetUser) {
      throw new Error('Utilisateur cible non trouvé')
    }

    // Empêcher la modification du mot de passe de l'admin par lui-même via cette fonction
    if (targetUser.user?.email === ADMIN_EMAIL) {
      throw new Error('Utilisez la fonction de réinitialisation de mot de passe standard pour votre propre compte')
    }

    console.log('🔄 Admin - Modification mot de passe pour:', targetUser.user?.email)

    // Modifier le mot de passe de l'utilisateur cible
    const { data: updateResult, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('❌ Erreur lors de la modification du mot de passe:', updateError)
      throw new Error(updateError.message || 'Erreur lors de la modification du mot de passe')
    }

    console.log('✅ Mot de passe modifié avec succès pour:', targetUser.user?.email)

    const result: UpdatePasswordResponse = {
      success: true,
      message: `Mot de passe modifié avec succès pour ${targetUser.user?.email}`
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'

    console.error('❌ Admin - Erreur modification mot de passe:', {
      error: errorMessage,
      timestamp: new Date().toISOString()
    })

    const result: UpdatePasswordResponse = {
      success: false,
      error: errorMessage
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
