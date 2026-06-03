# Back-office Propul'Space — Onglets Signatures / Documents / Jalons / Activité — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre fonctionnels les 4 onglets placeholder du panneau client admin (`/admin/propulspace/clients/:projectId/*`) : Jalons, Documents, Activité, Signatures.

**Architecture:** Option C — un scaffold partagé léger (`AdminTabScaffold`) + un hook/onglet/formulaire sur-mesure par entité, calqués sur le pattern Factures (`useAdminInvoices` + `adminRpc` + `InvoicesTab` + `AdminInvoiceForm`). Écritures via RPC `admin_*` SECURITY DEFINER (schéma `propulspace` non exposé à PostgREST) ; lectures via les vues `public.propulspace_*_v2` (proxy `v2.from()`).

**Tech Stack:** React 18 + TypeScript (strict, pas de `any`), Vite, Supabase (PostgREST + RPC + Storage + Edge Functions), Tailwind + shadcn/ui, lucide-react. Spec source : `docs/superpowers/specs/2026-06-03-propulspace-admin-onglets-design.md`.

**Ordre de livraison (tranches verticales, du moins au plus bloqué) :** Jalons → Documents → Activité → Signatures.

**Convention de vérification (pas de Vitest dans le projet — R-007) :** chaque tâche front se valide par `npm run build` (tsc + build Vite, zéro erreur de type). Vérification runtime manuelle finale (Task 24) sur le client de test « Site vitrine Boulangerie Dupont ».

> **⚠️ Application des migrations & edge fn — MANUELLE.** Le MCP Supabase de cette session est connecté à une autre organisation (CoProFlex) et ne voit PAS le projet ERP `tbuqctfgjjxnevmsvucl`. Toutes les étapes « appliquer/vérifier/déployer » se font **à la main** par l'utilisateur : SQL collé dans le **SQL Editor** du projet ERP (Dashboard Supabase), edge fn déployée via le Dashboard ou la CLI `supabase functions deploy`. Claude écrit les fichiers SQL + edge fn dans le repo et fournit le SQL à coller (bloc d'assertions inclus). C'est le workflow déjà utilisé pour les migrations 270/271/272.

**Note de numérotation migrations :** on numérote `280..283` dans l'ordre de livraison (≠ ordre de la spec) pour aligner timestamp = numéro = ordre de build : 280 jalons, 281 documents, 282 audit, 283 signatures.

---

## File Structure

**À créer** (sous `src/modules/EspaceClient/admin/`) :
- `components/AdminTabScaffold.tsx` — coquille partagée (header + bouton + loading + erreurs + empty).
- `hooks/useAdminProjectSteps.ts` · `components/ProjectStepsTab.tsx` · `components/AdminProjectStepForm.tsx` — Jalons.
- `hooks/useAdminDocuments.ts` · `components/DocumentsTab.tsx` · `components/AdminDocumentUpload.tsx` · `components/AdminDocumentEditDialog.tsx` — Documents.
- `hooks/useAdminAuditLog.ts` · `components/ActivityTab.tsx` — Activité.
- `hooks/useAdminSignatures.ts` · `components/SignaturesTab.tsx` · `components/AdminSignatureForm.tsx` — Signatures.

**À créer** (migrations SQL, `supabase/migrations/`) :
- `20260603110000_propulspace_280_admin_project_step_rpcs.sql`
- `20260603111000_propulspace_281_admin_document_rpcs.sql`
- `20260603112000_propulspace_282_admin_get_audit_log.sql`
- `20260603113000_propulspace_283_admin_signature_rpcs.sql`

**À modifier :**
- `src/modules/EspaceClient/admin/lib/adminRpc.ts` — étendre `AdminRpcMap` + exporter `AuditLogRow`.
- `src/modules/EspaceClient/admin/pages/AdminClientPanel.tsx` — remplacer les 4 `<TabPlaceholder>` par de vraies routes.
- `supabase/functions/admin-docuseal-create-submission/index.ts` — mode `probe` + dégradation gracieuse `not_configured`.

**À créer** (test) : `.planning/PROPULSPACE_ADMIN_TABS_TESTS.sql` — assertions RPC rejouables.

**Réutilisés sans modification :** `lib/adminStorage.ts` (`getAdminSignedUrl`), `shared/components/{StatusBadge, EmptyState, ActivityRow, FileIcon}`, `components/AdminClientTabs.tsx`, `client/hooks/usePortalData.ts` (types `PortalSignature/Document/ProjectStep`).

---

## Task 1 : Scaffold partagé `AdminTabScaffold`

**Files:**
- Create: `src/modules/EspaceClient/admin/components/AdminTabScaffold.tsx`

- [ ] **Step 1 : Écrire le composant**

```tsx
import type { ReactNode } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/modules/EspaceClient/shared/components';

interface ScaffoldAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  disabledReason?: string;
}

interface AdminTabScaffoldProps {
  title: string;
  action?: ScaffoldAction;
  loading: boolean;
  error: string | null;
  actionError?: string | null;
  isEmpty: boolean;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyBody?: string;
  children: ReactNode;
}

export function AdminTabScaffold({
  title, action, loading, error, actionError, isEmpty, emptyIcon, emptyTitle, emptyBody, children,
}: AdminTabScaffoldProps) {
  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        {action && (
          <Button
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.disabled ? action.disabledReason : undefined}
          >
            {action.icon && <action.icon className="mr-1 h-4 w-4" />} {action.label}
          </Button>
        )}
      </div>
      {loading && (
        <div className="py-6 text-sm text-gray-500"><Loader2 className="inline h-4 w-4 animate-spin" /> Chargement…</div>
      )}
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {actionError && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}
      {!loading && isEmpty && <EmptyState icon={emptyIcon} title={emptyTitle} body={emptyBody} />}
      {!loading && !isEmpty && children}
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier le build**

Run: `npm run build`
Expected: succès, 0 erreur TS. (Le composant n'est pas encore importé : on vérifie juste qu'il compile.)

- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/components/AdminTabScaffold.tsx
git commit -m "feat(propulspace-admin): scaffold partagé AdminTabScaffold pour les onglets"
```

---

## Task 2 : Migration 280 — RPC Jalons (project_steps)

**Files:**
- Create: `supabase/migrations/20260603110000_propulspace_280_admin_project_step_rpcs.sql`

- [ ] **Step 1 : Écrire la migration**

```sql
-- propulspace 280 — RPC admin: gestion des jalons (project_steps).
-- Le schéma propulspace n'étant pas exposé à PostgREST, l'admin écrit via ces
-- RPC public SECURITY DEFINER (garde is_admin). project_steps n'a PAS de trigger
-- d'audit (table non sensible) → mutations directes.
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor). Ne pas rejouer si déjà passée.

create or replace function public.admin_create_project_step(
  p_project_id        uuid,
  p_label             text,
  p_step_order        int     default null,
  p_status            text    default 'upcoming',
  p_description       text    default null,
  p_date_start        date    default null,
  p_date_planned_end  date    default null,
  p_visible_to_client boolean default true
) returns uuid
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_id uuid; v_order int;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  if p_status not in ('upcoming','in_progress','completed','blocked') then
    raise exception 'invalid status %', p_status using errcode='22023';
  end if;
  if not exists (select 1 from public.projects_v2 where id = p_project_id) then
    raise exception 'project % not found', p_project_id using errcode='P0002';
  end if;
  v_order := coalesce(
    p_step_order,
    (select coalesce(max(step_order), 0) + 1 from propulspace.project_steps where project_id = p_project_id)
  );
  insert into propulspace.project_steps(
    project_id, step_order, label, description, status,
    date_start, date_planned_end, visible_to_client
  ) values (
    p_project_id, v_order, p_label, p_description, p_status,
    p_date_start, p_date_planned_end, p_visible_to_client
  ) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.admin_update_project_step(
  p_step_id           uuid,
  p_label             text    default null,
  p_status            text    default null,
  p_description       text    default null,
  p_date_start        date    default null,
  p_date_planned_end  date    default null,
  p_date_actual_end   date    default null,
  p_visible_to_client boolean default null
) returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  if p_status is not null and p_status not in ('upcoming','in_progress','completed','blocked') then
    raise exception 'invalid status %', p_status using errcode='22023';
  end if;
  if not exists (select 1 from propulspace.project_steps where id = p_step_id) then
    raise exception 'step % not found', p_step_id using errcode='P0002';
  end if;
  update propulspace.project_steps set
    label             = coalesce(p_label, label),
    status            = coalesce(p_status, status),
    description       = coalesce(p_description, description),
    date_start        = coalesce(p_date_start, date_start),
    date_planned_end  = coalesce(p_date_planned_end, date_planned_end),
    date_actual_end   = coalesce(p_date_actual_end, date_actual_end),
    visible_to_client = coalesce(p_visible_to_client, visible_to_client),
    updated_at        = now()
  where id = p_step_id;
end; $$;

create or replace function public.admin_delete_project_step(p_step_id uuid)
returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  delete from propulspace.project_steps where id = p_step_id;
end; $$;

create or replace function public.admin_reorder_project_steps(
  p_project_id  uuid,
  p_ordered_ids uuid[]
) returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_id uuid; v_idx int := 0;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  foreach v_id in array p_ordered_ids loop
    v_idx := v_idx + 1;
    update propulspace.project_steps
       set step_order = v_idx, updated_at = now()
     where id = v_id and project_id = p_project_id;
  end loop;
end; $$;

revoke all on function public.admin_create_project_step(uuid,text,int,text,text,date,date,boolean) from public, anon;
revoke all on function public.admin_update_project_step(uuid,text,text,text,date,date,date,boolean) from public, anon;
revoke all on function public.admin_delete_project_step(uuid) from public, anon;
revoke all on function public.admin_reorder_project_steps(uuid,uuid[]) from public, anon;
grant execute on function public.admin_create_project_step(uuid,text,int,text,text,date,date,boolean) to authenticated;
grant execute on function public.admin_update_project_step(uuid,text,text,text,date,date,date,boolean) to authenticated;
grant execute on function public.admin_delete_project_step(uuid) to authenticated;
grant execute on function public.admin_reorder_project_steps(uuid,uuid[]) to authenticated;
```

