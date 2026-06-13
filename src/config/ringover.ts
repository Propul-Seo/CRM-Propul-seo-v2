import { RingoverService } from '../services/ringoverService';

export const RINGOVER_CONFIG = {
  // Clé API Ringover (à configurer dans .env)
  API_KEY: import.meta.env.VITE_RINGOVER_API_KEY || '',
  
  // URL de base de l'API Ringover
  BASE_URL: import.meta.env.VITE_RINGOVER_BASE_URL || 'https://public-api.ringover.com/v2',
  
  // Endpoints de l'API
  ENDPOINTS: {
    CALLS: '/calls',
    CALLS_HISTORY: '/calls/history',
    CALLS_STATS: '/calls/stats'
  },
  
  // Configuration des appels
  CALL_SETTINGS: {
    AUTO_ANSWER: true,
    DEFAULT_TIMEOUT: 30000, // 30 secondes
    MAX_RETRIES: 3
  },
  
  // Validation des numéros de téléphone
  PHONE_VALIDATION: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 15,
    SUPPORTED_COUNTRIES: ['FR', 'US', 'GB', 'DE', 'ES', 'IT']
  }
};

// Vérification de la configuration
export const validateRingoverConfig = () => {
  const errors: string[] = [];
  
  if (!RINGOVER_CONFIG.API_KEY) {
    errors.push('REACT_APP_RINGOVER_API_KEY manquante dans les variables d\'environnement');
  }
  
  if (!RINGOVER_CONFIG.BASE_URL) {
    errors.push('REACT_APP_RINGOVER_BASE_URL manquante dans les variables d\'environnement');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration Ringover invalide:', errors);
    return false;
  }
  
  console.log('✅ Configuration Ringover valide');
  return true;
};

// Hook pour récupérer l'ID de l'utilisateur SDR connecté
export const getCurrentSdrId = (): string => {
  // Ici vous pouvez adapter selon votre système d'authentification
  // Par exemple, depuis un store Zustand, un contexte React, ou localStorage
  
  // Exemple avec localStorage (à adapter selon votre implémentation)
  const user = localStorage.getItem('currentUser');
  if (user) {
    try {
      const userData = JSON.parse(user);
      return userData.id || userData.sdrId || '';
    } catch {
      return '';
    }
  }
  
  // Fallback : récupérer depuis le store global si disponible
  // return useStore.getState().currentUser?.id || '';
  
  // ID de test temporaire
  return 'test-user-123';
};

// Instance singleton du service
export const ringoverService = new RingoverService(
  import.meta.env.VITE_RINGOVER_API_KEY || '',
  import.meta.env.VITE_RINGOVER_BASE_URL || 'https://public-api.ringover.com/v2'
);
