import type { UseWelcomeWizardResult } from '../useWelcomeWizard';

export function Step3Preferences({ wizard: _wizard }: { wizard: UseWelcomeWizardResult }) {
  return (
    <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
      <p className="ps-eyebrow ps-eyebrow-muted">Étape 3 — Préférences</p>
      <h2 className="text-2xl font-bold">Canal, plages, notifications</h2>
      <p className="max-w-md text-sm text-[var(--ps-fg-secondary)]">
        Contenu à venir au palier 6 (canal préféré + plages horaires + toggle notifs).
      </p>
    </div>
  );
}