- [ ] **Step 2 : Appliquer à la main (SQL Editor du projet ERP)**

Claude fournit le SQL ci-dessus à l'utilisateur, qui le colle dans le **SQL Editor** du projet `tbuqctfgjjxnevmsvucl` et l'exécute.
Expected: succès sans erreur.

- [ ] **Step 3 : Vérifier (à coller dans le SQL Editor à la suite)**

```sql
select count(*) as fns from pg_proc
where proname in ('admin_create_project_step','admin_update_project_step','admin_delete_project_step','admin_reorder_project_steps');
```
Expected: `fns = 4`.

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/20260603110000_propulspace_280_admin_project_step_rpcs.sql
git commit -m "feat(propulspace-admin): RPC admin jalons (project_steps) — migration 280"
```

---

## Task 3 : Étendre `AdminRpcMap` (Jalons)

**Files:**
- Modify: `src/modules/EspaceClient/admin/lib/adminRpc.ts`

- [ ] **Step 1 : Ajouter les entrées RPC jalons dans `AdminRpcMap`**

Insérer ces propriétés dans l'interface `AdminRpcMap`, juste après le bloc `admin_send_invoice` :

```ts
  admin_create_project_step: {
    args: {
      p_project_id: string;
      p_label: string;
      p_step_order?: number | null;
      p_status?: string;
      p_description?: string | null;
      p_date_start?: string | null;
      p_date_planned_end?: string | null;
      p_visible_to_client?: boolean;
    };
    returns: string;            // step id (uuid)
  };
  admin_update_project_step: {
    args: {
      p_step_id: string;
      p_label?: string | null;
      p_status?: string | null;
      p_description?: string | null;
      p_date_start?: string | null;
      p_date_planned_end?: string | null;
      p_date_actual_end?: string | null;
      p_visible_to_client?: boolean | null;
    };
    returns: null;
  };
  admin_delete_project_step: {
    args: { p_step_id: string };
    returns: null;
  };
  admin_reorder_project_steps: {
    args: { p_project_id: string; p_ordered_ids: string[] };
    returns: null;
  };
```

- [ ] **Step 2 : Vérifier le build**

Run: `npm run build`
Expected: 0 erreur TS.

- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/lib/adminRpc.ts
git commit -m "feat(propulspace-admin): typage AdminRpcMap pour les RPC jalons"
```

---

## Task 4 : Hook `useAdminProjectSteps`

**Files:**
- Create: `src/modules/EspaceClient/admin/hooks/useAdminProjectSteps.ts`

- [ ] **Step 1 : Écrire le hook**

```ts
import { useCallback, useEffect, useState } from 'react';
import { v2 } from '@/lib/supabase';
import { adminRpc } from '../lib/adminRpc';
import type { PortalProjectStep } from '@/modules/EspaceClient/client/hooks/usePortalData';

export interface ProjectStepInput {
  label: string;
  status: string;                 // 'upcoming' | 'in_progress' | 'completed' | 'blocked'
  description?: string | null;
  dateStart?: string | null;      // 'YYYY-MM-DD'
  datePlannedEnd?: string | null;
  dateActualEnd?: string | null;
  visibleToClient: boolean;
}

interface UseAdminProjectStepsResult {
  steps: PortalProjectStep[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createStep: (input: ProjectStepInput) => Promise<{ error: string | null }>;
  updateStep: (stepId: string, input: Partial<ProjectStepInput>) => Promise<{ error: string | null }>;
  deleteStep: (stepId: string) => Promise<{ error: string | null }>;
  reorder: (orderedIds: string[]) => Promise<{ error: string | null }>;
}

export function useAdminProjectSteps(projectId: string): UseAdminProjectStepsResult {
  const [steps, setSteps] = useState<PortalProjectStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await v2.from('propulspace_project_steps')
      .select('*').eq('project_id', projectId).order('step_order', { ascending: true });
    if (err) { setError(err.message); setSteps([]); }
    else { setError(null); setSteps((data ?? []) as unknown as PortalProjectStep[]); }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const createStep = useCallback<UseAdminProjectStepsResult['createStep']>(async (input) => {
    const { error: err } = await adminRpc('admin_create_project_step', {
      p_project_id: projectId,
      p_label: input.label,
      p_status: input.status,
      p_description: input.description ?? null,
      p_date_start: input.dateStart ?? null,
      p_date_planned_end: input.datePlannedEnd ?? null,
      p_visible_to_client: input.visibleToClient,
    });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [projectId, refresh]);

  const updateStep = useCallback<UseAdminProjectStepsResult['updateStep']>(async (stepId, input) => {
    const { error: err } = await adminRpc('admin_update_project_step', {
      p_step_id: stepId,
      p_label: input.label ?? null,
      p_status: input.status ?? null,
      p_description: input.description ?? null,
      p_date_start: input.dateStart ?? null,
      p_date_planned_end: input.datePlannedEnd ?? null,
      p_date_actual_end: input.dateActualEnd ?? null,
      p_visible_to_client: input.visibleToClient ?? null,
    });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  const deleteStep = useCallback<UseAdminProjectStepsResult['deleteStep']>(async (stepId) => {
    const { error: err } = await adminRpc('admin_delete_project_step', { p_step_id: stepId });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  const reorder = useCallback<UseAdminProjectStepsResult['reorder']>(async (orderedIds) => {
    const { error: err } = await adminRpc('admin_reorder_project_steps', { p_project_id: projectId, p_ordered_ids: orderedIds });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [projectId, refresh]);

  return { steps, loading, error, refresh, createStep, updateStep, deleteStep, reorder };
}
```

- [ ] **Step 2 : Build** — `npm run build` → 0 erreur TS.
- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/hooks/useAdminProjectSteps.ts
git commit -m "feat(propulspace-admin): hook useAdminProjectSteps"
```

---

## Task 5 : Formulaire `AdminProjectStepForm`

**Files:**
- Create: `src/modules/EspaceClient/admin/components/AdminProjectStepForm.tsx`

- [ ] **Step 1 : Écrire le composant (création + édition)**

```tsx
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
```

- [ ] **Step 2 : Build** — `npm run build` → 0 erreur TS.
- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/components/AdminProjectStepForm.tsx
git commit -m "feat(propulspace-admin): formulaire jalon (création/édition)"
```

---

## Task 6 : Onglet `ProjectStepsTab`

**Files:**
- Create: `src/modules/EspaceClient/admin/components/ProjectStepsTab.tsx`

- [ ] **Step 1 : Écrire l'onglet**

```tsx
import { useState } from 'react';
import { Plus, ArrowUp, ArrowDown, Pencil, Trash2, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/modules/EspaceClient/shared/components';
import { AdminTabScaffold } from './AdminTabScaffold';
import { AdminProjectStepForm } from './AdminProjectStepForm';
import { useAdminProjectSteps } from '../hooks/useAdminProjectSteps';
import type { PortalProjectStep } from '@/modules/EspaceClient/client/hooks/usePortalData';

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'upcoming', label: 'À venir' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
  { value: 'blocked', label: 'Bloqué' },
];

export function ProjectStepsTab({ projectId }: { projectId: string }) {
  const { steps, loading, error, createStep, updateStep, deleteStep, reorder } = useAdminProjectSteps(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PortalProjectStep | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= steps.length) return;
    const ids = steps.map(s => s.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setActionError(null);
    const { error } = await reorder(ids);
    if (error) setActionError(error);
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
                <button type="button" className="text-gray-400 hover:text-gray-700 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} title="Monter"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" className="text-gray-400 hover:text-gray-700 disabled:opacity-30" disabled={i === steps.length - 1} onClick={() => move(i, 1)} title="Descendre"><ArrowDown className="h-4 w-4" /></button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{step.label}{!step.visible_to_client && <span className="ml-2 text-xs text-gray-400">Masqué</span>}</p>
                {step.description && <p className="truncate text-xs text-gray-500">{step.description}</p>}
              </div>
              <select className="rounded border border-gray-200 px-2 py-1 text-xs" value={step.status} disabled={busyId === step.id} onChange={e => onStatus(step, e.target.value)}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
```

