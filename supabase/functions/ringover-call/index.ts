import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RingoverCallRequest {
  phoneNumber: string;
  sdrUserId: string;
}

interface RingoverCallResponse {
  success: boolean;
  callId?: string;
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

    // Récupérer le corps de la requête
    const { phoneNumber, sdrUserId }: RingoverCallRequest = await req.json()

    // Validation des paramètres
    if (!phoneNumber || !sdrUserId) {
      throw new Error('phoneNumber et sdrUserId sont requis')
    }

    // Récupérer l'API key depuis les variables d'environnement Supabase
    const ringoverApiKey = Deno.env.get('RINGOVER_API_KEY')
    if (!ringoverApiKey) {
      throw new Error('RINGOVER_API_KEY non configurée')
    }

    // Nettoyer le numéro de téléphone
    const cleanPhoneNumber = cleanPhoneNumber(phoneNumber)
    if (!cleanPhoneNumber) {
      throw new Error('Numéro de téléphone invalide')
    }

    // Préparer la requête vers Ringover
    const payload = {
      from: sdrUserId,
      to: cleanPhoneNumber,
      auto_answer: true
    }

    console.log('🚀 Ringover - Initiation appel:', {
      from: sdrUserId,
      to: cleanPhoneNumber,
      timestamp: new Date().toISOString()
    })

    // Appeler l'API Ringover
    const response = await fetch('https://public-api.ringover.com/v2/calls', {
      method: 'POST',
      headers: {
        'X-API-Key': ringoverApiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || 
        `Erreur API Ringover: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()
    
    console.log('✅ Ringover - Appel initié avec succès:', data)

    const result: RingoverCallResponse = {
      success: true,
      callId: data.call_id || data.id,
      message: 'Appel initié avec succès'
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
    
    console.error('❌ Ringover - Erreur lors de l\'initiation de l\'appel:', {
      error: errorMessage,
      timestamp: new Date().toISOString()
    })

    const result: RingoverCallResponse = {
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

// Fonction utilitaire pour nettoyer le numéro de téléphone
function cleanPhoneNumber(phoneNumber: string): string | null {
  if (!phoneNumber) return null

  // Supprimer tous les caractères non numériques sauf le +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '')
  
  // Supprimer les espaces multiples
  cleaned = cleaned.replace(/\s+/g, '')
  
  // Validation basique
  if (cleaned.length < 8 || cleaned.length > 15) {
    return null
  }

  // Si le numéro commence par 00, le remplacer par +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2)
  }

  // Si le numéro commence par 0 et n'a pas de +, ajouter +33
  if (cleaned.startsWith('0') && !cleaned.startsWith('+')) {
    cleaned = '+33' + cleaned.substring(1)
  }

  return cleaned
}
