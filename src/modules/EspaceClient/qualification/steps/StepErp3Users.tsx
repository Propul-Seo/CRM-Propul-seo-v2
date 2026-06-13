import { RadioCard } from '../components/RadioCard';
import { ERP_USERS_COUNT, ERP_SSO_TYPES } from '../constants.erp';
import type { QualificationDraft } from '../schema';
import { StepShell, FieldGroup } from './_StepShell';

interface Props {
  draft: QualificationDraft;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  errors: Record<string, string | undefined>;
}

const MOBILE_OPTIONS = [
  { value: 'true',  label: 'Oui',  hint: 'Accès depuis smartphone / tablette nécessaire' },
  { value: 'false', label: 'Non',  hint: 'Bureau uniquement' },
] as const;

export function StepErp3Users({ draft, setField, errors }: Props) {
  const mobileValue =
    draft.erp_mobile_required === true ? 'true' :
    draft.erp_mobile_required === false ? 'false' : undefined;

  return (
    <StepShell
      title="Utilisateurs et accès"
      subtitle="Précisez les profils utilisateurs et les modalités d’accès attendues."
    >
      <FieldGroup
        label="Nombre d'utilisateurs internes"
        required
        hint="Nombre de personnes amenées à utiliser l’outil au quotidien."
        error={errors.erp_users_count}
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
          {ERP_USERS_COUNT.map(u => (
            <RadioCard
              key={u.value}
              name="erp_users_count"
              value={u.value}
              checked={draft.erp_users_count === u.value}
              onChange={v => setField('erp_users_count', v as QualificationDraft['erp_users_count'])}
              label={u.label}
              hint={u.hint}
            />
          ))}
        </div>
      </FieldGroup>

      <FieldGroup
        label="Accès mobile nécessaire ?"
        required
        hint="Vos équipes utilisent-elles l'outil en déplacement ?"
        error={errors.erp_mobile_required}
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
          {MOBILE_OPTIONS.map(o => (
            <RadioCard
              key={o.value}
              name="erp_mobile_required"
              value={o.value}
              checked={mobileValue === o.value}
              onChange={v => setField('erp_mobile_required', (v === 'true') as QualificationDraft['erp_mobile_required'])}
              label={o.label}
              hint={o.hint}
            />
          ))}
        </div>
      </FieldGroup>

      <FieldGroup
        label="Mode de connexion préféré"
        required
        hint="Méthode d’authentification souhaitée pour les utilisateurs."
        error={errors.erp_sso_type}
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
          {ERP_SSO_TYPES.map(s => (
            <RadioCard
              key={s.value}
              name="erp_sso_type"
              value={s.value}
              checked={draft.erp_sso_type === s.value}
              onChange={v => setField('erp_sso_type', v as QualificationDraft['erp_sso_type'])}
              label={s.label}
              hint={s.hint}
            />
          ))}
        </div>
      </FieldGroup>
    </StepShell>
  );
}
