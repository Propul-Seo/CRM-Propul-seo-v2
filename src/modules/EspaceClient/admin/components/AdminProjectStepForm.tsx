import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { AdminFormDialog, AdminFormField, AdminSelect } from './kit';
import type { ProjectStepInput } from '../hooks/useAdminProjectSteps';
import type { PortalProjectStep } from '@/modules/EspaceClient/client/hooks/usePortalData';
import { STEP_STATUSES } from './tabConstants';

const todayISO = () => new Date().toISOString().slice(0, 10);

// Pastille du select statut : mêmes couleurs que les dots des StatusBadge.
const STATUS_DOT: Record<string, string> = {
  upcoming: 'bg-[var(--ps-fg-muted)]',
  in_progress: 'bg-[var(--ps-primary)]',
  completed: 'bg-[var(--ps-success)]',
  blocked: 'bg-[var(--ps-danger)]',
};

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
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? 'Modifier le jalon' : 'Nouveau jalon'}
      formError={formError}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitLabel={initial ? 'Enregistrer' : 'Créer'}
    >
      <AdminFormField label="Libellé" htmlFor="step-label">
        <Input id="step-label" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex. Maquettes validées" />
      </AdminFormField>
      <AdminFormField
        label="Statut"
        htmlFor="step-status"
        hint="Passer à « Terminé » pré-remplit la date de fin réelle."
      >
        <div className="relative">
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${STATUS_DOT[status] ?? STATUS_DOT.upcoming}`}
          />
          <AdminSelect id="step-status" className="pl-7" options={STEP_STATUSES} value={status} onChange={e => setStatus(e.target.value)} />
        </div>
      </AdminFormField>
      <AdminFormField label="Description" htmlFor="step-description">
        <Input id="step-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optionnel — détail affiché sous le jalon" />
      </AdminFormField>
      <div className="grid grid-cols-3 gap-3">
        <AdminFormField label="Début" htmlFor="step-date-start">
          <Input id="step-date-start" type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} />
        </AdminFormField>
        <AdminFormField label="Fin prévue" htmlFor="step-date-planned">
          <Input id="step-date-planned" type="date" value={datePlannedEnd} onChange={e => setDatePlannedEnd(e.target.value)} />
        </AdminFormField>
        <AdminFormField label="Fin réelle" htmlFor="step-date-actual">
          <Input id="step-date-actual" type="date" value={dateActualEnd} onChange={e => setDateActualEnd(e.target.value)} />
        </AdminFormField>
      </div>
      <label className="flex items-center gap-2.5 text-sm text-foreground">
        <input type="checkbox" className="h-4 w-4 accent-primary" checked={visible} onChange={e => setVisible(e.target.checked)} />
        Visible par le client
      </label>
    </AdminFormDialog>
  );
}
