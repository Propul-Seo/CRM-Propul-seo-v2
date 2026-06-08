import { useMemo, useState, type ReactNode } from 'react'
import {
  Calendar, Clock, Check, Loader2, Lock, AlertCircle, FolderKanban,
  Download, ArrowRight, Mail, FileText, Radio,
} from 'lucide-react'
import {
  EmptyState, StatusBadge, Badge, ProgressRing, Skeleton, FileIcon,
} from '@/modules/EspaceClient/shared/components'
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext'
import {
  usePortalProjectSteps, usePortalDocuments,
  getSignedStorageUrl, type PortalDocument, type PortalProjectStep,
} from '../hooks/usePortalData'
import { usePortalProjectDetails } from '../hooks/usePortalProjectDetails'
import { inferBucket } from '@/modules/ProjectDetailsV3Preview/tabs/documents/constants'
import type { ProjectStepStatus } from '@/modules/EspaceClient/shared/types/portal.types'

// ── Formatage dates ───────────────────────────────────────────────
function formatLong(iso: string | null): string | undefined {
  if (!iso) return undefined
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
function formatShort(iso: string | null): string | undefined {
  if (!iso) return undefined
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
function daysBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null
  const ms = new Date(b).getTime() - new Date(a).getTime()
  if (Number.isNaN(ms)) return null
  return Math.max(0, Math.round(ms / 86_400_000))
}

// Clés = valeurs réelles de PrestaType (cf. src/types/project-v2.ts)
const PRESTA_LABELS: Record<string, string> = {
  web: 'Site web', site_web: 'Site web',
  erp: 'ERP / Outil métier', erp_v2: 'ERP / Outil métier',
  saas: 'SaaS', seo: 'SEO', communication: 'Communication',
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'PS'
}
function extOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

export function ProjectPage() {
  const { project } = usePortal()
  const steps = usePortalProjectSteps()
  const documents = usePortalDocuments()
  const { details } = usePortalProjectDetails()

  const loading = steps.loading || documents.loading
  const rows = steps.rows

  // ── Dérivés ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = rows.length || 1
    const done = rows.filter(s => s.status === 'completed').length
    const progressPct = Math.round((done / total) * 100)
    const current =
      rows.find(s => s.status === 'in_progress')
      ?? rows.find(s => s.status === 'blocked')
      ?? rows.find(s => s.status === 'upcoming')
      ?? null
    return { total: rows.length, done, progressPct, current }
  }, [rows])

  const startDate = details?.start_date ?? rows.find(s => s.date_start)?.date_start ?? null
  const endDate = details?.end_date ?? null
  const delay = daysBetween(startDate, endDate)
  const presta = details?.presta_type ?? []
  const prestaLabel = presta.length > 0 ? (PRESTA_LABELS[presta[0]] ?? presta[0]) : 'Projet'
  const referentName = details?.assigned_name ?? "Équipe Propul'SEO"

  // Livrables = documents de type "deliverable" (ou audit/report)
  const deliverables = useMemo(
    () => documents.rows.filter(d => ['deliverable', 'audit', 'report'].includes(d.document_type)),
    [documents.rows],
  )

  if (loading) return <ProjectSkeleton />

  if (steps.error) {
    return (
      <div className="ps-fade-in">
        <p className="rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">{steps.error}</p>
      </div>
    )
  }

  const hasSteps = rows.length > 0

  return (
    <div className="ps-fade-in space-y-6">
      {/* ── HERO + anneau + barre globale ──────────────────────── */}
      <section className="ps-surface relative overflow-hidden p-7 md:p-9">
        <div
          aria-hidden
          className="ps-hero-glow pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-60 blur-3xl"
        />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ps-primary-subtle)] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ps-primary-text)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ps-primary)]" />
              {prestaLabel}
            </span>
            <h1 className="ps-h1 mt-3 text-[24px] leading-tight text-[var(--ps-fg)] md:text-[28px]">
              {project.name ?? 'Mon projet'}
            </h1>
            <p className="ps-small mt-2">
              {startDate ? <>Démarré le {formatLong(startDate)}</> : 'Suivez l’avancement de votre projet en temps réel.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              {endDate && (
                <MetaItem icon={Calendar} text={`Livraison estimée : ${formatShort(endDate)}`} />
              )}
              {delay != null && (
                <MetaItem icon={Clock} text={`Délai : ${delay} jour${delay > 1 ? 's' : ''}`} />
              )}
              {stats.current && (
                <MetaItem icon={Radio} text={`Étape : ${stats.current.label}`} />
              )}
            </div>
          </div>
          <div className="shrink-0 self-center sm:self-start">
            <ProgressRing value={stats.progressPct} size={108} label="avancement global" />
          </div>
        </div>

        {/* Barre de progression globale */}
        {hasSteps && (
          <div className="mt-7">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--ps-border)]">
              <div
                className="h-full rounded-full bg-[var(--ps-primary)] transition-[width] duration-700"
                style={{ width: `${stats.progressPct}%` }}
              />
            </div>
            <p className="mt-2 text-[11.5px] text-[var(--ps-fg-muted)]">
              {stats.done} étape{stats.done > 1 ? 's' : ''} terminée{stats.done > 1 ? 's' : ''} sur {stats.total}
            </p>
          </div>
        )}
      </section>

      {!hasSteps ? (
        <section className="ps-surface p-6">
          <EmptyState
            icon={FolderKanban}
            title="Pas encore d'étapes"
            body="Votre roadmap projet sera publiée ici dès que l'équipe l'aura validée."
          />
        </section>
      ) : (
        <>
          {/* ── STEPPER HORIZONTAL ───────────────────────────── */}
          <section className="ps-surface overflow-x-auto px-6 py-7 md:px-8">
            <ol className="flex min-w-[560px] items-start">
              {rows.map((s, i) => (
                <StepperNode
                  key={s.id}
                  status={s.status as ProjectStepStatus}
                  label={s.label}
                  index={i}
                  isFirst={i === 0}
                  isLast={i === rows.length - 1}
                  prevDone={i > 0 && rows[i - 1].status === 'completed'}
                />
              ))}
            </ol>
            <Legend />
          </section>

          {/* ── PHASE ACTIVE : frise + activité/prochaine étape ─ */}
          <section>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ps-primary-subtle)] px-3 py-1 text-[11.5px] font-semibold text-[var(--ps-primary-text)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ps-primary)]" />
                Phase active
              </span>
              <h2 className="ps-h2 text-[var(--ps-fg)]">{stats.current?.label ?? 'Projet terminé'}</h2>
            </div>

            <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              {/* GAUCHE : frise vivante des jalons + livrables */}
              <div className="space-y-5">
                <div className="ps-surface flex flex-col overflow-hidden">
                  <header className="flex items-center justify-between border-b border-[var(--ps-border-soft)] px-6 py-4">
                    <h3 className="ps-h3 text-[var(--ps-fg)]">Frise du projet</h3>
                    <Badge tone="gray" dot={false}>{stats.total} jalon{stats.total > 1 ? 's' : ''}</Badge>
                  </header>
                  <ol className="flex-1 px-6 py-5">
                    {rows.map((s, i) => (
                      <TimelineRow key={s.id} step={s} isLast={i === rows.length - 1} />
                    ))}
                  </ol>
                </div>

                {deliverables.length > 0 && (
                  <div className="ps-surface overflow-hidden">
                    <header className="flex items-center justify-between border-b border-[var(--ps-border-soft)] px-6 py-4">
                      <h3 className="ps-h3 text-[var(--ps-fg)]">Livrables du projet</h3>
                      <Badge tone="gray" dot={false}>{deliverables.length}</Badge>
                    </header>
                    <ul className="divide-y divide-[var(--ps-border-soft)]">
                      {deliverables.map(doc => (
                        <DeliverableRow key={doc.id} doc={doc} />
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* DROITE : Activité & prochaine étape */}
              <aside className="flex flex-col gap-4">
                <NextStepCard current={stats.current} />
                <ReferentCard name={referentName} />
              </aside>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

// ── Hero meta ─────────────────────────────────────────────────────
function MetaItem({ icon: Icon, text }: { icon: typeof Calendar; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--ps-fg-secondary)]">
      <Icon className="h-3.5 w-3.5 text-[var(--ps-fg-muted)]" strokeWidth={2} />
      {text}
    </span>
  )
}

// ── Nœud du stepper horizontal ────────────────────────────────────
const STEP_LABEL_FR: Record<ProjectStepStatus, string> = {
  upcoming: 'À venir', in_progress: 'En cours', completed: 'Terminé', blocked: 'Bloqué',
}

function StepperNode({
  status, label, index, isFirst, isLast, prevDone,
}: {
  status: ProjectStepStatus
  label: string
  index: number
  isFirst: boolean
  isLast: boolean
  prevDone: boolean
}) {
  const done = status === 'completed'
  const active = status === 'in_progress'
  const blocked = status === 'blocked'
  const Icon = done ? Check : blocked ? AlertCircle : active ? Loader2 : Lock

  return (
    <li className="relative flex flex-1 flex-col items-center gap-2.5">
      {/* connecteurs */}
      {!isFirst && (
        <span
          aria-hidden
          className={`absolute right-1/2 top-[17px] h-0.5 w-full ${prevDone ? 'bg-[var(--ps-primary)]' : 'bg-[var(--ps-border)]'}`}
        />
      )}
      {!isLast && (
        <span
          aria-hidden
          className={`absolute left-1/2 top-[17px] h-0.5 w-full ${done ? 'bg-[var(--ps-primary)]' : 'bg-[var(--ps-border)]'}`}
        />
      )}
      {/* dot */}
      <span
        className={[
          'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          done ? 'bg-[var(--ps-primary)] text-white'
            : active ? 'bg-[var(--ps-bg-elevated)] text-[var(--ps-primary)] ring-[3px] ring-[var(--ps-primary-subtle)] border-2 border-[var(--ps-primary)]'
            : blocked ? 'bg-red-500 text-white'
            : 'bg-[var(--ps-bg-elevated)] text-[var(--ps-fg-muted)] border-2 border-[var(--ps-border)]',
        ].join(' ')}
      >
        <Icon className={`h-4 w-4 ${active ? 'animate-spin' : ''}`} strokeWidth={2.5} />
      </span>
      <div className="text-center">
        <p
          className={`text-[12px] font-semibold leading-tight ${
            done ? 'text-[var(--ps-primary-text)]'
              : active ? 'text-[var(--ps-primary)]'
              : blocked ? 'text-[var(--ps-danger-text)]'
              : 'text-[var(--ps-fg-muted)]'
          }`}
        >
          {label}
        </p>
        <p className={`mt-0.5 text-[10.5px] ${active ? 'font-medium text-[var(--ps-primary)]' : 'text-[var(--ps-fg-muted)]'}`}>
          {STEP_LABEL_FR[status]}
        </p>
      </div>
    </li>
  )
}

function Legend() {
  const items: Array<{ cls: string; label: string }> = [
    { cls: 'bg-[var(--ps-primary)]', label: 'Terminé' },
    { cls: 'border-2 border-[var(--ps-primary)] bg-[var(--ps-bg-elevated)]', label: 'En cours' },
    { cls: 'border-2 border-[var(--ps-border)] bg-[var(--ps-bg-elevated)]', label: 'À venir' },
    { cls: 'bg-red-500', label: 'Bloqué' },
  ]
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--ps-border-soft)] pt-4">
      {items.map(it => (
        <span key={it.label} className="inline-flex items-center gap-2 text-[11px] text-[var(--ps-fg-secondary)]">
          <span className={`h-3 w-3 rounded-full ${it.cls}`} />
          {it.label}
        </span>
      ))}
    </div>
  )
}

