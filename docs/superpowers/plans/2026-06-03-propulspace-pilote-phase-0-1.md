# Propul'Space pilote — Phase 0 (Fondations admin) + squelette Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser le back-office `/admin/propulspace` (dashboard clients + coquille du panneau client à onglets) et livrer les migrations SQL de la phase Factures, pour que l'équipe pilote un client sans SQL manuel.

**Architecture:** Espace admin dédié sous `/admin/propulspace`, branché dans `PropulspaceAdminApp`. Lectures via les vues `public.propulspace_*_v2`/`projects_portal_health_v2` (l'admin voit tout via `is_admin()` dans le `WHERE` des vues). Écritures via nouvelles RPC `public.admin_*` `SECURITY DEFINER` (le schéma `propulspace` n'étant pas exposé à PostgREST). Réutilise les primitives UI `shared/` et le proxy `v2` de `@/lib/supabase`.

**Tech Stack:** React 18 + TS strict + Vite, React Router v6, Supabase JS (proxy `v2`), shadcn/ui + Tailwind, Playwright (E2E), PostgreSQL (migrations manuelles `propulspace_270+`).

**Spec source:** `docs/superpowers/specs/2026-06-03-propulspace-admin-pilote-design.md`
**Audit source:** `.planning/AUDIT_LANCEMENT_PROPULSPACE_2026-06-03.md`

---

## Conventions de ce plan

- **Migrations SQL** : je les écris en fichiers `supabase/migrations/<timestamp>_propulspace_NNN_*.sql`. **L'utilisateur les applique à la main** sur Supabase (pas d'accès MCP). Après application d'une migration qui ajoute une RPC, **régénérer les types** (`npx supabase gen types typescript ... > src/types/database.ts`) OU enregistrer la signature dans `src/modules/EspaceClient/admin/lib/adminRpc.ts` (wrapper typé, un seul point de cast — voir Task 5).
- **Pas de `any` dans le code feature** : le seul cast toléré est isolé dans le proxy `v2` existant et dans `adminRpc.ts`.
- **Gate par tâche** : `npm run build` (type-check Vite+tsc) doit passer ; les specs Playwright listées doivent être vertes ; vérif visuelle du parcours avant de cocher la dernière étape d'une phase.
- **Commits** : un par tâche, préfixe `feat(propulspace-admin):` / `chore:` / `test:`.

## File Structure — Phase 0

```
src/modules/EspaceClient/admin/
├── PropulspaceAdminApp.tsx              MODIFIER  — ajouter routes clients + panel
├── pages/
│   ├── AdminClientsPage.tsx             CRÉER     — dashboard liste portails (défaut)
│   └── AdminClientPanel.tsx             CRÉER     — coquille onglets (Aperçu/Factures/…)
├── components/
│   ├── ClientHealthRow.tsx             CRÉER     — ligne de la liste (statut/progression)
│   └── AdminClientTabs.tsx             CRÉER     — barre d'onglets du panel
├── hooks/
│   └── useAdminClients.ts              CRÉER     — lecture projects_portal_health_v2
└── lib/
    └── adminRpc.ts                     CRÉER     — wrapper typé des RPC admin (vide en P0, rempli en P1)
tests/e2e/
└── propulspace-admin.spec.ts           CRÉER     — E2E dashboard admin
```

---

## Task 0 : Étendre le routing admin

**Files:**
- Modify: `src/modules/EspaceClient/admin/PropulspaceAdminApp.tsx`

- [ ] **Step 1 : Remplacer le contenu du sous-router**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { PropulspaceAdminGuard } from './PropulspaceAdminGuard';
import { LeadsQualifiesPage } from './LeadsQualifiesPage';
import { AdminClientsPage } from './pages/AdminClientsPage';
import { AdminClientPanel } from './pages/AdminClientPanel';