- [ ] **Step 2 : Build** — `npm run build` → 0 erreur TS.
- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/components/ProjectStepsTab.tsx
git commit -m "feat(propulspace-admin): onglet Jalons (liste + statut + réordonnancement)"
```

---

## Task 7 : Brancher la route Jalons

**Files:**
- Modify: `src/modules/EspaceClient/admin/pages/AdminClientPanel.tsx`

- [ ] **Step 1 : Ajouter l'import** (après la ligne `import { InvoicesTab } ...`)

```tsx
import { ProjectStepsTab } from '../components/ProjectStepsTab';
```

- [ ] **Step 2 : Ajouter le wrapper `JalonsRoute`** (après la fonction `InvoicesRoute`)

```tsx
function JalonsRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) return null;
  return <ProjectStepsTab projectId={projectId} />;
}
```

- [ ] **Step 3 : Remplacer la route placeholder jalons**

Remplacer la ligne :
```tsx
        <Route path="jalons" element={<TabPlaceholder name="Jalons" />} />
```
par :
```tsx
        <Route path="jalons" element={<JalonsRoute />} />
```

- [ ] **Step 4 : Build** — `npm run build` → 0 erreur TS.

- [ ] **Step 5 : Vérif runtime**

Run: `npm run dev` (si pas déjà lancé). Naviguer vers `/admin/propulspace/clients/<un projet>/jalons`.
Expected: l'onglet liste les jalons (ou état vide). Tester : ajouter un jalon, changer son statut, monter/descendre, modifier, supprimer. Aucune erreur console.

- [ ] **Step 6 : Commit**

```bash
git add src/modules/EspaceClient/admin/pages/AdminClientPanel.tsx
git commit -m "feat(propulspace-admin): brancher l'onglet Jalons sur la route"
```

---

## Task 8 : Migration 281 — RPC + vue admin Documents

**Files:**
- Create: `supabase/migrations/20260603111000_propulspace_281_admin_document_rpcs.sql`

- [ ] **Step 1 : Écrire la migration**

```sql
-- propulspace 281 — RPC admin GED + vue admin documents.
-- La vue client propulspace_documents_v2 n'expose PAS deleted_at (whitelist 190)
-- et n'a pas de filtre de lignes → un doc soft-supprimé y resterait visible.
-- On crée donc propulspace_documents_admin_v2 (filtre deleted_at IS NULL) que
-- l'admin lit. RLS via is_admin() (security_invoker). Les triggers d'audit sur
-- propulspace.documents loguent insert/update/delete pour l'onglet Activité.
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor). Ne pas rejouer si déjà passée.

-- 1. Vue admin (mêmes colonnes que PortalDocument + filtre soft-delete)
drop view if exists public.propulspace_documents_admin_v2;
create view public.propulspace_documents_admin_v2
  with (security_invoker = true) as
  select
    id, project_id, document_type, category, name, description,
    file_url, file_size_bytes, file_mime_type, version,
    visible_to_client, uploaded_by_client, viewed_by_client_at, created_at
  from propulspace.documents
  where deleted_at is null;

revoke all on public.propulspace_documents_admin_v2 from anon;
grant select on public.propulspace_documents_admin_v2 to authenticated;

-- 2. RPC create
create or replace function public.admin_create_document(
  p_project_id        uuid,
  p_document_type     text,
  p_name              text,
  p_file_url          text,
  p_file_size_bytes   bigint  default null,
  p_file_mime_type    text    default null,
  p_category          text    default null,
  p_description       text    default null,
  p_visible_to_client boolean default true
) returns uuid
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_id uuid; v_creator uuid;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  if not exists (select 1 from public.projects_v2 where id = p_project_id) then
    raise exception 'project % not found', p_project_id using errcode='P0002';
  end if;
  select id into v_creator from public.users where auth_user_id = auth.uid();
  insert into propulspace.documents(
    project_id, document_type, name, file_url, file_size_bytes, file_mime_type,
    category, description, visible_to_client, uploaded_by_client, uploaded_by
  ) values (
    p_project_id, p_document_type, p_name, p_file_url, p_file_size_bytes, p_file_mime_type,
    p_category, p_description, p_visible_to_client, false, v_creator
  ) returning id into v_id;
  return v_id;
end; $$;

-- 3. RPC update (métadonnées)
create or replace function public.admin_update_document(
  p_document_id       uuid,
  p_name              text    default null,
  p_category          text    default null,
  p_description       text    default null,
  p_visible_to_client boolean default null
) returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  if not exists (select 1 from propulspace.documents where id = p_document_id and deleted_at is null) then
    raise exception 'document % not found', p_document_id using errcode='P0002';
  end if;
  update propulspace.documents set
    name              = coalesce(p_name, name),
    category          = coalesce(p_category, category),
    description       = coalesce(p_description, description),
    visible_to_client = coalesce(p_visible_to_client, visible_to_client),
    updated_at        = now()
  where id = p_document_id;
end; $$;

-- 4. RPC delete (soft)
create or replace function public.admin_delete_document(p_document_id uuid)
returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  update propulspace.documents set deleted_at = now(), updated_at = now()
   where id = p_document_id and deleted_at is null;
end; $$;

revoke all on function public.admin_create_document(uuid,text,text,text,bigint,text,text,text,boolean) from public, anon;
revoke all on function public.admin_update_document(uuid,text,text,text,boolean) from public, anon;
revoke all on function public.admin_delete_document(uuid) from public, anon;
grant execute on function public.admin_create_document(uuid,text,text,text,bigint,text,text,text,boolean) to authenticated;
grant execute on function public.admin_update_document(uuid,text,text,text,boolean) to authenticated;
grant execute on function public.admin_delete_document(uuid) to authenticated;
```

- [ ] **Step 2 : Appliquer à la main** (SQL collé dans le SQL Editor du projet ERP).
- [ ] **Step 3 : Vérifier (à coller à la suite dans le SQL Editor)**

```sql
select
  (select count(*) from pg_proc where proname in ('admin_create_document','admin_update_document','admin_delete_document')) as fns,
  (select count(*) from information_schema.views where table_schema='public' and table_name='propulspace_documents_admin_v2') as adminview;
```
Expected: `fns = 3`, `adminview = 1`.

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/20260603111000_propulspace_281_admin_document_rpcs.sql
git commit -m "feat(propulspace-admin): RPC GED + vue admin documents — migration 281"
```

---

## Task 9 : Étendre `AdminRpcMap` (Documents)

**Files:**
- Modify: `src/modules/EspaceClient/admin/lib/adminRpc.ts`

- [ ] **Step 1 : Ajouter les entrées documents dans `AdminRpcMap`** (après les entrées jalons)

```ts
  admin_create_document: {
    args: {
      p_project_id: string;
      p_document_type: string;
      p_name: string;
      p_file_url: string;
      p_file_size_bytes?: number | null;
      p_file_mime_type?: string | null;
      p_category?: string | null;
      p_description?: string | null;
      p_visible_to_client?: boolean;
    };
    returns: string;            // document id (uuid)
  };
  admin_update_document: {
    args: {
      p_document_id: string;
      p_name?: string | null;
      p_category?: string | null;
      p_description?: string | null;
      p_visible_to_client?: boolean | null;
    };
    returns: null;
  };
  admin_delete_document: {
    args: { p_document_id: string };
    returns: null;
  };
```

- [ ] **Step 2 : Build** — `npm run build` → 0 erreur TS.
- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/lib/adminRpc.ts
git commit -m "feat(propulspace-admin): typage AdminRpcMap pour les RPC documents"
```

---

## Task 10 : Hook `useAdminDocuments`

**Files:**
- Create: `src/modules/EspaceClient/admin/hooks/useAdminDocuments.ts`

- [ ] **Step 1 : Écrire le hook** (upload Storage → RPC create ; lit la vue admin)

```ts
import { useCallback, useEffect, useState } from 'react';
import { v2, supabase } from '@/lib/supabase';
import { adminRpc } from '../lib/adminRpc';
import { getAdminSignedUrl } from '../lib/adminStorage';
import type { PortalDocument } from '@/modules/EspaceClient/client/hooks/usePortalData';

const BUCKET = 'propulspace-documents';

export interface UploadDocumentInput {
  file: File;
  documentType: string;
  name: string;
  description?: string | null;
  category?: string | null;
  visibleToClient: boolean;
}

export interface UpdateDocumentPatch {
  name?: string;
  category?: string | null;
  description?: string | null;
  visibleToClient?: boolean;
}

