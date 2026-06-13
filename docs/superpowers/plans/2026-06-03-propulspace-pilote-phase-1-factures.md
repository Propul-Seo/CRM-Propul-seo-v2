# Propul'Space pilote — Phase 1 (Factures) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à l'admin de créer, éditer, envoyer une facture (+ acomptes) depuis le panneau client `/admin/propulspace/clients/:projectId/factures`, le client la voit, la paie (Stripe) et télécharge son PDF.

**Architecture:** UI admin dans l'onglet Factures du `AdminClientPanel`. Lectures via la vue `propulspace_invoices_v2`/`propulspace_invoice_installments_v2` (l'admin voit tout, drafts compris). Écritures via les RPC `admin_create_invoice` / `admin_update_invoice` / `admin_send_invoice` (migrations 270/271, appelées par le wrapper `adminRpc`). À l'envoi : passage `sent`+lock, génération PDF (edge `generate-invoice-pdf`, dégradée si service PDF non configuré), email `invoice-sent` (edge `send-portal-email`, dégradé si Brevo non configuré). Le paiement réutilise l'edge existante `portal-create-checkout-session` + `stripe-webhook` côté client (déjà câblés dans `InvoicesPage`).

**Tech Stack:** React 18 + TS strict, Supabase JS (proxy `v2`, `functions.invoke`), shadcn/ui (Sheet/Dialog/Button/Input), Tailwind, Deno edge functions, Playwright.

**Spec:** `docs/superpowers/specs/2026-06-03-propulspace-admin-pilote-design.md` (§3.3, §3.4, phase 1)
**Pré-requis bloquant :** migrations **270 + 271 appliquées** sur Supabase + types régénérés (`src/types/database.ts`). Le reste (Stripe/Brevo/PDF) **dégrade gracieusement** sans secrets — l'E2E Stripe (Task 7) est `skip` tant que les secrets de test ne sont pas posés.

---

## Conventions
- Pas de `any` hors du cast isolé dans `adminRpc.ts`. TS strict. Tailwind only. French UI. Alias `@/`.
- **Gate par tâche** : `npm run build` (vite) compile + zéro nouvelle erreur tsc sur les fichiers touchés (`npx tsc -b --noEmit 2>&1 | grep -iE "admin/(pages|components|hooks|lib)"` vide hormis le préexistant) + vérif visuelle quand un écran est touché.
- Commits : un par tâche, préfixe `feat(propulspace-admin):` / `feat(propulspace):` (edge).
- Réutiliser les primitives `shared/components` (`StatusBadge`, `Hero`, `EmptyState`, `SectionHead`) et les composants shadcn (`Button`, `Dialog`, `Input`, `Label`). Lire `src/modules/EspaceClient/client/pages/InvoicesPage.tsx` pour le rendu facture/acompte et `src/modules/EspaceClient/admin/LeadsQualifiesPage.tsx` pour les conventions admin.

## File Structure

```
src/modules/EspaceClient/admin/
├── lib/adminRpc.ts                      MODIFIER  — déclarer les 3 RPC factures
├── hooks/useAdminInvoices.ts            CRÉER     — read + create/update/send + pdf + email
├── components/
│   ├── AdminInvoiceForm.tsx             CRÉER     — formulaire création (lignes + acomptes)
│   └── InvoicesTab.tsx                  CRÉER     — liste + créer + envoyer/relancer/PDF
└── pages/AdminClientPanel.tsx           MODIFIER  — route `factures` → <InvoicesTab/>
supabase/
├── functions/generate-invoice-pdf/index.ts   CRÉER  — PDF FR, upload propulspace-documents, set pdf_url+hash
└── migrations/…_272_admin_set_invoice_pdf.sql CRÉER  — RPC d'écriture pdf_url/hash (appliquée à la main)
tests/e2e/
└── propulspace-portal-stripe.spec.ts    CRÉER     — E2E paiement (skip sans secrets Stripe)
```

---

## Task 1 : Déclarer les RPC factures dans `adminRpc.ts`

**Files:** Modify `src/modules/EspaceClient/admin/lib/adminRpc.ts`

⚠️ À faire APRÈS application des migrations 270/271 + régénération des types.

