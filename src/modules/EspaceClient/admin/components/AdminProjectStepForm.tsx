import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProjectStepInput } from '../hooks/useAdminProjectSteps';
import type { PortalProjectStep } from '@/modules/EspaceClient/client/hooks/usePortalData';

const STATUSES: Array<{ value: string; label: string }> = [
  { value: 'upcoming', label: 'À venir' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
  { value: 'blocked', label: 'Bloqué' },
];

const SELECT_CLASS = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm';
const todayISO = () => new Date().toISOString().slice(0, 10);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: PortalProjectStep | null;
  onSubmit: (input: ProjectStepInput) => Promise<{ error: string | null }>;
}

export function AdminProjectStepForm({ open, onOpenChange, initial, onSubmit }: Props) {
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState('upcoming');
  const [description, setDescription] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [datePlannedEnd, setDatePlannedEnd] = useState('');
  const [dateActualEnd, setDateActualEnd] = useState('');
  const [visible, setVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLabel(initial?.label ?? '');
    setStatus(initial?.status ?? 'upcoming');
    setDescription(initial?.description ?? '');
    setDateStart(initial?.date_start ?? '');
    setDatePlannedEnd(initial?.date_planned_end ?? '');
    setDateActualEnd(initial?.date_actual_end ?? '');
    setVisible(initial?.visible_to_client ?? true);
    setFormError(null);
  }, [open, initial]);

  async function handleSubmit() {
    if (!label.trim()) { setFormError('Le libellé est requis.'); return; }
    // Passer à "Terminé" sans date réelle → pré-remplir aujourd'hui.
    const actual = status === 'completed' && !dateActualEnd ? todayISO() : (dateActualEnd || null);
    setSubmitting(true); setFormError(null);
    const { error } = await onSubmit({
      label: label.trim(), status, description: description.trim() || null,
      dateStart: dateStart || null, datePlannedEnd: datePlannedEnd || null,
      dateActualEnd: actual, visibleToClient: visible,
    });
    setSubmitting(false);
    if (error) { setFormError(error); return; }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{initial ? 'Modifier le jalon' : 'Nouveau jalon'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Libellé</Label><Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex. Maquettes validées" /></div>
          <div>
            <Label>Statut</Label>
            <select className={SELECT_CLASS} value={status} onChange={e => setStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div><Label>Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Début</Label><Input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} /></div>
            <div><Label>Prévu</Label><Input type="date" value={datePlannedEnd} onChange={e => setDatePlannedEnd(e.target.value)} /></div>
            <div><Label>Réel</Label><Input type="date" value={dateActualEnd} onChange={e => setDateActualEnd(e.target.value)} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} /> Visible par le client
          </label>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} {initial ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
