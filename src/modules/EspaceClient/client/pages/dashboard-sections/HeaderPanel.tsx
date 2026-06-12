import { Mail } from 'lucide-react';
import { ProgressRing } from '@/modules/EspaceClient/shared/components';
import { CONTACT_EMAIL } from '@/modules/EspaceClient/shared/constants';
import { EUR } from './lib';

// Panneau d'en-tête porteur (direction B « Matière & panneaux ») : identité
// projet + anneau d'avancement + interlocuteur dédié + bandeau d'indicateurs.

interface HeaderPanelProps {
  firstName: string;
  progressPct: number;
  /** Fin de la phrase d'état du titre (après « Votre projet est à X % — »). */
  tail: string;
  /** Nom du projet · type de prestation. */
  projectLine: string;
  /** « Démarré le … · livraison estimée le … » (null si aucune date connue). */
  scheduleLine: string | null;
  /** Membre Propul'SEO assigné (null → équipe générique). */
  referentName: string | null;
  dueTotal: number;
  dueCount: number;
  documentsCount: number;
  /** Dernier document partagé (« Dernier : nom · date »), null si aucun. */
  lastDocLine: string | null;
  pendingSignatures: number;
}

export function HeaderPanel({
  firstName, progressPct, tail, projectLine, scheduleLine, referentName,
  dueTotal, dueCount, documentsCount, lastDocLine, pendingSignatures,
}: HeaderPanelProps) {
  const refName = referentName ?? "Équipe Propul'SEO";
  const refInitials = refName.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'PS';
  const writeLabel = referentName ? `Écrire à ${referentName.trim().split(/\s+/)[0]}` : "Écrire à l'équipe";

  return (
    <section className="ps-surface overflow-hidden">
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between md:px-8 md:py-7">
        <div className="min-w-0 flex-1">
          <p className="ps-eyebrow">Bonjour, {firstName}</p>
          <h1 className="ps-h1 pt-2">
            Votre projet est à{' '}
            <span className="ps-num text-[var(--ps-primary)]">{progressPct} %</span>
            {' — '}{tail}
          </h1>
          <p className="ps-small mt-2">{projectLine}</p>
          {scheduleLine && (
            <p className="ps-small mt-1 text-[var(--ps-fg-secondary)]">{scheduleLine}</p>
          )}

          {/* Interlocuteur dédié — rapatrié de l'ancien rail droit */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] font-[family-name:var(--ps-font-display)] text-[12px] font-semibold text-[var(--ps-primary-text)]">
              {refInitials}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-tight text-[var(--ps-fg)]">{refName}</span>
              <span className="ps-small block text-[var(--ps-fg-secondary)]">Votre interlocuteur dédié</span>
            </span>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="ps-tap inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg-elevated)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--ps-fg-secondary)] transition-colors hover:bg-[var(--ps-bg-subtle)] hover:text-[var(--ps-fg)]"
            >
              <Mail className="h-3.5 w-3.5" strokeWidth={2} />
              {writeLabel}
            </a>
          </div>
        </div>
        <div className="hidden sm:block">
          <ProgressRing value={progressPct} size={116} />
        </div>
      </div>

      {/* Indicateurs intégrés au panneau — bandeau bg-subtle, pas de tuiles */}
      <div className="grid grid-cols-1 divide-y divide-[var(--ps-border-soft)] border-t border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <HeaderStat
          label="Reste à régler"
          value={dueTotal > 0 ? EUR.format(dueTotal) : '0 €'}
          hint={dueCount > 0
            ? `${dueCount} facture${dueCount > 1 ? 's' : ''} en attente`
            : 'Vous êtes à jour'}
        />
        <HeaderStat
          label="Documents partagés"
          value={String(documentsCount)}
          hint={lastDocLine ?? 'Disponibles dans votre espace'}
        />
        <HeaderStat
          label="Signatures"
          value={String(pendingSignatures)}
          hint={pendingSignatures > 0
            ? `Document${pendingSignatures > 1 ? 's' : ''} en attente de votre signature`
            : 'Tout est signé'}
        />
      </div>
    </section>
  );
}

function HeaderStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="min-w-0 px-6 py-4 md:px-8">
      <p className="ps-small text-[var(--ps-fg-secondary)]">{label}</p>
      <p className="ps-metric ps-num pt-1.5 text-[var(--ps-fg)]">{value}</p>
      <p className="mt-1 truncate text-[12px] text-[var(--ps-fg-secondary)]">{hint}</p>
    </div>
  );
}
