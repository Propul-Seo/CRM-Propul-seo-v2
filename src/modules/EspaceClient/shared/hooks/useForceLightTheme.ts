import { useEffect } from 'react';

// Force le light theme pendant le montage du composant. Mémorise l'état
// initial pour le restaurer fidèlement au démontage — utile pour les pages
// publiques (/diagnostic, /diagnostic-envoye) montées hors du CRM admin
// qui pose `dark` sur <html> globalement.
export function useForceLightTheme() {
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    html.classList.remove('dark');
    return () => {
      if (hadDark) html.classList.add('dark');
    };
  }, []);
}
