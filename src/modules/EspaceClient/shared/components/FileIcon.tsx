import { FileText, FileImage, FileArchive, FileSpreadsheet, FileVideo, File, type LucideIcon } from 'lucide-react';
import { DOC_TONE_STYLE, type DocTone } from './DocumentTypeIcon';

type FileKind = 'pdf' | 'image' | 'zip' | 'sheet' | 'video' | 'other';

interface FileIconProps {
  ext?: string;
  mime?: string;
  className?: string;
}

function detectKind(ext?: string, mime?: string): FileKind {
  const e = (ext ?? '').toLowerCase().replace(/^\./, '');
  const m = (mime ?? '').toLowerCase();
  if (e === 'pdf' || m === 'application/pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(e) || m.startsWith('image/')) return 'image';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e) || m.includes('zip') || m.includes('archive')) return 'zip';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(e) || m.includes('spreadsheet') || m === 'text/csv') return 'sheet';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(e) || m.startsWith('video/')) return 'video';
  return 'other';
}

// Teintes alignées sur la map partagée DOC_TONE_STYLE (source unique avec
// DocumentTypeIcon) — cohérence pdf/docs entre portail client et admin.
const KIND_META: Record<FileKind, { Icon: LucideIcon; tone: DocTone }> = {
  pdf:   { Icon: FileText,        tone: 'brand' },
  image: { Icon: FileImage,       tone: 'neutral' },
  zip:   { Icon: FileArchive,     tone: 'warning' },
  sheet: { Icon: FileSpreadsheet, tone: 'success' },
  video: { Icon: FileVideo,       tone: 'neutral' },
  other: { Icon: File,            tone: 'neutral' },
};

export function FileIcon({ ext, mime, className = 'h-10 w-10' }: FileIconProps) {
  const { Icon, tone } = KIND_META[detectKind(ext, mime)];
  const t = DOC_TONE_STYLE[tone];
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-lg ${t.bg} ${t.fg} ${className}`}>
      <Icon className="h-[55%] w-[55%]" strokeWidth={2} />
    </span>
  );
}
