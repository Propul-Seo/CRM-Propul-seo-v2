import { Textarea } from '@/components/ui/textarea';
import type { OnboardingRow } from '../useOnboarding';

interface Props {
  row: Partial<OnboardingRow> | null;
  setField: <K extends keyof OnboardingRow>(k: K, v: OnboardingRow[K]) => void;
}

export function OnboardingStep2Brand({ row, setField }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-[12.5px] font-semibold text-[var(--ps-fg)]">
          Voix de marque & ton
        </label>
        <p className="mt-0.5 text-[11.5px] text-[var(--ps-fg-muted)]">
          Comment vous adressez-vous à vos clients ? (familier, expert, chaleureux, etc.) Mots-clés à utiliser / à éviter.
        </p>
        <Textarea
          rows={4}
          value={row?.brand_voice_notes ?? ''}
          onChange={e => setField('brand_voice_notes', e.target.value)}
          placeholder="Ex. : ton chaleureux et accessible, on dit 'tu' aux clients. À éviter : jargon technique trop poussé."
          className="mt-1.5"
        />
      </div>

      <div>
        <label className="text-[12.5px] font-semibold text-[var(--ps-fg)]">
          Stratégie de contenu
        </label>
        <p className="mt-0.5 text-[11.5px] text-[var(--ps-fg-muted)]">
          Sujets à couvrir, formats préférés (articles, vidéos, infographies), fréquence souhaitée.
        </p>
        <Textarea
          rows={4}
          value={row?.content_strategy ?? ''}
          onChange={e => setField('content_strategy', e.target.value)}
          placeholder="Ex. : 2 articles SEO/mois, 1 newsletter mensuelle, posts LinkedIn 2×/semaine."
          className="mt-1.5"
        />
      </div>

      <p className="text-[11.5px] italic text-[var(--ps-fg-muted)]">
        Pas besoin d'être exhaustif. On affinera ensemble lors du kickoff.
      </p>
    </div>
  );
}