// Sous-router /admin/*. Back-office Propul'Space :
//  - clients            : dashboard des portails (défaut)
//  - clients/:projectId : panneau client à onglets
//  - leads              : leads qualifiés (Vue 9, existant)
export function PropulspaceAdminApp() {
  return (
    <PropulspaceAdminGuard>
      <Routes>
        <Route index element={<Navigate to="clients" replace />} />
        <Route path="clients" element={<AdminClientsPage />} />
        <Route path="clients/:projectId/*" element={<AdminClientPanel />} />
        <Route path="leads" element={<LeadsQualifiesPage />} />
      </Routes>
    </PropulspaceAdminGuard>
  );
}
```

- [ ] **Step 2 : Vérifier que ça compile (les imports cassent tant que les fichiers n'existent pas — on les crée Task 1-3)**

Run: `npm run build`
Expected: ÉCHEC sur imports manquants `./pages/AdminClientsPage` etc. (attendu — résolu après Task 3). Ne pas committer maintenant ; commit groupé en fin de Task 3.

---

## Task 1 : Hook `useAdminClients` (lecture du dashboard)

**Files:**
- Create: `src/modules/EspaceClient/admin/hooks/useAdminClients.ts`

La vue `projects_portal_health_v2` (mig. 249/251, SECURITY DEFINER, garde `is_propulseo_team()`) renvoie une ligne par projet à portail. On la lit via le proxy `v2` (session admin).

- [ ] **Step 1 : Écrire le hook**

```ts
import { useCallback, useEffect, useState } from 'react';
import { v2 } from '@/lib/supabase';

// Une ligne du dashboard portails. Colonnes confirmées dans la vue
// projects_portal_health_v2 (migration 249/251).
export interface AdminClientHealth {
  project_id: string;
  project_name: string;
  portal_client_email: string | null;
  portal_activated_at: string | null;
  last_client_login_at: string | null;
  invoices_overdue: number;
  invoices_pending: number;
  signatures_pending: number;
  documents_count: number;
}

