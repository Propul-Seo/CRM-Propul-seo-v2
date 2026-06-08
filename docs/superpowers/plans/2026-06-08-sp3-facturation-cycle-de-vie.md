# Facturation — cycle de vie complet (plan d'implémentation)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre l'équipe autonome sur tout le cycle de vie d'une facture (créer → corriger → supprimer/annuler → envoyer), avec une numérotation sans trou, sans toucher la base à la main.

**Architecture:** On complète l'existant (RPC `admin_*` SECURITY DEFINER côté base + hook `useAdminInvoices` + `InvoicesTab`/`AdminInvoiceForm`). On déplace l'attribution du numéro de la création vers l'envoi (numéro devenu facultatif), on ajoute deux RPC `admin_delete_invoice`/`admin_cancel_invoice` calquées sur les onglets voisins, on branche l'édition de brouillon (RPC déjà existante), on extrait la validation du formulaire en fonction pure testée, et on complète le badge `partially_paid`.

**Tech Stack:** PostgreSQL (RPC plpgsql), React 18 + TypeScript, Supabase JS, Vitest, Tailwind + shadcn/ui.

**Spec de référence :** `docs/superpowers/specs/2026-06-08-sp3-facturation-cycle-de-vie-design.md`

---

## Rappel des décisions

- **D1** Numéro à l'envoi : `invoice_number` devient nullable ; `next_invoice_number()` appelé dans `admin_send_invoice`, plus dans `admin_create_invoice`.
- **D2** Suppression : `admin_delete_invoice` seulement si `status='draft'` (acomptes en cascade).
- **D3** Annulation simple : `admin_cancel_invoice` si `status IN ('sent','overdue')` et non payée ; stocke motif + date.
- **D4** Édition brouillon : via `admin_update_invoice` (lignes/TVA/échéance/notes) ; **acomptes non éditables**.
- **D5** Compléter l'affichage de `partially_paid`.

## Contraintes d'application

- ⚠️ Le MCP Supabase pointe sur un autre projet → **la migration sera appliquée à la main par Lyes** dans le SQL Editor. On versionne le fichier, on ne l'exécute pas nous-mêmes.
- Le SQL n'est donc pas testable automatiquement en local → vérification = relecture + recette manuelle (Tâche 8).
- Modèle d'accès : tous les membres équipe gèrent tous les clients → **aucun filtrage par admin** à ajouter.

---

## File Structure

| Action | Fichier | Responsabilité |
|--------|---------|----------------|
| Créer | `supabase/migrations/20260608190000_propulspace_295_invoice_lifecycle.sql` | Numéro nullable + colonnes annulation + create/send modifiées + delete/cancel |
| Modifier | `src/modules/EspaceClient/admin/lib/adminRpc.ts` | Déclarer `admin_delete_invoice`, `admin_cancel_invoice` ; `admin_send_invoice` renvoie `string` |
| Créer | `src/modules/EspaceClient/admin/lib/invoiceFormValidation.ts` | Fonction pure `validateInvoiceForm` |
| Créer | `src/modules/EspaceClient/admin/lib/invoiceFormValidation.test.ts` | Tests Vitest de la validation |
| Modifier | `src/modules/EspaceClient/admin/hooks/useAdminInvoices.ts` | + `updateInvoice`/`deleteInvoice`/`cancelInvoice` ; `sendInvoice` utilise le numéro renvoyé |
| Modifier | `src/modules/EspaceClient/admin/components/AdminInvoiceForm.tsx` | Mode édition + branchement validation |
| Créer | `src/modules/EspaceClient/admin/components/CancelInvoiceDialog.tsx` | Fenêtre de saisie du motif d'annulation |
| Modifier | `src/modules/EspaceClient/admin/components/InvoicesTab.tsx` | « Brouillon » + boutons Modifier/Supprimer/Annuler |
| Modifier | `src/modules/EspaceClient/shared/components/Badge.tsx` | Entrée `partially_paid` |

