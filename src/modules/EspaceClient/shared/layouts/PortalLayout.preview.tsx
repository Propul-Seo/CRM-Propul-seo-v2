import { useState } from 'react';
import { ArrowUpRight, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { PortalLayout } from './PortalLayout';
import type { PortalTab } from '@/modules/EspaceClient/shared/constants';

/**
 * TEMPORARY preview page — visualises the PortalLayout shell with
 * representative content. Remove (or replace with the real routing tree)
 * at Task A5. Reachable at /espace-client/__preview.
 */
export function PortalLayoutPreview() {
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');

  return (
    <PortalLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      clientName="Sophie Martin"
      projectName="Disegno — refonte SEO"
      onLogout={() => alert('[demo] Logout clicked')}
    >
      <DemoContent activeTab={activeTab} />
    </PortalLayout>
  );
}

const LABELS: Record<PortalTab, string> = {
  dashboard: 'Bon retour, Sophie',
  project: 'Mon projet',
  documents: 'Documents',
  invoices: 'Factures',
  signatures: 'Signatures',
  help: 'Aide & FAQ',
};

const SUBTITLES: Record<PortalTab, string> = {
  dashboard: 'Voici un aperçu de votre projet aujourd’hui.',
  project: 'Les étapes de votre projet et l’avancement temps réel.',
  documents: 'Tous vos livrables et documents en un seul endroit.',
  invoices: 'Vos factures, échéances et historique de paiement.',
  signatures: 'Documents en attente de signature électronique.',
  help: 'Tout ce qu’il faut savoir pour profiter de votre espace.',
};

function DemoContent({ activeTab }: { activeTab: PortalTab }) {
  return (
    <div className="space-y-6 ps-fade-in" key={activeTab}>
      {/* Hero */}
      <section className="ps-surface relative overflow-hidden p-7 md:p-9">
        <div
          aria-hidden
          className="ps-hero-glow pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-60 blur-3xl"
        />
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--ps-primary-text)]">
          Tableau de bord
        </p>
        <h1 className="ps-gradient-text mt-1.5 text-[34px] font-bold leading-tight md:text-[40px]">
          {LABELS[activeTab]}
        </h1>
        <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-[var(--ps-text-secondary)]">
          {SUBTITLES[activeTab]}
        </p>
        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[var(--ps-primary-subtle)] px-3 py-1 text-[11.5px] font-semibold text-[var(--ps-primary-text)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--ps-primary)] animate-pulse" />
          Phase 2 · Production
          <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
        </div>
      </section>

      {/* KPI tiles */}
      <section className="grid gap-4 md:grid-cols-3">
        <Tile
          eyebrow="Avancement"
          value="62%"
          delta="+8 cette semaine"
          icon={TrendingUp}
          tint="violet"
        />
        <Tile
          eyebrow="Prochain jalon"
          value="14 j"
          delta="Recette intermédiaire"
          icon={Clock}
          tint="blue"
        />
        <Tile
          eyebrow="Tâches terminées"
          value="18 / 29"
          delta="62% complété"
          icon={CheckCircle2}
          tint="green"
        />
      </section>

      {/* Mini list / activity */}
      <section className="ps-surface overflow-hidden">
        <header className="flex items-center justify-between border-b border-[var(--ps-border-soft)] px-6 py-4">
          <h2 className="text-[14px] font-semibold tracking-tight text-[var(--ps-text-primary)]">
            Activité récente
          </h2>
          <button
            type="button"
            aria-label="Voir toute l'activité"
            className="text-[12px] font-medium text-[var(--ps-primary-text)] hover:underline"
          >
            Tout voir
          </button>
        </header>
        <ul className="divide-y divide-[var(--ps-border-soft)]">
          {ACTIVITY.map(item => (
            <li key={item.id} className="flex items-center gap-4 px-6 py-3.5">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-[14px] ${ACTIVITY_TINTS[item.tint]}`}
              >
                {item.glyph}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium tracking-tight text-[var(--ps-text-primary)]">
                  {item.title}
                </p>
                <p className="text-[12px] text-[var(--ps-text-muted)]">{item.date}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-[var(--ps-text-muted)]" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const TINTS = {
  violet: { bg: 'bg-[var(--ps-primary-subtle)]', text: 'text-[var(--ps-primary-text)]' },
  blue:   { bg: 'bg-blue-50',  text: 'text-blue-700' },
  green:  { bg: 'bg-emerald-50', text: 'text-emerald-700' },
} as const;

function Tile({
  eyebrow,
  value,
  delta,
  icon: Icon,
  tint,
}: {
  eyebrow: string;
  value: string;
  delta: string;
  icon: typeof TrendingUp;
  tint: keyof typeof TINTS;
}) {
  const t = TINTS[tint];
  return (
    <div className="ps-surface ps-surface-hover relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--ps-text-muted)]">
          {eyebrow}
        </p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.bg} ${t.text}`}>
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </span>
      </div>
      <p className="mt-3 text-[30px] font-bold leading-none tracking-tight text-[var(--ps-text-primary)]">
        {value}
      </p>
      <p className="mt-1.5 text-[12px] text-[var(--ps-text-muted)]">{delta}</p>
    </div>
  );
}

// Tints declared as literal class names so Tailwind's purge keeps them.
const ACTIVITY_TINTS = {
  blue:   'bg-blue-50',
  green:  'bg-emerald-50',
  violet: 'bg-[var(--ps-primary-subtle)]',
  amber:  'bg-amber-50',
} as const;

type ActivityTint = keyof typeof ACTIVITY_TINTS;

const ACTIVITY: Array<{ id: number; glyph: string; tint: ActivityTint; title: string; date: string }> = [
  { id: 1, glyph: '📄', tint: 'blue',   title: 'Facture PS-1031 envoyée',          date: 'Aujourd’hui · 14:22' },
  { id: 2, glyph: '✅', tint: 'green',  title: 'Maquette homepage validée',         date: 'Hier · 17:08' },
  { id: 3, glyph: '🎨', tint: 'violet', title: 'Charte graphique livrée',           date: '12 mai' },
  { id: 4, glyph: '📞', tint: 'amber',  title: 'Appel découverte planifié',         date: '10 mai' },
];
