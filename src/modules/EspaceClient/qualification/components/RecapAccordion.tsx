import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { QualificationDraft } from '../schema';
import {
  SECTORS, EXISTING_SITE_OPTIONS, MONTHLY_TRAFFIC, MAIN_PROBLEMS,
  MAIN_GOALS, TARGET_AUDIENCES, DESIRED_FEATURES, ECOMMERCE_PLATFORMS,
  PRODUCT_COUNT_RANGES, BRAND_STATUS, BUDGET_RANGES, DEADLINES, RESERVATION_TYPES,
} from '../constants';

function labelOf<T extends ReadonlyArray<{ value: string; label: string }>>(arr: T, v: string | undefined): string {
  if (!v) return '—';
  return arr.find(o => o.value === v)?.label ?? v;
}

function labelsOfMany<T extends ReadonlyArray<{ value: string; label: string }>>(arr: T, vs: string[] | undefined): string {
  if (!vs || vs.length === 0) return '—';
  return vs.map(v => arr.find(o => o.value === v)?.label ?? v).join(', ');
}

interface Section {
  num: number;
  title: string;
  summary: string;
  details: Array<{ label: string; value: string }>;
}

// Helper : ajoute une ligne au récap seulement si la valeur est non-vide.
// Évite des lignes "Précision · —" inutiles quand l'option Autre n'a pas été cochée.
function withOther(base: Array<{ label: string; value: string }>, label: string, value: string | null | undefined): Array<{ label: string; value: string }> {
  if (!value?.trim()) return base;
  return [...base, { label, value: value.trim() }];
}

function buildSections(d: QualificationDraft): Section[] {
  return [
    {
      num: 1,
      title: 'Qui êtes-vous',
      summary: [d.full_name, d.company_name, labelOf(SECTORS, d.business_sector)].filter(Boolean).join(' · ') || '—',
      details: withOther([
        { label: 'Nom complet',  value: d.full_name ?? '—' },
        { label: 'Email',        value: d.email ?? '—' },
        { label: 'Téléphone',    value: d.phone ?? '—' },
        { label: 'Entreprise',   value: d.company_name ?? '—' },
        { label: 'Secteur',      value: labelOf(SECTORS, d.business_sector) },
      ], 'Précision secteur', d.business_sector_custom),
    },
    {
      num: 2,
      title: 'Situation actuelle',
      summary: labelOf(EXISTING_SITE_OPTIONS, d.has_existing_site),
      details: withOther([
        { label: 'Site existant', value: labelOf(EXISTING_SITE_OPTIONS, d.has_existing_site) },
        { label: 'URL',           value: d.existing_site_url ?? '—' },
        { label: 'Trafic',        value: labelOf(MONTHLY_TRAFFIC, d.monthly_traffic) },
        { label: 'Problèmes',     value: labelsOfMany(MAIN_PROBLEMS, d.main_problems) },
        { label: 'Captures',      value: `${d.existing_site_screenshots?.length ?? 0} fichier(s)` },
      ], 'Précision problème', d.main_problems_other),
    },
    {
      num: 3,
      title: 'Objectifs',
      summary: [labelOf(MAIN_GOALS, d.main_goal), labelOf(TARGET_AUDIENCES, d.target_audience)].filter(s => s !== '—').join(' · ') || '—',
      details: withOther([
        { label: 'Objectif principal', value: labelOf(MAIN_GOALS, d.main_goal) },
        { label: 'Cible',              value: labelOf(TARGET_AUDIENCES, d.target_audience) },
        { label: 'Concurrents',        value: d.competitors ?? '—' },
      ], 'Précision objectif', d.main_goal_other),
    },
    {
      num: 4,
      title: 'Fonctionnalités',
      summary: labelsOfMany(DESIRED_FEATURES, d.desired_features),
      details: (() => {
        const base: Array<{ label: string; value: string }> = [
          { label: 'Fonctionnalités',  value: labelsOfMany(DESIRED_FEATURES, d.desired_features) },
        ];
        if (d.desired_features?.includes('ecommerce')) {
          base.push(
            { label: 'Plateforme e-com', value: labelOf(ECOMMERCE_PLATFORMS, d.ecommerce_platform) },
            { label: 'Volume produits',  value: labelOf(PRODUCT_COUNT_RANGES, d.product_count_range) },
          );
        }
        if (d.desired_features?.includes('reservation')) {
          base.push({ label: 'Type réservation', value: labelOf(RESERVATION_TYPES, d.reservation_type) });
        }
        return withOther(
          withOther(base, 'Précision fonctionnalité', d.desired_features_other),
          'Précision plateforme', d.ecommerce_platform_other,
        );
      })(),
    },
    {
      num: 5,
      title: 'Identité visuelle',
      summary: labelOf(BRAND_STATUS, d.has_visual_identity),
      details: [
        { label: 'Situation',     value: labelOf(BRAND_STATUS, d.has_visual_identity) },
        { label: 'Logo fourni',   value: d.logo_file_url ? 'Oui' : 'Non' },
        {
          label: 'Charte fournie',
          value: d.brand_guide_url
            ? 'Oui (upload)'
            : d.brand_guide_external_link
              ? `Lien : ${d.brand_guide_external_link}`
              : 'Non',
        },
      ],
    },
    {
      num: 6,
      title: 'Budget & délais',
      summary: [labelOf(BUDGET_RANGES, d.budget_range), labelOf(DEADLINES, d.desired_timeline)].filter(s => s !== '—').join(' · ') || '—',
      details: [
        { label: 'Budget', value: labelOf(BUDGET_RANGES, d.budget_range) },
        { label: 'Délai',  value: labelOf(DEADLINES, d.desired_timeline) },
      ],
    },
  ];
}

interface RecapAccordionProps {
  draft: QualificationDraft;
}

export function RecapAccordion({ draft }: RecapAccordionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const sections = buildSections(draft);

  return (
    <ul className="divide-y divide-[var(--ps-border-soft)] overflow-hidden rounded-xl border border-[var(--ps-border-soft)] bg-white">
      {sections.map((s, idx) => {
        const open = openIdx === idx;
        return (
          <li key={s.num}>
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : idx)}
              aria-expanded={open}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--ps-bg-subtle)]"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] text-[11px] font-bold text-[var(--ps-primary-text)]">
                {s.num}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-[var(--ps-fg)]">{s.title}</span>
                <span className="block truncate text-[12px] text-[var(--ps-fg-muted)]">{s.summary}</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[var(--ps-fg-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>
            {open && (
              <dl className="grid grid-cols-1 gap-2 bg-[var(--ps-bg-subtle)] px-4 py-3 text-[12.5px] sm:grid-cols-2">
                {s.details.map(d => (
                  <div key={d.label} className="min-w-0">
                    <dt className="text-[11px] uppercase tracking-wider text-[var(--ps-fg-muted)]">{d.label}</dt>
                    <dd className="break-words text-[var(--ps-fg)]">{d.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        );
      })}
    </ul>
  );
}
