import { Globe, Layers, Settings2 } from 'lucide-react';
import { RadioCard } from '../components/RadioCard';
import { PROJECT_TYPES } from '../constants';
import type { QualificationDraft } from '../schema';
import { StepShell, FieldGroup } from './_StepShell';

interface Step0Props {
  draft: QualificationDraft;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  errors: Record<string, string | undefined>;
}

// Mapping label → emoji visuel (icônes lucide non utilisables dans RadioCard.emoji)
const EMOJIS: Record<string, string> = {
  site:     '🌐',
  site_erp: '🧩',
  erp:      '⚙️',
};

export function Step0ProjectType({ draft, setField, errors }: Step0Props) {
  return (
    <StepShell
      title="Quel est votre besoin ?"
      subtitle="On adapte les questions suivantes selon votre projet."
    >
      <FieldGroup
        label="Type de projet"
        required
        hint="Site web vitrine, outil métier interne (ERP), ou les deux à la fois."
        error={errors.project_type}
      >
        <div className="grid gap-2.5">
          {PROJECT_TYPES.map(opt => (
            <RadioCard
              key={opt.value}
              name="project_type"
              value={opt.value}
              checked={draft.project_type === opt.value}
              onChange={v => setField('project_type', v as QualificationDraft['project_type'])}
              label={opt.label}
              hint={opt.hint}
              emoji={EMOJIS[opt.value]}
            />
          ))}
        </div>
      </FieldGroup>
    </StepShell>
  );
}
