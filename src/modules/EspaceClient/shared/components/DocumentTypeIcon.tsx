import {
  FileText, FileSignature, Scale, Receipt, PackageCheck, FileSearch, ClipboardList,
  Shapes, Palette, FileType, KeyRound, FileImage, FileSpreadsheet, FileArchive, FileVideo, File,
  type LucideIcon,
} from 'lucide-react';

// Icône de document basée sur le TYPE métier (pas seulement le mime).
// Partagée admin + portail client. DA : 4 tons max (accent violet unique,
// pas de rainbow) — brand (contractuel), success (livré/validé),
// warning (audits/rapports), neutral (le reste).
export type DocTone = 'brand' | 'success' | 'warning' | 'neutral';

export interface DocMeta {
  Icon: LucideIcon;
  tone: DocTone;
  label: string;
}

// Source unique des teintes documentaires — réutilisée par FileIcon pour
// garder la cohérence pdf/docs entre les deux composants. Theme-aware :
// les tokens --ps-* basculent seuls entre clair (portail) et sombre
// (admin .ps-theme-dark).
export const DOC_TONE_STYLE: Record<DocTone, { bg: string; fg: string }> = {
  brand:   { bg: 'bg-[var(--ps-primary-subtle)]', fg: 'text-[var(--ps-primary-text)]' },
  success: { bg: 'bg-[var(--ps-success-subtle)]', fg: 'text-[var(--ps-success-text)]' },
  warning: { bg: 'bg-[var(--ps-warning-subtle)]', fg: 'text-[var(--ps-warning-text)]' },
  neutral: { bg: 'bg-[var(--ps-bg-subtle)]',      fg: 'text-[var(--ps-fg-secondary)]' },
};

const TYPE_META: Record<string, DocMeta> = {
  quote:         { Icon: FileText,      tone: 'brand',   label: 'Devis' },
  contract:      { Icon: FileSignature, tone: 'brand',   label: 'Contrat' },
  legal:         { Icon: Scale,         tone: 'neutral', label: 'Légal' },
  invoice:       { Icon: Receipt,       tone: 'neutral', label: 'Facture' },
  deliverable:   { Icon: PackageCheck,  tone: 'success', label: 'Livrable' },
  audit:         { Icon: FileSearch,    tone: 'warning', label: 'Audit' },
  report:        { Icon: ClipboardList, tone: 'warning', label: 'Rapport' },
  asset_logo:    { Icon: Shapes,        tone: 'neutral', label: 'Logo' },
  asset_charter: { Icon: Palette,       tone: 'neutral', label: 'Charte' },
  asset_content: { Icon: FileType,      tone: 'neutral', label: 'Contenu' },
  asset_access:  { Icon: KeyRound,      tone: 'neutral', label: 'Accès' },
};

// Repli sur le mime quand le type métier est inconnu (mêmes tons que FileIcon).
function mimeMeta(mime?: string | null): DocMeta {
  const m = (mime ?? '').toLowerCase();
  if (m === 'application/pdf') return { Icon: FileText, tone: 'brand', label: 'PDF' };
  if (m.startsWith('image/')) return { Icon: FileImage, tone: 'neutral', label: 'Image' };
  if (m.includes('spreadsheet') || m === 'text/csv') return { Icon: FileSpreadsheet, tone: 'success', label: 'Tableur' };
  if (m.includes('zip') || m.includes('archive')) return { Icon: FileArchive, tone: 'warning', label: 'Archive' };
  if (m.startsWith('video/')) return { Icon: FileVideo, tone: 'neutral', label: 'Vidéo' };
  return { Icon: File, tone: 'neutral', label: 'Fichier' };
}

export function docMeta(type: string, mime?: string | null): DocMeta {
  return TYPE_META[type] ?? mimeMeta(mime);
}

// Pastille de label de type (mêmes teintes que la tuile, sans anneau).
export const DOC_CHIP_TONE: Record<DocTone, string> = {
  brand:   `${DOC_TONE_STYLE.brand.bg} ${DOC_TONE_STYLE.brand.fg}`,
  success: `${DOC_TONE_STYLE.success.bg} ${DOC_TONE_STYLE.success.fg}`,
  warning: `${DOC_TONE_STYLE.warning.bg} ${DOC_TONE_STYLE.warning.fg}`,
  neutral: `${DOC_TONE_STYLE.neutral.bg} ${DOC_TONE_STYLE.neutral.fg}`,
};

interface Props {
  type: string;
  mime?: string | null;
  className?: string;
}

export function DocumentTypeIcon({ type, mime, className = 'h-12 w-12' }: Props) {
  const { Icon, tone } = docMeta(type, mime);
  const t = DOC_TONE_STYLE[tone];
  return (
    <span className={`grid shrink-0 place-items-center rounded-xl ring-1 ring-inset ring-[color:var(--ps-border-soft)] ${t.bg} ${t.fg} ${className}`}>
      <Icon className="h-[46%] w-[46%]" strokeWidth={1.75} />
    </span>
  );
}
