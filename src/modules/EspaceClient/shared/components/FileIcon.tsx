import { FileText, FileImage, FileArchive, FileSpreadsheet, FileVideo, File } from 'lucide-react';

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

const KIND_STYLE: Record<FileKind, { Icon: typeof FileText; bg: string; fg: string }> = {
  pdf:   { Icon: FileText,        bg: 'bg-red-50',      fg: 'text-red-700' },
  image: { Icon: FileImage,       bg: 'bg-blue-50',     fg: 'text-blue-700' },
  zip:   { Icon: FileArchive,     bg: 'bg-[var(--ps-primary-subtle)]', fg: 'text-[var(--ps-primary-text)]' },
  sheet: { Icon: FileSpreadsheet, bg: 'bg-emerald-50',  fg: 'text-emerald-700' },
  video: { Icon: FileVideo,       bg: 'bg-amber-50',    fg: 'text-amber-700' },
  other: { Icon: File,            bg: 'bg-zinc-100',    fg: 'text-zinc-600' },
};

export function FileIcon({ ext, mime, className = 'h-10 w-10' }: FileIconProps) {
  const kind = detectKind(ext, mime);
  const style = KIND_STYLE[kind];
  const Icon = style.Icon;
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-lg ${style.bg} ${style.fg} ${className}`}>
      <Icon className="h-[55%] w-[55%]" strokeWidth={2} />
    </span>
  );
}
