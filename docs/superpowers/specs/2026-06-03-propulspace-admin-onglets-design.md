# Design — Back-office Propul'Space : onglets Signatures, Documents, Jalons, Activité

> Date : 2026-06-03
> Branche : `feat/propulspace-admin-pilote`
> Statut : design validé (brainstorming), en attente de relecture avant plan d'implémentation.
> Contexte : les onglets `Signatures`, `Documents`, `Jalons`, `Activité` du panneau client
> `/admin/propulspace/clients/:projectId/*` sont aujourd'hui des `<TabPlaceholder>` « à venir ».
> Cette spec décrit leur construction en réutilisant le pattern de l'onglet **Factures** (Phase 1, livré).

---

## 1. Objectif

Rendre fonctionnels les 4 onglets manquants du back-office admin Propul'Space, pour qu'un admin
gère depuis le CRM, projet par projet : les **signatures électroniques** (DocuSeal), la **GED**
(documents), les **jalons** (étapes projet) et consulte le **journal d'audit** (activité).

L'onglet **Factures** existant sert de référence : `InvoicesTab` + `useAdminInvoices` +
`AdminInvoiceForm` + `adminRpc()` + `StatusBadge`.

## 2. Décisions de cadrage (validées)

| Sujet | Décision |
|---|---|
| **Activité** | Vrai **journal d'audit** lu depuis `propulspace.audit_log` (table déjà alimentée par les triggers, orpheline jusqu'ici — R-005). Pas un simple feed agrégé. |
| **Signatures** | **UI complète** ; le bouton de création est **grisé** tant que DocuSeal n'est pas configuré. La lecture des signatures existantes fonctionne sans dépendance. |
| **Documents** | **Upload simple + visibilité client** (type, nom, description, toggle visible, soft-delete). **Pas de versioning** en V1. |
| **Jalons** | **Édition libre + réordonnancement** (créer/éditer/supprimer/statut/ordre). Réordonnancement via **flèches ↑/↓** en V1 (drag&drop `@dnd-kit` = amélioration ultérieure). Pas de modèles par prestation en V1. |
| **Archi** | **Option C** : scaffold partagé léger + corps sur-mesure par onglet (ni duplication intégrale, ni générique fragile). |

## 3. Architecture

### 3.1 Principe (Option C)

Un composant `AdminTabScaffold` encapsule la coquille identique aux 4 onglets ; chaque onglet
garde son **hook**, son **corps de liste** et son **formulaire** propres. On réutilise les briques
existantes (`StatusBadge`, `EmptyState`, `ActivityRow`, `TimelineStep`, `FileIcon`,
`getAdminSignedUrl`) sans les modifier.

```
AdminTabScaffold props:
  title: string                       // "3 documents", "1 signature"
  action?: { label, onClick, disabled?, disabledReason? }   // bouton coin haut-droit
  loading: boolean
  error: string | null
  isEmpty: boolean
  emptyIcon, emptyLabel
  children                            // corps = liste sur-mesure
```

Rend : header (titre + bouton optionnel) · `Loader2` si `loading` · bandeau rouge si `error` ·
`EmptyState` si `isEmpty` · sinon `children`.

### 3.2 Flux de données (calqué sur `useAdminInvoices`)

- **Lecture** : `v2.from('propulspace_<entity>').select('*').eq('project_id', projectId)` →
  tri pertinent → `setState`.
- **Mutation** : `adminRpc('admin_*', {...})` → `await refresh()`.
- **Deux exceptions** :
  - Signatures **crée** via edge function `admin-docuseal-create-submission` (pattern
    `usePortalActivation`, pas une RPC).
  - Activité **lit** via RPC `admin_get_audit_log` (pas de vue `_v2` : l'audit n'est jamais
    exposé à PostgREST).

**Vues lues côté admin** : on lit les vues client `propulspace_*_v2` existantes. Elles sont
`security_invoker=true` → l'admin (via `is_admin()`) passe la RLS et voit toutes les lignes du
projet. Les champs exposés par ces vues (= types `Portal*`) **suffisent à l'UI décrite**. Les champs
admin-only (`decline_reason`, `created_by`, `docuseal_submission_id`) **ne sont pas dans les vues
client** : si on veut les afficher plus tard, il faudra des vues dédiées `propulspace_signatures_admin_v2`
/ `propulspace_documents_admin_v2` (sur le modèle de `propulspace_invoices_admin_v2`). → **backlog**,
non requis en V1.

