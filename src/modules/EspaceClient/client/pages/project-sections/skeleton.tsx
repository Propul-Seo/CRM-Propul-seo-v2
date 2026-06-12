import { Skeleton } from '@/modules/EspaceClient/shared/components'

/** Squelette de chargement — mêmes proportions que la vue compacte. */
export function ProjectSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      {/* En-tête 2 colonnes */}
      <div className="ps-surface p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <div className="space-y-2.5 lg:border-l lg:border-[var(--ps-border-soft)] lg:pl-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-1.5 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
      {/* Jalons | activité + livrables */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-[var(--ps-radius-card)]" />
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-[var(--ps-radius-card)]" />
          <Skeleton className="h-28 rounded-[var(--ps-radius-card)]" />
        </div>
      </div>
    </div>
  )
}
