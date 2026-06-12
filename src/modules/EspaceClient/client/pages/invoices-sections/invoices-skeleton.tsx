import { Skeleton } from '@/modules/EspaceClient/shared/components';

// Squelette épousant la composition éditoriale : masthead (kicker, phrase
// d'état, bande de chiffres sous filets), tableau, carte de détail.

export function InvoicesSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1080px]">
      <div className="flex items-baseline justify-between gap-6">
        <Skeleton className="h-3.5 w-24 rounded-md" />
        <Skeleton className="h-3.5 w-48 rounded-md" />
      </div>
      <Skeleton className="mt-8 h-10 w-full max-w-[540px] rounded-lg" />
      <Skeleton className="mt-5 h-4 w-72 rounded-md" />

      <div className="mt-10 grid grid-cols-2 gap-6 border-y border-[var(--ps-border)] py-7 sm:grid-cols-3">
        {[0, 1, 2].map(i => (
          <div key={i}>
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="mt-3 h-7 w-28 rounded-md" />
          </div>
        ))}
      </div>

      <div className="mt-14">
        <Skeleton className="h-5 w-44 rounded-md" />
        <div className="mt-5 space-y-2">
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[56px] w-full rounded-lg" />
          ))}
        </div>
      </div>

      <Skeleton className="mt-10 h-[280px] w-full rounded-[var(--ps-radius-card)]" />
    </div>
  );
}
