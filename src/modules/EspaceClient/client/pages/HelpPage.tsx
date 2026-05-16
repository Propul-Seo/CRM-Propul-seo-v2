import { useState } from 'react';
import { ChevronDown, HelpCircle, Mail, MessageSquare } from 'lucide-react';
import { Hero } from '@/modules/EspaceClient/shared/components';
import { Button } from '@/components/ui/button';
import { CONTACT_EMAIL, WHATSAPP_NUMBER, AGENCY_NAME } from '@/modules/EspaceClient/shared/constants';

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Comment télécharger une facture ?',
    a: "Rendez-vous dans l'onglet Factures, cliquez sur la facture concernée, puis sur \"Télécharger le PDF\". Le lien est valable 1 heure.",
  },
  {
    q: 'Comment payer une facture en ligne ?',
    a: 'Dans le détail de la facture, cliquez sur "Payer en ligne". Vous serez redirigé vers une page Stripe sécurisée. Une fois payée, le statut se met à jour automatiquement.',
  },
  {
    q: "J'ai signé un document mais le statut n'a pas changé.",
    a: "Le statut se met à jour sous 5 minutes en moyenne. Si après 30 minutes rien n'a bougé, contactez-nous.",
  },
  {
    q: "Mon lien magique n'a pas marché.",
    a: "Les liens magiques expirent au bout d'1 heure pour des raisons de sécurité. Demandez-en un nouveau depuis la page de connexion.",
  },
  {
    q: 'Je ne vois pas tous mes documents.',
    a: "Seuls les documents marqués \"visibles client\" par l'équipe Propul'SEO sont affichés ici. Les brouillons internes ne sont jamais partagés sans validation.",
  },
  {
    q: 'Puis-je inviter un collaborateur à voir mon espace ?',
    a: "Pour la V1 du portail, un seul compte par projet. La gestion multi-utilisateurs arrivera dans une prochaine version.",
  },
];

export function HelpPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="ps-fade-in space-y-6">
      <Hero
        eyebrow="Aide"
        title="Aide & FAQ"
        subtitle="Tout ce qu'il faut savoir pour profiter de votre espace."
      />

      <section className="ps-surface overflow-hidden">
        <ul className="divide-y divide-[var(--ps-border-soft)]">
          {FAQ.map((item, idx) => {
            const open = openIdx === idx;
            return (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : idx)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-[var(--ps-bg-subtle)]"
                >
                  <HelpCircle className="h-4 w-4 shrink-0 text-[var(--ps-primary-text)]" />
                  <span className="flex-1 text-[13.5px] font-semibold text-[var(--ps-fg)]">{item.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--ps-fg-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <p className="px-6 pb-4 pl-[52px] text-[13px] leading-relaxed text-[var(--ps-fg-secondary)]">
                    {item.a}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="ps-surface p-6">
        <h2 className="ps-h3">Une question reste sans réponse ?</h2>
        <p className="mt-1 text-[13px] text-[var(--ps-fg-secondary)]">
          L'équipe {AGENCY_NAME} répond en moins d'une heure ouvrée.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild className="ps-brand-gradient text-white">
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="mr-1.5 h-4 w-4" />
              WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={`mailto:${CONTACT_EMAIL}`}>
              <Mail className="mr-1.5 h-4 w-4" />
              {CONTACT_EMAIL}
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