### 3.3 Arborescence des fichiers

Sous `src/modules/EspaceClient/admin/` :

| Fichier | État | Rôle |
|---|---|---|
| `components/AdminTabScaffold.tsx` | créer | coquille partagée |
| `hooks/useAdminSignatures.ts` · `components/SignaturesTab.tsx` · `components/AdminSignatureForm.tsx` | créer | onglet Signatures |
| `hooks/useAdminDocuments.ts` · `components/DocumentsTab.tsx` · `components/AdminDocumentUpload.tsx` | créer | onglet Documents |
| `hooks/useAdminProjectSteps.ts` · `components/ProjectStepsTab.tsx` · `components/AdminProjectStepForm.tsx` | créer | onglet Jalons |
| `hooks/useAdminAuditLog.ts` · `components/ActivityTab.tsx` | créer | onglet Activité (lecture seule) |
| `lib/adminRpc.ts` | modifier | étendre `AdminRpcMap` avec les nouvelles RPC |
| `pages/AdminClientPanel.tsx` | modifier | remplacer les 4 `<TabPlaceholder>` (l.57-60) par de vraies `<Route>` + wrappers `SignaturesRoute / DocumentsRoute / JalonsRoute / ActiviteRoute` (modèle `InvoicesRoute` l.42-47) |

Côté `supabase/functions/` :

| Fichier | État | Rôle |
|---|---|---|
| `admin-docuseal-create-submission/index.ts` | modifier | (1) accepter `{ probe: true }` → renvoyer `{ configured: boolean }` sans rien créer ; (2) en l'absence de `DOCUSEAL_API_KEY`, renvoyer `{ ok:false, reason:'not_configured' }` (HTTP 200) au lieu d'un 500 opaque |

Réutilisés **sans modification** : `lib/adminStorage.ts`, `shared/components/{StatusBadge, EmptyState, ActivityRow, TimelineStep, FileIcon}`, `components/AdminClientTabs.tsx` (6 onglets déjà déclarés), `client/hooks/usePortalData.ts` (types `PortalSignature`, `PortalDocument`, `PortalProjectStep` déjà définis).

## 4. Couche DB / RPC (migrations à créer)

Convention maison : `SECURITY DEFINER`, `SET search_path` verrouillé, check `is_admin()`,
`GRANT EXECUTE TO authenticated` + `REVOKE FROM anon, public`. Numérotation à la suite de 272.

### `280_admin_signature_rpcs.sql`
- `admin_cancel_signature(p_signature_id uuid, p_reason text default null)` →
  `status='cancelled'`. **Rejette si `status != 'pending'`** (une signature signée est permanente).
- Relance = pas de RPC (ré-invocation de l'email Brevo `signature-requested` avec le
  `docuseal_signing_url` existant).