---

## Task 1 : Migration base de données

**Files:**
- Create: `supabase/migrations/20260608190000_propulspace_295_invoice_lifecycle.sql`

- [ ] **Step 1 : Écrire la migration complète**

```sql
-- propulspace 295 — cycle de vie facture : numéro à l'envoi, suppression brouillon, annulation.
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor). Ne pas rejouer si déjà passée.

-- 1. Numéro facultatif (le brouillon n'a pas de numéro avant l'envoi).
alter table propulspace.invoices alter column invoice_number drop not null;

-- 2. Traçabilité de l'annulation.
alter table propulspace.invoices add column if not exists cancellation_reason text;
alter table propulspace.invoices add column if not exists cancelled_at timestamptz;

-- 3. Création : ne plus consommer de numéro (insérer NULL). Corps identique à la 270
--    hormis le numéro.
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
  p_installments        jsonb   default '[]'::jsonb
) returns uuid
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare
  v_invoice_id uuid; v_amount_vat numeric; v_total numeric;
  v_snapshot jsonb; v_inst jsonb; v_idx int := 0; v_creator uuid;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;

  select jsonb_build_object(
           'company',    coalesce(client_company, name),
           'first_name', client_first_name,
           'phone',      client_phone,
           'email',      portal_client_email
         )
    into v_snapshot from public.projects_v2 where id = p_project_id;
  if v_snapshot is null then
    raise exception 'project % not found', p_project_id using errcode = 'P0002';
  end if;

  select id into v_creator from public.users where auth_user_id = auth.uid();
  v_amount_vat := round(p_amount_subtotal * p_vat_rate / 100.0, 2);
  v_total      := p_amount_subtotal + v_amount_vat;

  insert into propulspace.invoices(
    invoice_number, project_id, client_snapshot, is_deposit,
    amount_subtotal, vat_rate, amount_vat, amount_total, currency,
    line_items, status, issue_date, due_date,
    client_visible_notes, internal_notes, created_by
  ) values (
    null, p_project_id, v_snapshot, p_is_deposit,
    p_amount_subtotal, p_vat_rate, v_amount_vat, v_total, 'EUR',
    coalesce(p_line_items,'[]'::jsonb), 'draft', p_issue_date,
    coalesce(p_due_date, p_issue_date + 30),
    p_client_visible_notes, p_internal_notes, v_creator
  ) returning id into v_invoice_id;

  for v_inst in select * from jsonb_array_elements(coalesce(p_installments,'[]'::jsonb))
  loop
    v_idx := v_idx + 1;
    insert into propulspace.invoice_installments(
      invoice_id, installment_number, label, amount, due_date, status
    ) values (
      v_invoice_id, v_idx,
      coalesce(v_inst->>'label', 'Acompte ' || v_idx),
      (v_inst->>'amount')::numeric,
      coalesce((v_inst->>'due_date')::date, p_issue_date + 30),
      'pending'
    );
  end loop;

  return v_invoice_id;
end; $$;

-- 4. Envoi : attribue le numéro (si absent) et renvoie le numéro.
--    DROP obligatoire car le type de retour change (void -> text).
drop function if exists public.admin_send_invoice(uuid);
create function public.admin_send_invoice(p_invoice_id uuid)
returns text
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_status text; v_number text;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  select status, invoice_number into v_status, v_number
    from propulspace.invoices where id = p_invoice_id;
  if v_status is null then raise exception 'invoice not found' using errcode='P0002'; end if;
  if v_status <> 'draft' then raise exception 'invoice already sent (status=%)', v_status using errcode='42501'; end if;
  if v_number is null then v_number := propulspace.next_invoice_number(); end if;
  update propulspace.invoices
     set invoice_number = v_number, status = 'sent', is_locked = true, updated_at = now()
   where id = p_invoice_id;
  return v_number;
end; $$;

-- 5. Suppression d'un brouillon (acomptes en cascade via FK ON DELETE CASCADE).
create or replace function public.admin_delete_invoice(p_invoice_id uuid)
returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_status text;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  select status into v_status from propulspace.invoices where id = p_invoice_id;
  if v_status is null then raise exception 'invoice not found' using errcode='P0002'; end if;
  if v_status <> 'draft' then
    raise exception 'only draft invoices can be deleted (status=%)', v_status using errcode='42501';
  end if;
  delete from propulspace.invoices where id = p_invoice_id;
end; $$;

-- 6. Annulation simple : facture envoyée/en retard et NON payée.
create or replace function public.admin_cancel_invoice(p_invoice_id uuid, p_reason text default null)
returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_status text; v_paid timestamptz;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  select status, paid_at into v_status, v_paid
    from propulspace.invoices where id = p_invoice_id;
  if v_status is null then raise exception 'invoice not found' using errcode='P0002'; end if;
  if v_status not in ('sent','overdue') or v_paid is not null then
    raise exception 'invoice not cancellable (status=%)', v_status using errcode='42501';
  end if;
  update propulspace.invoices
     set status = 'cancelled', cancellation_reason = p_reason, cancelled_at = now(), updated_at = now()
   where id = p_invoice_id;
end; $$;

-- 7. Droits (le DROP de admin_send_invoice a effacé ses grants → les reposer).
revoke all on function public.admin_send_invoice(uuid)        from public, anon;
revoke all on function public.admin_delete_invoice(uuid)      from public, anon;
revoke all on function public.admin_cancel_invoice(uuid,text) from public, anon;
grant execute on function public.admin_send_invoice(uuid)        to authenticated;
grant execute on function public.admin_delete_invoice(uuid)      to authenticated;
grant execute on function public.admin_cancel_invoice(uuid,text) to authenticated;
```