interface UseAdminDocumentsResult {
  documents: PortalDocument[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  uploadDocument: (input: UploadDocumentInput) => Promise<{ error: string | null }>;
  updateDocument: (id: string, patch: UpdateDocumentPatch) => Promise<{ error: string | null }>;
  deleteDocument: (id: string) => Promise<{ error: string | null }>;
  downloadDocument: (doc: PortalDocument) => Promise<void>;
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function useAdminDocuments(projectId: string): UseAdminDocumentsResult {
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await v2.from('propulspace_documents_admin')
      .select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (err) { setError(err.message); setDocuments([]); }
    else { setError(null); setDocuments((data ?? []) as unknown as PortalDocument[]); }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const uploadDocument = useCallback<UseAdminDocumentsResult['uploadDocument']>(async (input) => {
    const path = `${projectId}/documents/${crypto.randomUUID()}-${safeName(input.file.name)}`;
    const up = await supabase.storage.from(BUCKET).upload(path, input.file, {
      contentType: input.file.type || undefined, upsert: false,
    });
    if (up.error) return { error: up.error.message };
    const { error: err } = await adminRpc('admin_create_document', {
      p_project_id: projectId,
      p_document_type: input.documentType,
      p_name: input.name,
      p_file_url: path,
      p_file_size_bytes: input.file.size,
      p_file_mime_type: input.file.type || null,
      p_category: input.category ?? null,
      p_description: input.description ?? null,
      p_visible_to_client: input.visibleToClient,
    });
    if (err) {
      // rollback du fichier orphelin si l'insert RPC échoue
      await supabase.storage.from(BUCKET).remove([path]).catch(() => undefined);
      return { error: err.message };
    }
    await refresh();
    return { error: null };
  }, [projectId, refresh]);

  const updateDocument = useCallback<UseAdminDocumentsResult['updateDocument']>(async (id, patch) => {
    const { error: err } = await adminRpc('admin_update_document', {
      p_document_id: id,
      p_name: patch.name ?? null,
      p_category: patch.category ?? null,
      p_description: patch.description ?? null,
      p_visible_to_client: patch.visibleToClient ?? null,
    });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  const deleteDocument = useCallback<UseAdminDocumentsResult['deleteDocument']>(async (id) => {
    const { error: err } = await adminRpc('admin_delete_document', { p_document_id: id });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  const downloadDocument = useCallback<UseAdminDocumentsResult['downloadDocument']>(async (doc) => {
    const url = await getAdminSignedUrl(BUCKET, doc.file_url);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return { documents, loading, error, refresh, uploadDocument, updateDocument, deleteDocument, downloadDocument };
}
```

- [ ] **Step 2 : Build** — `npm run build` → 0 erreur TS.
- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/hooks/useAdminDocuments.ts
git commit -m "feat(propulspace-admin): hook useAdminDocuments (upload Storage + RPC)"
```

---

## Task 11 : Formulaires Documents (`AdminDocumentUpload` + `AdminDocumentEditDialog`)

**Files:**
- Create: `src/modules/EspaceClient/admin/components/AdminDocumentUpload.tsx`
- Create: `src/modules/EspaceClient/admin/components/AdminDocumentEditDialog.tsx`

- [ ] **Step 1 : Écrire `AdminDocumentUpload.tsx`**

```tsx
import { useEffect, useState, type ChangeEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UploadDocumentInput } from '../hooks/useAdminDocuments';

export const DOC_TYPES: Array<{ value: string; label: string }> = [
  { value: 'quote', label: 'Devis' }, { value: 'contract', label: 'Contrat' },
  { value: 'invoice', label: 'Facture' }, { value: 'deliverable', label: 'Livrable' },
  { value: 'audit', label: 'Audit' }, { value: 'report', label: 'Rapport' },
  { value: 'asset_logo', label: 'Logo' }, { value: 'asset_charter', label: 'Charte' },
  { value: 'asset_content', label: 'Contenu' }, { value: 'asset_access', label: 'Accès' },
  { value: 'legal', label: 'Légal' }, { value: 'other', label: 'Autre' },
];

const SELECT_CLASS = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: UploadDocumentInput) => Promise<{ error: string | null }>;
}

export function AdminDocumentUpload({ open, onOpenChange, onSubmit }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('deliverable');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visible, setVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFile(null); setDocumentType('deliverable'); setName(''); setDescription(''); setVisible(true); setFormError(null);
  }, [open]);

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && !name) setName(f.name);
  }

  async function handleSubmit() {
    if (!file) { setFormError('Sélectionnez un fichier.'); return; }
    if (!name.trim()) { setFormError('Le nom est requis.'); return; }
    setSubmitting(true); setFormError(null);
    const { error } = await onSubmit({
      file, documentType, name: name.trim(),
      description: description.trim() || null, visibleToClient: visible,
    });
    setSubmitting(false);
    if (error) { setFormError(error); return; }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Ajouter un document</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Fichier</Label><Input type="file" onChange={onFileChange} /></div>
          <div><Label>Nom</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div>
            <Label>Type</Label>
            <select className={SELECT_CLASS} value={documentType} onChange={e => setDocumentType(e.target.value)}>
              {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div><Label>Description (optionnel)</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} /> Visible par le client
          </label>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Téléverser
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2 : Écrire `AdminDocumentEditDialog.tsx`** (rename / description / catégorie)

```tsx
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UpdateDocumentPatch } from '../hooks/useAdminDocuments';
import type { PortalDocument } from '@/modules/EspaceClient/client/hooks/usePortalData';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: PortalDocument | null;
  onSubmit: (patch: UpdateDocumentPatch) => Promise<{ error: string | null }>;
}

export function AdminDocumentEditDialog({ open, onOpenChange, doc, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(doc?.name ?? '');
    setCategory(doc?.category ?? '');
    setDescription(doc?.description ?? '');
    setFormError(null);
  }, [open, doc]);

  async function handleSubmit() {
    if (!name.trim()) { setFormError('Le nom est requis.'); return; }
    setSubmitting(true); setFormError(null);
    const { error } = await onSubmit({
      name: name.trim(),
      category: category.trim() || null,
      description: description.trim() || null,
    });
    setSubmitting(false);
    if (error) { setFormError(error); return; }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Modifier le document</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nom</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label>Catégorie (optionnel)</Label><Input value={category} onChange={e => setCategory(e.target.value)} /></div>
          <div><Label>Description (optionnel)</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3 : Build** — `npm run build` → 0 erreur TS.
- [ ] **Step 4 : Commit**

```bash
git add src/modules/EspaceClient/admin/components/AdminDocumentUpload.tsx src/modules/EspaceClient/admin/components/AdminDocumentEditDialog.tsx
git commit -m "feat(propulspace-admin): formulaires upload + édition document"
```

---

## Task 12 : Onglet `DocumentsTab`

**Files:**
- Create: `src/modules/EspaceClient/admin/components/DocumentsTab.tsx`

- [ ] **Step 1 : Écrire l'onglet**

```tsx
import { useMemo, useState } from 'react';
import { Plus, Download, Eye, EyeOff, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileIcon } from '@/modules/EspaceClient/shared/components';
import { AdminTabScaffold } from './AdminTabScaffold';
import { AdminDocumentUpload } from './AdminDocumentUpload';
import { AdminDocumentEditDialog } from './AdminDocumentEditDialog';
import { useAdminDocuments } from '../hooks/useAdminDocuments';
import type { PortalDocument } from '@/modules/EspaceClient/client/hooks/usePortalData';

const FILTERS: Array<{ label: string; types: string[] | null }> = [
  { label: 'Tous', types: null },
  { label: 'Contrats', types: ['quote', 'contract', 'legal'] },
  { label: 'Factures', types: ['invoice'] },
  { label: 'Livrables', types: ['deliverable', 'audit', 'report'] },
  { label: 'Assets', types: ['asset_logo', 'asset_charter', 'asset_content', 'asset_access'] },
];

const formatSize = (b: number | null) =>
  b == null ? '' : b < 1024 ? `${b} o` : b < 1048576 ? `${(b / 1024).toFixed(0)} Ko` : `${(b / 1048576).toFixed(1)} Mo`;

export function DocumentsTab({ projectId }: { projectId: string }) {
  const { documents, loading, error, uploadDocument, updateDocument, deleteDocument, downloadDocument } = useAdminDocuments(projectId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<PortalDocument | null>(null);
  const [filter, setFilter] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const types = FILTERS[filter].types;
    return types ? documents.filter(d => types.includes(d.document_type)) : documents;
  }, [documents, filter]);

  async function onToggle(doc: PortalDocument) {
    setBusyId(doc.id); setActionError(null);
    const { error } = await updateDocument(doc.id, { visibleToClient: !doc.visible_to_client });
    if (error) setActionError(error);
    setBusyId(null);
  }
  async function onDelete(doc: PortalDocument) {
    if (!window.confirm(`Supprimer le document « ${doc.name} » ?`)) return;
    setBusyId(doc.id); setActionError(null);
    const { error } = await deleteDocument(doc.id);
    if (error) setActionError(error);
    setBusyId(null);
  }

  return (
    <>
      <AdminTabScaffold
        title={`${documents.length} document${documents.length > 1 ? 's' : ''}`}
        action={{ label: 'Ajouter un document', icon: Plus, onClick: () => setUploadOpen(true) }}
        loading={loading} error={error} actionError={actionError}
        isEmpty={documents.length === 0} emptyIcon={FolderOpen} emptyTitle="Aucun document" emptyBody="Téléversez le premier document du projet."
      >
        <div className="space-y-3">
          <div className="flex gap-1.5">
            {FILTERS.map((f, i) => (
              <button key={f.label} type="button" onClick={() => setFilter(i)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${filter === i ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <ul className="divide-y divide-gray-100">
            {filtered.map(doc => (
              <li key={doc.id} className="flex items-center gap-3 py-3">
                <FileIcon mime={doc.file_mime_type ?? undefined} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-500">{formatSize(doc.file_size_bytes)}{doc.version > 1 ? ` · v${doc.version}` : ''}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${doc.visible_to_client ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                  {doc.visible_to_client ? 'Visible client' : 'Masqué'}
                </span>
                <Button variant="ghost" size="icon" title="Télécharger" onClick={() => void downloadDocument(doc)}><Download className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title={doc.visible_to_client ? 'Masquer au client' : 'Rendre visible'} disabled={busyId === doc.id} onClick={() => onToggle(doc)}>
                  {doc.visible_to_client ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" title="Modifier" onClick={() => setEditing(doc)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Supprimer" disabled={busyId === doc.id} onClick={() => onDelete(doc)}><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        </div>
      </AdminTabScaffold>
      <AdminDocumentUpload open={uploadOpen} onOpenChange={setUploadOpen} onSubmit={uploadDocument} />
      <AdminDocumentEditDialog
        open={editing !== null}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        doc={editing}
        onSubmit={(patch) => editing ? updateDocument(editing.id, patch) : Promise.resolve({ error: null })}
      />
    </>
  );
}
```

- [ ] **Step 2 : Build** — `npm run build` → 0 erreur TS.
- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/components/DocumentsTab.tsx
git commit -m "feat(propulspace-admin): onglet Documents (upload, filtres, visibilité, édition, suppression)"
```

---

## Task 13 : Brancher la route Documents

**Files:**
- Modify: `src/modules/EspaceClient/admin/pages/AdminClientPanel.tsx`

- [ ] **Step 1 : Import** (après l'import `ProjectStepsTab`)

```tsx
import { DocumentsTab } from '../components/DocumentsTab';
```

- [ ] **Step 2 : Wrapper** (après `JalonsRoute`)

```tsx
function DocumentsRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) return null;
  return <DocumentsTab projectId={projectId} />;
}
```

- [ ] **Step 3 : Route** — remplacer
```tsx
        <Route path="documents" element={<TabPlaceholder name="Documents" />} />
```
par
```tsx
        <Route path="documents" element={<DocumentsRoute />} />
```

- [ ] **Step 4 : Build** — `npm run build` → 0 erreur TS.

- [ ] **Step 5 : Vérif runtime** — naviguer vers `.../documents`. Téléverser un PDF, le marquer visible/masqué, le télécharger, le modifier, le supprimer. Vérifier qu'un doc supprimé disparaît de la liste. 0 erreur console.

- [ ] **Step 6 : Commit**

```bash
git add src/modules/EspaceClient/admin/pages/AdminClientPanel.tsx
git commit -m "feat(propulspace-admin): brancher l'onglet Documents sur la route"
```

---

## Task 14 : Migration 282 — RPC `admin_get_audit_log`

**Files:**
- Create: `supabase/migrations/20260603112000_propulspace_282_admin_get_audit_log.sql`

- [ ] **Step 1 : Écrire la migration**

```sql
-- propulspace 282 — RPC admin: lecture du journal d'audit.
-- audit_log n'est JAMAIS exposé à PostgREST (pas de vue _v2). Lecture admin-only
-- via cette RPC. Résout l'auteur via public.users (email), 'Client' si non interne.
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor). Ne pas rejouer si déjà passée.

create or replace function public.admin_get_audit_log(
  p_project_id    uuid,
  p_limit         int  default 100,
  p_offset        int  default 0,
  p_resource_type text default null
) returns table (
  id            uuid,
  created_at    timestamptz,
  action        text,
  resource_type text,
  resource_id   uuid,
  actor_label   text,
  diff          jsonb
)
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  return query
    select
      al.id, al.created_at, al.action, al.resource_type, al.resource_id,
      coalesce(u.email, case when al.user_id is null then 'Client' else 'Système' end) as actor_label,
      al.diff
    from propulspace.audit_log al
    left join public.users u on u.id = al.user_id
    where al.project_id = p_project_id
      and (p_resource_type is null or al.resource_type = p_resource_type)
    order by al.created_at desc
    limit greatest(coalesce(p_limit, 100), 1)
    offset greatest(coalesce(p_offset, 0), 0);
end; $$;

revoke all on function public.admin_get_audit_log(uuid,int,int,text) from public, anon;
grant execute on function public.admin_get_audit_log(uuid,int,int,text) to authenticated;
```

- [ ] **Step 2 : Appliquer à la main** (SQL collé dans le SQL Editor du projet ERP).
- [ ] **Step 3 : Vérifier (à coller à la suite dans le SQL Editor)**

```sql
select count(*) as fn from pg_proc where proname = 'admin_get_audit_log';
```
Expected: `fn = 1`.

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/20260603112000_propulspace_282_admin_get_audit_log.sql
git commit -m "feat(propulspace-admin): RPC admin_get_audit_log — migration 282"
```

---

## Task 15 : Étendre `AdminRpcMap` + type `AuditLogRow`

**Files:**
- Modify: `src/modules/EspaceClient/admin/lib/adminRpc.ts`

- [ ] **Step 1 : Ajouter le type exporté `AuditLogRow`** en tête de fichier (après l'import) :

```ts
export interface AuditLogRow {
  id: string;
  created_at: string;
  action: 'insert' | 'update' | 'delete';
  resource_type: string;
  resource_id: string | null;
  actor_label: string;
  diff: { before?: Record<string, unknown>; after?: Record<string, unknown> } | null;
}
```

- [ ] **Step 2 : Ajouter l'entrée RPC** dans `AdminRpcMap` (après les entrées documents) :

```ts
  admin_get_audit_log: {
    args: {
      p_project_id: string;
      p_limit?: number;
      p_offset?: number;
      p_resource_type?: string | null;
    };
    returns: AuditLogRow[];
  };
```

- [ ] **Step 3 : Build** — `npm run build` → 0 erreur TS.
- [ ] **Step 4 : Commit**

```bash
git add src/modules/EspaceClient/admin/lib/adminRpc.ts
git commit -m "feat(propulspace-admin): typage AdminRpcMap + AuditLogRow pour l'audit"
```

---

## Task 16 : Hook `useAdminAuditLog`

**Files:**
- Create: `src/modules/EspaceClient/admin/hooks/useAdminAuditLog.ts`

- [ ] **Step 1 : Écrire le hook** (pagination + filtre par type de ressource)

```ts
import { useCallback, useEffect, useState } from 'react';
import { adminRpc, type AuditLogRow } from '../lib/adminRpc';

const PAGE = 100;

interface UseAdminAuditLogResult {
  rows: AuditLogRow[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  resourceType: string | null;
  setResourceType: (t: string | null) => void;
  loadMore: () => Promise<void>;
}

export function useAdminAuditLog(projectId: string): UseAdminAuditLogResult {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [resourceType, setResourceType] = useState<string | null>(null);

  const fetchPage = useCallback(async (offset: number, type: string | null) => {
    setLoading(true);
    const { data, error: err } = await adminRpc('admin_get_audit_log', {
      p_project_id: projectId, p_limit: PAGE, p_offset: offset, p_resource_type: type,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setError(null);
    const page = (Array.isArray(data) ? data : []) as AuditLogRow[];
    setHasMore(page.length === PAGE);
    setRows(prev => offset === 0 ? page : [...prev, ...page]);
    setLoading(false);
  }, [projectId]);

  // Recharge depuis 0 au montage et à chaque changement de filtre/projet.
  useEffect(() => { void fetchPage(0, resourceType); }, [fetchPage, resourceType]);

  const loadMore = useCallback(async () => {
    await fetchPage(rows.length, resourceType);
  }, [fetchPage, rows.length, resourceType]);

  return { rows, loading, error, hasMore, resourceType, setResourceType, loadMore };
}
```

- [ ] **Step 2 : Build** — `npm run build` → 0 erreur TS.
- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/hooks/useAdminAuditLog.ts
git commit -m "feat(propulspace-admin): hook useAdminAuditLog (pagination + filtre)"
```

---

## Task 17 : Onglet `ActivityTab`

**Files:**
- Create: `src/modules/EspaceClient/admin/components/ActivityTab.tsx`

- [ ] **Step 1 : Écrire l'onglet** (filtre toujours visible, gère son propre état vide)

```tsx
import { useState } from 'react';
import { Activity, FileText, Receipt, PenLine, ChevronDown, type LucideIcon } from 'lucide-react';
import { ActivityRow, type BadgeTone } from '@/modules/EspaceClient/shared/components';
import { AdminTabScaffold } from './AdminTabScaffold';
import { useAdminAuditLog } from '../hooks/useAdminAuditLog';
import type { AuditLogRow } from '../lib/adminRpc';

const FILTERS: Array<{ label: string; value: string | null }> = [
  { label: 'Tous', value: null },
  { label: 'Documents', value: 'propulspace.documents' },
  { label: 'Factures', value: 'propulspace.invoices' },
  { label: 'Signatures', value: 'propulspace.signatures' },
];

const RESOURCE_META: Record<string, { icon: LucideIcon; tint: BadgeTone; noun: string }> = {
  'propulspace.documents':  { icon: FileText, tint: 'violet', noun: 'Document' },
  'propulspace.invoices':   { icon: Receipt,  tint: 'blue',   noun: 'Facture' },
  'propulspace.signatures': { icon: PenLine,  tint: 'amber',  noun: 'Signature' },
};
const ACTION_VERB: Record<string, string> = { insert: 'ajouté', update: 'modifié', delete: 'supprimé' };

function rowName(r: AuditLogRow): string {
  const snap = r.diff?.after ?? r.diff?.before;
  const value = snap ? (snap['name'] ?? snap['invoice_number']) : undefined;
  return typeof value === 'string' ? value : '';
}
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export function ActivityTab({ projectId }: { projectId: string }) {
  const { rows, loading, error, hasMore, resourceType, setResourceType, loadMore } = useAdminAuditLog(projectId);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <AdminTabScaffold
      title="Activité"
      loading={loading && rows.length === 0}
      error={error}
      isEmpty={false}
      emptyIcon={Activity}
      emptyTitle="Aucune activité"
    >
      <div className="space-y-3">
        <div className="flex gap-1.5">
          {FILTERS.map(f => (
            <button key={f.label} type="button" onClick={() => setResourceType(f.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${resourceType === f.value ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {f.label}
            </button>
          ))}
        </div>
        {!loading && rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Aucune activité pour ce filtre.</p>
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {rows.map(r => {
              const meta = RESOURCE_META[r.resource_type] ?? { icon: Activity, tint: 'gray' as BadgeTone, noun: r.resource_type };
              const name = rowName(r);
              const title = `${meta.noun} ${ACTION_VERB[r.action] ?? r.action}${name ? ` : ${name}` : ''}`;
              return (
                <li key={r.id}>
                  <ActivityRow
                    icon={meta.icon}
                    tint={meta.tint}
                    title={title}
                    meta={`${r.actor_label} · ${formatDateTime(r.created_at)}`}
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  />
                  {expanded === r.id && r.diff && (
                    <pre className="overflow-x-auto bg-gray-50 px-6 py-3 text-[11px] leading-relaxed text-gray-600">
                      {JSON.stringify(r.diff, null, 2)}
                    </pre>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {hasMore && (
          <button type="button" onClick={() => void loadMore()} className="mx-auto flex items-center gap-1 text-sm text-violet-700 hover:underline">
            <ChevronDown className="h-4 w-4" /> Charger plus
          </button>
        )}
      </div>
    </AdminTabScaffold>
  );
}
```

- [ ] **Step 2 : Build** — `npm run build` → 0 erreur TS.
- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/components/ActivityTab.tsx
git commit -m "feat(propulspace-admin): onglet Activité (journal d'audit + filtre + détail diff)"
```

---

## Task 18 : Brancher la route Activité

**Files:**
- Modify: `src/modules/EspaceClient/admin/pages/AdminClientPanel.tsx`

- [ ] **Step 1 : Import** (après l'import `DocumentsTab`)

```tsx
import { ActivityTab } from '../components/ActivityTab';
```

- [ ] **Step 2 : Wrapper** (après `DocumentsRoute`)

```tsx
function ActiviteRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) return null;
  return <ActivityTab projectId={projectId} />;
}
```

- [ ] **Step 3 : Route** — remplacer
```tsx
        <Route path="activite" element={<TabPlaceholder name="Activité" />} />
```
par
```tsx
        <Route path="activite" element={<ActiviteRoute />} />
```

- [ ] **Step 4 : Build** — `npm run build` → 0 erreur TS.

- [ ] **Step 5 : Vérif runtime** — naviguer vers `.../activite`. Vérifier que les actions faites dans Documents/Jalons (les docs ont un trigger d'audit ; les jalons NON → seules documents/factures/signatures apparaissent) sont listées, que les filtres marchent, que « Voir le détail » déplie le diff, et que « Charger plus » apparaît si > 100 entrées. 0 erreur console.

- [ ] **Step 6 : Commit**

```bash
git add src/modules/EspaceClient/admin/pages/AdminClientPanel.tsx
git commit -m "feat(propulspace-admin): brancher l'onglet Activité sur la route"
```

---

## Task 19 : Migration 283 — RPC `admin_cancel_signature`

**Files:**
- Create: `supabase/migrations/20260603113000_propulspace_283_admin_signature_rpcs.sql`

- [ ] **Step 1 : Écrire la migration**

```sql
-- propulspace 283 — RPC admin: annulation de signature.
-- La CRÉATION passe par l'edge fn admin-docuseal-create-submission (DocuSeal API) ;
-- la synchro signed/declined/expired arrive par l'edge fn docuseal-webhook.
-- Ici : annuler une signature ENCORE en attente. Une signature signée est permanente.
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor). Ne pas rejouer si déjà passée.

create or replace function public.admin_cancel_signature(
  p_signature_id uuid,
  p_reason       text default null
) returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_status text;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  select status into v_status from propulspace.signatures where id = p_signature_id;
  if v_status is null then raise exception 'signature not found' using errcode='P0002'; end if;
  if v_status <> 'pending' then
    raise exception 'signature not cancellable (status=%)', v_status using errcode='42501';
  end if;
  update propulspace.signatures
     set status = 'cancelled', declined_at = now(), decline_reason = p_reason, updated_at = now()
   where id = p_signature_id;
end; $$;

revoke all on function public.admin_cancel_signature(uuid,text) from public, anon;
grant execute on function public.admin_cancel_signature(uuid,text) to authenticated;
```

- [ ] **Step 2 : Appliquer à la main** (SQL collé dans le SQL Editor du projet ERP).
- [ ] **Step 3 : Vérifier (à coller à la suite dans le SQL Editor)**

```sql
select count(*) as fn from pg_proc where proname = 'admin_cancel_signature';
```
Expected: `fn = 1`.

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/20260603113000_propulspace_283_admin_signature_rpcs.sql
git commit -m "feat(propulspace-admin): RPC admin_cancel_signature — migration 283"
```

---

## Task 20 : Edge fn DocuSeal — probe + dégradation gracieuse

**Files:**
- Modify: `supabase/functions/admin-docuseal-create-submission/index.ts`

- [ ] **Step 1 : Ajouter `probe?` au type body**

Remplacer l'interface `CreateSubmissionBody` par :
```ts
interface CreateSubmissionBody {
  probe?: boolean                 // si true → renvoie juste { configured } sans rien créer
  project_id: string
  template_id: string
  name: string
  signature_type: 'quote' | 'contract' | 'addendum' | 'other'
  signer_email: string
  signer_name?: string
  send_email?: boolean
}
```

- [ ] **Step 2 : Restructurer le handler `serve(...)`**

Remplacer le début du handler — du `serve(async (req) => {` jusqu'à la ligne de validation des paramètres incluse — par :

```ts
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Méthode non autorisée' }, 405)

  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard
  const { admin, callerId } = guard

  let body: CreateSubmissionBody
  try { body = await req.json() } catch { return jsonResponse({ error: 'Body JSON invalide' }, 400) }

  const apiKey = Deno.env.get('DOCUSEAL_API_KEY')

  // Probe : l'UI admin demande si DocuSeal est configuré (grise le bouton sinon).
  if (body?.probe === true) return jsonResponse({ configured: Boolean(apiKey) }, 200)

  // Dégradation gracieuse : pas de clé → 200 structuré (au lieu d'un 500 opaque).
  if (!apiKey) return jsonResponse({ ok: false, reason: 'not_configured' }, 200)

  if (!body?.project_id || !body.template_id || !body.name || !body.signer_email || !body.signature_type) {
    return jsonResponse({ error: 'Paramètres manquants' }, 400)
  }
  if (!['quote', 'contract', 'addendum', 'other'].includes(body.signature_type)) {
    return jsonResponse({ error: 'signature_type invalide' }, 400)
  }
```

> Note : la déclaration `const apiKey = ...` et le `if (!apiKey) return 500` qui figuraient AVANT `requireAdmin` dans la version actuelle sont supprimés (remplacés par le bloc ci-dessus). Le reste du handler (appel `createDocusealSubmission`, insert `signatures`, email Brevo, réponse finale) est inchangé.

- [ ] **Step 3 : Déployer l'edge fn (manuel)**

L'utilisateur déploie `admin-docuseal-create-submission` sur le projet ERP, soit via le Dashboard Supabase (Edge Functions), soit via la CLI : `supabase functions deploy admin-docuseal-create-submission --project-ref tbuqctfgjjxnevmsvucl`.
Expected: déploiement réussi. (Sans `DOCUSEAL_API_KEY` en prod, la fonction reste en mode dégradé — c'est voulu.)

- [ ] **Step 4 : Commit**

```bash
git add supabase/functions/admin-docuseal-create-submission/index.ts
git commit -m "feat(propulspace-admin): edge DocuSeal — mode probe + dégradation gracieuse not_configured"
```

---

## Task 21 : Étendre `AdminRpcMap` (Signatures)

**Files:**
- Modify: `src/modules/EspaceClient/admin/lib/adminRpc.ts`

- [ ] **Step 1 : Ajouter l'entrée** dans `AdminRpcMap` (après l'entrée `admin_get_audit_log`)

```ts
  admin_cancel_signature: {
    args: { p_signature_id: string; p_reason?: string | null };
    returns: null;
  };
```

- [ ] **Step 2 : Build** — `npm run build` → 0 erreur TS.
- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/lib/adminRpc.ts
git commit -m "feat(propulspace-admin): typage AdminRpcMap pour admin_cancel_signature"
```

---

## Task 22 : Hook `useAdminSignatures`

**Files:**
- Create: `src/modules/EspaceClient/admin/hooks/useAdminSignatures.ts`

- [ ] **Step 1 : Écrire le hook** (lecture + probe createEnabled + create via edge fn + relance email + annulation)

```ts
import { useCallback, useEffect, useState } from 'react';
import { v2, supabase } from '@/lib/supabase';
import { adminRpc } from '../lib/adminRpc';
import type { PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData';

export interface CreateSignatureInput {
  name: string;
  signatureType: string;          // 'quote' | 'contract' | 'addendum' | 'other'
  signerEmail: string;
  signerName?: string;
  templateId: string;
}

interface UseAdminSignaturesResult {
  signatures: PortalSignature[];
  loading: boolean;
  error: string | null;
  createEnabled: boolean;
  refresh: () => Promise<void>;
  createSignature: (input: CreateSignatureInput) => Promise<{ error: string | null }>;
  remindSignature: (sig: PortalSignature, clientEmail: string | null) => Promise<{ error: string | null }>;
  cancelSignature: (sig: PortalSignature) => Promise<{ error: string | null }>;
}

export function useAdminSignatures(projectId: string): UseAdminSignaturesResult {
  const [signatures, setSignatures] = useState<PortalSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createEnabled, setCreateEnabled] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await v2.from('propulspace_signatures')
      .select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (err) { setError(err.message); setSignatures([]); }
    else { setError(null); setSignatures((data ?? []) as unknown as PortalSignature[]); }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Probe DocuSeal au montage → grise le bouton de création si non configuré.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await supabase.functions
        .invoke('admin-docuseal-create-submission', { body: { probe: true } })
        .catch(() => ({ data: null }));
      const configured = Boolean((res.data as { configured?: boolean } | null)?.configured);
      if (!cancelled) setCreateEnabled(configured);
    })();
    return () => { cancelled = true; };
  }, []);

  const createSignature = useCallback<UseAdminSignaturesResult['createSignature']>(async (input) => {
    const { data, error: err } = await supabase.functions.invoke('admin-docuseal-create-submission', {
      body: {
        project_id: projectId,
        template_id: input.templateId,
        name: input.name,
        signature_type: input.signatureType,
        signer_email: input.signerEmail,
        signer_name: input.signerName,
      },
    });
    if (err) return { error: err.message ?? 'Échec de la création' };
    const res = data as { ok?: boolean; reason?: string } | null;
    if (res && res.ok === false) {
      return { error: res.reason === 'not_configured' ? "DocuSeal n'est pas encore configuré." : 'Création impossible.' };
    }
    await refresh();
    return { error: null };
  }, [projectId, refresh]);

  const remindSignature = useCallback<UseAdminSignaturesResult['remindSignature']>(async (sig, clientEmail) => {
    if (!clientEmail) return { error: "Pas d'email client" };
    if (!sig.docuseal_signing_url) return { error: 'Lien de signature indisponible' };
    const today = new Date().toISOString().slice(0, 10);
    const { error: err } = await supabase.functions.invoke('send-portal-email', {
      body: {
        template_key: 'signature-requested',
        to: { email: clientEmail },
        params: { doc_title: sig.name, doc_type: sig.signature_type, sign_url: sig.docuseal_signing_url },
        dedupe_key: `${sig.id}-reminder-${today}`,
      },
    });
    return { error: err ? (err.message ?? 'Échec') : null };
  }, []);

  const cancelSignature = useCallback<UseAdminSignaturesResult['cancelSignature']>(async (sig) => {
    const { error: err } = await adminRpc('admin_cancel_signature', { p_signature_id: sig.id });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  return { signatures, loading, error, createEnabled, refresh, createSignature, remindSignature, cancelSignature };
}
```

- [ ] **Step 2 : Build** — `npm run build` → 0 erreur TS.
- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/hooks/useAdminSignatures.ts
git commit -m "feat(propulspace-admin): hook useAdminSignatures (probe + create edge fn + relance + annulation)"
```

---

## Task 23 : Formulaire `AdminSignatureForm` + onglet `SignaturesTab` + route

**Files:**
- Create: `src/modules/EspaceClient/admin/components/AdminSignatureForm.tsx`
- Create: `src/modules/EspaceClient/admin/components/SignaturesTab.tsx`
- Modify: `src/modules/EspaceClient/admin/pages/AdminClientPanel.tsx`

- [ ] **Step 1 : Écrire `AdminSignatureForm.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreateSignatureInput } from '../hooks/useAdminSignatures';

const TYPES: Array<{ value: string; label: string }> = [
  { value: 'quote', label: 'Devis' },
  { value: 'contract', label: 'Contrat' },
  { value: 'addendum', label: 'Avenant' },
  { value: 'other', label: 'Autre' },
];

const SELECT_CLASS = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail: string | null;
  onSubmit: (input: CreateSignatureInput) => Promise<{ error: string | null }>;
}

export function AdminSignatureForm({ open, onOpenChange, defaultEmail, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [signatureType, setSignatureType] = useState('contract');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerName, setSignerName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(''); setSignatureType('contract'); setSignerEmail(defaultEmail ?? '');
    setSignerName(''); setTemplateId(''); setFormError(null);
  }, [open, defaultEmail]);

  async function handleSubmit() {
    if (!name.trim()) { setFormError('Le nom du document est requis.'); return; }
    if (!signerEmail.trim()) { setFormError("L'email du signataire est requis."); return; }
    if (!templateId.trim()) { setFormError('Le template DocuSeal est requis.'); return; }
    setSubmitting(true); setFormError(null);
    const { error } = await onSubmit({
      name: name.trim(), signatureType, signerEmail: signerEmail.trim(),
      signerName: signerName.trim() || undefined, templateId: templateId.trim(),
    });
    setSubmitting(false);
    if (error) { setFormError(error); return; }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nouvelle signature</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nom du document</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex. Contrat de prestation 2026" /></div>
          <div>
            <Label>Type</Label>
            <select className={SELECT_CLASS} value={signatureType} onChange={e => setSignatureType(e.target.value)}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div><Label>Email du signataire</Label><Input type="email" value={signerEmail} onChange={e => setSignerEmail(e.target.value)} /></div>
          <div><Label>Nom du signataire (optionnel)</Label><Input value={signerName} onChange={e => setSignerName(e.target.value)} /></div>
          <div><Label>Template DocuSeal (ID)</Label><Input value={templateId} onChange={e => setTemplateId(e.target.value)} placeholder="Ex. 12345" /></div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Envoyer à signer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2 : Écrire `SignaturesTab.tsx`**

```tsx
import { useState } from 'react';
import { Plus, Bell, X, FileDown, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/modules/EspaceClient/shared/components';
import { AdminTabScaffold } from './AdminTabScaffold';
import { AdminSignatureForm } from './AdminSignatureForm';
import { useAdminSignatures } from '../hooks/useAdminSignatures';
import type { PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData';

const TYPE_LABEL: Record<string, string> = { quote: 'Devis', contract: 'Contrat', addendum: 'Avenant', other: 'Autre' };
const formatDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('fr-FR') : '';

export function SignaturesTab({ projectId, clientEmail }: { projectId: string; clientEmail: string | null }) {
  const { signatures, loading, error, createEnabled, createSignature, remindSignature, cancelSignature } = useAdminSignatures(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function onRemind(sig: PortalSignature) {
    setBusyId(sig.id); setActionError(null);
    const { error } = await remindSignature(sig, clientEmail);
    if (error) setActionError(error);
    setBusyId(null);
  }
  async function onCancel(sig: PortalSignature) {
    if (!window.confirm(`Annuler la signature « ${sig.name} » ?`)) return;
    setBusyId(sig.id); setActionError(null);
    const { error } = await cancelSignature(sig);
    if (error) setActionError(error);
    setBusyId(null);
  }

  return (
    <>
      <AdminTabScaffold
        title={`${signatures.length} signature${signatures.length > 1 ? 's' : ''}`}
        action={{
          label: 'Nouvelle signature', icon: Plus, onClick: () => setFormOpen(true),
          disabled: !createEnabled, disabledReason: 'DocuSeal non configuré',
        }}
        loading={loading} error={error} actionError={actionError}
        isEmpty={signatures.length === 0} emptyIcon={PenLine} emptyTitle="Aucune signature" emptyBody="Envoyez un document à signer au client."
      >
        <ul className="divide-y divide-gray-100">
          {signatures.map(sig => (
            <li key={sig.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{sig.name}<span className="ml-2 text-xs text-gray-400">{TYPE_LABEL[sig.signature_type] ?? sig.signature_type}</span></p>
                <p className="text-xs text-gray-500">
                  {sig.sent_at ? `Envoyé le ${formatDate(sig.sent_at)}` : ''}
                  {sig.signed_at ? ` · Signé le ${formatDate(sig.signed_at)}` : ''}
                </p>
              </div>
              <StatusBadge status={sig.status} />
              {sig.status === 'signed' && sig.docuseal_signed_pdf_url && (
                <Button variant="ghost" size="icon" title="PDF signé" onClick={() => window.open(sig.docuseal_signed_pdf_url!, '_blank', 'noopener,noreferrer')}><FileDown className="h-4 w-4" /></Button>
              )}
              {sig.status === 'pending' && (
                <>
                  <Button variant="outline" size="sm" disabled={busyId === sig.id || !clientEmail} onClick={() => onRemind(sig)}><Bell className="mr-1 h-4 w-4" />Relancer</Button>
                  <Button variant="ghost" size="icon" title="Annuler" disabled={busyId === sig.id} onClick={() => onCancel(sig)}><X className="h-4 w-4" /></Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </AdminTabScaffold>
      <AdminSignatureForm open={formOpen} onOpenChange={setFormOpen} defaultEmail={clientEmail} onSubmit={createSignature} />
    </>
  );
}
```

- [ ] **Step 3 : Brancher la route dans `AdminClientPanel.tsx`**

Ajouter l'import (après l'import `ActivityTab`) :
```tsx
import { SignaturesTab } from '../components/SignaturesTab';
```
Ajouter le wrapper (après `ActiviteRoute`) — Signatures a besoin de l'email client comme `InvoicesRoute` :
```tsx
function SignaturesRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  const email = useAdminClientEmail(projectId);
  if (!projectId) return null;
  return <SignaturesTab projectId={projectId} clientEmail={email} />;
}
```
Remplacer la route :
```tsx
        <Route path="signatures" element={<TabPlaceholder name="Signatures" />} />
```
par :
```tsx
        <Route path="signatures" element={<SignaturesRoute />} />
```

- [ ] **Step 4 : Supprimer le `TabPlaceholder` devenu inutilisé**

Les 4 routes étant désormais réelles, la fonction `TabPlaceholder` (lignes 7-9 de `AdminClientPanel.tsx`) n'est plus référencée. La supprimer pour éviter l'erreur TS `'TabPlaceholder' is declared but never used` (build strict).

- [ ] **Step 5 : Build** — `npm run build` → 0 erreur TS.

- [ ] **Step 6 : Vérif runtime** — naviguer vers `.../signatures`. Sans `DOCUSEAL_API_KEY` en prod, le bouton « Nouvelle signature » doit être **grisé** (tooltip « DocuSeal non configuré »). Les signatures existantes (s'il y en a) s'affichent avec leur statut. 0 erreur console.

- [ ] **Step 7 : Commit**

```bash
git add src/modules/EspaceClient/admin/components/AdminSignatureForm.tsx src/modules/EspaceClient/admin/components/SignaturesTab.tsx src/modules/EspaceClient/admin/pages/AdminClientPanel.tsx
git commit -m "feat(propulspace-admin): onglet Signatures (lecture + création grisée si DocuSeal off) + route"
```

---

## Task 24 : Script de test SQL rejouable + vérification E2E finale

**Files:**
- Create: `.planning/PROPULSPACE_ADMIN_TABS_TESTS.sql`

- [ ] **Step 1 : Écrire le script d'assertions** (joué via MCP `execute_sql` sur le projet ERP ; remplacer `:project_id` par un UUID de projet de test)

```sql
-- Tests RPC admin onglets Propul'Space (jalons/documents/audit/signatures).
-- À jouer en tant qu'admin (MCP execute_sql tourne en service_role → is_admin()
-- doit renvoyer true ; sinon adapter pour exécuter sous un JWT admin).
-- Remplacer <PROJECT_ID> par un projet de test réel.

-- 1. JALONS : create → update statut → reorder → delete
do $$
declare v_step uuid; v_cnt int;
begin
  v_step := public.admin_create_project_step('<PROJECT_ID>'::uuid, 'TEST jalon', null, 'upcoming', null, null, null, true);
  perform public.admin_update_project_step(v_step, null, 'in_progress', null, null, null, null, null);
  select count(*) into v_cnt from propulspace.project_steps where id = v_step and status = 'in_progress';
  assert v_cnt = 1, 'jalon update statut KO';
  perform public.admin_delete_project_step(v_step);
  select count(*) into v_cnt from propulspace.project_steps where id = v_step;
  assert v_cnt = 0, 'jalon delete KO';
  raise notice 'JALONS OK';
end $$;

-- 2. DOCUMENTS : create → update visibilité → soft-delete → absent de la vue admin
do $$
declare v_doc uuid; v_cnt int;
begin
  v_doc := public.admin_create_document('<PROJECT_ID>'::uuid, 'other', 'TEST doc', 'test/path.pdf', 100, 'application/pdf', null, null, true);
  perform public.admin_update_document(v_doc, null, null, null, false);
  select count(*) into v_cnt from propulspace.documents where id = v_doc and visible_to_client = false;
  assert v_cnt = 1, 'doc update visibilité KO';
  perform public.admin_delete_document(v_doc);
  select count(*) into v_cnt from public.propulspace_documents_admin_v2 where id = v_doc;
  assert v_cnt = 0, 'doc soft-delete absent de la vue admin KO';
  delete from propulspace.documents where id = v_doc;  -- cleanup dur du test
  raise notice 'DOCUMENTS OK';
end $$;

-- 3. AUDIT : la RPC renvoie des lignes pour le projet
do $$
declare v_cnt int;
begin
  select count(*) into v_cnt from public.admin_get_audit_log('<PROJECT_ID>'::uuid, 10, 0, null);
  raise notice 'AUDIT lignes renvoyées: %', v_cnt;  -- informatif (≥0)
end $$;

-- 4. SIGNATURE : annulation refusée si statut ≠ pending
do $$
declare v_sig uuid; v_err text;
begin
  insert into propulspace.signatures(project_id, signature_type, name, docuseal_submission_id, status, sent_at)
  values ('<PROJECT_ID>'::uuid, 'contract', 'TEST sig', 'test-sub-'||gen_random_uuid()::text, 'signed', now())
  returning id into v_sig;
  begin
    perform public.admin_cancel_signature(v_sig, 'test');
    assert false, 'cancel aurait dû échouer sur statut signed';
  exception when others then
    raise notice 'SIGNATURE cancel correctement refusé (signed)';
  end;
  delete from propulspace.signatures where id = v_sig;  -- cleanup
  raise notice 'SIGNATURES OK';
end $$;
```

- [ ] **Step 2 : Jouer le script à la main** (SQL Editor du projet ERP, substituer `<PROJECT_ID>`).
Expected: notices `JALONS OK`, `DOCUMENTS OK`, `AUDIT lignes renvoyées: N`, `SIGNATURE cancel correctement refusé`, `SIGNATURES OK`. Aucune assertion échouée.

- [ ] **Step 3 : Vérification E2E manuelle** (dev server) sur « Site vitrine Boulangerie Dupont » :
  1. Jalons : ajouter 2 étapes, réordonner (↑/↓), passer l'une à « Terminé » (date réelle auto), modifier, supprimer.
  2. Documents : téléverser un PDF, basculer visible/masqué, modifier le nom, télécharger, supprimer (disparaît).
  3. Activité : vérifier que les opérations docs (insert/update/delete) apparaissent, tester les filtres + « Voir le détail ».
  4. Signatures : confirmer le bouton grisé (DocuSeal off) et l'affichage des signatures existantes.
  Screenshots via Playwright MCP. 0 erreur console sur les 4 onglets.

- [ ] **Step 4 : Build final** — `npm run build` → 0 erreur TS.

- [ ] **Step 5 : Commit**

```bash
git add .planning/PROPULSPACE_ADMIN_TABS_TESTS.sql
git commit -m "test(propulspace-admin): script SQL rejouable des RPC des 4 onglets"
```

---

## Notes de mise en œuvre

- **Sélecteurs natifs `<select>`** : on utilise des `<select>` HTML stylés Tailwind (pas le `Select` shadcn) pour rester cohérent avec `AdminInvoiceForm` (qui mélange déjà inputs natifs) et éviter une dépendance non vérifiée.
- **Pas d'optimistic UI** : chaque mutation appelle `refresh()` après succès, comme `useAdminInvoices`.
- **Mode dégradé** : Signatures (création) dépend de `DOCUSEAL_API_KEY` + déploiement edge fn ; Documents/Jalons/Activité n'ont aucune dépendance externe.
- **Écart vs spec** : numérotation des migrations 280→283 réalignée sur l'ordre de build ; ajout de la vue `propulspace_documents_admin_v2` (non prévue dans la spec, justifiée par la non-exposition de `deleted_at` dans la vue client) ; `documentId` (lien document↔signature) non implémenté en V1 (l'edge fn DocuSeal ne le gère pas) → backlog.

## Couverture de la spec

| Exigence spec | Tâche(s) |
|---|---|
| Scaffold partagé `AdminTabScaffold` | 1 |
| Jalons (CRUD + statut + réordonnancement ↑/↓) | 2-7 |
| Documents (upload + visibilité + édition + soft-delete + filtres + download) | 8-13 |
| Activité (journal d'audit réel + filtre + détail diff + pagination) | 14-18 |
| Signatures (lecture + création grisée si DocuSeal off + relance + annulation) | 19-23 |
| RPC `admin_*` SECURITY DEFINER + GRANT/REVOKE | 2, 8, 14, 19 |
| Edge fn probe + dégradation gracieuse | 20 |
| Verrouillage (signature signée non annulable) | 19 |
| Vues admin (problème `deleted_at`) | 8 |
| Tests + vérif runtime | 24 |
```
