# SP3 — Facturation : finir le cycle de vie des factures (design)

- **Date** : 2026-06-08
- **Tranche** : SP3 (facturation) du chantier de fusion CRM ↔ Propul'Space
- **Statut** : design validé, prêt pour plan d'implémentation

---

## 1. Contexte & constat

L'écran admin de facturation du portail (`/admin/propulspace` → panneau client → onglet **Factures**) **existe déjà et fonctionne** : créer une facture brouillon (lignes, TVA, acompte, échéances), l'envoyer (passage `sent` + verrou + génération PDF + email `invoice-sent`), relancer, ouvrir le PDF. Briques en place : RPC `admin_create_invoice` (mig 270), `admin_update_invoice` + `admin_send_invoice` (mig 271), `admin_set_invoice_pdf` (mig 272) ; hook `useAdminInvoices` ; composants `InvoicesTab` + `AdminInvoiceForm`.

**Ce qui manque pour être autonome (zéro SQL manuel) :**

1. **Éditer un brouillon** depuis l'écran : la RPC `admin_update_invoice` existe mais n'est branchée nulle part.
2. **Supprimer un brouillon** et **annuler une facture** : aucune RPC `admin_delete_invoice` / `admin_cancel_invoice` (les onglets voisins Jalons/Documents/Signatures ont pourtant leurs `admin_delete_*` / `admin_cancel_signature`).
3. **Numérotation conforme** : aujourd'hui le numéro officiel est attribué dès la création du brouillon (la séquence `propulspace.invoice_number_seq` avance). Supprimer un brouillon laisserait donc un **trou** dans la numérotation — interdit par la loi anti-fraude française.
4. **Garde-fous** du formulaire (montant ≤ 0, échéance antérieure à l'émission) et **affichage** d'une facture partiellement payée (`partially_paid`) à confirmer.

**Décisions tranchées avec l'utilisateur (2026-06-08) :**
- **D1 — Numéro à l'envoi** : un brouillon reste « Brouillon » sans numéro ; le numéro officiel n'est attribué qu'à l'envoi.
- **D2 — Annulation simple** : on peut annuler une facture **envoyée mais non payée** (statut `cancelled` + motif). L'avoir formel d'une facture déjà payée est reporté à une tranche suivante.

**Modèle d'accès (rappel)** : le CRM est mono-équipe ; **tous les membres équipe (admin/manager) voient et gèrent tous les clients**. Il n'y a pas d'isolation « par admin ». Les RPC `admin_*` ne filtrent donc volontairement pas par admin/projet — ce n'est pas un trou de sécurité. La vraie frontière reste équipe ↔ client portail.

---

## 2. Objectif & non-objectifs

**Objectif** : rendre l'équipe **autonome sur tout le cycle de vie d'une facture** (créer → corriger → supprimer/annuler → envoyer), avec une **numérotation sans trou**, sans jamais toucher la base à la main.

**Non-objectifs (tranches suivantes, hors de cette spec) :**
- Modifier les **acomptes** d'un brouillon déjà créé (limite assumée, cf. D4).
- **Avoir** comptable formel pour une facture déjà payée (document négatif + numéro + PDF).
- Édition des **infos client/projet** (GAP-06 de l'audit).
- Correctifs des onglets **Signatures** (`sent_at` non mis à jour à la relance) et **Jalons** (réordonnancement partiel).
- **Facture → GED** (le PDF dans l'espace Documents) et **unification compta** CRM ↔ portail.

---

## 3. Décisions de conception

| ID | Décision | Détail |
|----|----------|--------|
| D1 | Numéro à l'envoi | `invoice_number` devient **facultatif** (nullable). On déplace l'appel `next_invoice_number()` de la création vers l'envoi. La séquence n'avance donc qu'au moment d'un envoi réel. |
| D2 | Suppression brouillon | `admin_delete_invoice` : **suppression physique**, autorisée **seulement** si `status = 'draft'`. Les acomptes liés partent en cascade (FK `ON DELETE CASCADE` déjà présente). |
| D3 | Annulation | `admin_cancel_invoice` : passe `status = 'cancelled'` + enregistre **motif** et **date**. Autorisée si `status IN ('sent','overdue')` **et** facture non payée (`paid_at IS NULL`, statut ni `paid` ni `partially_paid`). |
| D4 | Édition brouillon | Réutilise `admin_update_invoice` (lignes, TVA, échéance, notes). Les **acomptes ne sont pas éditables** ; pour les corriger → supprimer le brouillon et le recréer. |
| D5 | `partially_paid` | Vérifier et compléter si besoin l'affichage du badge de statut (admin **et** client). |

---

## 4. Changements base de données (1 migration)

> ⚠️ Le MCP Supabase pointe sur un autre projet (CoProFlex). Cette migration sera **appliquée à la main par Lyes** dans le SQL Editor, comme les précédentes. Numéro attendu : suite des migrations propulspace (≥ 295).

1. **Colonne numéro facultative** : `ALTER TABLE propulspace.invoices ALTER COLUMN invoice_number DROP NOT NULL;`
   *(L'unicité est conservée ; en PostgreSQL plusieurs `NULL` ne violent pas une contrainte `UNIQUE`. L'index `idx_invoices_number` reste valide.)*
2. **Colonnes d'annulation** : ajouter `cancellation_reason text` et `cancelled_at timestamptz` (nullable).
3. **Modifier `admin_create_invoice`** : ne plus appeler `next_invoice_number()` ; insérer `invoice_number = NULL` (le brouillon n'a pas de numéro).
4. **Modifier `admin_send_invoice`** : si `invoice_number IS NULL`, attribuer `invoice_number = next_invoice_number()` **dans le même `UPDATE`** que `status='sent', is_locked=true`. La fonction **renvoie le numéro attribué** (`returns text`) pour que le front l'utilise dans le PDF et l'email.
5. **Nouvelle RPC `admin_delete_invoice(p_invoice_id uuid)`** : garde `propulspace.is_admin()` ; lève une exception si `status <> 'draft'` ; sinon `DELETE`. Calquée sur `admin_delete_project_step` / `admin_delete_document`.
6. **Nouvelle RPC `admin_cancel_invoice(p_invoice_id uuid, p_reason text)`** : garde `is_admin()` ; lève une exception si le statut n'est pas annulable (cf. D3) ; sinon pose `status='cancelled'`, `cancellation_reason`, `cancelled_at = now()`. Calquée sur `admin_cancel_signature`.
7. **GRANT/REVOKE** sur les nouvelles RPC : `revoke from public, anon` + `grant execute to authenticated` (pattern existant).

**Compatibilité trigger d'immuabilité** (`tg_invoice_immutable`, mig 271) :
- À l'envoi, le brouillon a `is_locked = false`, donc le trigger laisse passer l'attribution du numéro **et** le passage `is_locked=true` dans le même `UPDATE`.
- L'annulation ne modifie que `status` / colonnes d'annulation, jamais les montants/lignes/numéro → non bloquée même si `is_locked = true`.

**Pas de changement au `CHECK` de `status`** : `cancelled` y figure déjà (mig 210).

---

## 5. Changements côté écran (front)

**`useAdminInvoices`** (hook data) :
- Ajouter `updateInvoice(invoiceId, input)` → `admin_update_invoice`.
- Ajouter `deleteInvoice(invoiceId)` → `admin_delete_invoice`.
- Ajouter `cancelInvoice(invoiceId, reason)` → `admin_cancel_invoice`.
- Corriger `sendInvoice` : utiliser le **numéro renvoyé** par `admin_send_invoice` pour la génération PDF et l'email `invoice-sent` (aujourd'hui le code lit `invoice.invoice_number` de l'état précédent — vide pour un brouillon).

**`AdminInvoiceForm`** (formulaire) :
- Supporter un **mode édition** : pré-remplissage depuis une facture existante, appel `updateInvoice` au lieu de `createInvoice`.
- En mode édition, exposer lignes / TVA / échéance / notes ; la section **acomptes est masquée ou en lecture seule** (limite D4).
- **Garde-fous** (création et édition) : refuser tout montant ≤ 0 (`min="0"` + validation), et refuser une échéance antérieure à la date d'émission.

**`InvoicesTab`** (liste + actions) :
- Afficher **« Brouillon »** quand `invoice_number` est vide.
- Bouton **Modifier** (statut `draft`) → ouvre le formulaire en édition.
- Bouton **Supprimer** (statut `draft`) → confirmation, puis `deleteInvoice`.
- Bouton **Annuler** (statut `sent`/`overdue`, non payé) → petite fenêtre de saisie du **motif**, puis `cancelInvoice`.

**`StatusBadge`** (badge de statut, composant partagé) :
- Vérifier/ajouter le libellé + la couleur de `partially_paid` (et `cancelled` si absent), côté admin et côté client.

---

## 6. Découpage en unités (isolation)

Chaque unité a un rôle clair, une interface nette, et se teste seule :

- **Migration SQL** : schéma + 4 fonctions (2 modifiées, 2 nouvelles). Autonome.
- **Hook `useAdminInvoices`** : logique données (lectures + 5 actions). Interface = les fonctions exportées.
- **`AdminInvoiceForm`** : présentation création/édition. Interface = `{ mode, valeurInitiale, onSubmit }`.
- **`InvoicesTab`** : orchestration des actions + affichage liste.
- **`StatusBadge`** : présentation pure (statut → libellé/couleur).

---

## 7. Critères de vérification

Parcours de recette (à dérouler par Lyes dans le navigateur + checks automatiques) :

1. Créer un brouillon → **aucun numéro**, affiché « Brouillon ».
2. Modifier ce brouillon → montant et lignes à jour.
3. Créer 2 brouillons, en supprimer 1 → **le compteur n'a pas sauté de numéro**.
4. Envoyer une facture → **numéro officiel attribué**, PDF généré, email `invoice-sent` **avec le bon numéro**.
5. Annuler une facture envoyée non payée → passe « annulée » + motif enregistré.
6. Tenter de **supprimer** une facture envoyée **ou** d'**annuler** une facture payée → **refusé** (message clair).
7. Afficher une facture `partially_paid` → badge lisible.

Checks techniques : `npm run build` (tsc + build) **propre**, et tests verts si une suite couvre la zone. L'utilisateur effectue lui-même la vérification runtime.

---

## 8. Risques & limites assumées

- **Trou de séquence sur envoi échoué** : une séquence PostgreSQL ne « recule » pas si la transaction échoue après `nextval`. Un échec d'envoi peut donc consommer un numéro. C'est marginal (échec d'envoi rare) et **bien plus rare** que la situation actuelle (un numéro perdu par brouillon supprimé). Accepté.
- **Acomptes non éditables** (D4) : workaround = supprimer le brouillon et recréer. Reporté.
- **Migration appliquée à la main** par Lyes (MCP = CoProFlex). À versionner dans le repo et à exécuter dans le SQL Editor.

---

## 9. Hors-scope → tranches suivantes

Avoir formel (facture payée) · édition infos client (GAP-06) · correctifs Signatures/Jalons · Facture → GED (ADR-003) · unification compta CRM ↔ portail.
