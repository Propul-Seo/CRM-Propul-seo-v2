import { HelpCircle, Mail, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePortalProjectDetails } from '@/modules/EspaceClient/client/hooks/usePortalProjectDetails'
import { CONTACT_EMAIL, resolveTeamWhatsapp, AGENCY_NAME } from '@/modules/EspaceClient/shared/constants'
import { FaqCard } from './help-sections/faq-card'
import { FAQ } from './help-sections/faq-data'

/**
 * Page Aide du portail — forme compacte calquée sur l'aperçu admin
 * (couleurs Aurora) : en-tête masthead, FAQ en carte dense unique,
 * contacts WhatsApp/email en bandeau compact. Logique de contact inchangée.
 */
export function HelpPage() {
  const { details } = usePortalProjectDetails()
  const whatsapp = resolveTeamWhatsapp(details?.assigned_name)

  return (
    <div className="ps-fade-in space-y-4">
      {/* En-tête compact */}
      <section className="ps-surface p-5">
        <p className="ps-eyebrow ps-eyebrow-muted">Aide</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary-subtle)]">
            <HelpCircle className="h-5 w-5 text-[var(--ps-primary)]" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h1 className="ps-h2 truncate text-[var(--ps-fg)]">Aide & FAQ</h1>
            <p className="ps-small ps-num truncate">
              {FAQ.length} questions fréquentes — tout pour profiter de votre espace.
            </p>
          </div>
        </div>
      </section>

      <FaqCard />

      {/* Bandeau contact compact */}
      <section className="ps-surface flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="ps-h3 text-[var(--ps-fg)]">Une question reste sans réponse ?</h2>
          <p className="ps-small mt-0.5">L'équipe {AGENCY_NAME} répond en moins d'une heure ouvrée.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {whatsapp && (
            <Button asChild className="ps-tap bg-[var(--ps-primary)] text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)]">
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="mr-1.5 h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          )}
          <Button asChild variant="outline" className="ps-tap">
            <a href={`mailto:${CONTACT_EMAIL}`}>
              <Mail className="mr-1.5 h-4 w-4" />
              {CONTACT_EMAIL}
            </a>
          </Button>
        </div>
      </section>
    </div>
  )
}
