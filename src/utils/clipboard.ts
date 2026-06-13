/**
 * Utilitaire pour copier du texte dans le presse-papiers
 * Avec fallback pour les navigateurs plus anciens
 */

export const copyToClipboard = async (text: string, type: string = 'Texte'): Promise<boolean> => {
  try {
    // Méthode moderne avec l'API Clipboard
    await navigator.clipboard.writeText(text);
    console.log(`✅ ${type} copié:`, text);
    return true;
  } catch (err) {
    console.error(`❌ Erreur lors de la copie du ${type}:`, err);
    
    try {
      // Fallback pour les navigateurs plus anciens
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log(`✅ ${type} copié (méthode fallback):`, text);
        return true;
      } else {
        console.error(`❌ Échec de la copie avec la méthode fallback`);
        return false;
      }
    } catch (fallbackErr) {
      console.error(`❌ Erreur avec la méthode fallback:`, fallbackErr);
      return false;
    }
  }
};

/**
 * Hook personnalisé pour la copie avec retour visuel
 */
export const useClipboard = () => {
  const copy = async (text: string, type: string = 'Texte') => {
    const success = await copyToClipboard(text, type);
    
    if (success) {
      // Optionnel: retour visuel (toast, notification, etc.)
      // toast.success(`${type} copié dans le presse-papiers`);
    } else {
      // Optionnel: notification d'erreur
      // toast.error(`Erreur lors de la copie du ${type}`);
    }
    
    return success;
  };

  return { copy };
};
