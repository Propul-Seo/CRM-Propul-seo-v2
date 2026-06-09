import { useState } from 'react';
import { Plus, ChevronUp, ChevronDown, Pencil, Trash2, ListChecks, Loader2, EyeOff } from 'lucide-react';
import { StatusBadge } from '@/modules/EspaceClient/shared/components';
import { AdminEmptyState } from '@/modules/EspaceClient/admin/components/kit';
import { AdminProjectStepForm } from './AdminProjectStepForm';
import { STEP_STATUSES } from './tabConstants';
import { useAdminProjectSteps } from '../hooks/useAdminProjectSteps';
import type { PortalProjectStep } from '@/modules/EspaceClient/client/hooks/usePortalData';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

// Pastille de statut (DA Atelier).
const DOT: Record<string, string> = {
  upcoming: 'bg-surface-3',
  in_progress: 'bg-primary',
  completed: 'bg-emerald-500',
  blocked: 'bg-red-500',
};

const SELECT_CLASS =
  'rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-foreground transition focus:border-primary/50 focus:outline-none disabled:opacity-50';

function StepDates({ step }: { step: PortalProjectStep }) {
  const parts = [
    step.date_start && `Début ${fmtDate(step.date_start)}`,
    step.date_planned_end && `Prévu ${fmtDate(step.date_planned_end)}`,
    step.date_actual_end && `Terminé ${fmtDate(step.date_actual_end)}`,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return <p className="mt-1.5 text-[11px] text-muted-foreground tabular-nums">{parts.join(' · ')}</p>;
}

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
  const openCreate = () => { setEditing(null); setFormOpen(true); };

  const done = steps.filter(s => s.status === 'completed').length;
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;

  return (
    <>
      {loading && (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      )}
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {!loading && !error && steps.length === 0 && (
        <AdminEmptyState
          icon={ListChecks}
          title="Aucun jalon"
          body="Ajoutez la première étape du projet pour construire la frise."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-primary/85"
            >
              <Plus className="h-4 w-4" /> Ajouter un jalon
            </button>
          }
        />
      )}

      {!loading && !error && steps.length > 0 && (
        <section className="rounded-xl border border-border bg-surface-2 p-5 shadow-glow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Jalons du projet</p>
              <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
                {done}<span className="text-base font-normal text-muted-foreground"> / {steps.length} terminés</span>
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter un jalon
            </button>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-0">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: pct + '%' }} />
          </div>

          {actionError && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{actionError}</p>}

          <ol className="mt-5 space-y-2.5">
            {steps.map((step, i) => {
              const busy = busyId === step.id;
              return (
                <li key={step.id} className="group rounded-lg border border-border-subtle bg-surface-1 p-4 transition-colors hover:bg-surface-3">
                  <div className="flex items-start gap-3.5">
                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[step.status] ?? 'bg-surface-3'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-foreground">{step.label}</h3>
                        <StatusBadge status={step.status} />
                        {!step.visible_to_client && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            <EyeOff className="h-3 w-3" /> Masqué
                          </span>
                        )}
                      </div>
                      {step.description && <p className="mt-1 text-xs text-foreground/70">{step.description}</p>}
                      <StepDates step={step} />
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <select
                        className={SELECT_CLASS}
                        value={step.status}
                        disabled={busy}
                        onChange={e => onStatus(step, e.target.value)}
                        aria-label="Changer le statut"
                      >
                        {STEP_STATUSES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                        <button type="button" disabled={i === 0 || reordering} onClick={() => move(i, -1)} title="Monter" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-20"><ChevronUp className="h-4 w-4" /></button>
                        <button type="button" disabled={i === steps.length - 1 || reordering} onClick={() => move(i, 1)} title="Descendre" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-20"><ChevronDown className="h-4 w-4" /></button>
                        <button type="button" onClick={() => { setEditing(step); setFormOpen(true); }} title="Modifier" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                        <button type="button" disabled={busy} onClick={() => onDelete(step)} title="Supprimer" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40">
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <AdminProjectStepForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSubmit={editing ? (input) => updateStep(editing.id, input) : createStep}
      />
    </>
  );
}
