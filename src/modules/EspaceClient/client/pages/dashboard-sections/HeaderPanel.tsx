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
    <section className="ps-surface p-6 md:px-8 md:py-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="ps-eyebrow">Bonjour, {firstName}</p>
          <h1 className="ps-h1 pt-2">
            Votre projet est à{' '}
            <span className="ps-num text-[var(--ps-primary)]">{progressPct} %</span>
            {' — '}{tail}
          </h1>
          <p className="ps-small mt-2">{projectLine}</p>
          {scheduleLine && (
            <p className="ps-small ps-num mt-1 text-[var(--ps-fg-secondary)]">{scheduleLine}</p>
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

        {/* Chiffres clés + anneau — intégrés à l'encadré (ex-bande grise) */}
        <div className="flex items-center justify-between gap-6 lg:justify-end lg:gap-7">
          <dl className="grid flex-1 grid-cols-3 gap-4 lg:w-[210px] lg:flex-none lg:grid-cols-1 lg:gap-0 lg:space-y-3.5 lg:border-l lg:border-[var(--ps-border-soft)] lg:pl-6">
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
              hint={lastDocLine ?? 'Dans votre espace'}
            />
            <HeaderStat
              label="Signatures"
              value={String(pendingSignatures)}
              hint={pendingSignatures > 0
                ? `${pendingSignatures > 1 ? 'Documents' : 'Document'} en attente`
                : 'Tout est signé'}
            />
          </dl>
          <div className="hidden shrink-0 sm:block">
            <ProgressRing value={progressPct} size={116} />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeaderStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-[var(--ps-fg-secondary)]">{label}</dt>
      <dd className="ps-num mt-0.5 text-[15px] font-semibold tracking-tight text-[var(--ps-fg)] [font-family:var(--ps-font-display)]">
        {value}
      </dd>
      <dd className="ps-num truncate text-[11px] text-[var(--ps-fg-secondary)]">{hint}</dd>
    </div>
  );
}
