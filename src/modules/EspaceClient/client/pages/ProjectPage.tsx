import { FolderKanban, Loader2, Calendar, Sparkles, UserRound } from 'lucide-react'
import { Hero, TimelineStep, EmptyState, SectionHead, Badge } from '@/modules/EspaceClient/shared/components'
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext'
import { usePortalProjectSteps } from '../hooks/usePortalData'
import { usePortalProjectDetails } from '../hooks/usePortalProjectDetails'
import type { ProjectStepStatus } from '@/modules/EspaceClient/shared/types/portal.types'

function formatLong(iso: string | null): string | undefined {
  if (!iso) return undefined
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const PRESTA_LABELS: Record<string, string> = {
  site: 'Site web',
  site_erp: 'Site + ERP',
  erp: 'ERP / Outil métier',
  seo: 'SEO',
  ads: 'Publicité',
  content: 'Contenu',
  design: 'Design',
}

export function ProjectPage() {
  const { project } = usePortal()
  const { rows, loading, error } = usePortalProjectSteps()
  const { details } = usePortalProjectDetails()

  const startLabel = formatLong(details?.start_date ?? null)
  const endLabel   = formatLong(details?.end_date ?? null)
  const presta     = details?.presta_type ?? []

  return (
    <div className="ps-fade-in space-y-6">
      <Hero
        eyebrow="Projet"
        title={project.name ?? 'Mon projet'}
        subtitle="Les étapes de votre projet et l'avancement temps réel."
      />

      <section className="ps-surface overflow-hidden">
        <SectionHead title="Infos projet" />
        <dl className="grid grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-2">
          <InfoRow label="Type de prestation">
            {presta.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {presta.map(p => (
                  <Badge key={p} tone="violet">{PRESTA_LABELS[p] ?? p}</Badge>
                ))}
              </div>
            ) : <Muted>—</Muted>}
          </InfoRow>
          <InfoRow label="Statut">
            <Badge tone="blue">{project.status ?? '—'}</Badge>
          </InfoRow>
          <InfoRow label="Démarrage">
            {startLabel ? <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 opacity-60" />{startLabel}</span> : <Muted>—</Muted>}
          </InfoRow>
          <InfoRow label="Livraison prévue">
            {endLabel ? <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 opacity-60" />{endLabel}</span> : <Muted>—</Muted>}
          </InfoRow>
        </dl>
        {details?.description && (
          <div className="border-t border-[var(--ps-border-soft)] px-6 py-4">
            <p className="text-[11px] uppercase tracking-wider text-[var(--ps-fg-muted)] mb-1">Description</p>
            <p className="whitespace-pre-line text-[13.5px] text-[var(--ps-fg)] leading-relaxed">{details.description}</p>
          </div>
        )}
      </section>

      <section className="ps-surface overflow-hidden">
        <SectionHead title="Votre référent agence" />
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-pink-500 to-amber-500 text-white">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-medium text-[var(--ps-fg)]">
              {details?.assigned_name ?? 'Équipe Propul\'SEO'}
            </p>
            <p className="text-[12px] text-[var(--ps-fg-muted)]">
              Pour toute question : <a href="mailto:team@propulseo-site.com" className="text-[var(--ps-primary-text)] hover:underline">team@propulseo-site.com</a>
            </p>
          </div>
        </div>
      </section>

      <section className="ps-surface p-6 md:p-8">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--ps-primary-text)]" />
          <h2 className="ps-h3">Avancement</h2>
        </div>
        {loading && (
          <div className="flex items-center justify-center py-8 text-[var(--ps-fg-muted)]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
        )}
        {!loading && !error && rows.length === 0 && (
          <EmptyState
            icon={FolderKanban}
            title="Pas encore d'étapes"
            body="Votre roadmap projet sera publiée ici dès que l'équipe l'aura validée."
          />
        )}
        {!loading && rows.length > 0 && (
          <ol className="space-y-0">
            {rows.map((s, i) => (
              <TimelineStep
                key={s.id}
                status={s.status as ProjectStepStatus}
                label={s.label}
                startedAt={formatLong(s.date_start)}
                completedAt={formatLong(s.date_actual_end)}
                isLast={i === rows.length - 1}
              />
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-[var(--ps-fg-muted)]">{label}</dt>
      <dd className="mt-1 text-[13.5px] font-medium text-[var(--ps-fg)]">{children}</dd>
    </div>
  )
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-[var(--ps-fg-muted)]">{children}</span>
}
