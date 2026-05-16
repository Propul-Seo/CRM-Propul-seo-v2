import { useState } from 'react';
import { TrendingUp, Clock, CheckCircle2, FileText, Image, Phone } from 'lucide-react';
import { PortalLayout } from './PortalLayout';
import type { PortalTab } from '@/modules/EspaceClient/shared/constants';
import {
  Hero,
  KpiTile,
  SectionHead,
  ActivityRow,
} from '@/modules/EspaceClient/shared/components';

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
    <div className="ps-fade-in space-y-6" key={activeTab}>
      <Hero
        eyebrow="Tableau de bord"
        title={LABELS[activeTab]}
        subtitle={SUBTITLES[activeTab]}
        phasePill="Phase 2 · Production"
      />

      <section className="grid gap-4 md:grid-cols-3">
        <KpiTile eyebrow="Avancement"      value="62%"     delta="+8 cette semaine"  icon={TrendingUp}    tint="violet" />
        <KpiTile eyebrow="Prochain jalon"  value="14 j"    delta="Recette intermédiaire" icon={Clock}     tint="blue" />
        <KpiTile eyebrow="Tâches terminées" value="18 / 29" delta="62% complété"      icon={CheckCircle2}  tint="green" />
      </section>

      <section className="ps-surface overflow-hidden">
        <SectionHead
          title="Activité récente"
          action={
            <button
              type="button"
              aria-label="Voir toute l'activité"
              className="text-[12px] font-medium text-[var(--ps-primary-text)] hover:underline"
            >
              Tout voir
            </button>
          }
        />
        <ul className="divide-y divide-[var(--ps-border-soft)]">
          {ACTIVITY.map(item => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <ActivityRow icon={Icon} tint={item.tint} title={item.title} meta={item.date} />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

const ACTIVITY = [
  { id: 1, icon: FileText,    tint: 'blue'   as const, title: 'Facture PS-1031 envoyée',  date: 'Aujourd’hui · 14:22' },
  { id: 2, icon: CheckCircle2, tint: 'green' as const, title: 'Maquette homepage validée', date: 'Hier · 17:08' },
  { id: 3, icon: Image,       tint: 'violet' as const, title: 'Charte graphique livrée',   date: '12 mai' },
  { id: 4, icon: Phone,       tint: 'amber'  as const, title: 'Appel découverte planifié', date: '10 mai' },
];
