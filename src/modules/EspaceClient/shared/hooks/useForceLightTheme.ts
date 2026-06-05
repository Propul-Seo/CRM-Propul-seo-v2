import { useForcePortalSurface } from './useForcePortalSurface';

// Conservé pour compat : tous les contextes clairs (portail, qualif) l'utilisent.
export function useForceLightTheme() {
  useForcePortalSurface('light');
}
