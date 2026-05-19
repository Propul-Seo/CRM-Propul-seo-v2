import type { LucideIcon } from 'lucide-react';

// Placeholder Sky Aurora — gradient pastel + icône centrée.
export function TabPreviewPlaceholder({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="relative flex h-[100px] w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-sky-50 via-violet-50 to-pink-50 ring-1 ring-violet-100"
      style={{ boxShadow: 'inset 0 1px 2px rgba(139,92,246,0.08)' }}
    >
      <div className="flex flex-col items-center gap-1.5 text-violet-400">
        <Icon className="h-7 w-7 opacity-80" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Aperçu · {label}</span>
      </div>
    </div>
  );
}
