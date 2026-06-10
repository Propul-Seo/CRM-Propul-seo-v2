import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { Loader2, PenLine, Eraser } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { portalSupabase } from '@/lib/supabase';
import type { PortalSignature } from '../hooks/usePortalData';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  signature: PortalSignature;
  signerDefaultName: string;
  onSigned: () => void;
}

type Mode = 'draw' | 'type';

const tabClass = (active: boolean) =>
  `flex-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
    active
      ? 'bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)] ring-1 ring-[var(--ps-primary-subtle)]'
      : 'text-[var(--ps-fg-muted)] hover:bg-[var(--ps-bg-subtle)] hover:text-[var(--ps-fg)]'
  }`;

export function SignatureSignModal({ open, onOpenChange, signature, signerDefaultName, onSigned }: Props) {
  const [mode, setMode] = useState<Mode>('draw');
  const [typedName, setTypedName] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  useEffect(() => {
    if (!open) return;
    setMode('draw'); setTypedName(signerDefaultName); setConsent(false); setError(null);
    hasDrawn.current = false;
    const c = canvasRef.current;
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height);
  }, [open, signerDefaultName]);

  function at(e: RPointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!; const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  }
  function down(e: RPointerEvent<HTMLCanvasElement>) {
    drawing.current = true; const { x, y } = at(e);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.strokeStyle = '#18181B';
  }
  function move(e: RPointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return; const { x, y } = at(e);
    const ctx = canvasRef.current!.getContext('2d')!; ctx.lineTo(x, y); ctx.stroke(); hasDrawn.current = true;
  }
  function clearCanvas() {
    const c = canvasRef.current; if (!c) return;
    c.getContext('2d')?.clearRect(0, 0, c.width, c.height); hasDrawn.current = false;
  }

  // Le nom tapé est rendu en PNG (police manuscrite) → format unifié avec le dessin.
  function typedToPng(): string | null {
    const name = typedName.trim(); if (!name) return null;
    const c = document.createElement('canvas'); c.width = 600; c.height = 200;
    const ctx = c.getContext('2d'); if (!ctx) return null;
    ctx.fillStyle = '#18181B'; ctx.font = '64px "Segoe Script", "Brush Script MT", cursive';
    ctx.textBaseline = 'middle'; ctx.fillText(name, 20, 100);
    return c.toDataURL('image/png');
  }

  function buildImage(): string | null {
    if (mode === 'type') return typedToPng();
    return hasDrawn.current && canvasRef.current ? canvasRef.current.toDataURL('image/png') : null;
  }

  async function handleSign() {
    const name = typedName.trim();
    if (!name) { setError('Indiquez votre nom complet.'); return; }
    if (!consent) { setError('Vous devez cocher la case de consentement.'); return; }
    const image = buildImage();
    if (!image) { setError(mode === 'draw' ? 'Dessinez votre signature.' : 'Saisissez votre nom.'); return; }
    setSubmitting(true); setError(null);
    const { data, error: err } = await portalSupabase.functions.invoke('portal-sign-document', {
      body: { signature_id: signature.id, signature_image: image, signed_name: name, consent: true },
    });
    setSubmitting(false);
    const res = data as { ok?: boolean; error?: string } | null;
    if (err || (res && res.ok === false)) {
      setError(res?.error ?? err?.message ?? 'La signature a échoué. Réessayez.');
      return;
    }
    onOpenChange(false);
    onSigned();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="propulspace-portal max-w-lg">
        <DialogHeader><DialogTitle>Signer « {signature.name} »</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2 rounded-lg bg-[var(--ps-bg-subtle)] p-1">
            <button type="button" onClick={() => setMode('draw')} className={tabClass(mode === 'draw')}>Dessiner</button>
            <button type="button" onClick={() => setMode('type')} className={tabClass(mode === 'type')}>Taper</button>
          </div>

          {mode === 'draw' ? (
            <div className="space-y-2">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                onPointerDown={down}
                onPointerMove={move}
                onPointerUp={() => { drawing.current = false; }}
                onPointerLeave={() => { drawing.current = false; }}
                className="h-[200px] w-full touch-none rounded-lg border border-[var(--ps-border)] bg-white"
              />
              <button
                type="button"
                onClick={clearCanvas}
                className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ps-fg-muted)] hover:text-[var(--ps-fg)]"
              >
                <Eraser className="h-3.5 w-3.5" /> Effacer
              </button>
            </div>
          ) : (
            <div className="flex h-[120px] items-center justify-center rounded-lg border border-[var(--ps-border)] bg-white px-4">
              <p className="truncate font-[cursive] text-[40px] leading-none text-[var(--ps-fg)]">
                {typedName.trim() || 'Votre nom'}
              </p>
            </div>
          )}

          <div>
            <Label className="ps-eyebrow ps-eyebrow-muted mb-1.5 block">Votre nom complet</Label>
            <Input value={typedName} onChange={e => setTypedName(e.target.value)} placeholder="Prénom Nom" />
          </div>

          <label className="flex items-start gap-2 text-[13px] text-[var(--ps-fg-secondary)]">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
            <span>Je certifie être {typedName.trim() || '…'} et j'accepte de signer ce document de façon électronique.</span>
          </label>

          {error && <p className="text-[13px] text-[var(--ps-danger-text)]">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            onClick={handleSign}
            disabled={submitting}
            className="bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
          >
            {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <PenLine className="mr-1.5 h-4 w-4" />}
            Signer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
