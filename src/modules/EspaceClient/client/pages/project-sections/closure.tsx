import { ArrowRight } from 'lucide-react'
import type { PortalProjectStep } from '@/modules/EspaceClient/client/hooks/usePortalData'
import { TEAM_MAILTO, formatJour } from './format'

interface ClosureFooterProps {
  current: PortalProjectStep | null
  endDate: string | null
  referentName: string
}

/** Clôture éditoriale : prochaine échéance + signature du référent. */
export function ClosureFooter({ current, endDate, referentName }: ClosureFooterProps) {
  const prenom = referentName.split(' ')[0] ?? referentName
  const ctaLabel = /^équipe$/i.test(prenom) ? "Écrire à l'équipe" : `Écrire à ${prenom}`

  return (
    <footer className="mt-14 grid gap-6 border-t border-[var(--ps-border)] pt-6 sm:mt-20 sm:grid-cols-2 sm:items-end">
      <div>
        <p className="ps-tiny">Prochaine échéance</p>
        <p className="ps-num mt-1 text-[15px] font-medium text-[var(--ps-fg)]">
          {current
            ? `${current.label} · ${formatJour(current.date_planned_end ?? current.date_start)}`
            : `Livraison · ${formatJour(endDate)}`}
        </p>
      </div>
      <div className="sm:text-right">
        <p className="ps-small">
          Un doute sur une étape ?{' '}
          <span className="font-medium text-[var(--ps-fg)]">{referentName}</span>, votre référent,
          vous répond sous 24 h.
        </p>
        <a
          href={TEAM_MAILTO}
          className="group mt-1 inline-flex min-h-[44px] items-center gap-1.5 text-[13px] font-semibold text-[var(--ps-primary-text)] transition-colors duration-150 hover:text-[var(--ps-primary-hover)]"
        >
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.25} />
        </a>
      </div>
    </footer>
  )
}
