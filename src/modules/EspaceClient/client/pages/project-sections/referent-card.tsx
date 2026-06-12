import { Mail } from 'lucide-react'
import { TEAM_MAILTO } from './format'

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'PS'
}

// ── Référent agence (conservé de la page historique) ──────────────
export function ReferentCard({ name }: { name: string }) {
  return (
    <div className="ps-surface flex items-center gap-3.5 p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--ps-primary-subtle)] bg-[var(--ps-primary-subtle)] text-[12px] font-bold text-[var(--ps-primary-text)]">
        {initials(name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[var(--ps-fg)]">{name}</p>
        <p className="text-[11.5px] text-[var(--ps-fg-muted)]">Propul'SEO · votre référent</p>
      </div>
      <a
        href={TEAM_MAILTO}
        className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 text-[12px] font-medium text-[var(--ps-primary-text)] hover:underline"
      >
        <Mail className="h-3.5 w-3.5" strokeWidth={2} />
        Une question ?
      </a>
    </div>
  )
}
