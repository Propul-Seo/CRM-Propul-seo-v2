import type { LucideIcon } from 'lucide-react';

// Palier 7 — placeholder générique pour les 7 mini-mocks du carrousel.
// Décision Q4 : on garde des placeholders pour l'instant, à remplacer par
// des mini-mocks JSX réalistes une fois que les vraies pages portail seront
// finalisées (évite le drift visuel pendant qu'elles bougent encore).
export function TabPreviewPlaceholder({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div
      className="ps-skeleton relative flex h-[120px] w-full items-center justify-center overflow-hidden rounded-lg border border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <Icon className="ps-pulse h-10 w-10 text-[var(--ps-fg-muted)] opacity-60" />
      <span className="ps-eyebrow ps-eyebrow-muted absolute bottom-2 left-2.5 rounded-full bg-white/70 px-2 py-0.5 backdrop-blur-sm">
        Aperçu · {label}
      </span>
    </div>
  );
}
