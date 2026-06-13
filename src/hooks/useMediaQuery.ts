import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour détecter les media queries
 * @param query - Media query string (ex: '(max-width: 768px)')
 * @returns boolean - true si la query match
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    // SSR safe - retourne false côté serveur
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);

    const updateMatches = () => setMatches(media.matches);
    updateMatches();

    // Utiliser addEventListener pour compatibilité moderne
    media.addEventListener('change', updateMatches);
    return () => media.removeEventListener('change', updateMatches);
  }, [query]);

  return matches;
}

/**
 * Hook pour détecter si on est sur mobile (< 768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook pour détecter si on est sur tablette (768px - 1023px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Hook pour détecter si on est sur desktop (>= 1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

/**
 * Hook pour détecter l'orientation de l'écran
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  return isPortrait ? 'portrait' : 'landscape';
}

/**
 * Hook pour détecter si l'appareil supporte le touch
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );
  }, []);

  return isTouch;
}

/**
 * Hook combiné pour obtenir toutes les infos de viewport
 */
export function useViewport() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const orientation = useOrientation();
  const isTouch = useIsTouchDevice();

  return {
    isMobile,
    isTablet,
    isDesktop,
    orientation,
    isTouch,
    // Helpers
    isSmallScreen: isMobile || isTablet,
    isLargeScreen: isDesktop,
  };
}
