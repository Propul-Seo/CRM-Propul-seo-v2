# Aperçu client admin + interactions cartes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre les cartes du back-office portail cliquables (clic → aperçu, icônes œil/loupe retirées, cartes factures compactées) et ajouter un bouton admin « Voir comme le client » qui ouvre le vrai portail de n'importe quel client en lecture seule.

**Architecture:** Chantier A = édits UI locaux sur 3 onglets admin. Chantier B = 100 % front, sans migration (la RLS `ps_*_admin_all` / `team_all` autorise déjà l'admin à tout lire) : on rend les requêtes du portail explicites (filtre `project_id` + prédicats de parité client), on ajoute `previewMode` au `PortalContext`, un provider d'aperçu admin, une route admin réutilisant `PortalShell`, et le masquage des actions d'écriture.

**Tech Stack:** React 18 + TypeScript + Vite, react-router-dom v7, Supabase (`@/lib/supabase` → `v2Portal`), Tailwind, lucide-react. Tests : **vitest** (logique pure uniquement — pattern du repo).

**Spec :** `docs/superpowers/specs/2026-06-09-apercu-client-admin-et-cartes-portail-design.md`

---

## Conventions de vérification (ce projet)

- **Type-check :** `npx tsc --noEmit` → attendu : exit 0, zéro erreur.
- **Build :** `npx vite build` → attendu : `✓ built` + manifeste de chunks. (Dure ~2-3 min ; si lancé via tokenade le wrapper peut afficher « timed out » à 120 s alors que le build finit — se fier au `✓ built`.)
- **Tests unitaires :** `npx vitest run <chemin>` → attendu : PASS.
- **Vérif comportementale :** décrite par phase, **réalisée par l'utilisateur au navigateur** (`npm run dev -- --port 5180`). Ne pas lancer de navigateur soi-même.
- **Commits :** messages sans accents, scope `feat(...)` / `fix(...)`, finir par la ligne `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Un commit par tâche.
- **Pas de `any`, alias `@/`, pas de style inline hors largeur dynamique de barre (convention du repo).**

## Pattern « carte cliquable » (réutilisé en Phase A)

Pour chaque carte : la racine de la carte reçoit `onClick`, `role="button"`, `tabIndex={0}`, et un handler clavier `onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); <open>; } }}` + `cursor-pointer`. **Chaque bouton d'action interne** déclenche `e.stopPropagation()` avant son handler, pour ne pas ouvrir l'aperçu.

---

## File Structure

**Chantier A**
- Create: `src/modules/EspaceClient/admin/lib/signaturePreview.ts` — helper pur « quelle preview pour une signature » (+ test).
- Create: `src/modules/EspaceClient/admin/lib/signaturePreview.test.ts`
- Modify: `src/modules/EspaceClient/admin/components/InvoiceCard.tsx` — carte cliquable, œil retiré, compactage.
- Modify: `src/modules/EspaceClient/admin/components/DocumentsTab.tsx` — carte cliquable, loupe retirée.
- Modify: `src/modules/EspaceClient/admin/components/SignaturesTab.tsx` — carte cliquable + `FilePreviewDialog`.

**Chantier B**
- Modify: `src/modules/EspaceClient/shared/context/PortalContext.tsx` — champ `previewMode`.
- Modify: `src/modules/EspaceClient/client/hooks/usePortalData.ts` — `useList` paramétré (projectId + filtres parité) ; installments par ids de factures.
- Modify: `src/modules/EspaceClient/client/pages/InvoicesPage.tsx` — passe les ids de factures aux échéances + gate paiement.
- Modify: `src/modules/EspaceClient/client/pages/ProfilePage.tsx` — gate écritures.
- Modify: `src/modules/EspaceClient/client/pages/SignaturesPage.tsx` — gate CTA signature.
- Create: `src/modules/EspaceClient/admin/preview/AdminPortalPreviewProvider.tsx` — charge le projet par id, fournit `PortalContext` `previewMode:true`.
- Create: `src/modules/EspaceClient/admin/preview/AdminPortalPreviewPage.tsx` — bandeau d'aperçu + montage `PortalShell` + routes pages client.
- Modify: `src/modules/EspaceClient/admin/AdminRoutesShell.tsx` — enregistre la route `clients/:projectId/apercu-client/*`.
- Modify: `src/modules/EspaceClient/client/PortalShell.tsx` — nav en liens **relatifs** (portable sous une autre base).
- Modify: `src/modules/EspaceClient/admin/components/cockpit/CockpitClientHeader.tsx` — bouton « Voir comme le client ».

---

## PHASE A — Interactions des cartes

### Task A1: Carte facture cliquable + compactage

**Files:**
- Modify: `src/modules/EspaceClient/admin/components/InvoiceCard.tsx`

- [ ] **Step 1 — Rendre l'`<article>` cliquable + compacter.** Remplacer l'ouverture de `<article>` (ligne ~74) :

```tsx
<article className="rounded-xl border border-border bg-surface-2 p-5 shadow-glow-sm">
```
par :
```tsx
<article
  onClick={onPreview}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPreview(); } }}
  className="cursor-pointer rounded-xl border border-border bg-surface-2 p-3 shadow-glow-sm transition-colors hover:bg-surface-3/40"
>
```

- [ ] **Step 2 — Compacter l'en-tête** (montant + statut déjà à droite). Réduire l'espacement : remplacer `<div className="min-w-0 space-y-1.5">` par `<div className="min-w-0 space-y-1">` et `text-2xl` du montant (ligne ~85) par `text-xl`. Réduire la marge de l'échéancier et de la barre d'action : `mt-4 ... pt-3.5` (ligne ~98) → `mt-3 ... pt-3`.

- [ ] **Step 3 — Retirer l'œil (aperçu redondant).** Supprimer la ligne ~119 :
```tsx
<Ghost icon={Eye} label="Aperçu" onClick={onPreview} disabled={busy} />
```
Retirer `Eye` de l'import lucide si plus utilisé ailleurs dans le fichier.

- [ ] **Step 4 — `stopPropagation` sur les actions.** Dans le composant `Ghost` (haut du fichier), envelopper son `onClick` : `onClick={(e) => { e.stopPropagation(); onClick(); }}` (signature interne adaptée). Pour les boutons « Envoyer » (~101) et « Relancer » (~109), changer `onClick={onSend}` → `onClick={(e) => { e.stopPropagation(); onSend(); }}` et idem pour `onRemind`.

- [ ] **Step 5 — Vérifier le type-check.** Run: `npx tsc --noEmit` — Expected: exit 0.

- [ ] **Step 6 — Commit.**
```bash
git add src/modules/EspaceClient/admin/components/InvoiceCard.tsx
git commit -m "feat(admin-portail): carte facture cliquable (apercu) + compactage, oeil retire" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task A2: Carte document cliquable

**Files:**
- Modify: `src/modules/EspaceClient/admin/components/DocumentsTab.tsx`

- [ ] **Step 1 — `<li>` cliquable.** Ligne ~129, ajouter à la `<li>` : `onClick={() => setPreview(doc)}`, `role="button"`, `tabIndex={0}`, `onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPreview(doc); } }}`, et `cursor-pointer` dans la className.

- [ ] **Step 2 — Retirer la loupe.** Supprimer le bouton « Aperçu » ligne ~159 :
```tsx
<button type="button" title="Aperçu" aria-label="Aperçu" onClick={() => setPreview(doc)} className={actionBtn}><FileSearch className="h-4 w-4" /></button>
```
Retirer `FileSearch` de l'import lucide (ligne 2) s'il n'est plus utilisé.

- [ ] **Step 3 — `stopPropagation` sur les 4 actions restantes** (download, visibilité, modifier, supprimer, ~160-165). Préfixer chaque `onClick` par `e.stopPropagation();`, ex : `onClick={(e) => { e.stopPropagation(); void downloadDocument(doc); }}`, `onClick={(e) => { e.stopPropagation(); onToggle(doc); }}`, `onClick={(e) => { e.stopPropagation(); setEditing(doc); }}`, `onClick={(e) => { e.stopPropagation(); onDelete(doc); }}`.

- [ ] **Step 4 — Type-check.** Run: `npx tsc --noEmit` — Expected: exit 0.

- [ ] **Step 5 — Commit.**
```bash
git add src/modules/EspaceClient/admin/components/DocumentsTab.tsx
git commit -m "feat(admin-portail): carte document cliquable (apercu), loupe retiree" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task A3: Carte signature cliquable + aperçu in-app (TDD sur le helper)

**Files:**
- Create: `src/modules/EspaceClient/admin/lib/signaturePreview.ts`
- Create: `src/modules/EspaceClient/admin/lib/signaturePreview.test.ts`
- Modify: `src/modules/EspaceClient/admin/components/SignaturesTab.tsx`

- [ ] **Step 1 — Écrire le test du helper (échoue).** `signaturePreview.test.ts` :
```ts
import { describe, it, expect } from 'vitest';
import { signaturePreviewTarget } from './signaturePreview';
import type { PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData';

const base: PortalSignature = {
  id: '1', project_id: 'p', document_id: null, signature_type: 'contract', name: 'Contrat',
  docuseal_signing_url: null, docuseal_signed_pdf_url: null, status: 'pending',
  sent_at: null, signed_at: null, expires_at: null, created_at: '',
};

describe('signaturePreviewTarget', () => {
  it('priorise le PDF signe', () => {
    expect(signaturePreviewTarget({ ...base, docuseal_signed_pdf_url: 'pdf', docuseal_signing_url: 'sign' }))
      .toEqual({ kind: 'pdf', url: 'pdf' });
  });
  it('retombe sur le lien DocuSeal si pas de PDF signe', () => {
    expect(signaturePreviewTarget({ ...base, docuseal_signing_url: 'sign' }))
      .toEqual({ kind: 'external', url: 'sign' });
  });
  it('renvoie null si aucune URL', () => {
    expect(signaturePreviewTarget(base)).toBeNull();
  });
});
```

- [ ] **Step 2 — Lancer le test (échoue).** Run: `npx vitest run src/modules/EspaceClient/admin/lib/signaturePreview.test.ts` — Expected: FAIL (module introuvable).

- [ ] **Step 3 — Écrire le helper.** `signaturePreview.ts` :
```ts
import type { PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData';

export type SignaturePreview =
  | { kind: 'pdf'; url: string }        // PDF signe -> apercu in-app
  | { kind: 'external'; url: string }   // page DocuSeal -> nouvel onglet
  | null;

// Aucune URL de contrat original n'est stockee : on previsualise le PDF signe
// si dispo, sinon on ouvre la page DocuSeal du document.
export function signaturePreviewTarget(s: PortalSignature): SignaturePreview {
  if (s.docuseal_signed_pdf_url) return { kind: 'pdf', url: s.docuseal_signed_pdf_url };
  if (s.docuseal_signing_url) return { kind: 'external', url: s.docuseal_signing_url };
  return null;
}
```

- [ ] **Step 4 — Lancer le test (passe).** Run: `npx vitest run src/modules/EspaceClient/admin/lib/signaturePreview.test.ts` — Expected: PASS (3 tests).

- [ ] **Step 5 — Brancher la carte.** Dans `SignaturesTab.tsx` :
  - Importer : `import { FilePreviewDialog } from '@/modules/EspaceClient/shared/components';` et `import { signaturePreviewTarget } from '@/modules/EspaceClient/admin/lib/signaturePreview';`
  - Ajouter un état : `const [pdfPreview, setPdfPreview] = useState<{ name: string; url: string } | null>(null);`
  - Ajouter le handler d'ouverture :
```tsx
function openPreview(s: PortalSignature) {
  const target = signaturePreviewTarget(s);
  if (!target) return;
  if (target.kind === 'external') { window.open(target.url, '_blank', 'noopener,noreferrer'); return; }
  setPdfPreview({ name: s.name, url: target.url });
}
```
  - Sur la `<article>` de la carte (la racine de chaque signature dans `rows.map`), ajouter `onClick={() => openPreview(s)}`, `role="button"`, `tabIndex={0}`, `onKeyDown` (même pattern), `cursor-pointer`.
  - Préfixer les `onClick` des boutons d'action (PDF signé, relancer, annuler) par `e.stopPropagation();`.
  - Monter le dialog en bas du composant :
```tsx
<FilePreviewDialog
  open={pdfPreview !== null}
  onOpenChange={(o) => { if (!o) setPdfPreview(null); }}
  name={pdfPreview?.name ?? ''}
  mime="application/pdf"
  resolveUrl={() => Promise.resolve(pdfPreview?.url ?? null)}
/>
```

- [ ] **Step 6 — Type-check + build.** Run: `npx tsc --noEmit` (exit 0) puis `npx vite build` (`✓ built`).

- [ ] **Step 7 — Commit.**
```bash
git add src/modules/EspaceClient/admin/lib/signaturePreview.ts src/modules/EspaceClient/admin/lib/signaturePreview.test.ts src/modules/EspaceClient/admin/components/SignaturesTab.tsx
git commit -m "feat(admin-portail): carte signature cliquable + apercu PDF in-app" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

**Vérif Phase A (utilisateur, navigateur) :** sur les 3 onglets, cliquer une carte ouvre l'aperçu ; cliquer une action (PDF, éditer, supprimer, relancer…) **n'ouvre pas** l'aperçu ; les cartes de factures sont nettement plus compactes.

---

## PHASE B1 — Couche data explicite + previewMode

### Task B1.1: `previewMode` dans PortalContext

**Files:**
- Modify: `src/modules/EspaceClient/shared/context/PortalContext.tsx`
- Modify: `src/modules/EspaceClient/shared/guards/PortalGuard.tsx` (passe `previewMode: false`)

- [ ] **Step 1 — Ajouter le champ.** Dans `PortalContext.tsx`, étendre l'interface :
```tsx
interface PortalContextValue {
  email: string;
  project: PortalProject;
  signOut: () => Promise<void>;
  previewMode: boolean;
}
```

- [ ] **Step 2 — Renseigner le flux client réel.** Dans `PortalGuard.tsx`, à l'endroit où il construit le `value` du `PortalProvider`, ajouter `previewMode: false`. (Ouvrir le fichier ; le `value` est l'objet `{ email, project, signOut }` → `{ email, project, signOut, previewMode: false }`.)

- [ ] **Step 3 — Type-check.** Run: `npx tsc --noEmit` — Expected: exit 0 (aucun autre consommateur ne casse : `previewMode` est requis mais seuls PortalGuard et le futur provider d'aperçu créent la value).

- [ ] **Step 4 — Commit.**
```bash
git add src/modules/EspaceClient/shared/context/PortalContext.tsx src/modules/EspaceClient/shared/guards/PortalGuard.tsx
git commit -m "feat(portail): ajoute previewMode au PortalContext" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task B1.2: `useList` paramétré par projectId + filtres de parité

**Files:**
- Modify: `src/modules/EspaceClient/client/hooks/usePortalData.ts`

- [ ] **Step 1 — Étendre `useList`.** Remplacer la signature et le corps de `useList` (lignes 18-41) par :
```ts
type ListFilter = readonly [op: 'eq' | 'neq' | 'is', col: string, val: string | boolean | null];

function useList<T>(
  table: string, orderBy: string, ascending: boolean,
  projectId: string, filters: readonly ListFilter[] = [],
): ListResult<T> {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const filterKey = filters.map(f => f.join(':')).join('|');
  const refresh = useCallback(async () => {
    setLoading(true);
    let q = v2.from(table).select('*').eq('project_id', projectId);
    for (const [op, col, val] of filters) {
      q = op === 'eq' ? q.eq(col, val) : op === 'neq' ? q.neq(col, val) : q.is(col, val);
    }
    const { data, error: err } = await q.order(orderBy, { ascending });
    if (!mountedRef.current) return;
    if (err) { setError(err.message); setRows([]); }
    else { setError(null); setRows((data ?? []) as T[]); }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, orderBy, ascending, projectId, filterKey]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { rows, loading, error, refresh };
}
```
(NB : `filters` est sérialisé via `filterKey` pour stabiliser `useCallback` ; le commentaire eslint couvre la dépendance volontairement omise.)

- [ ] **Step 2 — Mettre à jour les hooks** (remplacer les lignes 88-95, hors installments) pour lire `usePortal().project.id` + appliquer les prédicats de parité client. Ajouter en haut du fichier : `import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';`
```ts
export const usePortalInvoices = () => {
  const { project } = usePortal();
  return useList<PortalInvoice>('propulspace_invoices', 'issue_date', false, project.id, [['neq', 'status', 'draft']]);
};
export const usePortalDocuments = () => {
  const { project } = usePortal();
  // Parite client : visible_to_client uniquement. (deleted_at IS NULL est gere par la vue ;
  // si la colonne deleted_at est exposee, ajouter ['is','deleted_at',null].)
  return useList<PortalDocument>('propulspace_documents', 'created_at', false, project.id, [['eq', 'visible_to_client', true]]);
};
export const usePortalSignatures = () => {
  const { project } = usePortal();
  return useList<PortalSignature>('propulspace_signatures', 'created_at', false, project.id, []);
};
export const usePortalProjectSteps = () => {
  const { project } = usePortal();
  return useList<PortalProjectStep>('propulspace_project_steps', 'step_order', true, project.id, [['eq', 'visible_to_client', true]]);
};
export const usePortalProjectActivities = () => {
  const { project } = usePortal();
  return useList<PortalActivity>('propulspace_activities', 'created_at', false, project.id, []);
};
```

- [ ] **Step 3 — Type-check.** Run: `npx tsc --noEmit` — Expected: exit 0.
> Note : si tsc signale que `v2.from(table).select(...).eq(...)` perd le typage chaîné, garder `let q = v2.from(table).select('*') as any` est **interdit** (pas de `any`) → typer `q` via le type de retour de `.select('*')` (PostgrestFilterBuilder). Vérifier le typage existant de `v2`.

- [ ] **Step 4 — Commit.**
```bash
git add src/modules/EspaceClient/client/hooks/usePortalData.ts
git commit -m "feat(portail): filtre explicite project_id + paritee client sur les hooks de liste" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task B1.3: Échéances scopées par ids de factures

**Files:**
- Modify: `src/modules/EspaceClient/client/hooks/usePortalData.ts`
- Modify: `src/modules/EspaceClient/client/pages/InvoicesPage.tsx`

- [ ] **Step 1 — Remplacer le hook installments.** Dans `usePortalData.ts`, remplacer la ligne 89 (`usePortalInstallments`) par un hook prenant les ids de factures (les échéances n'ont pas de `project_id`) :
```ts
export const usePortalInstallments = (invoiceIds: string[]) => {
  const [rows, setRows] = useState<PortalInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const idsKey = invoiceIds.join(',');
  const refresh = useCallback(async () => {
    setLoading(true);
    if (invoiceIds.length === 0) { if (mountedRef.current) { setRows([]); setLoading(false); } return; }
    const { data, error: err } = await v2.from('propulspace_invoice_installments')
      .select('*').in('invoice_id', invoiceIds).order('due_date', { ascending: true });
    if (!mountedRef.current) return;
    if (err) { setError(err.message); setRows([]); } else { setError(null); setRows((data ?? []) as PortalInstallment[]); }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { rows, loading, error, refresh };
};
```

- [ ] **Step 2 — Adapter `InvoicesPage`.** Ouvrir `InvoicesPage.tsx`. Là où il appelle `usePortalInstallments()`, passer les ids des factures déjà chargées :
```tsx
const { rows: invoices, loading: invLoading } = usePortalInvoices();
const invoiceIds = useMemo(() => invoices.map(i => i.id), [invoices]);
const { rows: installments } = usePortalInstallments(invoiceIds);
```
(Ajouter `useMemo` à l'import React si absent. Si la page utilisait un autre nommage, conserver le sien et n'injecter que `invoiceIds`.)

- [ ] **Step 3 — Type-check + build.** Run: `npx tsc --noEmit` (exit 0) puis `npx vite build` (`✓ built`).

- [ ] **Step 4 — Commit.**
```bash
git add src/modules/EspaceClient/client/hooks/usePortalData.ts src/modules/EspaceClient/client/pages/InvoicesPage.tsx
git commit -m "feat(portail): echeances scopees par ids de factures (paritee admin)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

**Vérif Phase B1 (utilisateur) :** le **portail client réel** (login client) affiche toujours exactement ses factures (hors brouillons), documents visibles, signatures, étapes — **aucune régression**.

---

## PHASE B2 — Provider d'aperçu + route admin

### Task B2.1: `PortalShell` en liens relatifs

**Files:**
- Modify: `src/modules/EspaceClient/client/PortalShell.tsx`

- [ ] **Step 1 — Rendre la nav portable.** Ouvrir `PortalShell.tsx`. Repérer les liens de navigation (`<NavLink>` / `<Link>` / `navigate(...)`). Si les `to` sont **absolus** (`/espace-client/...`), les passer en **relatifs** (`to="documents"`, `to="invoices"`, `to="."` pour l'index, etc.) pour que la nav fonctionne sous n'importe quelle base de route. Ne pas changer la structure visuelle.

- [ ] **Step 2 — Type-check + sanity portail réel.** Run: `npx tsc --noEmit` (exit 0). Vérif utilisateur : la nav du portail client réel fonctionne toujours.

- [ ] **Step 3 — Commit.**
```bash
git add src/modules/EspaceClient/client/PortalShell.tsx
git commit -m "refactor(portail): nav PortalShell en liens relatifs (portable)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task B2.2: Provider d'aperçu admin

**Files:**
- Create: `src/modules/EspaceClient/admin/preview/AdminPortalPreviewProvider.tsx`

- [ ] **Step 1 — Écrire le provider.** Charge `projects_v2` par id (l'admin y a accès), fournit le `PortalContext` en `previewMode:true`. États loading / introuvable.
```tsx
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalSupabase } from '@/lib/supabase';
import { PortalProvider } from '@/modules/EspaceClient/shared/context/PortalContext';
import type { PortalProject } from '@/modules/EspaceClient/shared/hooks/usePortalAuth';

export function AdminPortalPreviewProvider({ projectId, children }: { projectId: string; children: ReactNode }) {
  const navigate = useNavigate();
  const [project, setProject] = useState<PortalProject | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'not-found'>('loading');

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await portalSupabase
        .from('projects_v2')
        .select('id, name, client_name, status, portal_client_email')
        .eq('id', projectId)
        .maybeSingle();
      if (!alive) return;
      if (error || !data) { setState('not-found'); return; }
      setProject(data as PortalProject);
      setState('ready');
    })();
    return () => { alive = false; };
  }, [projectId]);

  if (state === 'loading') return <div className="p-10 text-center text-sm text-muted-foreground">Chargement de l'aperçu…</div>;
  if (state === 'not-found' || !project) return <div className="p-10 text-center text-sm text-muted-foreground">Projet introuvable.</div>;

  return (
    <PortalProvider value={{
      email: project.portal_client_email ?? '',
      project,
      previewMode: true,
      signOut: async () => { navigate('/portails/clients'); },
    }}>
      {children}
    </PortalProvider>
  );
}
```
(Vérifier le type exact `PortalProject` exporté par `usePortalAuth` et ajuster les colonnes `select` en conséquence.)

- [ ] **Step 2 — Type-check.** Run: `npx tsc --noEmit` — Expected: exit 0.

- [ ] **Step 3 — Commit.**
```bash
git add src/modules/EspaceClient/admin/preview/AdminPortalPreviewProvider.tsx
git commit -m "feat(admin-portail): provider d apercu client (lecture seule)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task B2.3: Page d'aperçu (bandeau + PortalShell) + route admin

**Files:**
- Create: `src/modules/EspaceClient/admin/preview/AdminPortalPreviewPage.tsx`
- Modify: `src/modules/EspaceClient/admin/AdminRoutesShell.tsx`

- [ ] **Step 1 — Écrire la page d'aperçu.** Bandeau « Mode aperçu » + `PortalShell` (avec `<Outlet/>`) + sous-routes réutilisant les pages client.
```tsx
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AdminPortalPreviewProvider } from './AdminPortalPreviewProvider';
import { PortalShell } from '@/modules/EspaceClient/client/PortalShell';
import { DashboardPage } from '@/modules/EspaceClient/client/pages/DashboardPage';
import { ProjectPage } from '@/modules/EspaceClient/client/pages/ProjectPage';
import { DocumentsPage } from '@/modules/EspaceClient/client/pages/DocumentsPage';
import { InvoicesPage } from '@/modules/EspaceClient/client/pages/InvoicesPage';
import { SignaturesPage } from '@/modules/EspaceClient/client/pages/SignaturesPage';
import { ProfilePage } from '@/modules/EspaceClient/client/pages/ProfilePage';

export function AdminPortalPreviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  if (!projectId) return null;
  return (
    <AdminPortalPreviewProvider projectId={projectId}>
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-500/15 px-4 py-2 text-sm text-amber-200 ring-1 ring-amber-500/30">
        <span>Mode aperçu — vous voyez le portail tel que le client le voit (lecture seule).</span>
        <button type="button" onClick={() => navigate(`/portails/clients/${projectId}`)}
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/20 px-2.5 py-1 font-medium hover:bg-amber-500/30">
          <ArrowLeft className="h-4 w-4" /> Retour au cockpit
        </button>
      </div>
      <Routes>
        <Route element={<PortalShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="project" element={<ProjectPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="signatures" element={<SignaturesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </AdminPortalPreviewProvider>
  );
}
```

- [ ] **Step 2 — Enregistrer la route admin.** Dans `AdminRoutesShell.tsx`, ajouter (sous le guard admin existant), à côté de `clients/:projectId/*` :
```tsx
<Route path="clients/:projectId/apercu-client/*" element={<AdminPortalPreviewPage />} />
```
Import : `import { AdminPortalPreviewPage } from './preview/AdminPortalPreviewPage';`. **Important :** déclarer cette route **avant** la route catch-all `clients/:projectId/*` du cockpit si elle existe, sinon le cockpit capte `apercu-client` comme un onglet.

- [ ] **Step 3 — Type-check + build.** Run: `npx tsc --noEmit` (exit 0) puis `npx vite build` (`✓ built`).

- [ ] **Step 4 — Commit.**
```bash
git add src/modules/EspaceClient/admin/preview/AdminPortalPreviewPage.tsx src/modules/EspaceClient/admin/AdminRoutesShell.tsx
git commit -m "feat(admin-portail): route et page d apercu client" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

**Vérif Phase B2 (utilisateur) :** ouvrir manuellement `/portails/clients/<projectId>/apercu-client` en admin → le portail du client s'affiche avec le bandeau ; la nav interne (documents/factures/signatures) fonctionne ; tester **2 projets différents** → pas de fuite de données entre eux.

---

## PHASE B3 — Lecture seule + bouton cockpit

### Task B3.1: Masquer les actions d'écriture en previewMode

**Files:**
- Modify: `src/modules/EspaceClient/client/pages/InvoicesPage.tsx`
- Modify: `src/modules/EspaceClient/client/pages/ProfilePage.tsx`
- Modify: `src/modules/EspaceClient/client/pages/SignaturesPage.tsx`

- [ ] **Step 1 — InvoicesPage.** Récupérer `const { previewMode } = usePortal();` (import `usePortal` depuis `@/modules/EspaceClient/shared/context/PortalContext`). Envelopper le bouton de paiement Stripe (~ligne 50-62, l'appel `portal-create-checkout-session`) dans `{!previewMode && ( … )}`.

- [ ] **Step 2 — ProfilePage.** Idem : `const { previewMode } = usePortal();`. Désactiver les soumissions : sur les boutons « Enregistrer » (profil) et « Changer le mot de passe » (~lignes 32-46), ajouter `disabled={previewMode || <disabled existant>}`, ou masquer les formulaires via `{!previewMode && ( … )}` si plus simple.

- [ ] **Step 3 — SignaturesPage.** Idem : masquer/désactiver le CTA d'ouverture DocuSeal (`docuseal_signing_url`) en previewMode, pour ne pas lancer une signature au nom du client.

- [ ] **Step 4 — Type-check + build.** Run: `npx tsc --noEmit` (exit 0) puis `npx vite build` (`✓ built`).

- [ ] **Step 5 — Commit.**
```bash
git add src/modules/EspaceClient/client/pages/InvoicesPage.tsx src/modules/EspaceClient/client/pages/ProfilePage.tsx src/modules/EspaceClient/client/pages/SignaturesPage.tsx
git commit -m "feat(portail): masque les actions d ecriture en mode apercu (lecture seule)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task B3.2: Bouton « Voir comme le client » dans le cockpit

**Files:**
- Modify: `src/modules/EspaceClient/admin/components/cockpit/CockpitClientHeader.tsx`

- [ ] **Step 1 — Ajouter le bouton.** Dans la zone d'actions/KPI du header, ajouter un bouton qui navigue vers l'aperçu du `projectId` courant. Récupérer le projectId (déjà disponible via `useParams` dans l'arbre cockpit, ou via une prop existante du header — vérifier la source). Exemple :
```tsx
import { useNavigate, useParams } from 'react-router-dom';
import { Eye } from 'lucide-react';
// …
const navigate = useNavigate();
const { projectId } = useParams<{ projectId: string }>();
// dans le rendu, zone actions :
{projectId && (
  <button type="button" onClick={() => navigate(`/portails/clients/${projectId}/apercu-client`)}
    className="inline-flex items-center gap-1.5 rounded-lg bg-surface-3 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2">
    <Eye className="h-4 w-4" /> Voir comme le client
  </button>
)}
```
(Si `CockpitClientHeader` reçoit déjà le client/projet en prop, utiliser cet id plutôt que `useParams`.)

- [ ] **Step 2 — Type-check + build.** Run: `npx tsc --noEmit` (exit 0) puis `npx vite build` (`✓ built`).

- [ ] **Step 3 — Commit.**
```bash
git add src/modules/EspaceClient/admin/components/cockpit/CockpitClientHeader.tsx
git commit -m "feat(admin-portail): bouton Voir comme le client dans le header cockpit" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

**Vérif Phase B3 (utilisateur) :** depuis le cockpit d'un client, le bouton « Voir comme le client » ouvre l'aperçu ; aucune action d'écriture (paiement, édition profil, signature) n'est disponible en aperçu ; route inaccessible en non-admin.

---

## Self-Review (writing-plans)

- **Couverture spec :** A (3 cartes + compactage) → Tasks A1-A3 ✓. B1 couche data + previewMode → B1.1-B1.3 ✓. B2 provider+route+basePath → B2.1-B2.3 ✓. B3 lecture seule + bouton → B3.1-B3.2 ✓. Décision « zéro migration » respectée (aucune tâche SQL). ✓
- **Placeholders :** aucun « TBD/TODO » ; les rares incertitudes (typage chaîné Postgrest, source du projectId dans le header, exposition `deleted_at`) sont des **vérifications explicites** à l'exécution, pas des trous — chacune a une consigne de résolution.
- **Cohérence des types :** `previewMode: boolean` (B1.1) consommé en B2.2/B3.1 ; `usePortalInstallments(invoiceIds: string[])` (B1.3) consommé dans InvoicesPage ; `signaturePreviewTarget` renvoie `SignaturePreview` consommé en A3. ✓
- **Risque clé :** le typage chaîné `PostgrestFilterBuilder` dans `useList` (B1.2) — interdiction de `any` ; si tsc résiste, typer `q` explicitement. Noté dans la tâche.
