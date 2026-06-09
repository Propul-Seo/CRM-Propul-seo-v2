import {
  FileText, FileSignature, Scale, Receipt, PackageCheck, FileSearch, ClipboardList,
  Shapes, Palette, FileType, KeyRound, FileImage, FileSpreadsheet, FileArchive, FileVideo, File,
  type LucideIcon,
} from 'lucide-react';

// Icône de document basée sur le TYPE métier (pas seulement le mime), avec une
// teinte sémantique propre au thème sombre. Partagée admin + portail client.
export type DocTone =
  | 'violet' | 'indigo' | 'blue' | 'sky' | 'cyan'
  | 'emerald' | 'amber' | 'rose' | 'fuchsia' | 'slate';

export interface DocMeta {
  Icon: LucideIcon;
  tone: DocTone;
  label: string;
}

const TYPE_META: Record<string, DocMeta> = {
  quote:         { Icon: FileText,      tone: 'violet',  label: 'Devis' },
  contract:      { Icon: FileSignature, tone: 'indigo',  label: 'Contrat' },
  legal:         { Icon: Scale,         tone: 'slate',   label: 'Légal' },
  invoice:       { Icon: Receipt,       tone: 'blue',    label: 'Facture' },
  deliverable:   { Icon: PackageCheck,  tone: 'emerald', label: 'Livrable' },
  audit:         { Icon: FileSearch,    tone: 'amber',   label: 'Audit' },
  report:        { Icon: ClipboardList, tone: 'sky',     label: 'Rapport' },
  asset_logo:    { Icon: Shapes,        tone: 'fuchsia', label: 'Logo' },
  asset_charter: { Icon: Palette,       tone: 'rose',    label: 'Charte' },
  asset_content: { Icon: FileType,      tone: 'cyan',    label: 'Contenu' },
  asset_access:  { Icon: KeyRound,      tone: 'amber',   label: 'Accès' },
};

// Repli sur le mime quand le type métier est inconnu.
function mimeMeta(mime?: string | null): DocMeta {
  const m = (mime ?? '').toLowerCase();
  if (m === 'application/pdf') return { Icon: FileText, tone: 'rose', label: 'PDF' };
  if (m.startsWith('image/')) return { Icon: FileImage, tone: 'violet', label: 'Image' };
  if (m.includes('spreadsheet') || m === 'text/csv') return { Icon: FileSpreadsheet, tone: 'emerald', label: 'Tableur' };
  if (m.includes('zip') || m.includes('archive')) return { Icon: FileArchive, tone: 'amber', label: 'Archive' };
  if (m.startsWith('video/')) return { Icon: FileVideo, tone: 'blue', label: 'Vidéo' };
  return { Icon: File, tone: 'slate', label: 'Fichier' };
}

export function docMeta(type: string, mime?: string | null): DocMeta {
  return TYPE_META[type] ?? mimeMeta(mime);
}

// Tuile (fond teinté + anneau interne) — pour l'icône.
const TILE_TONE: Record<DocTone, string> = {
  violet:  'bg-primary/10 text-primary ring-primary/25',
  indigo:  'bg-indigo-500/10 text-indigo-300 ring-indigo-500/25',
  blue:    'bg-blue-500/10 text-blue-300 ring-blue-500/25',
  sky:     'bg-sky-500/10 text-sky-300 ring-sky-500/25',
  cyan:    'bg-cyan-500/10 text-cyan-300 ring-cyan-500/25',
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25',
  amber:   'bg-amber-500/10 text-amber-300 ring-amber-500/25',
  rose:    'bg-rose-500/10 text-rose-300 ring-rose-500/25',
  fuchsia: 'bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-500/25',
  slate:   'bg-slate-500/10 text-slate-300 ring-slate-500/25',
};

// Pastille de label de type (même teinte, plus discrète).
export const DOC_CHIP_TONE: Record<DocTone, string> = {
  violet:  'bg-primary/10 text-primary',
  indigo:  'bg-indigo-500/10 text-indigo-300',
  blue:    'bg-blue-500/10 text-blue-300',
  sky:     'bg-sky-500/10 text-sky-300',
  cyan:    'bg-cyan-500/10 text-cyan-300',
  emerald: 'bg-emerald-500/10 text-emerald-300',
  amber:   'bg-amber-500/10 text-amber-300',
  rose:    'bg-rose-500/10 text-rose-300',
  fuchsia: 'bg-fuchsia-500/10 text-fuchsia-300',
  slate:   'bg-slate-500/10 text-slate-300',
};

interface Props {
  type: string;
  mime?: string | null;
  className?: string;
}

export function DocumentTypeIcon({ type, mime, className = 'h-12 w-12' }: Props) {
  const { Icon, tone } = docMeta(type, mime);
  return (
    <span className={`grid shrink-0 place-items-center rounded-xl ring-1 ring-inset ${TILE_TONE[tone]} ${className}`}>
      <Icon className="h-[46%] w-[46%]" strokeWidth={1.75} />
    </span>
  );
}