- [ ] **Step 1 : Remplacer l'interface `AdminRpcMap` vide par les 3 signatures**

```ts
export interface AdminRpcMap {
  admin_create_invoice: {
    args: {
      p_project_id: string;
      p_amount_subtotal: number;
      p_is_deposit?: boolean;
      p_vat_rate?: number;
      p_line_items?: Array<{ label: string; amount: number }>;
      p_issue_date?: string;        // 'YYYY-MM-DD'
      p_due_date?: string | null;
      p_client_visible_notes?: string | null;
      p_internal_notes?: string | null;
      p_installments?: Array<{ label: string; amount: number; due_date: string }>;
    };
    returns: string;                // invoice id (uuid)
  };
  admin_update_invoice: {
    args: {
      p_invoice_id: string;
      p_amount_subtotal?: number | null;
      p_vat_rate?: number | null;
      p_line_items?: Array<{ label: string; amount: number }> | null;
      p_due_date?: string | null;
      p_client_visible_notes?: string | null;
      p_internal_notes?: string | null;
    };
    returns: null;
  };
  admin_send_invoice: {
    args: { p_invoice_id: string };
    returns: null;
  };
}
```
(Remove the now-unneeded `@ts-expect-error`/empty-interface lint disable if present — an interface with members no longer triggers `no-empty-object-type`.)

- [ ] **Step 2 : Build + commit**

Run: `npm run build` → Expected: clean vite build, no new tsc error from `adminRpc.ts`.
```bash
git add src/modules/EspaceClient/admin/lib/adminRpc.ts
git commit -m "feat(propulspace-admin): typer les RPC factures dans adminRpc"
```

---

## Task 2 : Hook `useAdminInvoices`

**Files:** Create `src/modules/EspaceClient/admin/hooks/useAdminInvoices.ts`

Lecture des factures + acomptes d'un projet (admin voit les drafts) ; mutations via `adminRpc` ; à l'envoi, déclenche l'edge PDF puis l'email `invoice-sent` (les deux non bloquants/dégradés).

- [ ] **Step 1 : Écrire le hook**

