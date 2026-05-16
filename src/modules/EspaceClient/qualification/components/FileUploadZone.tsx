import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { QUALIFICATION_STORAGE_BUCKET, QUALIFICATION_STORAGE_FOLDER } from '../constants';

interface FileUploadZoneProps {
  leadId: string | null;
  paths: string[];
  onChange: (paths: string[]) => void;
  maxFiles: number;
  maxSizeMb: number;
  accept: string;
  label?: string;
  hint?: string;
  kind: 'screenshot' | 'logo' | 'brand-guide';
}

interface UploadingItem {
  name: string;
  progress: 'uploading' | 'error';
  errorMsg?: string;
}

// Upload côté front vers Supabase Storage. Path = qualification/<leadId>/<kind>-<ts>-<rand>.<ext>.
// Bucket privé : on stocke des paths, la lecture se fera via URL signée
// quand un admin consultera le lead.
async function uploadOne(file: File, leadId: string | null, kind: string): Promise<{ path: string | null; error: string | null }> {
  const id = leadId ?? 'pending';
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const safeKind = kind.replace(/[^a-z0-9-]/gi, '');
  const fileName = `${safeKind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${QUALIFICATION_STORAGE_FOLDER}/${id}/${fileName}`;

  const { error } = await supabase.storage.from(QUALIFICATION_STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600', upsert: false, contentType: file.type || undefined,
  });
  if (error) return { path: null, error: error.message };
  return { path, error: null };
}

export function FileUploadZone({
  leadId, paths, onChange, maxFiles, maxSizeMb, accept, label, hint, kind,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<UploadingItem[]>([]);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const slotsLeft = maxFiles - paths.length;
    const toProcess = arr.slice(0, slotsLeft);

    for (const file of toProcess) {
      if (file.size > maxSizeMb * 1024 * 1024) {
        setUploading(prev => [...prev, { name: file.name, progress: 'error', errorMsg: `Trop volumineux (max ${maxSizeMb} MB)` }]);
        continue;
      }
      setUploading(prev => [...prev, { name: file.name, progress: 'uploading' }]);
      const { path, error } = await uploadOne(file, leadId, kind);
      setUploading(prev => prev.filter(u => u.name !== file.name || u.progress === 'error'));
      if (error || !path) {
        setUploading(prev => [...prev, { name: file.name, progress: 'error', errorMsg: error ?? 'Upload échoué' }]);
        continue;
      }
      onChange([...paths, path]);
    }
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) void handleFiles(e.target.files);
    e.target.value = '';
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files) void handleFiles(e.dataTransfer.files);
  }

  function removeAt(idx: number) {
    onChange(paths.filter((_, i) => i !== idx));
  }

  const isFull = paths.length >= maxFiles;
  // Bloque l'upload tant que le lead n'a pas été créé en DB. Sinon le path
  // contiendrait `qualification/pending/...` qui ne serait jamais rattaché.
  const blockedNoLead = leadId === null;
  const disabled = isFull || blockedNoLead;
  const Icon = kind === 'brand-guide' ? FileText : ImageIcon;

  return (
    <div className="space-y-2">
      {label && <p className="text-[12.5px] font-semibold text-[var(--ps-fg)]">{label}</p>}
      <div
        onDragOver={e => { if (!disabled) { e.preventDefault(); setDragOver(true); } }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { if (!disabled) onDrop(e); else e.preventDefault(); }}
        className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
          dragOver ? 'border-[var(--ps-primary)] bg-[var(--ps-primary-subtle)]' : 'border-[var(--ps-border)] bg-[var(--ps-bg-subtle)]'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <Upload className="mx-auto h-5 w-5 text-[var(--ps-fg-muted)]" />
        <p className="mt-2 text-[12.5px] text-[var(--ps-fg-secondary)]">
          {blockedNoLead
            ? 'Renseignez d\'abord l\'étape 1 — l\'upload sera disponible ensuite.'
            : (hint ?? `Glissez vos fichiers · max ${maxFiles} · ${maxSizeMb} MB chacun`)}
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="mt-2 text-[12px] font-semibold text-[var(--ps-primary-text)] hover:underline disabled:opacity-50 disabled:no-underline"
        >
          Parcourir…
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={onInputChange}
          className="hidden"
        />
      </div>

      {(paths.length > 0 || uploading.length > 0) && (
        <ul className="space-y-1.5">
          {paths.map((p, i) => {
            const name = p.split('/').pop() ?? p;
            return (
              <li key={p} className="flex items-center gap-2 rounded-lg border border-[var(--ps-border-soft)] bg-white px-3 py-2 text-[12.5px]">
                <Icon className="h-3.5 w-3.5 text-[var(--ps-primary-text)]" />
                <span className="flex-1 truncate text-[var(--ps-fg)]">{name}</span>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label={`Retirer ${name}`}
                  className="text-[var(--ps-fg-muted)] hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
          {uploading.map((u, i) => (
            <li key={`up-${i}`} className="flex items-center gap-2 rounded-lg border border-[var(--ps-border-soft)] bg-white px-3 py-2 text-[12.5px]">
              {u.progress === 'uploading' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--ps-primary-text)]" />
              ) : (
                <X className="h-3.5 w-3.5 text-red-500" />
              )}
              <span className="flex-1 truncate text-[var(--ps-fg-secondary)]">{u.name}</span>
              {u.errorMsg && <span className="text-[11px] text-red-600">{u.errorMsg}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
