import { Blocks, Globe, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { RadioCard } from '../components/RadioCard';
import { PROJECT_TYPES } from '../constants';
import type { QualificationDraft } from '../schema';
import { StepShell, FieldGroup } from './_StepShell';

interface Step0Props {
  draft: QualificationDraft;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  errors: Record<string, string | undefined>;
}

// Icône Lucide par type de projet.
const ICONS: Record<string, LucideIcon> = {
  site:     Globe,
  site_erp: Blocks,
  erp:      Settings,
};

export function Step0ProjectType({ draft, setField, errors }: Step0Props) {
  return (
    <StepShell
      title="Quel est votre besoin ?"
      subtitle="Les questions suivantes s’adaptent à la nature de votre projet."
    >
      <FieldGroup
        label="Type de projet"
        required
        hint="Site web, outil métier interne ou besoin combiné."
        error={errors.project_type}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {PROJECT_TYPES.map(opt => (
            <RadioCard
              key={opt.value}
              name="project_type"
              value={opt.value}
              checked={draft.project_type === opt.value}
              onChange={v => setField('project_type', v as QualificationDraft['project_type'])}
              label={opt.label}
              hint={opt.hint}
              icon={ICONS[opt.value]}
            />
          ))}
        </div>
      </FieldGroup>
    </StepShell>
  );
}
