import type { UseWelcomeWizardResult } from '../useWelcomeWizard';

export function Step2Contact({ wizard: _wizard }: { wizard: UseWelcomeWizardResult }) {
  return (
    <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
      <p className="ps-eyebrow ps-eyebrow-muted">Étape 2 — Coordonnées</p>
      <h2 className="text-2xl font-bold">Carte d'identité</h2>
      <p className="max-w-md text-sm text-[var(--ps-fg-secondary)]">
        Contenu à venir au palier 5 (carte d'identité éditable + sync auto vers CRM).
      </p>
    </div>
  );
}