- *(La création reste assurée par l'edge fn `admin-docuseal-create-submission`.)*

### `281_admin_document_rpcs.sql`
- `admin_create_document(p_project_id, p_document_type, p_name, p_file_url, p_file_size_bytes?, p_file_mime_type?, p_category?, p_description?, p_visible_to_client?)` → `uuid`.
- `admin_update_document(p_document_id, p_name?, p_category?, p_description?, p_visible_to_client?)` → `void`.
- `admin_delete_document(p_document_id)` → soft-delete (`deleted_at=NOW()`), le fichier reste en Storage.

### `282_admin_project_step_rpcs.sql`
- `admin_create_project_step(p_project_id, p_label, p_step_order?, p_status?, p_description?, p_date_start?, p_date_planned_end?, p_visible_to_client?)` → `uuid`
  (`step_order` absent → `MAX(step_order)+1`).
- `admin_update_project_step(p_step_id, p_label?, p_status?, p_description?, p_date_start?, p_date_planned_end?, p_date_actual_end?, p_visible_to_client?)` → `void`.
- `admin_delete_project_step(p_step_id)` → `void`.
- `admin_reorder_project_steps(p_project_id, p_ordered_ids uuid[])` → réassigne `step_order`
  selon l'ordre du tableau.

### `283_admin_get_audit_log.sql`
- `admin_get_audit_log(p_project_id uuid, p_limit int default 100, p_offset int default 0, p_resource_type text default null)` →
  jointure sur `users` pour résoudre l'auteur (nom interne, ou « Client » si `user_id` non interne),
  renvoie `id, created_at, action, resource_type, resource_id, actor_label, diff`.
  **Admin-only, sans vue `_v2`.**

Côté front : `adminRpc.ts` reçoit ces signatures dans `AdminRpcMap` (typage strict, pas de `any` dispersé).

## 5. Design des onglets

### 5.1 Signatures
Table `propulspace.signatures` / vue `propulspace_signatures_v2` / type `PortalSignature`.

**Liste** — nom + type (`Devis`/`Contrat`/`Avenant`/`Autre`) + `StatusBadge` + dates envoi/signature.
Actions selon statut :

| Statut | Actions |
|---|---|
| `pending` | **Relancer** (email Brevo `signature-requested` + `signing_url` existant) · **Annuler** (`admin_cancel_signature`) |
| `signed` | **Télécharger le PDF signé** (`docuseal_signed_pdf_url`, lien DocuSeal direct) |
| `declined` / `expired` / `cancelled` | lecture seule |

**Form** (`AdminSignatureForm`) : nom, type (select), email signataire (pré-rempli
`portal_client_email`), document lié optionnel (select sur documents du projet), template DocuSeal.
Submit → edge fn `admin-docuseal-create-submission`.

**Mode dégradé DocuSeal** : `useAdminSignatures` appelle une fois au montage l'edge fn en mode
`{ probe: true }` → `{ configured: boolean }`, et expose `createEnabled`. Si `false` → bouton
« Nouvelle signature » **grisé** + tooltip « DocuSeal non configuré ». En filet de sécurité, une
tentative de création quand non configuré renvoie `{ ok:false, reason:'not_configured' }` (HTTP 200),
affichée comme message clair plutôt qu'erreur 500. La **lecture** des signatures existantes fonctionne
sans rien.

Réutilisation du pattern Factures : ~85 %.

### 5.2 Documents
Table `propulspace.documents` / vue `propulspace_documents_v2` / type `PortalDocument`.

**Filtres** (repris de `DocumentsPage` client) : Tous · Contrats · Factures · Livrables · Assets.
**Liste** — `FileIcon`(mime) + nom + type + taille + version + badge **Visible client / Masqué** + date.
Actions : **Télécharger** (`getAdminSignedUrl`), **toggle visibilité** (`admin_update_document`),
**Éditer** (nom/catégorie/description, dialog), **Supprimer** (soft-delete, confirmation).
**Ajout** (`AdminDocumentUpload`) : zone fichier → upload binaire vers
`propulspace-documents/{project_id}/documents/{uuid}-{nom}` **puis** `admin_create_document`.
Champs : fichier, type (12 valeurs), nom (défaut = nom du fichier), description, visible client (défaut ✅).
Validation client mime/taille (le bucket impose déjà 52 Mo + allowlist mime côté serveur).

Aucune dépendance externe → 100 % fonctionnel. Réutilisation : ~70 %.

### 5.3 Jalons (`project_steps`)
Table `propulspace.project_steps` / vue `propulspace_project_steps_v2` / type `PortalProjectStep`.
Pas de trigger d'audit (table non sensible).

**Liste = timeline éditable** : chaque étape → `step_order` + label + `StatusBadge` + dates, contrôles
inline : **select de statut** (`upcoming→in_progress→completed→blocked`), **↑ / ↓** (réordonner),
**Éditer**, **Supprimer**.
**Form** (`AdminProjectStepForm`) : label, statut, description, date début, date prévue, date réelle,
visible client. À la création `step_order` = fin de liste. Passer à `completed` pré-remplit la date
réelle à aujourd'hui (éditable).

Réordonnancement = flèches ↑/↓ en V1 (les deux UX appellent `admin_reorder_project_steps`).
Réutilisation : ~75 %.

### 5.4 Activité (`audit_log`, lecture seule)
Table `propulspace.audit_log` via RPC `admin_get_audit_log`. Pas de bouton d'action.

Filtre par type : Tous · Documents · Factures · Signatures.
**Liste chronologique** (`created_at` DESC) : icône selon ressource + **libellé lisible**
(« Document ajouté : *Devis.pdf* », « Facture PS-1031 envoyée », « Signature modifiée ») + **auteur**
(nom interne ou « Client ») + date relative. **« Voir le détail »** déplie les champs modifiés (parsés
du `diff` JSONB before/after). Le nom de la ressource (même supprimée) est lu dans le `diff`.
Pagination « Charger plus » (limit 100 / offset).

Réutilise `ActivityRow`. Réutilisation : ~50 % (pas de form, pas de mutation).

## 6. Transversal

### 6.1 Verrouillage / immuabilité
| Entité | Règle |
|---|---|
| Signatures | `signed` permanente ; `admin_cancel_signature` n'agit que sur `pending`. |
| Documents | Soft-delete (fichier conservé + tracé audit) ; pas de verrou en V1. |
| Jalons | Tout éditable/supprimable, pas de verrou. |
| Factures | Inchangé (`is_locked` après envoi). |

### 6.2 Notifications email client (Brevo, best-effort)
- Signatures : email « document à signer » déjà envoyé par l'edge fn à la création ; « Relancer »
  ré-envoie le même. Rien à ajouter.
- Documents & Jalons : **pas d'email automatique en V1** (aucun template Brevo + éviter le spam).
  → backlog.
- Tous les emails sont **best-effort** (`.catch`) : ne bloquent jamais la mutation.

### 6.3 Gestion d'erreur (uniforme, modèle Factures)
Mutations → `{ error: string | null }` → bandeau rouge `actionError` + `busyId` par ligne.
Erreurs RPC (`forbidden`, `not found`, état invalide) remontées en messages FR lisibles.
Création de signature = action principale → échec affiché ; emails/Storage best-effort.
Après mutation : `refresh()` (pas d'optimistic).

### 6.4 Sécurité
- Toutes les RPC : `SECURITY DEFINER` + `search_path` + `is_admin()` + `GRANT authenticated` / `REVOKE anon, public`.
- `admin_get_audit_log` : admin-only, sans vue `_v2`.
- **R-008 hors périmètre** : le risque de fuite cross-tenant porte sur la policy Storage *côté client
  portail* (`ps_docs_storage_client_read` qui vérifie seulement `portal_project_id() IS NOT NULL`),
  pas l'admin (URL signées service-role). Documenté comme risque connu, **non élargi ici** (durcissement
  RLS = sprint sécu A.3).

### 6.5 Mode dégradé (récap)
DocuSeal absent → Signatures en lecture, création grisée. · Brevo absent → emails non envoyés,
actions OK. · Documents / Jalons / Activité → aucune dépendance externe, marchent toujours.

## 7. Tests & vérification

- **Type check** : `npm run build` (tsc, zéro `any`) après chaque onglet.
- **Pas de suite Vitest** dans le projet (R-007) → on n'en introduit pas. À la place : **script SQL
  rejouable** (modèle `.planning/A3_TESTS.sql`) prouvant chaque RPC (admin CRUD ✓, non-admin
  `forbidden` ✓, `audit_log` alimenté ✓), joué via MCP sur le projet ERP `tbuqctfgjjxnevmsvucl`.
- **Vérif runtime manuelle** sur le client de test « Site vitrine Boulangerie Dupont » : ajouter /
  réordonner / changer le statut d'un jalon → uploader un doc + toggle visible + supprimer → créer
  une signature (message dégradé si DocuSeal off) → vérifier que l'onglet **Activité** liste ces
  opérations. Screenshots via Playwright MCP.
- **Migrations** versionnées dans le repo **et** appliquées en prod via MCP (comme 270/271/272).

## 8. Ordre d'implémentation (tranches verticales)

Du moins au plus bloqué : **Jalons → Documents → Activité → Signatures**.
Chaque tranche = migration + hook + onglet + form + branchement route, puis type-check + vérif
runtime **avant** la suivante.

## 9. Hors périmètre (backlog)

- Versioning des documents (`parent_document_id`, remplacement de fichier).
- Modèles de jalons par `presta_type`.
- Drag&drop `@dnd-kit` pour le réordonnancement des jalons.
- Emails de notification client pour documents/jalons (templates Brevo à créer).
- ADR-003 : auto-insertion du PDF facture dans `propulspace.documents`.
- Durcissement R-008 (policy Storage côté portail).
- Multi-projets ADR-004 (switcher côté client).

## 10. Dépendances externes (rappel)

- **Signatures** : nécessite `DOCUSEAL_API_KEY` + `DOCUSEAL_WEBHOOK_SECRET` + déploiement des edge fn
  `admin-docuseal-create-submission` et `docuseal-webhook` + templates DocuSeal (cf.
  `docs/propulspace/DOCUSEAL_RUNBOOK.md`). Sans ça : lecture seule, création grisée.
- **Emails** : `BREVO_API_KEY` (sinon best-effort silencieux).
- **Documents / Jalons / Activité** : aucune.
