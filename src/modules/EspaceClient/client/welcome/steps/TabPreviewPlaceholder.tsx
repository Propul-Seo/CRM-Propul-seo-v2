import type { LucideIcon } from 'lucide-react';

// Placeholder Aurora — surface neutre opaque + icône centrée (accent violet unique).
export function TabPreviewPlaceholder({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="relative flex h-[100px] w-full items-center justify-center overflow-hidden rounded-lg bg-[var(--ps-bg-subtle)] shadow-inner ring-1 ring-[var(--ps-border-soft)]">
      <div className="flex flex-col items-center gap-1.5 text-[var(--ps-fg-muted)]">
        <Icon className="h-7 w-7 opacity-80" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Aperçu · {label}</span>
      </div>
    </div>
  );
}
