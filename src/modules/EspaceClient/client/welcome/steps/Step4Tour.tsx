import type { UseWelcomeWizardResult } from '../useWelcomeWizard';

export function Step4Tour({ wizard: _wizard }: { wizard: UseWelcomeWizardResult }) {
  return (
    <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
      <p className="ps-eyebrow ps-eyebrow-muted">Étape 4 — Tour du propriétaire</p>
      <h2 className="text-2xl font-bold">Découvrez votre espace</h2>
      <p className="max-w-md text-sm text-[var(--ps-fg-secondary)]">
        Contenu à venir au palier 7 (carrousel 7 sections + previews placeholder + swipe).
      </p>
    </div>
  );
}