```ts
import { useCallback, useEffect, useState } from 'react';
import { v2, supabase } from '@/lib/supabase';
import { adminRpc } from '../lib/adminRpc';
import type { PortalInvoice, PortalInstallment } from '@/modules/EspaceClient/client/hooks/usePortalData';

export interface CreateInvoiceInput {
  amountSubtotal: number;
  isDeposit: boolean;
  vatRate: number;                       // 0 par défaut (franchise art. 293 B)
  lineItems: Array<{ label: string; amount: number }>;
  issueDate: string;                     // 'YYYY-MM-DD'
  dueDate?: string | null;
  clientVisibleNotes?: string | null;
  installments: Array<{ label: string; amount: number; due_date: string }>;
}

interface UseAdminInvoicesResult {
  invoices: PortalInvoice[];
  installmentsByInvoice: Map<string, PortalInstallment[]>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createInvoice: (input: CreateInvoiceInput) => Promise<{ id: string | null; error: string | null }>;
  sendInvoice: (invoice: PortalInvoice, clientEmail: string | null) => Promise<{ error: string | null }>;
  remindInvoice: (invoice: PortalInvoice, clientEmail: string | null) => Promise<{ error: string | null }>;
}

export function useAdminInvoices(projectId: string): UseAdminInvoicesResult {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [installmentsByInvoice, setMap] = useState<Map<string, PortalInstallment[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [inv, inst] = await Promise.all([
      v2.from('propulspace_invoices').select('*').eq('project_id', projectId).order('issue_date', { ascending: false }),
      v2.from('propulspace_invoice_installments').select('*').order('due_date', { ascending: true }),
    ]);
    if (inv.error) { setError(inv.error.message); setInvoices([]); setLoading(false); return; }
    setError(null);
    const rows = (inv.data ?? []) as unknown as PortalInvoice[];
    setInvoices(rows);
    const ids = new Set(rows.map(r => r.id));
    const map = new Map<string, PortalInstallment[]>();
    ((inst.data ?? []) as unknown as PortalInstallment[]).forEach(i => {
      if (!ids.has(i.invoice_id)) return;        // limiter aux factures de ce projet
      const arr = map.get(i.invoice_id) ?? [];
      arr.push(i); map.set(i.invoice_id, arr);
    });
    setMap(map);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const createInvoice = useCallback<UseAdminInvoicesResult['createInvoice']>(async (input) => {
    const { data, error: err } = await adminRpc('admin_create_invoice', {
      p_project_id: projectId,
      p_amount_subtotal: input.amountSubtotal,
      p_is_deposit: input.isDeposit,
      p_vat_rate: input.vatRate,
      p_line_items: input.lineItems,
      p_issue_date: input.issueDate,
      p_due_date: input.dueDate ?? null,
      p_client_visible_notes: input.clientVisibleNotes ?? null,
      p_installments: input.installments,
    });
    if (err) return { id: null, error: err.message };
    await refresh();
    return { id: typeof data === 'string' ? data : null, error: null };
  }, [projectId, refresh]);

  // Envoi : sent+lock (RPC) → PDF (edge, non bloquant) → email invoice-sent (edge, non bloquant)
  const sendInvoice = useCallback<UseAdminInvoicesResult['sendInvoice']>(async (invoice, clientEmail) => {
    const { error: err } = await adminRpc('admin_send_invoice', { p_invoice_id: invoice.id });
    if (err) return { error: err.message };
    // best-effort : on n'échoue pas l'envoi si PDF/email ne sont pas configurés
    await supabase.functions.invoke('generate-invoice-pdf', { body: { invoice_id: invoice.id } }).catch(() => undefined);
    if (clientEmail) {
      await supabase.functions.invoke('send-portal-email', {
        body: {
          template_key: 'invoice-sent',
          to: { email: clientEmail },
          params: { invoice_number: invoice.invoice_number, amount_total: String(invoice.amount_total) },
          dedupe_key: `${invoice.id}-sent`,
        },
      }).catch(() => undefined);
    }
    await refresh();
    return { error: null };
  }, [refresh]);

  const remindInvoice = useCallback<UseAdminInvoicesResult['remindInvoice']>(async (invoice, clientEmail) => {
    if (!clientEmail) return { error: 'Pas d\'email client' };
    const today = new Date().toISOString().slice(0, 10);
    const { error: err } = await supabase.functions.invoke('send-portal-email', {
      body: {
        template_key: 'invoice-reminder',
        to: { email: clientEmail },
        params: { invoice_number: invoice.invoice_number, amount_total: String(invoice.amount_total) },
        dedupe_key: `${invoice.id}-reminder-${today}`,
      },
    });
    return { error: err ? err.message : null };
  }, []);

  return { invoices, installmentsByInvoice, loading, error, refresh, createInvoice, sendInvoice, remindInvoice };
}
```

- [ ] **Step 2 : Vérifs** — confirmer que `PortalInvoice`/`PortalInstallment` sont bien exportés depuis `client/hooks/usePortalData` (ils le sont). Confirmer le nom de la vue installments via le proxy : `v2.from('propulspace_invoice_installments')` → `propulspace_invoice_installments_v2` (règle `${table}_v2`).

- [ ] **Step 3 : Build + commit**

Run: `npm run build` → clean.
```bash
git add src/modules/EspaceClient/admin/hooks/useAdminInvoices.ts
git commit -m "feat(propulspace-admin): hook useAdminInvoices (read + create/send/relancer)"
```

---

## Task 3 : `AdminInvoiceForm` (formulaire de création)

**Files:** Create `src/modules/EspaceClient/admin/components/AdminInvoiceForm.tsx`

Formulaire dans un `Dialog` shadcn : lignes (label + montant), case « Acompte », TVA (défaut 0), dates, notes client, et acomptes optionnels. Le sous-total = somme des lignes. Validation : ≥1 ligne avec montant > 0 ; si acomptes, leur somme ≤ total.

- [ ] **Step 1 : Écrire le composant**

