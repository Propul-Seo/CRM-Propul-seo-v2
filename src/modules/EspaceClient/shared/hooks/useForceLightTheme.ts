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
    // Le CRM définit son fond sombre dans :root (toujours actif), donc retirer
    // `dark` ne suffit pas : on pose une classe qui force html/body/#root en clair
    // (cf. portal-theme.css) le temps que le contexte Propul'Space est monté.
    html.classList.add('ps-light-surface');
    return () => {
      html.classList.remove('ps-light-surface');
      if (hadDark) html.classList.add('dark');
    };
  }, []);
}
