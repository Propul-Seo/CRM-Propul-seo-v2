import { useEffect, useState } from 'react';
import { Loader2, Download, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Aperçu inline d'un fichier (A4 / E4) : PDF en <iframe>, image en <img>,
// fallback téléchargement pour les autres types (docx, zip…).
// Réutilisable admin + client : on lui passe une fonction qui résout l'URL signée.

function kind(name: string, mime: string | null): 'pdf' | 'image' | 'other' {
  const m = (mime ?? '').toLowerCase();
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (m.includes('pdf') || ext === 'pdf') return 'pdf';
  if (m.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(ext)) return 'image';
  return 'other';
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  mime?: string | null;
  /** Résout l'URL signée (temporaire) du fichier. Appelé à l'ouverture. */
  resolveUrl: () => Promise<string | null>;
}

export function FilePreviewDialog({ open, onOpenChange, name, mime = null, resolveUrl }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) { setUrl(null); setError(false); return; }
    let cancelled = false;
    setLoading(true); setError(false);
    void resolveUrl().then(u => {
      if (cancelled) return;
      if (u) setUrl(u); else setError(true);
      setLoading(false);
    });
    return () => { cancelled = true; };
    // resolveUrl est recréée à chaque render côté appelant : on ne dépend que de `open`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const k = kind(name, mime);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle className="truncate pr-6 text-sm">{name}</DialogTitle></DialogHeader>
        <div className="flex min-h-[60vh] items-center justify-center">
          {loading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
          {!loading && error && <p className="text-sm text-red-400">Impossible de générer l'aperçu. Réessayez plus tard.</p>}
          {!loading && url && k === 'pdf' && (
            <iframe src={url} title={name} className="h-[70vh] w-full rounded-md border border-border bg-white" />
          )}
          {!loading && url && k === 'image' && (
            <img src={url} alt={name} className="max-h-[70vh] max-w-full rounded-md object-contain" />
          )}
          {!loading && url && k === 'other' && (
            <div className="flex flex-col items-center gap-3 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Aperçu non disponible pour ce type de fichier.</p>
              <Button onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
                <Download className="mr-1.5 h-4 w-4" /> Télécharger
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
