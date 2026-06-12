import { Link } from 'react-router-dom';
import { ArrowRight, LogOut, Mail, ReceiptEuro, Signature } from 'lucide-react';
import { CONTACT_EMAIL } from '@/modules/EspaceClient/shared/constants';
import type { DashboardAction } from './lib';

// Hero d'accueil « nuit encre » compact (variante V3 « barre de statut ») :
// état du projet + 3 chiffres en puces + interlocuteur, accès profil/déconnexion
// en haut à droite, et les actions attendues intégrées au pied de l'encadré.

const ACTION_ICON = { signature: Signature, invoice: ReceiptEuro } as const;

export interface HeaderStat {
  label: string;
  value: string;
}

interface HeaderPanelProps {
  firstName: string;
  progressPct: number;
  /** Fin de la phrase d'état (après « Votre projet est à X % — »). */
  tail: string;
  /** Nom du projet · type de prestation. */
  projectLine: string;
  /** « Démarré le … · livraison estimée le … » (null si aucune date). */
  scheduleLine: string | null;
  /** Membre Propul'SEO assigné (null → équipe générique). */
  referentName: string | null;
  /** Initiales du client connecté, pour l'avatar de profil. */
  clientInitials: string;
  /** 3 chiffres clés (étape, livraison, documents). */
  stats: HeaderStat[];
  /** Actions attendues, triées par urgence (jusqu'à 4). */
  actions: DashboardAction[];
  onProfile: () => void;
  onLogout: () => void;
}

export function HeaderPanel({
  firstName, progressPct, tail, projectLine, scheduleLine, referentName,
  clientInitials, stats, actions, onProfile, onLogout,
}: HeaderPanelProps) {
  const refName = referentName ?? "Équipe Propul'SEO";
  const writeLabel = referentName ? `Écrire à ${referentName.trim().split(/\s+/)[0]}` : "Écrire à l'équipe";
  const refInitials = refName.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'PS';

  return (
    <section className="ps-surface relative overflow-hidden">
      <span className="ps-hero-glow pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full opacity-70" aria-hidden />

      <div className="relative p-4 md:px-6 md:py-5">
        {/* Rangée haute : état + accès profil / déconnexion */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="ps-eyebrow">Bonjour, {firstName}</p>
            <h1 className="ps-h1 pt-2 text-[var(--ps-fg)]">
              Votre projet est à <span className="ps-num text-[var(--ps-primary-text)]">{progressPct} %</span>
              {' — '}{tail}
            </h1>
          </div>
          {/* Profil + déconnexion (desktop/tablette ; le header mobile fixe les porte déjà) */}
          <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
            <button
              type="button"
              onClick={onProfile}
              aria-label="Mon profil"
              className="ps-tap ps-brand-gradient flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold text-white ring-2 ring-[var(--ps-primary-subtle)] ring-offset-2 ring-offset-[var(--ps-bg-elevated)] transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              {clientInitials}
            </button>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Se déconnecter"
              className="ps-tap flex h-9 w-9 items-center justify-center rounded-full text-[var(--ps-fg-muted)] transition-colors duration-200 hover:bg-[var(--ps-bg-subtle)] hover:text-[var(--ps-fg)]"
            >
              <LogOut className="h-[15px] w-[15px]" strokeWidth={2} />
            </button>
          </div>
        </div>

        <p className="ps-small ps-num mt-1.5">
          {projectLine}{scheduleLine ? ` · ${scheduleLine}` : ''}
        </p>

        {/* 3 chiffres en puces inline + interlocuteur dédié */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {stats.map(s => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] px-3 py-1 text-[12px]"
            >
              <span className="text-[var(--ps-fg-secondary)]">{s.label}</span>
              <span className="ps-num font-semibold text-[var(--ps-fg)]">{s.value}</span>
            </span>
          ))}
          <span className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] font-[family-name:var(--ps-font-display)] text-[11px] font-semibold text-[var(--ps-primary-text)]">
                {refInitials}
              </span>
              <span className="ps-small text-[var(--ps-fg-secondary)]">
                <span className="font-semibold text-[var(--ps-fg)]">{refName}</span> · interlocuteur
              </span>
            </span>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="ps-tap inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg-elevated)] px-2.5 py-1 text-[12px] font-semibold text-[var(--ps-fg-secondary)] transition-colors hover:bg-[var(--ps-bg-subtle)] hover:text-[var(--ps-fg)]"
            >
              <Mail className="h-3.5 w-3.5" strokeWidth={2} />
              {writeLabel}
            </a>
          </span>
        </div>

        {/* Actions attendues, intégrées au pied de l'encadré */}
        {actions.length > 0 && (
          <div className="mt-4 border-t border-[var(--ps-border-soft)] pt-4">
            <div className="flex items-center gap-2">
              <p className="text-[12px] font-semibold text-[var(--ps-fg-secondary)]">À faire de votre côté</p>
              <span className="ps-num inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] px-1 text-[11px] font-semibold text-[var(--ps-primary-text)]">
                {actions.length}
              </span>
            </div>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              {actions.map((a, i) => <ActionRow key={a.key} action={a} primary={i === 0} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ActionRow({ action, primary }: { action: DashboardAction; primary: boolean }) {
  const Icon = ACTION_ICON[action.kind];
  return (
    <Link
      to={action.to}
      className="group ps-tap flex items-center gap-3 rounded-[10px] border border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] px-3 py-2 transition-colors hover:border-[var(--ps-border-strong)]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)] ring-1 ring-inset ring-[var(--ps-border-soft)]">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="ps-num block truncate text-[13px] font-semibold text-[var(--ps-fg)]">{action.title}</span>
        <span className="ps-num block text-[11.5px] leading-tight text-[var(--ps-fg-secondary)]">{action.meta}</span>
      </span>
      {primary ? (
        <span className="ps-tap inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-lg bg-[var(--ps-primary)] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors group-hover:bg-[var(--ps-primary-hover)]">
          {action.cta}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
        </span>
      ) : (
        <span className="ps-tap inline-flex min-h-[34px] shrink-0 items-center rounded-lg bg-[var(--ps-primary-subtle)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ps-primary-text)] transition-colors group-hover:bg-[var(--ps-primary)] group-hover:text-white">
          {action.cta}
        </span>
      )}
    </Link>
  );
}
