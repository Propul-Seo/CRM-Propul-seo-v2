import { FileImage, FilePlus, Scale, FileCheck2 } from 'lucide-react';
import type { OnboardingRow } from '../useOnboarding';

interface Props {
  row: Partial<OnboardingRow> | null;
  setField: <K extends keyof OnboardingRow>(k: K, v: OnboardingRow[K]) => void;
}

interface ToggleProps {
  icon: typeof FileImage;
  label: string;
  hint: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}

function ToggleCard({ icon: Icon, label, hint, value, onToggle }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!value)}
      className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
        value
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-[var(--ps-border-soft)] bg-white hover:bg-[var(--ps-bg-subtle)]'
      }`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${value ? 'text-emerald-600' : 'text-[var(--ps-fg-muted)]'}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold text-[var(--ps-fg)]">{label}</p>
        <p className="text-[11px] text-[var(--ps-fg-muted)]">{hint}</p>
      </div>
      <span className={`text-[11px] font-semibold ${value ? 'text-emerald-700' : 'text-[var(--ps-fg-muted)]'}`}>
        {value ? '✓ Fourni' : 'À fournir'}
      </span>
    </button>
  );
}

export function OnboardingStep3Visual({ row, setField }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-[var(--ps-fg-secondary)]">
        Confirmez ce que vous avez déjà transmis à votre agence (par email, drive partagé ou en physique). On utilise ces éléments pour rester cohérent avec votre identité.
      </p>

      <ToggleCard
        icon={FileImage}
        label="Logo"
        hint="Format vectoriel (SVG, AI) idéal. PNG haute résolution accepté."
        value={row?.logo_uploaded === true}
        onToggle={(v) => setField('logo_uploaded', v)}
      />
      <ToggleCard
        icon={FilePlus}
        label="Charte graphique"
        hint="Couleurs, typos, règles d'usage. PDF préférable."
        value={row?.charter_uploaded === true}
        onToggle={(v) => setField('charter_uploaded', v)}
      />
      <ToggleCard
        icon={FileCheck2}
        label="Contenu existant"
        hint="Articles, descriptifs produits, photos, vidéos déjà créés."
        value={row?.content_uploaded === true}
        onToggle={(v) => setField('content_uploaded', v)}
      />
      <ToggleCard
        icon={Scale}
        label="Mentions légales"
        hint="Numéro SIREN, hébergeur, RGPD, cookies, etc."
        value={row?.legal_mentions_provided === true}
        onToggle={(v) => setField('legal_mentions_provided', v)}
      />

      <p className="text-[11.5px] italic text-[var(--ps-fg-muted)]">
        Si vous n'avez rien de tout ça, pas de panique — on peut tout créer ensemble (devis dédié).
      </p>
    </div>
  );
}
