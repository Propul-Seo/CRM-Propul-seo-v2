import type { LucideIcon } from 'lucide-react';

// Palier 7 — placeholder générique pour les 7 mini-mocks du carrousel.
// Décision Q4 : on garde des placeholders pour l'instant, à remplacer par
// des mini-mocks JSX réalistes une fois que les vraies pages portail seront
// finalisées (évite le drift visuel pendant qu'elles bougent encore).
export function TabPreviewPlaceholder({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="relative flex h-[120px] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-[var(--ps-border)] bg-[var(--ps-bg-subtle)]">
      <div className="flex flex-col items-center gap-2 text-[var(--ps-fg-muted)]">
        <Icon className="h-8 w-8 opacity-50" />
        <span className="text-[11px] font-medium uppercase tracking-wider">Aperçu · {label}</span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}
