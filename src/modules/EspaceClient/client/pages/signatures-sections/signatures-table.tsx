import type { PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData'
import {
  STATUT_DOT, STATUT_LIBELLE, STATUT_TEXTE, TYPE_LABELS,
  formatDate, formatShortDate, toSignatureStatus,
} from './signatures-lib'

// Liste éditoriale posée sur le fond (même forme que le tableau Factures) :
// document, type, envoi, échéance, statut — lignes sélectionnables ≥ 48 px.

const GRID = 'sm:grid sm:grid-cols-[minmax(0,1fr)_110px_120px_140px_130px] sm:gap-6'

/** Dot + libellé FR du statut — partagé entre la liste et la carte de détail. */
export function StatutSignature({ status }: { status: string }) {
  const s = toSignatureStatus(status)
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUT_DOT[s]} ${s === 'pending' ? 'ps-pulse' : ''}`} aria-hidden />
      <span className={`text-[12px] font-medium ${STATUT_TEXTE[s]}`}>{STATUT_LIBELLE[s]}</span>
    </span>
  )
}

interface SignaturesTableProps {
  rows: PortalSignature[]
  oldestSent: string | null
  selectedId: string | null
  onSelect: (id: string) => void
}

export function SignaturesTable({ rows, oldestSent, selectedId, onSelect }: SignaturesTableProps) {
  return (
    <section className="mt-4" aria-label="Tous les documents à signer">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-[var(--ps-border)] pb-3">
        <div>
          <h2 className="ps-h3">Tous les documents</h2>
          <p className="ps-num mt-0.5 text-[12px] text-[var(--ps-fg-secondary)]">
            {rows.length} {rows.length > 1 ? 'documents' : 'document'}
            {oldestSent ? ` · depuis ${formatDate(oldestSent)}` : ''}
          </p>
        </div>
      </div>

      <div className={`hidden border-b border-[var(--ps-border-soft)] py-2.5 text-[12px] font-medium text-[var(--ps-fg-secondary)] sm:px-3 ${GRID}`}>
        <span>Document</span>
        <span>Type</span>
        <span>Envoyé le</span>
        <span>Échéance</span>
        <span>Statut</span>
      </div>

      <ul className="divide-y divide-[var(--ps-border-soft)]">
        {rows.map(sig => (
          <li key={sig.id}>
            <LigneSignature sig={sig} selectionnee={sig.id === selectedId} onSelect={() => onSelect(sig.id)} />
          </li>
        ))}
      </ul>
    </section>
  )
}

// ── Ligne de la liste (bouton de sélection) ─────────────────────────
interface LigneProps {
  sig: PortalSignature
  selectionnee: boolean
  onSelect: () => void
}

function LigneSignature({ sig, selectionnee, onSelect }: LigneProps) {
  const status = toSignatureStatus(sig.status)
  const echeance = status === 'signed'
    ? `Signé le ${formatShortDate(sig.signed_at)}`
    : status === 'pending' && sig.expires_at
      ? `avant le ${formatShortDate(sig.expires_at)}`
      : '—'

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selectionnee}
      className={`flex min-h-[48px] w-full items-center justify-between gap-4 rounded-[var(--ps-radius-input)] px-3 py-3 text-left transition-[background-color,box-shadow] duration-150 [transition-timing-function:var(--ps-ease)] ${GRID} ${
        selectionnee
          ? 'bg-[var(--ps-primary-subtle)] shadow-[inset_3px_0_0_0_var(--ps-primary)]'
          : 'hover:bg-[var(--ps-bg-subtle)]'
      }`}
    >
      <span className="min-w-0 sm:contents">
        <span className="block truncate text-[13.5px] font-medium text-[var(--ps-fg)] sm:order-1 sm:self-center">
          {sig.name}
        </span>
        <span className="ps-num mt-0.5 block text-[11.5px] text-[var(--ps-fg-secondary)] sm:order-2 sm:mt-0 sm:self-center sm:text-[12px]">
          {TYPE_LABELS[sig.signature_type] ?? sig.signature_type}
        </span>
      </span>
      <span className="hidden sm:order-3 sm:block sm:self-center">
        <span className="ps-num text-[13px] text-[var(--ps-fg-secondary)]">{formatShortDate(sig.sent_at ?? sig.created_at)}</span>
      </span>
      <span className="hidden sm:order-4 sm:block sm:self-center">
        <span className="ps-num text-[13px] text-[var(--ps-fg-secondary)]">{echeance}</span>
      </span>
      <span className="flex shrink-0 justify-end sm:order-5 sm:items-center sm:justify-start">
        <StatutSignature status={sig.status} />
      </span>
    </button>
  )
}