interface UseAdminClientsResult {
  clients: AdminClientHealth[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAdminClients(): UseAdminClientsResult {
  const [clients, setClients] = useState<AdminClientHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await v2
      .from('projects_portal_health')
      .select('*')
      .order('portal_activated_at', { ascending: false, nullsFirst: false });
    if (err) { setError(err.message); setClients([]); }
    else { setError(null); setClients((data ?? []) as AdminClientHealth[]); }
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { clients, loading, error, refresh };
}
```

- [ ] **Step 2 : Vérifier les colonnes réelles de la vue**

Avant de coder l'UI, ouvrir `supabase/migrations/20260521120000_propulspace_249_portal_health_view.sql` (et `..._251_portal_views_security_definer.sql`) et **aligner les noms de colonnes** de `AdminClientHealth` sur le `SELECT` réel. Corriger l'interface si un nom diffère (ex. `last_login_at` vs `last_client_login_at`).

Run: `npm run build`
Expected: pas d'erreur de type sur ce fichier (le proxy `v2` renvoie `any`, donc le cast `as AdminClientHealth[]` compile).

---

## Task 2 : `ClientHealthRow` + `AdminClientsPage` (dashboard)

**Files:**
- Create: `src/modules/EspaceClient/admin/components/ClientHealthRow.tsx`
- Create: `src/modules/EspaceClient/admin/pages/AdminClientsPage.tsx`

**Pattern à imiter** : `LeadsQualifiesPage.tsx` (mêmes imports UI shadcn `Card`, `Badge`, états `loading`/`error`/`empty`, primitives `shared/` `Hero`/`KpiTile`/`EmptyState`). Lire ce fichier avant de coder pour reprendre exactement ses conventions (classes Tailwind, structure).

- [ ] **Step 1 : `ClientHealthRow` — une ligne cliquable**

```tsx
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import type { AdminClientHealth } from '../hooks/useAdminClients';

function deriveStatus(c: AdminClientHealth): { label: string; tone: string } {
  if (!c.portal_activated_at) return { label: 'Inactif', tone: 'bg-gray-100 text-gray-700' };
  if (c.signatures_pending > 0) return { label: 'Signature en attente', tone: 'bg-amber-100 text-amber-800' };
  if (c.invoices_pending > 0) return { label: 'Paiement en attente', tone: 'bg-blue-100 text-blue-800' };
  return { label: 'Actif', tone: 'bg-emerald-100 text-emerald-800' };
}

export function ClientHealthRow({ client }: { client: AdminClientHealth }) {
  const navigate = useNavigate();
  const status = deriveStatus(client);
  return (
    <button
      onClick={() => navigate(`/admin/propulspace/clients/${client.project_id}`)}
      className="w-full flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left hover:border-violet-300 hover:bg-violet-50/40 transition"
    >
      <div className="min-w-0">
        <div className="font-medium text-gray-900 truncate">{client.project_name}</div>
        <div className="text-sm text-gray-500 truncate">{client.portal_client_email ?? '— pas d\'email portail —'}</div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {client.invoices_overdue > 0 && <Badge className="bg-red-100 text-red-700">{client.invoices_overdue} en retard</Badge>}
        <Badge className={status.tone}>{status.label}</Badge>
      </div>
    </button>
  );
}
```

- [ ] **Step 2 : `AdminClientsPage` — liste + recherche + états**

```tsx
import { useMemo, useState } from 'react';
import { useAdminClients } from '../hooks/useAdminClients';
import { ClientHealthRow } from '../components/ClientHealthRow';
import { Hero } from '../../shared/components/Hero';
import { EmptyState } from '../../shared/components/EmptyState';

export function AdminClientsPage() {
  const { clients, loading, error } = useAdminClients();
  const [q, setQ] = useState('');
  const filtered = useMemo(
    () => clients.filter(c =>
      c.project_name.toLowerCase().includes(q.toLowerCase()) ||
      (c.portal_client_email ?? '').toLowerCase().includes(q.toLowerCase())),
    [clients, q],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Hero eyebrow="Propul'Space" title="Clients & portails" subtitle="Pilotez chaque client de bout en bout." />
      <input
        value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un client…"
        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-violet-400 focus:outline-none"
      />
      {loading && <div className="text-sm text-gray-500">Chargement…</div>}
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState title="Aucun client" description="Les portails activés apparaîtront ici." />
      )}
      <div className="space-y-2">
        {filtered.map(c => <ClientHealthRow key={c.project_id} client={c} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : Vérifier les chemins d'import des primitives `shared/`**

Confirmer les chemins réels de `Hero` et `EmptyState` (ex. `../../shared/components/Hero` ou un barrel `../../shared/components`). Ajuster les imports. Idem `Badge` (chemin shadcn `@/components/ui/badge`).

Run: `npm run build`
Expected: pas d'erreur sur ces 2 fichiers.

---

## Task 3 : `AdminClientTabs` + `AdminClientPanel` (coquille du panneau)

**Files:**
- Create: `src/modules/EspaceClient/admin/components/AdminClientTabs.tsx`
- Create: `src/modules/EspaceClient/admin/pages/AdminClientPanel.tsx`

En Phase 0 le panel n'affiche que l'onglet **Aperçu** (nom projet + email + activation réutilisant `PortalStatusSection`). Les onglets Factures/Signatures/Documents/Jalons/Activité sont des coquilles « À venir » remplies aux phases 1-5.

- [ ] **Step 1 : `AdminClientTabs`**

```tsx
import { NavLink, useParams } from 'react-router-dom';

const TABS = [
  { key: '', label: 'Aperçu' },
  { key: 'factures', label: 'Factures' },
  { key: 'signatures', label: 'Signatures' },
  { key: 'documents', label: 'Documents' },
  { key: 'jalons', label: 'Jalons' },
  { key: 'activite', label: 'Activité' },
];

export function AdminClientTabs() {
  const { projectId } = useParams();
  const base = `/admin/propulspace/clients/${projectId}`;
  return (
    <nav className="flex gap-1 border-b border-gray-200">
      {TABS.map(t => (
        <NavLink
          key={t.key} end={t.key === ''} to={t.key ? `${base}/${t.key}` : base}
          className={({ isActive }) =>
            `px-3 py-2 text-sm border-b-2 -mb-px transition ${isActive ? 'border-violet-600 text-violet-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2 : `AdminClientPanel` (routes internes des onglets, coquilles)**

```tsx
import { Routes, Route, useParams, Link } from 'react-router-dom';
import { AdminClientTabs } from '../components/AdminClientTabs';

function TabPlaceholder({ name }: { name: string }) {
  return <div className="py-10 text-center text-sm text-gray-400">Onglet « {name} » — à venir</div>;
}

function OverviewTab() {
  const { projectId } = useParams();
  // Phase 4 : infos client éditables + <PortalStatusSection projectId={projectId} />
  return <div className="py-6 text-sm text-gray-600">Aperçu du projet <code>{projectId}</code> — activation & infos client (Phase 4).</div>;
}

export function AdminClientPanel() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Link to="/admin/propulspace/clients" className="text-sm text-violet-700 hover:underline">← Tous les clients</Link>
      <AdminClientTabs />
      <Routes>
        <Route index element={<OverviewTab />} />
        <Route path="factures" element={<TabPlaceholder name="Factures" />} />
        <Route path="signatures" element={<TabPlaceholder name="Signatures" />} />
        <Route path="documents" element={<TabPlaceholder name="Documents" />} />
        <Route path="jalons" element={<TabPlaceholder name="Jalons" />} />
        <Route path="activite" element={<TabPlaceholder name="Activité" />} />
      </Routes>
    </div>
  );
}
```

- [ ] **Step 3 : Build complet (Task 0-3 se résolvent ensemble)**

Run: `npm run build`
Expected: PASS (plus d'imports manquants).

- [ ] **Step 4 : Commit**

```bash
git add src/modules/EspaceClient/admin
git commit -m "feat(propulspace-admin): back-office shell (dashboard clients + panneau à onglets)"
```

---

## Task 4 : Lien Leads → panneau client + entrée de nav

**Files:**
- Modify: `src/modules/EspaceClient/admin/LeadsQualifiesPage.tsx` (ou son `LeadDetailSheet`)

- [ ] **Step 1 : Pour un lead `converted` (avec `converted_to_project_id`), ajouter un bouton « Ouvrir le portail client »**

Dans le composant qui affiche un lead converti (repérer `converted_to_project_id` dans `LeadDetailSheet.tsx`), ajouter :

```tsx
import { useNavigate } from 'react-router-dom';
// …
const navigate = useNavigate();
// dans le rendu, si lead.converted_to_project_id :
{lead.converted_to_project_id && (
  <button
    onClick={() => navigate(`/admin/propulspace/clients/${lead.converted_to_project_id}`)}
    className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
  >
    Ouvrir le portail client →
  </button>
)}
```

- [ ] **Step 2 : Ajouter un lien « Clients » dans la nav admin** (header/onglets de l'espace admin — repérer où `leads` est lié, ajouter `clients`). Si aucune nav globale n'existe, ajouter deux `NavLink` (`Clients`, `Leads`) en tête de `AdminClientsPage`/`LeadsQualifiesPage` via un petit composant partagé `AdminTopNav`.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin
git commit -m "feat(propulspace-admin): navigation leads↔clients"
```

---

## Task 5 : Wrapper RPC typé + E2E dashboard (gate Phase 0)

**Files:**
- Create: `src/modules/EspaceClient/admin/lib/adminRpc.ts`
- Create: `tests/e2e/propulspace-admin.spec.ts`

- [ ] **Step 1 : `adminRpc.ts` — point unique de cast pour les RPC admin**

```ts
import { supabase } from '@/lib/supabase';

// Les RPC admin_* sont ajoutées par les migrations 270+ et peuvent ne pas
// être encore dans les types générés. Ce module isole l'unique cast nécessaire
// (au lieu d'un `as any` dispersé). Signatures alignées sur les migrations.
type AdminRpcMap = {
  // rempli en Phase 1+ :
  // admin_create_invoice: { args: {...}; returns: string };
};

export async function adminRpc<K extends keyof AdminRpcMap>(
  fn: K,
  args: AdminRpcMap[K] extends { args: infer A } ? A : never,
): Promise<{ data: unknown; error: { message: string } | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)(fn, args);
  return { data, error };
}
```

- [ ] **Step 2 : Lire la config Playwright existante** (`playwright.config.*`, `tests/e2e/propulspace-public.spec.ts`) pour reprendre le `baseURL` et le mécanisme d'auth admin (storageState ou login programmatique). **S'il n'existe pas de fixture admin authentifiée**, créer un `tests/e2e/_fixtures/admin-auth.ts` qui se logge en `team@propulseo-site.com` via `supabase.auth.signInWithPassword` et sauvegarde le `storageState` (clé `sb-crm-propulseo-auth`).

- [ ] **Step 3 : E2E — l'admin atteint le dashboard**

```ts
import { test, expect } from '@playwright/test';
// import { adminStorageState } from './_fixtures/admin-auth'; // si fixture créée

test.describe('Back-office Propul\'Space', () => {
  // test.use({ storageState: adminStorageState });

  test('le dashboard /admin/propulspace/clients se charge', async ({ page }) => {
    await page.goto('/admin/propulspace');
    await expect(page).toHaveURL(/\/admin\/propulspace\/clients/);
    await expect(page.getByText('Clients & portails')).toBeVisible();
  });

  test('ouvre un panneau client et voit les onglets', async ({ page }) => {
    await page.goto('/admin/propulspace/clients');
    const firstRow = page.locator('button', { hasText: '@' }).first();
    if (await firstRow.count()) {
      await firstRow.click();
      await expect(page.getByRole('link', { name: 'Factures' })).toBeVisible();
    }
  });
});
```

- [ ] **Step 4 : Lancer la suite**

Run: `npx playwright test tests/e2e/propulspace-admin.spec.ts`
Expected: PASS (2 tests). Si l'auth admin bloque, finaliser la fixture Step 2 d'abord.

- [ ] **Step 5 : Vérif visuelle réelle**

`npm run dev`, se connecter en admin, ouvrir `/admin/propulspace` : la liste des portails s'affiche, le clic ouvre le panneau avec les 6 onglets, retour « Tous les clients » OK.

- [ ] **Step 6 : Commit**

```bash
git add src/modules/EspaceClient/admin/lib tests/e2e/propulspace-admin.spec.ts
git commit -m "test(propulspace-admin): e2e dashboard + wrapper rpc typé"
```

**🚦 GATE PHASE 0** : `npm run build` vert + 2 specs E2E vertes + parcours visuel OK → Phase 0 terminée.

---

# Squelette Phase 1 — Factures (migrations à appliquer à la main)

> Les UI/hooks/edge de la phase 1 seront détaillés dans leur propre plan. Ci-dessous les **2 migrations SQL complètes** à appliquer dès maintenant côté Supabase, plus le découpage des tâches restantes.

## Task 6 : Migration 270 — `admin_create_invoice`

**Files:**
- Create: `supabase/migrations/20260603100000_propulspace_270_admin_create_invoice.sql`

- [ ] **Step 1 : Écrire la migration**

```sql
-- propulspace 270 — RPC admin: création atomique facture + acomptes.
-- Le schéma propulspace n'étant pas exposé à PostgREST, l'admin écrit via cette
-- RPC public SECURITY DEFINER (garde is_admin). Numéro via next_invoice_number(),
-- snapshot client immuable depuis projects_v2, totaux recalculés serveur.
create or replace function public.admin_create_invoice(
  p_project_id          uuid,
  p_amount_subtotal     numeric,
  p_is_deposit          boolean default false,
  p_vat_rate            numeric default 0,
  p_line_items          jsonb   default '[]'::jsonb,
  p_issue_date          date    default current_date,
  p_due_date            date    default null,
  p_client_visible_notes text   default null,
  p_internal_notes      text    default null,
  p_installments        jsonb   default '[]'::jsonb   -- [{label, amount, due_date}]
) returns uuid
language plpgsql
security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare
  v_invoice_id uuid;
  v_number     text;
  v_amount_vat numeric;
  v_total      numeric;
  v_snapshot   jsonb;
  v_inst       jsonb;
  v_idx        int := 0;
  v_creator    uuid;
begin
  if not propulspace.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
           'company',    coalesce(client_company, name),  -- projects_v2 colonne = name (pas project_name)
           'first_name', client_first_name,
           'phone',      client_phone,
           'email',      portal_client_email
         )
    into v_snapshot
    from public.projects_v2
   where id = p_project_id;

  if v_snapshot is null then
    raise exception 'project % not found', p_project_id using errcode = 'P0002';
  end if;

  select id into v_creator from public.users where auth_user_id = auth.uid();

  v_number     := propulspace.next_invoice_number();
  v_amount_vat := round(p_amount_subtotal * p_vat_rate / 100.0, 2);
  v_total      := p_amount_subtotal + v_amount_vat;

  insert into propulspace.invoices(
    invoice_number, project_id, client_snapshot, is_deposit,
    amount_subtotal, vat_rate, amount_vat, amount_total, currency,
    line_items, status, issue_date, due_date,
    client_visible_notes, internal_notes, created_by
  ) values (
    v_number, p_project_id, v_snapshot, p_is_deposit,
    p_amount_subtotal, p_vat_rate, v_amount_vat, v_total, 'EUR',
    coalesce(p_line_items,'[]'::jsonb), 'draft', p_issue_date,
    coalesce(p_due_date, p_issue_date + 30),
    p_client_visible_notes, p_internal_notes, v_creator
  )
  returning id into v_invoice_id;

  for v_inst in select * from jsonb_array_elements(coalesce(p_installments,'[]'::jsonb))
  loop
    v_idx := v_idx + 1;
    insert into propulspace.invoice_installments(
      invoice_id, installment_number, label, amount, due_date, status
    ) values (
      v_invoice_id, v_idx,
      coalesce(v_inst->>'label', 'Acompte ' || v_idx),
      (v_inst->>'amount')::numeric,
      coalesce((v_inst->>'due_date')::date, p_issue_date + 30),  -- due_date NOT NULL
      'pending'
    );
  end loop;

  return v_invoice_id;
end;
$$;

revoke all on function public.admin_create_invoice(uuid,numeric,boolean,numeric,jsonb,date,date,text,text,jsonb) from public, anon;
grant execute on function public.admin_create_invoice(uuid,numeric,boolean,numeric,jsonb,date,date,text,text,jsonb) to authenticated;
```

- [ ] **Step 2 : Vérifier les noms de colonnes** contre `supabase/migrations/20260515184848_propulspace_050_portal_tables.sql` + alters Stripe 210 (invoices : `client_visible_notes`, `internal_notes`, `created_by` ; installments : `installment_number`, `label`, `amount`, `due_date`, `status`). Ajuster si un nom diffère.

- [ ] **Step 3 : ⚠️ ACTION UTILISATEUR — appliquer la migration sur Supabase**

Coller le SQL dans Supabase → SQL Editor (ou `supabase db push` si CLI branché). Puis **régénérer les types** et renseigner `admin_create_invoice` dans `AdminRpcMap` (Task 5). Me confirmer « 270 OK ».

- [ ] **Step 4 : Test SQL de fumée**

```sql
-- en tant qu'admin (role manager/admin) :
select public.admin_create_invoice(
  '<UN_PROJECT_ID_REEL>'::uuid, 1000, true, 0, '[]'::jsonb,
  current_date, null, 'Acompte de lancement', null,
  '[{"label":"Acompte 50%","amount":500,"due_date":"2026-06-15"}]'::jsonb
);
-- attendu : un uuid ; vérifier la facture (status=draft, PS-XXXX) + 1 acompte.
```

---

## Task 7 : Migration 271 — `admin_update_invoice`, `admin_send_invoice`, verrou

**Files:**
- Create: `supabase/migrations/20260603101000_propulspace_271_admin_invoice_send_lock.sql`

- [ ] **Step 1 : Écrire la migration**

```sql
-- propulspace 271 — édition brouillon, envoi (status->sent + verrou), immuabilité.

create or replace function public.admin_update_invoice(
  p_invoice_id           uuid,
  p_amount_subtotal      numeric default null,
  p_vat_rate             numeric default null,
  p_line_items           jsonb   default null,
  p_due_date             date    default null,
  p_client_visible_notes text    default null,
  p_internal_notes       text    default null
) returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_status text; v_sub numeric; v_rate numeric;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  select status into v_status from propulspace.invoices where id = p_invoice_id;
  if v_status is null then raise exception 'invoice not found' using errcode='P0002'; end if;
  if v_status <> 'draft' then raise exception 'invoice not editable (status=%)', v_status using errcode='42501'; end if;

  update propulspace.invoices set
    amount_subtotal      = coalesce(p_amount_subtotal, amount_subtotal),
    vat_rate             = coalesce(p_vat_rate, vat_rate),
    line_items           = coalesce(p_line_items, line_items),
    due_date             = coalesce(p_due_date, due_date),
    client_visible_notes = coalesce(p_client_visible_notes, client_visible_notes),
    internal_notes       = coalesce(p_internal_notes, internal_notes),
    updated_at           = now()
  where id = p_invoice_id;

  select amount_subtotal, vat_rate into v_sub, v_rate from propulspace.invoices where id = p_invoice_id;
  update propulspace.invoices set
    amount_vat   = round(v_sub * v_rate / 100.0, 2),
    amount_total = v_sub + round(v_sub * v_rate / 100.0, 2)
  where id = p_invoice_id;
end; $$;

create or replace function public.admin_send_invoice(p_invoice_id uuid)
returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_status text;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  select status into v_status from propulspace.invoices where id = p_invoice_id;
  if v_status is null then raise exception 'invoice not found' using errcode='P0002'; end if;
  if v_status <> 'draft' then raise exception 'invoice already sent (status=%)', v_status using errcode='42501'; end if;
  update propulspace.invoices
     set status = 'sent', is_locked = true, updated_at = now()
   where id = p_invoice_id;
end; $$;

-- Immuabilité : une facture verrouillée n'autorise que les transitions de paiement
-- (status/paid_at/stripe_* posés par le webhook service_role).
create or replace function propulspace.tg_invoice_immutable()
returns trigger language plpgsql as $$
begin
  if old.is_locked then
    if new.amount_total    is distinct from old.amount_total
    or new.amount_subtotal is distinct from old.amount_subtotal
    or new.line_items      is distinct from old.line_items
    or new.invoice_number  is distinct from old.invoice_number
    or new.client_snapshot is distinct from old.client_snapshot then
      raise exception 'facture % verrouillée (art. 293 B)', old.invoice_number using errcode='42501';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists trg_invoice_immutable on propulspace.invoices;
create trigger trg_invoice_immutable
  before update on propulspace.invoices
  for each row execute function propulspace.tg_invoice_immutable();

revoke all on function public.admin_update_invoice(uuid,numeric,numeric,jsonb,date,text,text) from public, anon;
revoke all on function public.admin_send_invoice(uuid) from public, anon;
grant execute on function public.admin_update_invoice(uuid,numeric,numeric,jsonb,date,text,text) to authenticated;
grant execute on function public.admin_send_invoice(uuid) to authenticated;
```

- [ ] **Step 2 : ⚠️ ACTION UTILISATEUR — appliquer 271** sur Supabase, régénérer les types, compléter `AdminRpcMap`. Me confirmer « 271 OK ».

- [ ] **Step 3 : Test SQL** : tenter `admin_update_invoice` sur une facture `sent` → doit échouer ; `admin_send_invoice` deux fois → 2e échoue ; UPDATE direct du montant d'une facture verrouillée → bloqué par le trigger.

---

## Tâches Phase 1 restantes (plan détaillé à suivre, après 270/271 appliquées)

- [ ] **Task 8 — Edge `generate-invoice-pdf`** : copier la structure de `supabase/functions/generate-quote-pdf/index.ts`, rendre la facture FR (mentions légales, n° séquentiel, TVA art. 293 B, snapshot client), uploader dans le bucket `propulspace-documents`, remplir `invoices.pdf_url` + `pdf_hash_sha256`. Garde JWT + `is_admin`.
- [ ] **Task 9 — Hook `useAdminInvoices`** : lecture `v2.from('propulspace_invoices').eq('project_id', …)` + acomptes ; écritures via `adminRpc('admin_create_invoice'|'admin_update_invoice'|'admin_send_invoice', …)` ; déclenche l'edge PDF puis l'email `send-portal-email` (template #33 invoice-sent) à l'envoi.
- [ ] **Task 10 — UI `InvoicesTab` + `AdminInvoiceForm`** : liste des factures (statut, montant, PDF), formulaire création (lignes + sous-total + acomptes 50/25/25), boutons Éditer (draft) / Envoyer / Relancer. Remplace la coquille « Factures » du panel.
- [ ] **Task 11 — E2E paiement Stripe (GAP-31)** `tests/e2e/propulspace-portal-stripe.spec.ts` : admin crée+envoie une facture → côté client la facture est visible → clic Payer → `portal-create-checkout-session` redirige Stripe (mode test) → simulation webhook `checkout.session.completed` → facture `paid` + email #35. (Nécessite secrets Stripe test posés — checklist prod.)

**🚦 GATE PHASE 1** : un client peut être facturé depuis l'admin, reçoit sa facture PDF, paie en test Stripe, la facture passe `paid` — E2E vert.

---

## Self-Review (effectué)

- **Couverture spec** : Phase 0 = §3.1/§3.2 (routing + dashboard + panel shell) ✓ ; migrations 270/271 = §4 + §3.3 (écritures factures) ✓ ; PDF = §3.4 (Task 8) ✓ ; reste Phase 1 = Tasks 8-11 ✓. Phases 2-6 hors de ce plan (plans dédiés).
- **Placeholders** : les coquilles d'onglets (Task 3) sont des jalons UI assumés, remplacés aux phases 1-5 — pas des placeholders de plan (chaque a son code). Tasks 8-11 sont des en-têtes de tâches dont le code détaillé vient au plan Phase 1 (dépend de 270/271 appliquées) — signalé explicitement.
- **Cohérence des types** : `AdminClientHealth` (Task 1) réutilisé Task 2 ; `adminRpc`/`AdminRpcMap` (Task 5) réutilisé Tasks 6-7-9 ; noms de RPC identiques partout (`admin_create_invoice`, `admin_update_invoice`, `admin_send_invoice`).
- **Points à vérifier au moment de coder** (notés dans les steps) : colonnes réelles des vues (Task 1.2) et tables (Task 6.2), chemins des primitives `shared/` (Task 2.3), fixture auth Playwright (Task 5.2).