```tsx
import { useMemo, useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreateInvoiceInput } from '../hooks/useAdminInvoices';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateInvoiceInput) => Promise<{ id: string | null; error: string | null }>;
}

type Line = { label: string; amount: string };
type Inst = { label: string; amount: string; due_date: string };

const todayISO = () => new Date().toISOString().slice(0, 10);

export function AdminInvoiceForm({ open, onOpenChange, onSubmit }: Props) {
  const [lines, setLines] = useState<Line[]>([{ label: '', amount: '' }]);
  const [isDeposit, setIsDeposit] = useState(false);
  const [vatRate, setVatRate] = useState('0');
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [installments, setInstallments] = useState<Inst[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0),
    [lines],
  );
  const total = useMemo(() => subtotal * (1 + (parseFloat(vatRate) || 0) / 100), [subtotal, vatRate]);

  function reset() {
    setLines([{ label: '', amount: '' }]); setIsDeposit(false); setVatRate('0');
    setIssueDate(todayISO()); setDueDate(''); setNotes(''); setInstallments([]); setFormError(null);
  }

  async function handleSubmit() {
    const cleanLines = lines.filter(l => l.label.trim() && parseFloat(l.amount) > 0)
      .map(l => ({ label: l.label.trim(), amount: parseFloat(l.amount) }));
    if (cleanLines.length === 0) { setFormError('Ajoutez au moins une ligne avec un montant.'); return; }
    const cleanInst = installments.filter(i => parseFloat(i.amount) > 0 && i.due_date)
      .map(i => ({ label: i.label.trim() || 'Acompte', amount: parseFloat(i.amount), due_date: i.due_date }));
    const instSum = cleanInst.reduce((s, i) => s + i.amount, 0);
    if (cleanInst.length > 0 && instSum > total + 0.01) {
      setFormError('La somme des acomptes dépasse le total.'); return;
    }
    setSubmitting(true); setFormError(null);
    const { error } = await onSubmit({
      amountSubtotal: cleanLines.reduce((s, l) => s + l.amount, 0),
      isDeposit, vatRate: parseFloat(vatRate) || 0, lineItems: cleanLines,
      issueDate, dueDate: dueDate || null, clientVisibleNotes: notes.trim() || null,
      installments: cleanInst,
    });
    setSubmitting(false);
    if (error) { setFormError(error); return; }
    reset(); onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nouvelle facture</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Lignes</Label>
            {lines.map((l, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Désignation" value={l.label}
                  onChange={e => setLines(ls => ls.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                <Input type="number" placeholder="€ HT" className="w-28" value={l.amount}
                  onChange={e => setLines(ls => ls.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))} />
                <Button type="button" variant="ghost" size="icon"
                  onClick={() => setLines(ls => ls.length > 1 ? ls.filter((_, j) => j !== i) : ls)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setLines(ls => [...ls, { label: '', amount: '' }])}>
              <Plus className="mr-1 h-4 w-4" /> Ligne
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>TVA (%)</Label><Input type="number" value={vatRate} onChange={e => setVatRate(e.target.value)} /></div>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input type="checkbox" checked={isDeposit} onChange={e => setIsDeposit(e.target.checked)} /> Facture d'acompte
            </label>
            <div><Label>Émission</Label><Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
            <div><Label>Échéance</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          </div>

          <div><Label>Note visible client</Label><Input value={notes} onChange={e => setNotes(e.target.value)} /></div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Acomptes / échéances (optionnel)</Label>
              <Button type="button" variant="outline" size="sm"
                onClick={() => setInstallments(is => [...is, { label: '', amount: '', due_date: '' }])}>
                <Plus className="mr-1 h-4 w-4" /> Échéance
              </Button>
            </div>
            {installments.map((it, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Libellé" value={it.label}
                  onChange={e => setInstallments(is => is.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                <Input type="number" placeholder="€" className="w-24" value={it.amount}
                  onChange={e => setInstallments(is => is.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))} />
                <Input type="date" className="w-40" value={it.due_date}
                  onChange={e => setInstallments(is => is.map((x, j) => j === i ? { ...x, due_date: e.target.value } : x))} />
                <Button type="button" variant="ghost" size="icon" onClick={() => setInstallments(is => is.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
            Sous-total HT <strong>{subtotal.toFixed(2)} €</strong> · Total TTC <strong>{total.toFixed(2)} €</strong>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Créer (brouillon)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2 : Vérifs** — confirmer les chemins shadcn `@/components/ui/dialog`, `input`, `label` existent (sinon adapter). Pas de `any`.

- [ ] **Step 3 : Build + commit**

```bash
git add src/modules/EspaceClient/admin/components/AdminInvoiceForm.tsx
git commit -m "feat(propulspace-admin): formulaire de création de facture"
```

---

## Task 4 : `InvoicesTab` (liste + actions)

**Files:** Create `src/modules/EspaceClient/admin/components/InvoicesTab.tsx`

Liste des factures du projet avec statut, montant, et actions selon le statut : `draft` → **Envoyer** ; `sent`/`overdue` → **Relancer** ; PDF si présent. Bouton **+ Nouvelle facture** ouvre `AdminInvoiceForm`.

- [ ] **Step 1 : Écrire le composant** (charge l'email client depuis la vue health ou via prop ; ici on le passe en prop depuis le panel)

```tsx
import { useState } from 'react';
import { Plus, Send, Bell, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge, EmptyState, SectionHead } from '@/modules/EspaceClient/shared/components';
import { useAdminInvoices } from '../hooks/useAdminInvoices';
import { AdminInvoiceForm } from './AdminInvoiceForm';
import { getSignedStorageUrl } from '@/modules/EspaceClient/client/hooks/usePortalData';
import type { PortalInvoice } from '@/modules/EspaceClient/client/hooks/usePortalData';

