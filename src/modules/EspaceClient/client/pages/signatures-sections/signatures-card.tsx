import { Download, PenLine } from 'lucide-react'
import { Badge } from '@/modules/EspaceClient/shared/components'
import type { PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData'
import {
  STATUT_DOT, STATUT_LIBELLE, STATUT_TEXTE, TYPE_LABELS, formatDate, toSignatureStatus,
} from './signatures-lib'

// Carte dense des documents à signer — même forme que la carte jalons du
// projet (header px-5 py-3.5, lignes divide-y px-5 py-3) : dot + libellé FR,
// date, action « Signer » à droite.

interface SignaturesCardProps {
  rows: PortalSignature[]
  /** Aperçu admin : la signature est désactivée. */
  previewMode: boolean
  onSign: (sig: PortalSignature) => void
  onDownloadSigned: (sig: PortalSignature) => void
}

export function SignaturesCard({ rows, previewMode, onSign, onDownloadSigned }: SignaturesCardProps) {
  const pending = rows.filter(r => toSignatureStatus(r.status) === 'pending').length
  return (
    <section className="ps-surface overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--ps-border-soft)] px-5 py-3.5">
        <h2 className="ps-h3 text-[var(--ps-fg)]">Documents à signer</h2>
        <Badge tone="gray" dot={false}>
          <span className="ps-num">{pending > 0 ? `${pending} en attente` : 'À jour'}</span>
        </Badge>
      </header>
      <ul className="divide-y divide-[var(--ps-border-soft)]">
        {rows.map(sig => (
          <SignatureRow
            key={sig.id}
            sig={sig}
            previewMode={previewMode}
            onSign={() => onSign(sig)}
            onDownload={() => onDownloadSigned(sig)}
          />
        ))}
      </ul>
    </section>
  )
}

interface RowProps {
  sig: PortalSignature
  previewMode: boolean
  onSign: () => void
  onDownload: () => void
}

function SignatureRow({ sig, previewMode, onSign, onDownload }: RowProps) {
  const status = toSignatureStatus(sig.status)
  const canSign = !previewMode && status === 'pending'
  const hasSignedPdf = status === 'signed' && !!sig.signed_pdf_url

  const dateLigne = status === 'signed'
    ? formatDate(sig.signed_at)
    : status === 'pending' && sig.expires_at
      ? `avant le ${formatDate(sig.expires_at)}`
      : formatDate(sig.sent_at ?? sig.created_at)

  return (
    <li className={`flex min-h-[48px] items-center gap-3 px-5 py-3 ${status === 'pending' ? 'bg-[var(--ps-warning-subtle)]' : ''}`}>
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${STATUT_DOT[status]} ${status === 'pending' ? 'ps-pulse' : ''}`}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium leading-5 text-[var(--ps-fg)]">{sig.name}</p>
        <p className="ps-num truncate text-[12px] text-[var(--ps-fg-secondary)]">
          {TYPE_LABELS[sig.signature_type] ?? sig.signature_type}
          {sig.sent_at && ` · envoyé le ${formatDate(sig.sent_at)}`}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="ps-num hidden text-[12px] text-[var(--ps-fg-secondary)] sm:block">{dateLigne}</p>
        <p className={`text-[12px] font-medium ${STATUT_TEXTE[status]}`}>{STATUT_LIBELLE[status]}</p>
      </div>
      {canSign && (
        <button
          type="button"
          onClick={onSign}
          className="ps-tap inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-[var(--ps-radius-input)] bg-[var(--ps-primary)] px-3.5 text-[12.5px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)]"
        >
          <PenLine className="h-3.5 w-3.5" strokeWidth={2.25} />
          Signer
        </button>
      )}
      {hasSignedPdf && (
        <button
          type="button"
          onClick={onDownload}
          aria-label="Télécharger le document signé"
          title="Télécharger le document signé"
          className="ps-tap flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--ps-radius-input)] border border-[var(--ps-border)] text-[var(--ps-fg-secondary)] transition-colors duration-150 hover:bg-[var(--ps-bg-subtle)] hover:text-[var(--ps-fg)]"
        >
          <Download className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
    </li>
  )
}
