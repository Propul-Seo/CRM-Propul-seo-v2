import type { UseWelcomeWizardResult } from '../useWelcomeWizard';

export function Step5Done({ wizard }: { wizard: UseWelcomeWizardResult }) {
  const firstName = wizard.row?.welcome_first_name ?? 'là';
  return (
    <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
      <p className="ps-eyebrow ps-eyebrow-muted">Étape 5 — Tout est prêt</p>
      <h2 className="text-3xl font-bold">Bienvenue à bord, {firstName}.</h2>
      <p className="max-w-md text-sm text-[var(--ps-fg-secondary)]">
        Contenu final à venir au palier 8 (halo pulsant + animations + redirect).
      </p>
    </div>
  );
}
