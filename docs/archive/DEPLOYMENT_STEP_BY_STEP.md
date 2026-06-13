# 🚀 Déploiement Manuel de la Fonction Edge Ringover

## 📋 **ÉTAPE 1: Accéder au Dashboard Supabase**

1. **Allez sur** [https://supabase.com](https://supabase.com)
2. **Connectez-vous** avec votre compte
3. **Sélectionnez votre projet** CRMPropulseo

## 📋 **ÉTAPE 2: Créer la Fonction Edge**

1. **Dans le menu gauche**, cliquez sur **"Edge Functions"**
2. **Cliquez sur "New Function"**
3. **Nom de la fonction**: `ringover-call`
4. **Cliquez sur "Create"**

## 📋 **ÉTAPE 3: Copier le Code**

1. **Remplacez tout le contenu** de l'éditeur par ce code :

```typescript
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
```

5. **Cliquez sur "Deploy"**

## 📋 **ÉTAPE 4: Configurer la Variable d'Environnement**

1. **Dans le menu gauche**, cliquez sur **"Settings"**
2. **Cliquez sur "Environment variables"**
3. **Cliquez sur "Add new"**
4. **Key**: `RINGOVER_API_KEY`
5. **Value**: `86beace54c2f20043f96487617499b3bfbde123e`
6. **Cliquez sur "Save"**

## 📋 **ÉTAPE 5: Vérifier le Déploiement**

1. **Retournez à "Edge Functions"**
2. **Vérifiez que** `ringover-call` est listée
3. **Statut**: Devrait être "Active"

## 🧪 **ÉTAPE 6: Tester dans Votre Application**

1. **Rafraîchissez votre page** dans le navigateur
2. **Ouvrez une fiche client**
3. **Dans le panneau orange**, cliquez sur **"Test Connectivité"**
4. **Résultat attendu**: ✅ `true`
5. **Cliquez sur "Test Appel"**
6. **Résultat attendu**: ✅ Succès
7. **Testez le bouton vert "Appeler"**

## 🔍 **En Cas de Problème**

### **Erreur "Function not found"**
- Vérifiez que la fonction est bien déployée
- Vérifiez le nom exact: `ringover-call`

### **Erreur "RINGOVER_API_KEY non configurée"**
- Vérifiez que la variable d'environnement est bien configurée
- Redéployez la fonction après avoir ajouté la variable

### **Erreur "Erreur API Ringover: 401"**
- Vérifiez que l'API key est correcte
- Vérifiez que l'API key a les bonnes permissions

## 🎯 **Résultat Attendu**

Après le déploiement :
- ✅ **Plus d'erreurs CORS**
- ✅ **Bouton "Appeler" cliquable**
- ✅ **Appels Ringover fonctionnels**
- ✅ **Notifications de succès**

---

**🚀 Votre fonction Edge est maintenant prête à être déployée !**
