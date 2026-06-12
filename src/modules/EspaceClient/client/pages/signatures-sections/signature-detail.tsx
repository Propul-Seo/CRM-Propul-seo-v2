import { ArrowRight, Check, Download, PenLine, ShieldCheck } from 'lucide-react'
import type { PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData'
import { TYPE_LABELS, formatDate, toSignatureStatus } from './signatures-lib'
import { StatutSignature } from './signatures-table'

// Carte de détail riche en zone basse : LA surface élevée de l'écran.
// Réassurance eIDAS, exemplaire signé téléchargeable, CTA « Signer » → modal.

interface SignatureDetailProps {
  signature: PortalSignature
  /** Aperçu admin : le CTA reste visible mais désactivé (parité client). */
  previewMode: boolean
  onSign: () => void
  onDownloadSigned: () => void
}

const LINK_CLS =
  'group -my-2 inline-flex min-h-[44px] items-center gap-1.5 py-2 text-[13px] font-semibold text-[var(--ps-primary-text)] transition-colors duration-150 hover:text-[var(--ps-primary-hover)]'

export function SignatureDetail({ signature, previewMode, onSign, onDownloadSigned }: SignatureDetailProps) {
  const status = toSignatureStatus(signature.status)

  const piedTexte = status === 'pending'
    ? null // remplacé par la réassurance ShieldCheck
    : status === 'signed'
      ? signature.signed_at
        ? <>Signé le <span className="ps-num font-medium text-[var(--ps-fg)]">{formatDate(signature.signed_at)}</span>{signature.signed_name ? <> par <span className="font-medium text-[var(--ps-fg)]">{signature.signed_name}</span></> : null}. Merci pour votre confiance.</>
        : 'Document signé. Merci pour votre confiance.'
      : status === 'declined'
        ? 'Vous avez refusé ce document — contactez votre référent si vous souhaitez le revoir.'
        : 'Le délai de signature est dépassé — contactez votre référent pour recevoir une nouvelle demande.'

  return (
    <section className="mt-4" aria-label="Détail du document sélectionné">
      <div className="ps-surface p-5">
        {/* Entête : identité du document + statut */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0">
            <p className="ps-num text-[12px] text-[var(--ps-fg-muted)] [font-family:var(--ps-font-mono)]">
              {TYPE_LABELS[signature.signature_type] ?? signature.signature_type}
            </p>
            <h2 className="ps-h3 mt-1 text-[var(--ps-fg)]">{signature.name}</h2>
            <dl className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] text-[var(--ps-fg-secondary)]">
              <div className="flex gap-1.5">
                <dt>Envoyé le</dt>
                <dd className="ps-num font-medium text-[var(--ps-fg)]">{formatDate(signature.sent_at ?? signature.created_at)}</dd>
              </div>
              {status === 'pending' && signature.expires_at && (
                <div className="flex gap-1.5">
                  <dt>À signer avant le</dt>
                  <dd className="ps-num font-medium text-[var(--ps-warning-text)]">{formatDate(signature.expires_at)}</dd>
                </div>
              )}
              {status === 'signed' && signature.signed_at && (
                <div className="flex gap-1.5">
                  <dt>Signé le</dt>
                  <dd className="ps-num font-medium text-[var(--ps-fg)]">{formatDate(signature.signed_at)}</dd>
                </div>
              )}
            </dl>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="ps-tiny">Statut du document</p>
            <p className="mt-1.5 sm:flex sm:justify-end">
              <StatutSignature status={signature.status} />
            </p>
          </div>
        </div>

        {/* Pied : réassurance + exemplaire signé + action */}
        <div className="mt-4 flex flex-col gap-4 border-t border-[var(--ps-border-soft)] pt-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {status === 'pending' ? (
              <p className="ps-small flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--ps-fg-muted)]" strokeWidth={2} />
                Signature électronique sécurisée (eIDAS) — un certificat de preuve horodaté est conservé.
              </p>
            ) : (
              <p className="ps-small">{piedTexte}</p>
            )}
            {status === 'signed' && signature.signed_pdf_url && (
              <div className="mt-1 flex flex-wrap items-center gap-x-5">
                <button type="button" onClick={onDownloadSigned} className={LINK_CLS}>
                  <Download className="h-3.5 w-3.5" strokeWidth={2} />
                  Télécharger l'exemplaire signé
                </button>
              </div>
            )}
          </div>
          {status === 'pending' && (
            <button
              type="button"
              onClick={onSign}
              disabled={previewMode}
              title={previewMode ? 'Désactivé en aperçu admin' : undefined}
              className="group ps-tap inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-[var(--ps-radius-input)] bg-[var(--ps-primary)] px-8 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)] disabled:opacity-60 sm:w-auto"
            >
              <PenLine className="h-4 w-4" strokeWidth={2.25} />
              Signer le document
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.25} />
            </button>
          )}
          {status === 'signed' && (
            <span
              aria-disabled="true"
              className="inline-flex h-12 w-full shrink-0 cursor-default items-center justify-center gap-2 rounded-[var(--ps-radius-input)] bg-[var(--ps-bg-subtle)] px-8 text-[14px] font-semibold text-[var(--ps-fg-muted)] sm:w-auto"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              Document signé
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