const BUCKET = 'propulspace-documents';
const money = (a: string | number, c = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c }).format(typeof a === 'string' ? parseFloat(a) : a);

export function InvoicesTab({ projectId, clientEmail }: { projectId: string; clientEmail: string | null }) {
  const { invoices, loading, error, createInvoice, sendInvoice, remindInvoice } = useAdminInvoices(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onSend(inv: PortalInvoice) {
    setBusyId(inv.id); await sendInvoice(inv, clientEmail); setBusyId(null);
  }
  async function onRemind(inv: PortalInvoice) {
    setBusyId(inv.id); await remindInvoice(inv, clientEmail); setBusyId(null);
  }
  async function onPdf(inv: PortalInvoice) {
    if (!inv.pdf_url) return;
    const url = await getSignedStorageUrl(BUCKET, inv.pdf_url);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <SectionHead title={`${invoices.length} facture${invoices.length > 1 ? 's' : ''}`} />
        <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="mr-1 h-4 w-4" /> Nouvelle facture</Button>
      </div>

      {loading && <div className="py-6 text-sm text-gray-500"><Loader2 className="inline h-4 w-4 animate-spin" /> Chargement…</div>}
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {!loading && invoices.length === 0 && <EmptyState icon={FileText} title="Aucune facture" body="Créez la première facture de ce client." />}

      <ul className="divide-y divide-gray-100">
        {invoices.map(inv => (
          <li key={inv.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{inv.invoice_number}{inv.is_deposit && <span className="ml-2 text-xs text-gray-400">Acompte</span>}</p>
              <p className="text-xs text-gray-500">Émise le {new Date(inv.issue_date).toLocaleDateString('fr-FR')}</p>
            </div>
            <span className="text-sm font-bold">{money(inv.amount_total, inv.currency)}</span>
            <StatusBadge status={inv.status} />
            {inv.pdf_url && <Button variant="ghost" size="icon" onClick={() => onPdf(inv)} title="PDF"><FileText className="h-4 w-4" /></Button>}
            {inv.status === 'draft' && (
              <Button size="sm" onClick={() => onSend(inv)} disabled={busyId === inv.id}>
                {busyId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-1 h-4 w-4" />Envoyer</>}
              </Button>
            )}
            {(inv.status === 'sent' || inv.status === 'overdue') && (
              <Button variant="outline" size="sm" onClick={() => onRemind(inv)} disabled={busyId === inv.id || !clientEmail}>
                {busyId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Bell className="mr-1 h-4 w-4" />Relancer</>}
              </Button>
            )}
          </li>
        ))}
      </ul>

      <AdminInvoiceForm open={formOpen} onOpenChange={setFormOpen} onSubmit={createInvoice} />
    </div>
  );
}
```

- [ ] **Step 2 : Build + commit**

```bash
git add src/modules/EspaceClient/admin/components/InvoicesTab.tsx
git commit -m "feat(propulspace-admin): onglet Factures (liste + envoyer/relancer/pdf)"
```

---

## Task 5 : Brancher l'onglet dans `AdminClientPanel`

**Files:** Modify `src/modules/EspaceClient/admin/pages/AdminClientPanel.tsx`

- [ ] **Step 1 : Remplacer la coquille `factures`**

Le panel doit fournir `projectId` (déjà via `useParams`) et l'email client. Récupérer l'email via une lecture légère de `projects_portal_health_v2` filtrée, OU le passer depuis l'état déjà chargé. Simplement : lire l'email dans le panel.

```tsx
// en tête du fichier
import { InvoicesTab } from '../components/InvoicesTab';
import { useAdminClientEmail } from '../hooks/useAdminClients'; // voir step 2
```

Remplacer `<Route path="factures" element={<TabPlaceholder name="Factures" />} />` par :
```tsx
<Route path="factures" element={<InvoicesRoute />} />
```
et ajouter dans le fichier :
```tsx
function InvoicesRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  const email = useAdminClientEmail(projectId);
  if (!projectId) return null;
  return <InvoicesTab projectId={projectId} clientEmail={email} />;
}
```

- [ ] **Step 2 : Ajouter `useAdminClientEmail` dans `useAdminClients.ts`** (petit hook dérivé, évite un fetch lourd)

```ts
export function useAdminClientEmail(projectId: string | undefined): string | null {
  const { clients } = useAdminClients();
  if (!projectId) return null;
  return clients.find(c => c.project_id === projectId)?.portal_client_email ?? null;
}
```
(Acceptable pour le pilote ; à terme, le panel chargera le projet complet en Phase 4. Si `useAdminClients` est jugé trop lourd ici, lire directement `v2.from('projects_portal_health').select('portal_client_email').eq('project_id', projectId).maybeSingle()`.)

- [ ] **Step 3 : Build + vérif visuelle**

Run: `npm run build` → clean. Puis `npm run dev`, ouvrir un client → onglet Factures : créer une facture brouillon, vérifier qu'elle apparaît, cliquer Envoyer (sans secrets : la facture passe `sent`, pas d'erreur bloquante ; PDF/email silencieux).

- [ ] **Step 4 : Commit**

```bash
git add src/modules/EspaceClient/admin
git commit -m "feat(propulspace-admin): brancher l'onglet Factures dans le panneau client"
```

---

## Task 6 : Edge `generate-invoice-pdf`

**Files:** Create `supabase/functions/generate-invoice-pdf/index.ts`

Calquée sur `supabase/functions/generate-quote-pdf/index.ts` (PDFMonkey). **Accès données : via le JWT admin** (le service_role ne satisfait ni `is_admin()` ni `portal_project_id()` dans les vues `_v2`, donc ne « voit » pas la facture). Le service_role ne sert qu'à l'**upload Storage** (bypass des policies bucket). L'écriture `pdf_url`/`pdf_hash_sha256` passe par une **RPC dédiée** (migration 272). **Dégrade** (200, `pdf: false`) si `PDF_API_KEY`/template absents.

- [ ] **Step 1 : Migration 272 — `admin_set_invoice_pdf`** — Create `supabase/migrations/20260603102000_propulspace_272_admin_set_invoice_pdf.sql` (⚠️ à appliquer à la main) :

```sql
-- propulspace 272 — l'edge generate-invoice-pdf écrit le chemin PDF + hash via cette RPC
-- (appelée avec le JWT admin ; le service_role ne traverse pas les vues _v2).
create or replace function public.admin_set_invoice_pdf(
  p_invoice_id uuid, p_url text, p_hash text
) returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  update propulspace.invoices set pdf_url = p_url, pdf_hash_sha256 = p_hash, updated_at = now()
   where id = p_invoice_id;   -- colonnes non bloquées par tg_invoice_immutable
end; $$;

revoke all on function public.admin_set_invoice_pdf(uuid,text,text) from public, anon;
grant execute on function public.admin_set_invoice_pdf(uuid,text,text) to authenticated;
```
Puis l'ajouter à `AdminRpcMap` (adminRpc.ts) n'est PAS nécessaire (appelée côté edge, pas front).

- [ ] **Step 2 : Lire `generate-quote-pdf/index.ts`** pour la structure (CORS, createClient, getUser, fonction `generatePDF` PDFMonkey). Puis écrire l'edge :

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s: number) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const PDF_API_KEY = Deno.env.get('PDF_API_KEY') ?? '';
const PDF_INVOICE_TEMPLATE_ID = Deno.env.get('PDF_INVOICE_TEMPLATE_ID') ?? '';
const BUCKET = 'propulspace-documents';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // 1) garde admin via le JWT (schéma de send-portal-email)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Auth requise' }, 401);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'JWT invalide' }, 401);
  const { data: isAdmin } = await userClient.rpc('is_admin');
  if (!isAdmin) return json({ error: 'Admin requis' }, 403);

  const { invoice_id } = await req.json().catch(() => ({}));
  if (!invoice_id) return json({ error: 'invoice_id requis' }, 400);

  // 2) lire la facture via le JWT admin (la vue _v2 la renvoie car is_admin() = true)
  const { data: inv, error: invErr } = await userClient.from('propulspace_invoices_v2').select('*').eq('id', invoice_id).maybeSingle();
  if (invErr || !inv) return json({ error: 'Facture introuvable' }, 404);

  // 3) dégradation gracieuse : pas de service PDF configuré → ne bloque pas l'envoi
  if (!PDF_API_KEY || !PDF_INVOICE_TEMPLATE_ID) {
    return json({ ok: true, pdf: false, reason: 'PDF service non configuré' }, 200);
  }

  // 4) générer le PDF (PDFMonkey) — voir Step 3 (copie de generatePDF de generate-quote-pdf)
  const pdfBytes = await generateInvoicePdf(inv);
  if (!pdfBytes) return json({ ok: true, pdf: false, reason: 'génération échouée' }, 200);

  // 5) upload Storage via service_role (bypass policies bucket) + hash SHA-256
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const path = `${inv.project_id}/invoices/${String(inv.invoice_number).replace(/\s+/g, '_')}.pdf`;
  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, pdfBytes, { contentType: 'application/pdf', upsert: true });
  if (upErr) return json({ error: `upload: ${upErr.message}` }, 500);
  const hashBuf = await crypto.subtle.digest('SHA-256', pdfBytes);
  const hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

  // 6) écrire pdf_url (= chemin) + hash via la RPC admin (JWT admin)
  const { error: updErr } = await userClient.rpc('admin_set_invoice_pdf', { p_invoice_id: invoice_id, p_url: path, p_hash: hash });
  if (updErr) return json({ error: `update: ${updErr.message}` }, 500);

  return json({ ok: true, pdf: true, path }, 200);
});
```

- [ ] **Step 3 :** Implémenter `generateInvoicePdf(inv)` en copiant `generatePDF` de `generate-quote-pdf` (create document → poll status → download), avec `document_template_id: PDF_INVOICE_TEMPLATE_ID` et un `payload` = facture + bloc agence (mentions FR : raison sociale, SIRET, « TVA non applicable, art. 293 B du CGI », n° séquentiel, snapshot client `inv.client_snapshot`). Renvoie `Uint8Array | null`.

- [ ] **Step 4 :** `supabase/config.toml` — déclarer `generate-invoice-pdf` (`verify_jwt = true`) en copiant le bloc d'une edge admin existante (`send-portal-email`).

- [ ] **Step 5 (⚠️ actions utilisateur, plus tard) :** appliquer la migration 272 ; déployer l'edge ; poser `PDF_API_KEY` + créer le template facture PDFMonkey → `PDF_INVOICE_TEMPLATE_ID`. Tester l'envoi → PDF visible côté client. (Sans ça : envoi OK, pas de PDF — dégradation attendue.)

- [ ] **Step 6 : Commit** (code de l'edge + migration ; pas le déploiement)

```bash
git add supabase/functions/generate-invoice-pdf supabase/config.toml supabase/migrations/20260603102000_propulspace_272_admin_set_invoice_pdf.sql
git commit -m "feat(propulspace): edge generate-invoice-pdf + RPC admin_set_invoice_pdf (PDF FR, dégradée)"
```

---

## Task 7 : E2E paiement Stripe (skip sans secrets) — GAP-31

**Files:** Create `tests/e2e/propulspace-portal-stripe.spec.ts`

- [ ] **Step 1 :** Lire `tests/e2e/fixtures/auth.ts` (fixture `adminPage`) + `propulspace-admin.spec.ts`. Écrire un parcours : admin crée+envoie une facture pour un projet de test → bascule sur la session client → la facture est visible → le bouton « Payer la facture entière » mène à Stripe (mode test). Gate par `test.skip` si les variables Stripe test / projet de test ne sont pas fournies.

```ts
import { test, expect } from './fixtures/auth';

const hasStripeTest = !!process.env.E2E_STRIPE_TEST && !!process.env.E2E_TEST_PROJECT_ID;

test.describe('Facturation portail (E2E Stripe)', () => {
  test.skip(!hasStripeTest, 'Nécessite E2E_STRIPE_TEST + E2E_TEST_PROJECT_ID + secrets Stripe test posés');

  test('admin crée+envoie une facture, le client peut lancer le paiement', async ({ adminPage }) => {
    const projectId = process.env.E2E_TEST_PROJECT_ID!;
    await adminPage.goto(`/admin/propulspace/clients/${projectId}/factures`);
    await adminPage.getByRole('button', { name: /Nouvelle facture/ }).click();
    await adminPage.getByPlaceholder('Désignation').fill('Prestation test E2E');
    await adminPage.getByPlaceholder('€ HT').fill('100');
    await adminPage.getByRole('button', { name: /Créer/ }).click();
    await adminPage.getByRole('button', { name: /Envoyer/ }).first().click();
    await expect(adminPage.getByText(/PS-/)).toBeVisible();
    // La suite (bascule session client + redirection Stripe) dépend du harness d'auth client ;
    // à compléter quand un compte client de test est disponible.
  });
});
```

- [ ] **Step 2 :** `npx playwright test tests/e2e/propulspace-portal-stripe.spec.ts` → doit être **skipped** (pas d'erreur) tant que les env ne sont pas posées.

- [ ] **Step 3 : Commit**

```bash
git add tests/e2e/propulspace-portal-stripe.spec.ts
git commit -m "test(propulspace): squelette E2E paiement Stripe (skip sans secrets)"
```

**🚦 GATE PHASE 1** (quand secrets Stripe/PDF/Brevo posés) : admin crée → envoie → client voit la facture, télécharge le PDF, paie en test Stripe, la facture passe `paid` (webhook) et reçoit l'email. Sans secrets : tout le flux fonctionne **sauf** PDF/email/paiement réel (dégradés).

---

## Self-Review

- **Couverture spec** (§3.3/§3.4, phase 1) : RPC factures typées (T1) ; read+create+send+relancer (T2) ; formulaire (T3) ; liste+actions (T4) ; branchement panel (T5) ; PDF FR dégradable (T6) ; E2E Stripe GAP-31 (T7). ✓
- **Dépendances externes isolées** : Stripe/Brevo/PDF dégradent gracieusement → Phase 1 buildable sans secrets ; seules les actions utilisateur (déployer l'edge, poser PDF_API_KEY + template, secrets Stripe) restent, clairement balisées.
- **Placeholders** : T6 Step 3 décrit `generateInvoicePdf` en référence au code existant `generatePDF` (à copier) — consigne de copie d'un code réel, pas un placeholder vague ; upload/hash/MAJ complets.
- **Cohérence types** : `CreateInvoiceInput` (T2) consommé par `AdminInvoiceForm` (T3) ; `useAdminInvoices` (T2) consommé par `InvoicesTab` (T4) ; `adminRpc`/`AdminRpcMap` (T1) consommé par T2 ; noms de RPC identiques aux migrations 270/271/272.
- **Accès données edge (corrigé)** : lecture facture via le **JWT admin** (les vues `_v2` filtrent `is_admin()`, que le service_role ne satisfait pas) ; écriture `pdf_url`/`hash` via RPC `admin_set_invoice_pdf` (migration 272) ; service_role réservé à l'upload Storage.
- **Migrations à appliquer à la main pour cette phase** : 270 + 271 (déjà écrites, pré-requis) + **272** (admin_set_invoice_pdf, dans cette phase).