// ── Ligne de la frise verticale (jalon détaillé) ──────────────────
const ROW_DOT: Record<ProjectStepStatus, { node: string; icon: typeof Check }> = {
  completed:   { node: 'bg-[var(--ps-primary)] text-white', icon: Check },
  in_progress: { node: 'ps-brand-gradient text-white', icon: Loader2 },
  blocked:     { node: 'bg-red-500 text-white', icon: AlertCircle },
  upcoming:    { node: 'bg-[var(--ps-bg-subtle)] text-[var(--ps-fg-muted)]', icon: Lock },
}

function TimelineRow({ step, isLast }: { step: PortalProjectStep; isLast: boolean }) {
  const status = step.status as ProjectStepStatus
  const cfg = ROW_DOT[status] ?? ROW_DOT.upcoming
  const Icon = cfg.icon
  const date = step.date_actual_end
    ? `Terminé le ${formatLong(step.date_actual_end)}`
    : step.date_start
      ? `Démarré le ${formatLong(step.date_start)}`
      : step.date_planned_end
        ? `Prévu le ${formatLong(step.date_planned_end)}`
        : null

  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[15px] top-8 h-[calc(100%-32px)] w-px bg-[var(--ps-border-soft)]"
        />
      )}
      <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.node}`}>
        <Icon className={`h-4 w-4 ${status === 'in_progress' ? 'animate-spin' : ''}`} strokeWidth={2.5} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13.5px] font-semibold tracking-tight text-[var(--ps-fg)]">{step.label}</p>
          <StatusBadge status={step.status} />
        </div>
        {step.description && (
          <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--ps-fg-secondary)]">{step.description}</p>
        )}
        {date && <p className="mt-1 text-[11.5px] text-[var(--ps-fg-muted)]">{date}</p>}
      </div>
    </li>
  )
}

// ── Livrable téléchargeable ───────────────────────────────────────
async function downloadDocument(doc: PortalDocument): Promise<void> {
  const bucket = inferBucket(doc.file_url)
  if (bucket === 'external') {
    window.open(doc.file_url, '_blank', 'noopener,noreferrer')
    return
  }
  const url = await getSignedStorageUrl(bucket, doc.file_url)
  if (!url) {
    alert('Impossible de générer le lien de téléchargement. Réessayez plus tard.')
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

function DeliverableRow({ doc }: { doc: PortalDocument }) {
  const [downloading, setDownloading] = useState(false)
  async function handle() {
    setDownloading(true)
    await downloadDocument(doc)
    setDownloading(false)
  }
  return (
    <li className="flex items-center gap-4 px-6 py-3.5">
      <FileIcon ext={extOf(doc.name)} mime={doc.file_mime_type ?? undefined} className="h-10 w-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-[var(--ps-fg)]">{doc.name}</p>
        <p className="text-[12px] text-[var(--ps-fg-muted)]">
          {formatShort(doc.created_at) ?? '—'}
          {` · v${doc.version}`}
        </p>
      </div>
      <button
        type="button"
        onClick={handle}
        disabled={downloading}
        className="ps-tap inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--ps-border-strong)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ps-fg-secondary)] transition-colors hover:bg-[var(--ps-bg-subtle)] disabled:opacity-50"
      >
        {downloading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Download className="h-3.5 w-3.5" strokeWidth={2} />}
        Télécharger
      </button>
    </li>
  )
}

// ── Bloc « Activité & prochaine étape » ───────────────────────────
function NextStepCard({ current }: { current: PortalProjectStep | null }) {
  if (!current) {
    return (
      <div className="ps-surface flex flex-1 flex-col justify-center p-6 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ps-success-subtle)] text-[var(--ps-success-text)]">
          <Check className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <p className="ps-h3 mt-3 text-[var(--ps-fg)]">Projet finalisé</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--ps-fg-secondary)]">
          Toutes les étapes sont terminées. Merci de votre confiance !
        </p>
      </div>
    )
  }

  const blocked = current.status === 'blocked'
  const dateLine = current.date_planned_end
    ? `Échéance prévue : ${formatLong(current.date_planned_end)}`
    : current.date_start
      ? `Démarrée le ${formatLong(current.date_start)}`
      : null

  return (
    <div className="ps-surface flex flex-1 flex-col rounded-[var(--ps-radius-card)] border-l-[3px] border-l-[var(--ps-primary)] bg-[var(--ps-primary-subtle)] p-6">
      <p className="ps-eyebrow flex items-center gap-1.5">
        <Clock className="h-3 w-3" strokeWidth={2.5} />
        {blocked ? 'Action attendue' : 'Étape en cours'}
      </p>
      <p className="ps-h3 mt-2.5 text-[var(--ps-fg)]">{current.label}</p>
      {current.description && (
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--ps-fg-secondary)]">
          {current.description}
        </p>
      )}
      <div className="mt-3">
        <StatusBadge status={current.status} />
      </div>
      {dateLine && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[var(--ps-fg-secondary)]">
          <Calendar className="h-3.5 w-3.5 opacity-70" strokeWidth={2} />
          {dateLine}
        </p>
      )}
      <a
        href="mailto:team@propulseo-site.com"
        className="ps-tap mt-5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--ps-primary)] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--ps-primary-hover)]"
      >
        Échanger sur cette étape
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
      </a>
    </div>
  )
}

// ── Référent agence ───────────────────────────────────────────────
function ReferentCard({ name }: { name: string }) {
  return (
    <div className="ps-surface flex items-center gap-3.5 p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--ps-primary-subtle)] bg-[var(--ps-primary-subtle)] text-[12px] font-bold text-[var(--ps-primary-text)]" style={{ fontFamily: 'var(--ps-font-display)' }}>
        {initials(name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[var(--ps-fg)]">{name}</p>
        <p className="text-[11.5px] text-[var(--ps-fg-muted)]">Propul'SEO · votre référent</p>
      </div>
      <a
        href="mailto:team@propulseo-site.com"
        className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-[var(--ps-primary-text)] hover:underline"
      >
        <Mail className="h-3.5 w-3.5" strokeWidth={2} />
        Une question ?
      </a>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────
function ProjectSkeleton(): ReactNode {
  return (
    <div className="space-y-6">
      <div className="ps-surface p-8">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="mt-3 h-7 w-2/3 rounded-md" />
        <Skeleton className="mt-3 h-4 w-44 rounded-md" />
        <Skeleton className="mt-6 h-1.5 w-full rounded-full" />
      </div>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  )
}
