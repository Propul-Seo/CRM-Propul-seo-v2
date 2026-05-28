import { Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { RadioCard } from '../components/RadioCard';
import { SECTORS } from '../constants';
import type { QualificationDraft } from '../schema';
import { StepShell, FieldGroup } from './_StepShell';

interface Step1Props {
  draft: QualificationDraft;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  errors: Record<string, string | undefined>;
}

// Step 1 : tous les champs visibles d'office.
// Le champ "Précisez votre secteur" apparaît uniquement si "Autre" est sélectionné.
export function Step1Identity({ draft, setField, errors }: Step1Props) {
  const showSectorCustom = draft.business_sector === 'autre';

  return (
    <StepShell
      title="Qui êtes-vous ?"
      subtitle="Quelques informations pour personnaliser notre proposition."
    >
      <FieldGroup label="Nom complet" required error={errors.full_name}>
        <Input
          placeholder="Prénom Nom"
          value={draft.full_name ?? ''}
          onChange={e => setField('full_name', e.target.value)}
          className="h-11"
          autoComplete="name"
        />
      </FieldGroup>

      <FieldGroup label="Email professionnel" required error={errors.email}>
        <Input
          type="email"
          placeholder="vous@votre-entreprise.fr"
          value={draft.email ?? ''}
          onChange={e => setField('email', e.target.value)}
          className="h-11"
          autoComplete="email"
        />
      </FieldGroup>

      <FieldGroup
        label={
          <span className="inline-flex items-center gap-1.5">
            Téléphone
            <span title="Pour vous rappeler sous 24h. Jamais partagé avec des tiers." className="text-stone-400">
              <Lock className="h-3 w-3" />
            </span>
          </span>
        }
        required
        hint="Pour vous rappeler sous 24h. Jamais partagé avec des tiers."
        error={errors.phone}
      >
        <Input
          type="tel"
          placeholder="06 12 34 56 78"
          value={draft.phone ?? ''}
          onChange={e => setField('phone', e.target.value)}
          className="h-11"
          autoComplete="tel"
        />
      </FieldGroup>

      <FieldGroup label="Nom de l'entreprise" required error={errors.company_name}>
        <Input
          placeholder="Nom de votre entreprise"
          value={draft.company_name ?? ''}
          onChange={e => setField('company_name', e.target.value)}
          className="h-11"
          autoComplete="organization"
        />
      </FieldGroup>

      <FieldGroup label="Votre secteur d'activité" required error={errors.business_sector}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {SECTORS.map(s => (
            <RadioCard
              key={s.value}
              name="business_sector"
              value={s.value}
              checked={draft.business_sector === s.value}
              onChange={v => setField('business_sector', v as QualificationDraft['business_sector'])}
              label={s.label}
            />
          ))}
        </div>
      </FieldGroup>

      {showSectorCustom && (
        <FieldGroup
          label="Précisez votre secteur"
          required
          hint="Décrivez en quelques mots votre activité."
          error={errors.business_sector_custom}
        >
          <Input
            placeholder="Ex. coaching sportif, conseil RH, photographie événementielle…"
            value={draft.business_sector_custom ?? ''}
            onChange={e => setField('business_sector_custom', e.target.value)}
            className="h-11"
            maxLength={160}
          />
        </FieldGroup>
      )}
    </StepShell>
  );
}
