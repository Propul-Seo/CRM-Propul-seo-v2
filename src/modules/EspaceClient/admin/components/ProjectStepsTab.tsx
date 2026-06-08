import { useState } from 'react';
import { Plus, ArrowUp, ArrowDown, Pencil, Trash2, ListChecks, Loader2, EyeOff, Check, AlertCircle, Lock } from 'lucide-react';
import { StatusBadge } from '@/modules/EspaceClient/shared/components';
import { AdminSectionHeader, AdminCard, AdminEmptyState } from '@/modules/EspaceClient/admin/components/kit';
import { AdminProjectStepForm } from './AdminProjectStepForm';
import { STEP_STATUSES } from './tabConstants';
import { useAdminProjectSteps } from '../hooks/useAdminProjectSteps';
import type { PortalProjectStep } from '@/modules/EspaceClient/client/hooks/usePortalData';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

// Pastille de frise par statut (thème CRM sombre, tokens sémantiques uniquement).
const NODE: Record<string, { dot: string; icon: typeof Check }> = {
  upcoming:    { dot: 'border-border bg-surface-3 text-muted-foreground', icon: Lock },
  in_progress: { dot: 'border-primary/40 bg-primary/15 text-primary', icon: Loader2 },
  completed:   { dot: 'border-green-500/30 bg-green-500/10 text-green-300', icon: Check },
  blocked:     { dot: 'border-red-500/30 bg-red-500/10 text-red-300', icon: AlertCircle },
};

const SELECT_CLASS =
  'rounded-md border border-border bg-surface-3 px-2 py-1 text-xs text-foreground transition focus:border-primary/50 focus:outline-none disabled:opacity-50';

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

  return (
    <>
      <div className="py-2">
        <AdminSectionHeader
          title={`${steps.length} jalon${steps.length > 1 ? 's' : ''}`}
          subtitle="Frise des étapes du projet"
          action={{ label: 'Ajouter un jalon', icon: Plus, onClick: openCreate }}
        />

        {loading && (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </div>
        )}
        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        {actionError && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{actionError}</p>}

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
          <ol className="space-y-2.5">
            {steps.map((step, i) => {
              const node = NODE[step.status] ?? NODE.upcoming;
              const NodeIcon = node.icon;
              const isLast = i === steps.length - 1;
              const busy = busyId === step.id;
              return (
                <li key={step.id} className="relative flex gap-3">
                  {/* Frise : pastille + ligne de liaison */}
                  <div className="relative flex flex-col items-center">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${node.dot}`}>
                      <NodeIcon className={`h-4 w-4 ${step.status === 'in_progress' ? 'animate-spin' : ''}`} strokeWidth={2.5} />
                    </span>
                    {!isLast && <span aria-hidden className="mt-1 w-px flex-1 bg-border" />}
                  </div>

                  <AdminCard className="group mb-1.5 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{step.label}</p>
                          {!step.visible_to_client && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                              <EyeOff className="h-3 w-3" /> Masqué
                            </span>
                          )}
                          <StatusBadge status={step.status} />
                        </div>
                        {step.description && (
                          <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                        )}
                        {(step.date_start || step.date_planned_end || step.date_actual_end) && (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {[
                              step.date_start && `Début ${fmtDate(step.date_start)}`,
                              step.date_planned_end && `Prévu ${fmtDate(step.date_planned_end)}`,
                              step.date_actual_end && `Terminé ${fmtDate(step.date_actual_end)}`,
                            ].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>

                      {/* Actions : statut + réordonnage + édition */}
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

                        <div className="flex flex-col">
                          <button
                            type="button"
                            className="text-muted-foreground opacity-30 transition hover:text-foreground group-hover:opacity-100 disabled:opacity-20"
                            disabled={i === 0 || reordering}
                            onClick={() => move(i, -1)}
                            title="Monter"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="text-muted-foreground opacity-30 transition hover:text-foreground group-hover:opacity-100 disabled:opacity-20"
                            disabled={isLast || reordering}
                            onClick={() => move(i, 1)}
                            title="Descendre"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="rounded-md p-1.5 text-muted-foreground transition hover:bg-surface-3 hover:text-foreground"
                          title="Modifier"
                          onClick={() => { setEditing(step); setFormOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                          title="Supprimer"
                          disabled={busy}
                          onClick={() => onDelete(step)}
                        >
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </AdminCard>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <AdminProjectStepForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSubmit={editing ? (input) => updateStep(editing.id, input) : createStep}
      />
    </>
  );
}