- [ ] **Step 2 : Vérifier la cohérence (relecture)**

Points à confirmer en relecture (pas d'exécution locale) :
- `admin_send_invoice` est bien `drop` puis `create` (changement de type de retour).
- Le trigger d'immuabilité (`tg_invoice_immutable`) n'est pas gêné : à l'envoi `old.is_locked=false` ; l'annulation ne touche pas montants/lignes/numéro.
- `cancelled` est déjà dans le `CHECK` de `status` (mig 210) → pas de modif du CHECK.

- [ ] **Step 3 : Commit**

```bash
git add supabase/migrations/20260608190000_propulspace_295_invoice_lifecycle.sql
git commit -m "feat(facturation): migration 295 - numero a l'envoi + suppression/annulation facture"
```

---

## Task 2 : Helper `adminRpc`

**Files:**
- Modify: `src/modules/EspaceClient/admin/lib/adminRpc.ts:45-48` (retour de `admin_send_invoice`) et bloc `AdminRpcMap` (ajouts)

- [ ] **Step 1 : Changer le type de retour de `admin_send_invoice`**

Remplacer (lignes ~45-48) :

```ts
  admin_send_invoice: {
    args: { p_invoice_id: string };
    returns: string;                // invoice_number attribué à l'envoi
  };
```

- [ ] **Step 2 : Ajouter les deux nouvelles RPC dans `AdminRpcMap`**

Ajouter après `admin_send_invoice` :

```ts
  admin_delete_invoice: {
    args: { p_invoice_id: string };
    returns: null;
  };
  admin_cancel_invoice: {
    args: { p_invoice_id: string; p_reason?: string | null };
    returns: null;
  };
```

- [ ] **Step 3 : Vérifier la compilation**

Run: `npm run build`
Expected: build OK (pas d'erreur de type sur `adminRpc.ts`).

- [ ] **Step 4 : Commit**

```bash
git add src/modules/EspaceClient/admin/lib/adminRpc.ts
git commit -m "feat(facturation): declarer admin_delete_invoice/admin_cancel_invoice + retour numero a l'envoi"
```

---

## Task 3 : Validation du formulaire (TDD)

**Files:**
- Create: `src/modules/EspaceClient/admin/lib/invoiceFormValidation.ts`
- Test: `src/modules/EspaceClient/admin/lib/invoiceFormValidation.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

```ts
import { describe, it, expect } from 'vitest';
import { validateInvoiceForm, type InvoiceFormValues } from './invoiceFormValidation';

const base = (over: Partial<InvoiceFormValues> = {}): InvoiceFormValues => ({
  lines: [{ label: 'Prestation', amount: 1000 }],
  vatRate: 0,
  issueDate: '2026-06-08',
  dueDate: '',
  installments: [],
  ...over,
});

describe('validateInvoiceForm', () => {
  it('accepte un formulaire valide', () => {
    expect(validateInvoiceForm(base())).toBeNull();
  });

  it('refuse une facture sans ligne avec montant positif', () => {
    expect(validateInvoiceForm(base({ lines: [{ label: '', amount: 0 }] })))
      .toBe('Ajoutez au moins une ligne avec un montant positif.');
  });

  it('refuse un montant négatif', () => {
    expect(validateInvoiceForm(base({ lines: [{ label: 'X', amount: -10 }] })))
      .toBe('Les montants ne peuvent pas être négatifs.');
  });

  it("refuse une échéance antérieure à l'émission", () => {
    expect(validateInvoiceForm(base({ issueDate: '2026-06-08', dueDate: '2026-06-01' })))
      .toBe("L'échéance ne peut pas précéder la date d'émission.");
  });

  it('refuse une somme d\'acomptes supérieure au total', () => {
    expect(validateInvoiceForm(base({
      lines: [{ label: 'X', amount: 100 }],
      installments: [{ amount: 80, due_date: '2026-07-01' }, { amount: 50, due_date: '2026-08-01' }],
    }))).toBe('La somme des acomptes dépasse le total.');
  });
});
```

- [ ] **Step 2 : Lancer le test, vérifier qu'il échoue**

Run: `npx vitest run src/modules/EspaceClient/admin/lib/invoiceFormValidation.test.ts`
Expected: FAIL (`validateInvoiceForm` introuvable).

- [ ] **Step 3 : Écrire l'implémentation**

```ts
export interface InvoiceFormValues {
  lines: Array<{ label: string; amount: number }>;
  vatRate: number;
  issueDate: string;            // 'YYYY-MM-DD'
  dueDate: string;              // '' ou 'YYYY-MM-DD'
  installments: Array<{ amount: number; due_date: string }>;
}

// Renvoie un message d'erreur FR, ou null si le formulaire est valide.
export function validateInvoiceForm(v: InvoiceFormValues): string | null {
  if (v.lines.some((l) => l.amount < 0)) {
    return 'Les montants ne peuvent pas être négatifs.';
  }
  const valid = v.lines.filter((l) => l.label.trim() && l.amount > 0);
  if (valid.length === 0) {
    return 'Ajoutez au moins une ligne avec un montant positif.';
  }
  if (v.dueDate && v.dueDate < v.issueDate) {
    return "L'échéance ne peut pas précéder la date d'émission.";
  }
  const subtotal = valid.reduce((s, l) => s + l.amount, 0);
  const total = subtotal * (1 + (v.vatRate || 0) / 100);
  const instSum = v.installments.reduce((s, i) => s + i.amount, 0);
  if (v.installments.length > 0 && instSum > total + 0.01) {
    return 'La somme des acomptes dépasse le total.';
  }
  return null;
}
```

- [ ] **Step 4 : Lancer le test, vérifier qu'il passe**

Run: `npx vitest run src/modules/EspaceClient/admin/lib/invoiceFormValidation.test.ts`
Expected: PASS (5 tests verts).

- [ ] **Step 5 : Commit**

```bash
git add src/modules/EspaceClient/admin/lib/invoiceFormValidation.ts src/modules/EspaceClient/admin/lib/invoiceFormValidation.test.ts
git commit -m "feat(facturation): validation pure du formulaire de facture + tests"
```

---

## Task 4 : Hook `useAdminInvoices`

**Files:**
- Modify: `src/modules/EspaceClient/admin/hooks/useAdminInvoices.ts`

- [ ] **Step 1 : Ajouter le type `UpdateInvoiceInput` et étendre l'interface du résultat**

Après `CreateInvoiceInput` (ligne ~15), ajouter :

```ts
export interface UpdateInvoiceInput {
  amountSubtotal: number;
  vatRate: number;
  lineItems: Array<{ label: string; amount: number }>;
  dueDate?: string | null;
  clientVisibleNotes?: string | null;
}
```

Dans `UseAdminInvoicesResult`, ajouter ces trois signatures :

```ts
  updateInvoice: (invoiceId: string, input: UpdateInvoiceInput) => Promise<{ error: string | null }>;
  deleteInvoice: (invoiceId: string) => Promise<{ error: string | null }>;
  cancelInvoice: (invoiceId: string, reason: string) => Promise<{ error: string | null }>;
```

- [ ] **Step 2 : Implémenter `updateInvoice`, `deleteInvoice`, `cancelInvoice`**

Avant le `return { ... }` final, ajouter :

```ts
  const updateInvoice = useCallback<UseAdminInvoicesResult['updateInvoice']>(async (invoiceId, input) => {
    const { error: err } = await adminRpc('admin_update_invoice', {
      p_invoice_id: invoiceId,
      p_amount_subtotal: input.amountSubtotal,
      p_vat_rate: input.vatRate,
      p_line_items: input.lineItems,
      p_due_date: input.dueDate ?? null,
      p_client_visible_notes: input.clientVisibleNotes ?? null,
    });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  const deleteInvoice = useCallback<UseAdminInvoicesResult['deleteInvoice']>(async (invoiceId) => {
    const { error: err } = await adminRpc('admin_delete_invoice', { p_invoice_id: invoiceId });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  const cancelInvoice = useCallback<UseAdminInvoicesResult['cancelInvoice']>(async (invoiceId, reason) => {
    const { error: err } = await adminRpc('admin_cancel_invoice', { p_invoice_id: invoiceId, p_reason: reason || null });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [refresh]);
```

- [ ] **Step 3 : Corriger `sendInvoice` pour utiliser le numéro renvoyé**

Remplacer le corps de `sendInvoice` (lignes ~73-89) par :

```ts
  const sendInvoice = useCallback<UseAdminInvoicesResult['sendInvoice']>(async (invoice, clientEmail) => {
    const { data, error: err } = await adminRpc('admin_send_invoice', { p_invoice_id: invoice.id });
    if (err) return { error: err.message };
    const invoiceNumber = typeof data === 'string' ? data : invoice.invoice_number;
    await supabase.functions.invoke('generate-invoice-pdf', { body: { invoice_id: invoice.id } }).catch(() => undefined);
    if (clientEmail) {
      await supabase.functions.invoke('send-portal-email', {
        body: {
          template_key: 'invoice-sent',
          to: { email: clientEmail },
          params: { invoice_number: invoiceNumber ?? '', amount_total: String(invoice.amount_total) },
          dedupe_key: `${invoice.id}-sent`,
        },
      }).catch(() => undefined);
    }
    await refresh();
    return { error: null };
  }, [refresh]);
```

- [ ] **Step 4 : Exposer les nouvelles fonctions dans le `return`**

Remplacer la dernière ligne `return { ... }` par :

```ts
  return { invoices, installmentsByInvoice, loading, error, refresh, createInvoice, updateInvoice, deleteInvoice, cancelInvoice, sendInvoice, remindInvoice };
```

- [ ] **Step 5 : Vérifier la compilation**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 6 : Commit**

```bash
git add src/modules/EspaceClient/admin/hooks/useAdminInvoices.ts
git commit -m "feat(facturation): hook - editer/supprimer/annuler + numero d'envoi dans l'email"
```

---

## Task 5 : Formulaire en mode édition + garde-fous

**Files:**
- Modify: `src/modules/EspaceClient/admin/components/AdminInvoiceForm.tsx`

- [ ] **Step 1 : Étendre les props pour le mode édition**

Remplacer l'interface `Props` (lignes ~9-13) par :

```ts
import type { CreateInvoiceInput, UpdateInvoiceInput } from '../hooks/useAdminInvoices';
import type { PortalInvoice } from '@/modules/EspaceClient/client/hooks/usePortalData';
import { validateInvoiceForm } from '../lib/invoiceFormValidation';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateInvoiceInput) => Promise<{ id: string | null; error: string | null }>;
  /** Si fourni, le formulaire est en mode édition de ce brouillon. */
  editInvoice?: PortalInvoice | null;
  onUpdate?: (invoiceId: string, input: UpdateInvoiceInput) => Promise<{ error: string | null }>;
}
```

- [ ] **Step 2 : Pré-remplir en mode édition**

Dans le composant, après les `useState`, ajouter un effet de pré-remplissage :

```ts
  const isEdit = !!editInvoice;

  useEffect(() => {
    if (open && editInvoice) {
      const items = (editInvoice.line_items ?? []) as Array<{ label: string; amount: number }>;
      setLines(items.length ? items.map((l) => ({ label: l.label, amount: String(l.amount) })) : [{ label: '', amount: '' }]);
      setVatRate(String(editInvoice.vat_rate ?? 0));
      setIssueDate(editInvoice.issue_date ?? todayISO());
      setDueDate(editInvoice.due_date ?? '');
      setNotes(editInvoice.client_visible_notes ?? '');
      setInstallments([]); // acomptes non éditables (D4)
      setIsDeposit(!!editInvoice.is_deposit);
      setFormError(null);
    }
  }, [open, editInvoice]);
```

(Ajouter `useEffect` à l'import React en tête de fichier.)

- [ ] **Step 3 : Brancher la validation pure et router create/update**

Remplacer le début de `handleSubmit` (validations manuelles) par un appel à `validateInvoiceForm`, puis router :

```ts
  async function handleSubmit() {
    const numericLines = lines.map((l) => ({ label: l.label.trim(), amount: parseFloat(l.amount) || 0 }));
    const numericInst = installments
      .filter((i) => i.due_date)
      .map((i) => ({ amount: parseFloat(i.amount) || 0, due_date: i.due_date }));
    const err = validateInvoiceForm({
      lines: numericLines,
      vatRate: parseFloat(vatRate) || 0,
      issueDate,
      dueDate,
      installments: numericInst,
    });
    if (err) { setFormError(err); return; }

    const cleanLines = numericLines.filter((l) => l.label && l.amount > 0);
    const cleanInst = installments
      .filter((i) => parseFloat(i.amount) > 0 && i.due_date)
      .map((i) => ({ label: i.label.trim() || 'Acompte', amount: parseFloat(i.amount), due_date: i.due_date }));

    setSubmitting(true); setFormError(null);
    const amountSubtotal = cleanLines.reduce((s, l) => s + l.amount, 0);
    const result = isEdit && editInvoice && onUpdate
      ? await onUpdate(editInvoice.id, {
          amountSubtotal, vatRate: parseFloat(vatRate) || 0, lineItems: cleanLines,
          dueDate: dueDate || null, clientVisibleNotes: notes.trim() || null,
        })
      : await onSubmit({
          amountSubtotal, isDeposit, vatRate: parseFloat(vatRate) || 0, lineItems: cleanLines,
          issueDate, dueDate: dueDate || null, clientVisibleNotes: notes.trim() || null,
          installments: cleanInst,
        });
    setSubmitting(false);
    if (result.error) { setFormError(result.error); return; }
    reset(); onOpenChange(false);
  }
```

- [ ] **Step 4 : Adapter l'UI au mode édition**

- Titre dynamique : `<DialogTitle>{isEdit ? 'Modifier la facture' : 'Nouvelle facture'}</DialogTitle>`.
- Ajouter `min="0" step="0.01"` sur les deux `Input type="number"` de montant (lignes et acomptes).
- En mode édition, masquer la section acomptes et la case « Facture d'acompte » : envelopper ces blocs dans `{!isEdit && ( … )}`.
- Bouton de soumission : `{isEdit ? 'Enregistrer' : 'Créer (brouillon)'}`.

- [ ] **Step 5 : Vérifier la compilation**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 6 : Commit**

```bash
git add src/modules/EspaceClient/admin/components/AdminInvoiceForm.tsx
git commit -m "feat(facturation): formulaire en mode edition + garde-fous (validation pure)"
```

---

## Task 6 : Dialog d'annulation

**Files:**
- Create: `src/modules/EspaceClient/admin/components/CancelInvoiceDialog.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  invoiceNumber: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<{ error: string | null }>;
}

export function CancelInvoiceDialog({ open, invoiceNumber, onOpenChange, onConfirm }: Props) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true); setError(null);
    const { error: err } = await onConfirm(reason.trim());
    setSubmitting(false);
    if (err) { setError(err); return; }
    setReason(''); onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setReason(''); setError(null); } onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Annuler la facture {invoiceNumber ?? ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            La facture passera en « Annulée ». Action réservée aux factures non payées.
          </p>
          <div>
            <Label>Motif (optionnel)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. erreur de montant" />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Retour</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Confirmer l'annulation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2 : Vérifier la compilation**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/components/CancelInvoiceDialog.tsx
git commit -m "feat(facturation): dialog de saisie du motif d'annulation"
```

---

## Task 7 : Actions dans `InvoicesTab`

**Files:**
- Modify: `src/modules/EspaceClient/admin/components/InvoicesTab.tsx`

- [ ] **Step 1 : Importer et brancher les nouvelles actions du hook**

Mettre à jour l'import des icônes et du hook :

```ts
import { Plus, Send, Bell, Loader2, FileText, Pencil, Trash2, Ban } from 'lucide-react';
import { CancelInvoiceDialog } from './CancelInvoiceDialog';
```

Remplacer la déstructuration du hook (ligne ~15) par :

```ts
  const { invoices, loading, error, createInvoice, updateInvoice, deleteInvoice, cancelInvoice, sendInvoice, remindInvoice } = useAdminInvoices(projectId);
  const [editInvoice, setEditInvoice] = useState<PortalInvoice | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PortalInvoice | null>(null);
```

- [ ] **Step 2 : Ajouter les handlers supprimer/annuler**

À côté de `onSend`/`onRemind` :

```ts
  async function onDelete(inv: PortalInvoice) {
    if (!window.confirm(`Supprimer le brouillon ${inv.invoice_number ?? ''} ? Cette action est définitive.`)) return;
    setBusyId(inv.id); setActionError(null);
    const { error } = await deleteInvoice(inv.id);
    if (error) setActionError(error);
    setBusyId(null);
  }
```

- [ ] **Step 3 : Afficher « Brouillon » et les boutons selon le statut**

Dans le `<li>`, remplacer l'affichage du numéro :

```tsx
              <p className="text-sm font-semibold text-foreground">
                {inv.invoice_number ?? 'Brouillon'}
                {inv.is_deposit && <span className="ml-2 text-xs text-muted-foreground">Acompte</span>}
              </p>
```

Ajouter, dans la zone des boutons, pour un brouillon (à côté du bouton « Envoyer ») :

```tsx
            {inv.status === 'draft' && (
              <>
                <Button variant="ghost" size="icon" title="Modifier" onClick={() => setEditInvoice(inv)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Supprimer" onClick={() => onDelete(inv)} disabled={busyId === inv.id}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
```

Et pour une facture envoyée/en retard non payée, un bouton « Annuler » à côté de « Relancer » :

```tsx
            {(inv.status === 'sent' || inv.status === 'overdue') && (
              <Button variant="ghost" size="icon" title="Annuler" onClick={() => setCancelTarget(inv)}>
                <Ban className="h-4 w-4" />
              </Button>
            )}
```

- [ ] **Step 4 : Brancher le formulaire d'édition et le dialog d'annulation**

Remplacer la ligne du `AdminInvoiceForm` par deux usages (création + édition) et ajouter le dialog d'annulation, avant la fermeture du composant :

```tsx
      <AdminInvoiceForm open={formOpen} onOpenChange={setFormOpen} onSubmit={createInvoice} />
      <AdminInvoiceForm
        open={!!editInvoice}
        editInvoice={editInvoice}
        onUpdate={updateInvoice}
        onSubmit={createInvoice}
        onOpenChange={(o) => { if (!o) setEditInvoice(null); }}
      />
      <CancelInvoiceDialog
        open={!!cancelTarget}
        invoiceNumber={cancelTarget?.invoice_number ?? null}
        onOpenChange={(o) => { if (!o) setCancelTarget(null); }}
        onConfirm={async (reason) => {
          if (!cancelTarget) return { error: 'Aucune facture' };
          const res = await cancelInvoice(cancelTarget.id, reason);
          if (!res.error) setCancelTarget(null);
          return res;
        }}
      />
```

- [ ] **Step 5 : Vérifier la compilation**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 6 : Commit**

```bash
git add src/modules/EspaceClient/admin/components/InvoicesTab.tsx
git commit -m "feat(facturation): onglet - boutons modifier/supprimer/annuler + libelle Brouillon"
```

---

## Task 8 : Badge `partially_paid`

**Files:**
- Modify: `src/modules/EspaceClient/shared/components/Badge.tsx:54`

- [ ] **Step 1 : Ajouter l'entrée dans `STATUS_MAP`**

Après la ligne `refunded:` (ligne ~54), ajouter :

```ts
  partially_paid: { tone: 'amber', label: 'Partiellement payée' },
```

- [ ] **Step 2 : Vérifier la compilation**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/shared/components/Badge.tsx
git commit -m "feat(facturation): badge - statut Partiellement payee"
```

---

## Vérification finale

- [ ] **Build + tests**

Run: `npm run build && npx vitest run`
Expected: build OK, tous les tests verts (dont `invoiceFormValidation.test.ts`).

- [ ] **Application de la migration (Lyes)**

Coller le contenu de `20260608190000_propulspace_295_invoice_lifecycle.sql` dans le SQL Editor Supabase (projet ERP), exécuter une fois. Regénérer les types si besoin.

- [ ] **Recette manuelle (Lyes, navigateur)** — `/admin/propulspace` → un client → onglet Factures :
  1. Créer un brouillon → s'affiche **« Brouillon »**, sans numéro.
  2. **Modifier** ce brouillon → montant et lignes à jour.
  3. Créer 2 brouillons, en **supprimer** 1 → le compteur ne saute pas de numéro à l'envoi suivant.
  4. **Envoyer** → numéro officiel attribué, PDF généré, email reçu **avec le bon numéro**.
  5. **Annuler** une facture envoyée non payée → passe « Annulée » (+ motif en base).
  6. Tenter de **supprimer** une facture envoyée ou d'**annuler** une facture payée → refusé proprement.
  7. Une facture `partially_paid` affiche **« Partiellement payée »**.

---

## Notes

- **Acomptes non éditables** (D4) : en mode édition, la section est masquée. Corriger des acomptes = supprimer le brouillon et le recréer.
- **Motif d'annulation** : stocké (`cancellation_reason`/`cancelled_at`), pas encore affiché — affichage possible dans une tranche ultérieure.
- **Suppression** : `window.confirm` suffit pour un brouillon en back-office ; un dialog stylé est possible plus tard.
- **Avoir formel**, édition infos client, Facture→GED, unification compta : hors-scope (tranches suivantes).
