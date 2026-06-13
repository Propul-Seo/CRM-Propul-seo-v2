import { Skeleton } from '@/modules/EspaceClient/shared/components';

// Squelette qui épouse la nouvelle composition : panneau d'en-tête
// (texte + anneau + bandeau d'indicateurs), bandeau d'action,
// grille principale + rail latéral.
export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="ps-surface overflow-hidden">
        <div className="flex items-center justify-between gap-6 p-6 md:px-8 md:py-7">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3 w-28 rounded-md" />
            <Skeleton className="mt-3 h-7 w-3/4 rounded-md" />
            <Skeleton className="mt-2 h-4 w-48 rounded-md" />
            <Skeleton className="mt-1.5 h-4 w-64 rounded-md" />
          </div>
          <Skeleton className="hidden h-[116px] w-[116px] shrink-0 rounded-full sm:block" />
        </div>
        <div className="grid grid-cols-1 border-t border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] sm:grid-cols-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="px-6 py-4 md:px-8">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="mt-2 h-6 w-16 rounded-md" />
              <Skeleton className="mt-2 h-3 w-28 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      <Skeleton className="h-[88px] w-full rounded-[var(--ps-radius-card)]" />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Skeleton className="h-72 w-full rounded-[var(--ps-radius-card)]" />
          <Skeleton className="h-48 w-full rounded-[var(--ps-radius-card)]" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-32 w-full rounded-[var(--ps-radius-card)]" />
          <Skeleton className="h-24 w-full rounded-[var(--ps-radius-card)]" />
          <Skeleton className="h-48 w-full rounded-[var(--ps-radius-card)]" />
        </div>
      </div>
    </div>
  );
}
