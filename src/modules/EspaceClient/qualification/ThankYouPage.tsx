import { useForceLightTheme } from '@/modules/EspaceClient/shared/hooks/useForceLightTheme';
import '@/modules/EspaceClient/shared/layouts/portal-theme.css';
import { ThankYouA } from './thankyou/ThankYouA';

// Page de remerciement post-soumission qualif.
// Variante A (Confirmation premium silencieuse) — validée par Lyes le 2026-05-20.
// 2 CTAs : Réserver un appel (cal.com) + Voir nos accompagnements (propulseo-site.com).
// Pas de wrapper .propulspace-portal ici : ses styles globaux sur <a>
// (color: var(--ps-primary)) écrasent text-white sur les CTA gradient.
export function ThankYouPage() {
  useForceLightTheme();
  return <ThankYouA />;
}
