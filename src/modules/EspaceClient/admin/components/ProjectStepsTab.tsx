import { useState, type CSSProperties } from 'react';
import { Plus, ChevronUp, ChevronDown, Pencil, Trash2, ListChecks, Loader2, EyeOff } from 'lucide-react';
import { StatusBadge, Skeleton } from '@/modules/EspaceClient/shared/components';
import { AdminEmptyState } from '@/modules/EspaceClient/admin/components/kit';
import { AdminProjectStepForm } from './AdminProjectStepForm';
import { STEP_STATUSES } from './tabConstants';
import { useAdminProjectSteps } from '../hooks/useAdminProjectSteps';
import type { PortalProjectStep } from '@/modules/EspaceClient/client/hooks/usePortalData';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

// Pastille numérotée : couleur alignée sur les tons des StatusBadge.
const NUM_CHIP: Record<string, string> = {
  upcoming: 'border-border bg-surface-2 text-muted-foreground',
  in_progress: 'border-primary/40 bg-primary/10 text-primary',
  completed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  blocked: 'border-red-500/30 bg-red-500/10 text-red-300',
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
        // Squelette : reproduit la forme des lignes jalon (numéro + titre + dates).
        <ul className="space-y-2.5 py-2" aria-hidden="true">
          {[0, 1, 2].map(i => (
            <li key={i} className="rounded-lg border border-border-subtle bg-surface-1 p-4">
              <div className="flex items-start gap-3.5">
                <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <Skeleton className="h-4 w-2/5 rounded-md" />
                  <Skeleton className="h-3 w-3/5 rounded-md" />
                </div>
              </div>
            </li>
          ))}
        </ul>
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
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Jalons du projet</p>
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

          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-0">
              <div
                className="ps-progress-fill h-full rounded-full bg-primary transition-all"
                style={{ '--ps-bar-w': `${pct}%` } as CSSProperties}
              />
            </div>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{pct} %</span>
          </div>

          {actionError && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{actionError}</p>}

          <ol className="mt-5 space-y-2.5">
            {steps.map((step, i) => {
              const busy = busyId === step.id;
              return (
                <li key={step.id} className="group rounded-lg border border-border-subtle bg-surface-1 p-4 transition-colors hover:bg-surface-3">
                  <div className="flex items-start gap-3.5">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-xs font-semibold tabular-nums ${NUM_CHIP[step.status] ?? NUM_CHIP.upcoming}`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
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
                      <div className="flex opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
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
