import { useState } from 'react';
import { Plus, ArrowUp, ArrowDown, Pencil, Trash2, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/modules/EspaceClient/shared/components';
import { AdminTabScaffold } from './AdminTabScaffold';
import { AdminProjectStepForm } from './AdminProjectStepForm';
import { STEP_STATUSES } from './tabConstants';
import { useAdminProjectSteps } from '../hooks/useAdminProjectSteps';
import type { PortalProjectStep } from '@/modules/EspaceClient/client/hooks/usePortalData';

export function ProjectStepsTab({ projectId }: { projectId: string }) {
  const { steps, loading, error, createStep, updateStep, deleteStep, reorder } = useAdminProjectSteps(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PortalProjectStep | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= steps.length) return;
    const ids = steps.map(s => s.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setActionError(null);
    setReordering(true);
    try {
      const { error } = await reorder(ids);
      if (error) setActionError(error);
    } finally {
      setReordering(false);
    }
  }
  async function onStatus(step: PortalProjectStep, status: string) {
    setBusyId(step.id); setActionError(null);
    const { error } = await updateStep(step.id, { status });
    if (error) setActionError(error);
    setBusyId(null);
  }
  async function onDelete(step: PortalProjectStep) {
    if (!window.confirm(`Supprimer le jalon « ${step.label} » ?`)) return;
    setBusyId(step.id); setActionError(null);
    const { error } = await deleteStep(step.id);
    if (error) setActionError(error);
    setBusyId(null);
  }

  return (
    <>
      <AdminTabScaffold
        title={`${steps.length} jalon${steps.length > 1 ? 's' : ''}`}
        action={{ label: 'Ajouter un jalon', icon: Plus, onClick: () => { setEditing(null); setFormOpen(true); } }}
        loading={loading} error={error} actionError={actionError}
        isEmpty={steps.length === 0} emptyIcon={ListChecks} emptyTitle="Aucun jalon" emptyBody="Ajoutez la première étape du projet."
      >
        <ul className="divide-y divide-gray-100">
          {steps.map((step, i) => (
            <li key={step.id} className="flex items-center gap-3 py-3">
              <div className="flex flex-col">
                <button type="button" className="text-gray-400 hover:text-gray-700 disabled:opacity-30" disabled={i === 0 || reordering} onClick={() => move(i, -1)} title="Monter"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" className="text-gray-400 hover:text-gray-700 disabled:opacity-30" disabled={i === steps.length - 1 || reordering} onClick={() => move(i, 1)} title="Descendre"><ArrowDown className="h-4 w-4" /></button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{step.label}{!step.visible_to_client && <span className="ml-2 text-xs text-gray-400">Masqué</span>}</p>
                {step.description && <p className="truncate text-xs text-gray-500">{step.description}</p>}
              </div>
              <select className="rounded border border-gray-200 px-2 py-1 text-xs" value={step.status} disabled={busyId === step.id} onChange={e => onStatus(step, e.target.value)}>
                {STEP_STATUSES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <StatusBadge status={step.status} />
              <Button variant="ghost" size="icon" title="Modifier" onClick={() => { setEditing(step); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" title="Supprimer" disabled={busyId === step.id} onClick={() => onDelete(step)}><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      </AdminTabScaffold>
      <AdminProjectStepForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSubmit={editing ? (input) => updateStep(editing.id, input) : createStep}
      />
    </>
  );
}
