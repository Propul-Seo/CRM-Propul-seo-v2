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
  // Quand on a un nom réel : "Lyes Triki · votre AE". Quand on ne l'a pas
  // encore (PortalProject ne l'expose pas en V1) : juste "Votre AE" sans
  // suffixe redondant.
  const label = name ? `${name} · votre AE` : 'Votre AE';
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--ps-bg-subtle)] p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-[12px] font-bold text-white">
        {initials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[var(--ps-fg)]">{label}</p>
        <p className="text-[11.5px] text-[var(--ps-fg-muted)]">
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
    <div className="space-y-4 rounded-xl border border-dashed border-[var(--ps-border)] bg-[var(--ps-bg-subtle)] p-5 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)]">
        <Target className="h-5 w-5 text-[var(--ps-primary-text)]" />
      </div>
      <div className="space-y-1.5">
        <p className="text-[14px] font-semibold text-[var(--ps-fg)]">Votre récap arrive bientôt</p>
        <p className="text-[12.5px] leading-relaxed text-[var(--ps-fg-secondary)]">
          On n'a pas encore reçu votre questionnaire de qualification.
          Quelques minutes pour nous aider à mieux comprendre votre projet — et votre récap apparaîtra ici.
        </p>
      </div>
      <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
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
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--ps-primary)] to-[var(--ps-primary-deep)] shadow-lg shadow-[var(--ps-primary)]/30">
          <Sparkles className="h-6 w-6 text-white" />
        </div>

        <div>
          <h1 className="ps-gradient-text text-[30px] font-semibold leading-[1.1] tracking-tight">
            Bienvenue,<br />{firstName}.
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
