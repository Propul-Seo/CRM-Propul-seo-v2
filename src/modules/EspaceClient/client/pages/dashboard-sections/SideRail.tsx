import { Link } from 'react-router-dom';
import {
  CalendarClock, ChevronRight, FolderOpen, Mail, PenLine, Receipt, type LucideIcon,
} from 'lucide-react';
import { CONTACT_EMAIL } from '@/modules/EspaceClient/shared/constants';
import { formatLongDate } from './lib';

// Rail latéral sticky : référent réel (projects_v2.assigned_name), prochaine
// échéance réelle, accès rapides vers les pages internes du portail.

interface SideRailProps {
  /** Nom du membre Propul'SEO assigné (null → équipe générique). */
  referentName: string | null;
  nextStep: { label: string; date: string | null } | null;
  dueCount: number;
  documentsCount: number;
  pendingSignatures: number;
  basePath: string;
}

export function SideRail({
  referentName, nextStep, dueCount, documentsCount, pendingSignatures, basePath,
}: SideRailProps) {
  const name = referentName ?? "Équipe Propul'SEO";
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'PS';
  const writeLabel = referentName ? `Écrire à ${referentName.trim().split(/\s+/)[0]}` : "Écrire à l'équipe";

  return (
    // top-24 (et non top-8 comme au banc d'essai) : le header sticky frosted
    // du PortalLayout fait 60 px de haut.
    <aside className="space-y-5 self-start lg:sticky lg:top-24">
      <div className="ps-surface p-5">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] font-[family-name:var(--ps-font-display)] text-[14px] font-semibold text-[var(--ps-primary-text)]">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="ps-h3 truncate">{name}</p>
            <p className="ps-small text-[var(--ps-fg-secondary)]">Propul'SEO — votre interlocuteur dédié</p>
          </div>
        </div>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="ps-tap mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg-elevated)] px-4 py-2.5 text-[13px] font-semibold text-[var(--ps-fg-secondary)] transition-colors hover:bg-[var(--ps-bg-subtle)]"
        >
          <Mail className="h-4 w-4" strokeWidth={2} />
          {writeLabel}
        </a>
      </div>

      <div className="ps-surface p-5">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--ps-info-subtle)] text-[var(--ps-info-text)]">
            <CalendarClock className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="ps-small text-[var(--ps-fg-secondary)]">Prochaine échéance</p>
            <p className="ps-num pt-0.5 text-[15px] font-semibold text-[var(--ps-fg)]">
              {nextStep ? (formatLongDate(nextStep.date) ?? '—') : 'Aucune à venir'}
            </p>
            {nextStep && (
              <p className="ps-small mt-0.5 truncate text-[var(--ps-fg-secondary)]">{nextStep.label}</p>
            )}
          </div>
        </div>
      </div>

      <div className="ps-surface overflow-hidden">
        <h2 className="ps-h3 border-b border-[var(--ps-border-soft)] px-5 py-3.5">Accès rapides</h2>
        <ul className="divide-y divide-[var(--ps-border-soft)]">
          <QuickLink
            to={`${basePath}/invoices`}
            icon={Receipt}
            label="Vos factures"
            hint={dueCount > 0 ? `${dueCount} à régler` : 'À jour'}
          />
          <QuickLink
            to={`${basePath}/documents`}
            icon={FolderOpen}
            label="Vos documents"
            hint={`${documentsCount} fichier${documentsCount > 1 ? 's' : ''}`}
          />
          <QuickLink
            to={`${basePath}/signatures`}
            icon={PenLine}
            label="Vos signatures"
            hint={pendingSignatures > 0 ? `${pendingSignatures} en attente` : 'Tout est signé'}
          />
        </ul>
      </div>
    </aside>
  );
}

function QuickLink({ to, icon: Icon, label, hint }: { to: string; icon: LucideIcon; label: string; hint: string }) {
  return (
    <li>
      <Link
        to={to}
        className="ps-tap flex min-h-[48px] w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[var(--ps-bg-subtle)]"
      >
        <Icon className="h-[18px] w-[18px] shrink-0 text-[var(--ps-fg-secondary)]" strokeWidth={2} />
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-semibold text-[var(--ps-fg)]">{label}</span>
          <span className="ps-small block text-[var(--ps-fg-secondary)]">{hint}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--ps-fg-muted)]" strokeWidth={2} />
      </Link>
    </li>
  );
}
