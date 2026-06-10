import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, HelpCircle, Mail, MessageSquare, Search, X, SearchX, LayoutDashboard, FolderKanban, FileText, Receipt, PenLine } from 'lucide-react'
import { Hero, SectionHead, EmptyState } from '@/modules/EspaceClient/shared/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext'
import { usePortalProjectDetails } from '../hooks/usePortalProjectDetails'
import { CONTACT_EMAIL, resolveTeamWhatsapp, AGENCY_NAME } from '@/modules/EspaceClient/shared/constants'

const FAQ: Array<{ q: string; a: string; tags: string[] }> = [
  { q: 'Comment télécharger une facture ?',
    a: "Rendez-vous dans l'onglet Factures, cliquez sur la facture concernée, puis sur \"Télécharger le PDF\". Le lien est valable 1 heure.",
    tags: ['facture', 'téléchargement', 'pdf'] },
  { q: 'Comment payer une facture en ligne ?',
    a: 'Dans le détail de la facture, cliquez sur "Payer en ligne". Vous serez redirigé vers une page Stripe sécurisée. Une fois payée, le statut se met à jour automatiquement.',
    tags: ['facture', 'paiement', 'stripe'] },
  { q: "J'ai signé un document mais le statut n'a pas changé.",
    a: "Le statut se met à jour automatiquement une fois la signature finalisée. Si rien n'a bougé après quelques minutes, contactez-nous.",
    tags: ['signature'] },
  { q: 'Comment me connecter à mon espace ?',
    a: "Avec votre email et votre mot de passe. Vous pouvez aussi demander un lien de connexion à usage unique (« Recevoir un lien à la place »), ou réinitialiser votre mot de passe via « Mot de passe oublié ? » depuis la page de connexion.",
    tags: ['connexion', 'mot de passe', 'lien'] },
  { q: 'Je ne vois pas tous mes documents.',
    a: "Seuls les documents marqués \"visibles client\" par l'équipe Propul'SEO sont affichés ici. Les brouillons internes ne sont jamais partagés sans validation.",
    tags: ['document'] },
  { q: 'Puis-je inviter un collaborateur à voir mon espace ?',
    a: "Pour la V1 du portail, un seul compte par projet. La gestion multi-utilisateurs arrivera dans une prochaine version.",
    tags: ['accès', 'compte', 'collaborateur'] },
  { q: 'Comment changer mon mot de passe ?',
    a: "Rendez-vous dans Mon profil → section Sécurité. Tapez votre nouveau mot de passe (8 caractères minimum), confirmez-le, et cliquez sur Changer.",
    tags: ['mot de passe', 'profil', 'sécurité'] },
  { q: 'Mes coordonnées sont-elles modifiables ?',
    a: "Oui, depuis Mon profil → Mes coordonnées. Téléphone, entreprise et prénom peuvent être mis à jour à tout moment. L'email de connexion reste figé.",
    tags: ['profil', 'coordonnées'] },
]

const QUICK_LINKS = [
  { seg: '',           label: 'Tableau de bord', icon: LayoutDashboard },
  { seg: 'project',    label: 'Mon projet',      icon: FolderKanban },
  { seg: 'documents',  label: 'Documents',       icon: FileText },
  { seg: 'invoices',   label: 'Factures',        icon: Receipt },
  { seg: 'signatures', label: 'Signatures',      icon: PenLine },
]

export function HelpPage() {
  const { basePath } = usePortal()
  const { details } = usePortalProjectDetails()
  const whatsapp = resolveTeamWhatsapp(details?.assigned_name)
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return FAQ
    return FAQ.filter(item =>
      item.q.toLowerCase().includes(q) ||
      item.a.toLowerCase().includes(q) ||
      item.tags.some(t => t.includes(q))
    )
  }, [search])

  return (
    <div className="ps-fade-in space-y-6">
      <Hero
        eyebrow="Aide"
        title="Aide & FAQ"
        subtitle="Tout ce qu'il faut savoir pour profiter de votre espace."
      />

      <section className="ps-surface overflow-hidden">
        <SectionHead title="Accès rapide" />
        <div className="grid grid-cols-2 gap-2 px-6 py-4 sm:grid-cols-5">
          {QUICK_LINKS.map(link => {
            const Icon = link.icon
            return (
              <Link
                key={link.seg}
                to={link.seg ? `${basePath}/${link.seg}` : basePath}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] px-3 py-3 text-center transition-colors hover:border-[var(--ps-primary-subtle)] hover:bg-[var(--ps-primary-subtle)]"
              >
                <Icon className="h-5 w-5 text-[var(--ps-primary-text)]" />
                <span className="text-[12px] font-medium text-[var(--ps-fg)]">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="ps-surface overflow-hidden">
        <div className="border-b border-[var(--ps-border-soft)] px-6 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ps-fg-muted)]" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher dans la FAQ…"
              className="pl-8 pr-8"
            />
            {search && (
              <button
                type="button"
                aria-label="Effacer"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ps-fg-muted)] hover:text-[var(--ps-fg)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={SearchX}
              title="Aucune réponse trouvée"
              body="Aucune question ne correspond à votre recherche. Essayez d'autres mots-clés ou contactez-nous directement."
            />
          </div>
        ) : (
          <ul className="divide-y divide-[var(--ps-border-soft)]">
            {filtered.map((item, idx) => {
              const open = openIdx === idx
              return (
                <li key={item.q}>
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
              )
            })}
          </ul>
        )}
      </section>

      <section className="ps-surface p-6">
        <h2 className="ps-h3">Une question reste sans réponse ?</h2>
        <p className="mt-1 text-[13px] text-[var(--ps-fg-secondary)]">
          L'équipe {AGENCY_NAME} répond en moins d'une heure ouvrée.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {whatsapp && (
            <Button asChild className="bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]">
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="mr-1.5 h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          )}
          <Button asChild variant="outline">
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
