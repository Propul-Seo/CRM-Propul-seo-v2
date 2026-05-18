import { Globe, Server, Network, Share2, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { OnboardingRow, OnboardingSetField } from '../useOnboarding';

interface Props {
  row: Partial<OnboardingRow> | null;
  setField: OnboardingSetField;
}

interface CheckRowProps {
  icon: typeof Globe;
  label: string;
  hint: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}

function CheckRow({ icon: Icon, label, hint, value, onToggle }: CheckRowProps) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
      value ? 'border-emerald-200 bg-emerald-50' : 'border-[var(--ps-border-soft)] bg-white hover:bg-[var(--ps-bg-subtle)]'
    }`}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-1 h-4 w-4 accent-[var(--ps-primary)]"
      />
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${value ? 'text-emerald-600' : 'text-[var(--ps-fg-muted)]'}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold text-[var(--ps-fg)]">{label}</p>
        <p className="text-[11px] text-[var(--ps-fg-muted)]">{hint}</p>
      </div>
    </label>
  );
}

export function OnboardingStep4Access({ row, setField }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-[var(--ps-fg-secondary)]">
        Pour démarrer rapidement, on a besoin d'accès à vos outils. Cochez ceux que vous avez déjà partagés (ou que vous pouvez partager bientôt).
      </p>

      <CheckRow
        icon={Globe}
        label="Google Analytics & Search Console"
        hint="Indispensable pour mesurer le trafic SEO et suivre les conversions."
        value={row?.has_provided_google_access === true}
        onToggle={(v) => setField('has_provided_google_access', v)}
      />
      <CheckRow
        icon={Server}
        label="Hébergement / CMS"
        hint="WordPress, Shopify, OVH, etc. — pour déployer les modifications."
        value={row?.has_provided_hosting_access === true}
        onToggle={(v) => setField('has_provided_hosting_access', v)}
      />
      <CheckRow
        icon={Network}
        label="DNS / Registrar"
        hint="Gandi, OVH, Cloudflare — pour configurer sous-domaines / redirections."
        value={row?.has_provided_dns_access === true}
        onToggle={(v) => setField('has_provided_dns_access', v)}
      />
      <CheckRow
        icon={Share2}
        label="Réseaux sociaux"
        hint="Instagram, LinkedIn, Facebook — si publication / pub gérée par l'agence."
        value={row?.has_provided_social_access === true}
        onToggle={(v) => setField('has_provided_social_access', v)}
      />

      <div className="rounded-lg border border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] p-3">
        <label className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--ps-fg)]">
          <KeyRound className="h-4 w-4 text-[var(--ps-primary)]" />
          Identifiant coffre-fort (optionnel)
        </label>
        <p className="mt-0.5 text-[11px] text-[var(--ps-fg-muted)]">
          Si vous utilisez Bitwarden / 1Password pour partager les credentials, collez ici l'ID ou le lien du dossier partagé.
        </p>
        <Input
          value={row?.access_credentials_vault_id ?? ''}
          onChange={(e) => setField('access_credentials_vault_id', e.target.value)}
          placeholder="Ex. : bw-collection-xxxx ou lien 1Password"
          className="mt-1.5 bg-white"
        />
      </div>

      <p className="text-[11.5px] italic text-[var(--ps-fg-muted)]">
        Ne partagez JAMAIS de mots de passe par email — utilisez un coffre-fort.
      </p>
    </div>
  );
}
