export interface RingoverCallPayload {
  from: string;
  to: string;
  auto_answer: boolean;
}

export interface RingoverCallResponse {
  success: boolean;
  callId?: string;
  error?: string;
  message?: string;
}

export class RingoverService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://public-api.ringover.com/v2') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Initie un appel via la fonction Edge Supabase (évite les problèmes CORS)
   * @param phoneNumber - Numéro de téléphone à appeler
   * @param sdrUserId - ID de l'utilisateur SDR qui initie l'appel
   * @returns Promise<RingoverCallResponse>
   */
  async initiateCall(phoneNumber: string, sdrUserId: string): Promise<RingoverCallResponse> {
    try {
      // Validation des paramètres
      if (!phoneNumber || !sdrUserId) {
        throw new Error('phoneNumber et sdrUserId sont requis');
      }

      // Nettoyer le numéro de téléphone (supprimer espaces, tirets, etc.)
      const cleanPhoneNumber = this.cleanPhoneNumber(phoneNumber);
      
      if (!cleanPhoneNumber) {
        throw new Error('Numéro de téléphone invalide');
      }

      console.log('🚀 Ringover - Initiation appel via Supabase Edge');

      // Utiliser la fonction Edge Supabase au lieu d'appeler directement l'API
      const response = await fetch('https://tbuqctfgjjxnevmsvucl.supabase.co/functions/v1/ringover-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Pas besoin d'Authorization pour les fonctions Edge publiques
        },
        body: JSON.stringify({
          phoneNumber: cleanPhoneNumber,
          sdrUserId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          `Erreur fonction Edge: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      
      console.log('✅ Ringover - Appel initié avec succès');

      return {
        success: true,
        callId: data.callId,
        message: data.message || 'Appel initié avec succès'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      console.error('❌ Ringover - Erreur lors de l\'initiation de l\'appel:', {
        error: errorMessage,
        phoneNumber,
        sdrUserId,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Nettoie et valide un numéro de téléphone
   * @param phoneNumber - Numéro de téléphone brut
   * @returns Numéro nettoyé ou null si invalide
   */
  private cleanPhoneNumber(phoneNumber: string): string | null {
    if (!phoneNumber) return null;

    // Supprimer tous les caractères non numériques sauf le +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Supprimer les espaces multiples
    cleaned = cleaned.replace(/\s+/g, '');
    
    // Validation basique
    if (cleaned.length < 8 || cleaned.length > 15) {
      return null;
    }

    // Si le numéro commence par 00, le remplacer par +
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.substring(2);
    }

    // Si le numéro commence par 0 et n'a pas de +, ajouter +33
    if (cleaned.startsWith('0') && !cleaned.startsWith('+')) {
      cleaned = '+33' + cleaned.substring(1);
    }

    return cleaned;
  }

  /**
   * Vérifie la connectivité avec la fonction Edge Supabase
   * @returns Promise<boolean>
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      // Test simple de la fonction Edge avec des paramètres factices
      const response = await fetch('https://tbuqctfgjjxnevmsvucl.supabase.co/functions/v1/ringover-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: '0612345678',
          sdrUserId: 'test-connectivity'
        })
      });
      
      // Si on reçoit une réponse (même une erreur de validation), la fonction Edge est accessible
      return response.status !== 404;
    } catch (error) {
      console.error('❌ Ringover - Erreur de connectivité:', error);
      return false;
    }
  }
}

// Instance singleton du service
export const ringoverService = new RingoverService(
  import.meta.env.VITE_RINGOVER_API_KEY || '',
  import.meta.env.VITE_RINGOVER_BASE_URL || 'https://public-api.ringover.com/v2'
);
