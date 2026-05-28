import { Sparkles, CheckCircle2 } from 'lucide-react';
import type { OnboardingRow } from '../useOnboarding';

interface Props { row: Partial<OnboardingRow> | null }

export function OnboardingStep1Recap({ row }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] p-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ps-primary)]" />
        <div className="text-[12.5px] text-[var(--ps-fg-secondary)]">
          On a déjà collecté quelques infos via le formulaire de qualification. Vérifiez et complétez les étapes suivantes — chaque info nous fait gagner du temps sur votre projet.
        </div>
      </div>

      {row?.inherited_from_qualification_id ? (
        <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Qualification initiale reprise. Vos réponses ont été pré-remplies.</span>
        </div>
      ) : (
        <p className="text-[12.5px] text-[var(--ps-fg-muted)]">
          Aucune qualification antérieure trouvée. Vous démarrez de zéro — pas de souci, ça prend ~10 minutes.
        </p>
      )}

      <ul className="space-y-2 text-[12.5px] text-[var(--ps-fg-secondary)]">
        <li><strong>Étape 2 — Marque & contenu</strong> : votre cible, votre ton, vos sujets.</li>
        <li><strong>Étape 3 — Identité visuelle</strong> : logo, charte, mentions légales.</li>
        <li><strong>Étape 4 — Accès tech</strong> : Google Analytics, hébergement, DNS, réseaux.</li>
        <li><strong>Étape 5 — Kickoff call</strong> : un créneau pour lancer le projet.</li>
      </ul>

      <p className="text-[11.5px] italic text-[var(--ps-fg-muted)]">
        Vous pouvez passer une étape et y revenir plus tard. Les données sont sauvegardées automatiquement.
      </p>
    </div>
  );
}
