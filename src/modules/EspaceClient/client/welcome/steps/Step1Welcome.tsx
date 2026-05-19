import { Sparkles, Target, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import type { UseWelcomeWizardResult } from '../useWelcomeWizard';
import { Step1QualifRecap } from './Step1QualifRecap';

// Génère les initiales prénom+nom pour l'avatar AE ("Lyes Triki" → "LT").
function initials(name: string | null | undefined, fallback = 'AE'): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Carte AE — sobre, factuelle, pas de citation fake.
// V1 : nom AE hardcodé "Votre AE" car PortalProject n'expose pas assigned_name.
// Étendre PortalProject + usePortalAuth quand on aura besoin du nom réel.
function AECard({ name }: { name: string | null }) {
  const label = name ? `${name} · votre AE` : 'Votre AE';
  return (
    <div className="ps-surface ps-lift flex items-center gap-3 rounded-xl p-3.5">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 text-[12px] font-bold tracking-wide text-white shadow-md shadow-orange-500/30 ps-num">
        {initials(name)}
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-semibold text-[var(--ps-fg)]">{label}</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-emerald-700">
            <span className="h-1 w-1 rounded-full bg-emerald-500" aria-hidden />
            En ligne
          </span>
        </div>
        <p className="text-[11.5px] leading-snug text-[var(--ps-fg-muted)]">
          Suit votre dossier depuis le devis · répond sous 1 h ouvrée
        </p>
      </div>
    </div>
  );
}

// Panel affiché à droite quand aucune qualification n'est rattachée au projet
// (décision Q6 — option avec CTA : on laisse le client compléter lui-même).
function NoQualifPanel() {
  return (
    <div className="ps-surface relative space-y-4 overflow-hidden rounded-2xl p-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        // Gradient subtil bg-only via Tailwind arbitrary value
      />
      <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] ps-glow-violet-soft">
        <span className="absolute inset-0 rounded-full ps-pulse bg-[var(--ps-primary-subtle)]" aria-hidden />
        <Target className="relative h-6 w-6 text-[var(--ps-primary-text)]" />
      </div>
      <div className="relative space-y-1.5">
        <p className="text-[15px] font-semibold tracking-tight text-[var(--ps-fg)]">
          Votre récap arrive bientôt
        </p>
        <p className="mx-auto max-w-[34ch] text-[12.5px] leading-relaxed text-[var(--ps-fg-secondary)]">
          On n'a pas encore reçu votre questionnaire de qualification.
          Quelques minutes pour mieux comprendre votre projet — et votre récap apparaîtra ici.
        </p>
      </div>
      <Button
        asChild
        size="sm"
        className="ps-brand-gradient ps-glow-violet-soft ps-tap relative h-9 gap-1.5 border-0 px-4 font-semibold text-white hover:opacity-95"
      >
        <a href="/diagnostic" target="_blank" rel="noopener noreferrer">
          Compléter mon questionnaire
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </Button>
    </div>
  );
}

interface Step1WelcomeProps {
  wizard: UseWelcomeWizardResult;
}

export function Step1Welcome({ wizard }: Step1WelcomeProps) {
  const { project } = usePortal();
  const qualif = wizard.qualification;

  const firstName = wizard.row?.welcome_first_name
    ?? qualif?.full_name?.split(' ')[0]
    ?? project.client_name?.split(' ')[0]
    ?? 'là';

  const company = wizard.row?.welcome_company
    ?? qualif?.company_name
    ?? project.name
    ?? 'votre projet';

  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-8">
      {/* ── Colonne gauche : salutation chaleureuse ──────────────────── */}
      <div className="space-y-5">
        <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--ps-primary)] to-[var(--ps-primary-deep)] shadow-lg shadow-[var(--ps-primary)]/30 ps-glow-violet">
          <span
            aria-hidden
            className="absolute -inset-3 -z-10 rounded-3xl bg-[radial-gradient(circle_at_center,var(--ps-primary-subtle),transparent_70%)] opacity-80 blur-md"
          />
          <Sparkles className="h-6 w-6 text-white" />
        </div>

        <div>
          <h1 className="ps-gradient-text text-[30px] font-semibold leading-[1.05] tracking-tight">
            Bienvenue,
            <br />
            <span className="italic font-medium">{firstName}.</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--ps-fg-secondary)]">
            On est ravis de démarrer{' '}
            <span className="font-semibold text-[var(--ps-fg)]">{company}</span>{' '}
            avec vous.
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ps-fg-muted)]">
            Votre espace est prêt. Quelques minutes ensemble pour vérifier nos infos,
            caler vos préférences, et vous présenter votre nouveau Propul'Space.
          </p>
        </div>

        <AECard name={null} />
      </div>

      {/* ── Colonne droite : récap qualif OU CTA si pas de qualif ───── */}
      <div>
        {qualif ? <Step1QualifRecap qualif={qualif} /> : <NoQualifPanel />}
      </div>
    </div>
  );
}
