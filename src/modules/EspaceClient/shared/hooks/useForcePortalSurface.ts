import { useEffect } from 'react';

type Surface = 'light' | 'dark' | 'night' | 'none';

const SURFACE_CLASS: Record<Exclude<Surface, 'none'>, string> = {
  light: 'ps-light-surface',
  dark:  'ps-dark-surface',
  night: 'ps-night-surface',
};

// Force le chrome de page (html/body/#root) en clair, sombre OU nuit pendant le
// montage. Mémorise l'état initial pour le restaurer fidèlement au démontage.
// Le CRM pose `dark` + un fond sombre dans :root ; les contextes Propul'Space
// (portail nuit / admin sombre / qualif claire) posent leur propre surface.
export function useForcePortalSurface(surface: Surface = 'light') {
  useEffect(() => {
    if (surface === 'none') return; // monté dans un shell qui gère déjà son thème : ne pas toucher au <html>
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    const surfaceClass = SURFACE_CLASS[surface];
    html.classList.remove('dark');
    html.classList.add(surfaceClass);
    return () => {
      html.classList.remove(surfaceClass);
      if (hadDark) html.classList.add('dark');
    };
  }, [surface]);
}
