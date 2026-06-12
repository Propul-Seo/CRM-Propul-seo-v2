import { Skeleton } from '@/modules/EspaceClient/shared/components'

/** Squelette qui épouse la composition « une de revue » + frise éditoriale. */
export function ProjectSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1080px]">
      {/* Kicker */}
      <div className="flex items-baseline justify-between">
        <Skeleton className="h-3.5 w-28 rounded-md" />
        <Skeleton className="h-3.5 w-44 rounded-md" />
      </div>
      {/* Titre display */}
      <Skeleton className="mt-8 h-10 w-4/5 rounded-md" />
      <Skeleton className="mt-3 h-10 w-1/2 rounded-md" />
      {/* Filet-progression + bande de méta */}
      <Skeleton className="mt-10 h-0.5 w-full rounded-full" />
      <div className="grid grid-cols-2 gap-y-5 border-b border-[var(--ps-border)] py-5 sm:grid-cols-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="sm:px-8 sm:first:pl-0">
            <Skeleton className="h-3 w-20 rounded-md" />
            <Skeleton className="mt-2 h-4 w-28 rounded-md" />
          </div>
        ))}
      </div>
      {/* Frise : deux lignes, la carte active, une ligne */}
      <div className="mt-10 sm:mt-14">
        {[0, 1].map(i => (
          <FriseLigneSkeleton key={i} />
        ))}
        <Skeleton className="my-6 h-48 w-full rounded-2xl" />
        <FriseLigneSkeleton />
      </div>
      {/* Compléments (livrables / activité) */}
      <div className="mt-10 space-y-5 sm:mt-14">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  )
}

function FriseLigneSkeleton() {
  return (
    <div className="grid gap-1.5 py-5 sm:grid-cols-[176px_minmax(0,1fr)] sm:gap-0 sm:py-0">
      <div className="flex justify-start sm:justify-end sm:pr-10 sm:pt-6">
        <Skeleton className="h-3.5 w-24 rounded-md" />
      </div>
      <div className="sm:border-l sm:border-[var(--ps-border)] sm:py-6 sm:pl-10">
        <Skeleton className="h-4 w-48 rounded-md" />
        <Skeleton className="mt-2 h-3.5 w-72 max-w-full rounded-md" />
      </div>
    </div>
  )
}
