# Fusion CRM ↔ Propul'Space — Architecture de convergence

> Issu d'une deep research multi-agents (2026-06-05) sur le code et les types réels. Document de référence pour la décomposition en sous-projets et les specs à suivre.
> **Objectif** : faire de Propul'Space le **CRM unifié**, sur le socle `projects_v2` + schéma `propulspace`.

## 0. État de fait (la fusion est déjà à ~70 %)
- **`projects_v2` est le pivot de fait** : `LeadsV3`, `ProjectsV3`, `ProjectDetailsV3Preview`, `DashboardV3`, `EspaceClient` lisent tous dessus. `projects` (CRM histo) est un **mort-vivant** (seuls `useProjects.ts`/listes de sélection y écrivent encore).
- **Pattern de migration déjà prouvé** : `project_documents_unified_v2` (UNION ALL, migration 254) = vue d'union read-only → c'est le modèle à industrialiser.
- **Conversion lead→projet déjà partielle** : `qualification_leads.converted_to_project_id → projects_v2.id` (RPC 256). MAIS deux chemins incohérents (voir §1).
- `proxy v2` (`src/lib/supabase.ts` l.136-148) route `v2.from('x')` → `x_v2` (physiquement dans `public`). Tables `propulspace.*` **non exposées à PostgREST** → lecture via vues `public.propulspace_*_v2`, écriture via RPC `admin_*` SECURITY DEFINER.

## 1. Carte des chevauchements (sources de vérité à trancher)

| Concept | Doublons | Source de vérité proposée | Liaison actuelle |
|---|---|---|---|
| **Client/Société** | `clients` · `contacts` · `projects_v2.client_*` (snapshot) · `auth.users` (portail) | **`contacts`** = registre identité ; `projects_v2.client_*` = snapshot | `project_contacts` (jointure, créée à la conversion qualif) |
| **Projet** | `projects` (mort) · `projects_v2` (~60 col) | **`projects_v2`** | aucune FK entre les deux |
| **Lead** | `contacts.status` · `crmerp_leads` · `leads` (mort) · `propulspace.qualification_leads` | à décider (table `leads` unifiée OU vue d'agrégation) | `qualification_leads.converted_to_project_id` |
| **Conversion** | `useConvertLeadToProject` (crée projet **nu**) · `admin_convert_qualif_to_project` (projet **+ contact + project_contact + activité**) | **la RPC complète** comme chemin unique | 2 chemins incohérents = dette |
| **Facturation** | `accounting_entries` (journal) · `project_invoices_v2` (CRM V2) · `propulspace.invoices`+`installments` (FR-conforme, Stripe) | **`propulspace.invoices`** = facture client ; `accounting_entries` = journal compta | aucune entre les trois |
| **Jalons/Tâches** | `tasks` (mort) · `checklist_items_v2` (interne) · `personal_tasks` · `propulspace.project_steps` (client) | **2 niveaux** : `checklist_items_v2` (interne) + `project_steps` (jalons client). Déprécier `tasks` | `automationService` crée des checklist au changement de statut |
| **Documents** | `project_documents_v2` (CRM) · `propulspace.documents` (versioning, soft-delete, audit) | **`propulspace.documents`** | vue `project_documents_unified_v2` (read-only) |
| **Activité** | `activities`·`prospect_activities`·`contact_activities`·`crmerp_activities`·`crm_bot_one_activities`·`project_activities_v2`·`user_activities`·`useActivities` (**localStorage !**)·`propulspace.audit_log` | **`project_activities_v2`** (timeline) + `contact_activities` (CRM) ; `audit_log` séparé (RGPD) | RPC conversion alimente `project_activities_v2` |
| **Communication** | `posts` (FK `clients`, pas de `project_id`) · `client_posts` (doublon à supprimer) | **`posts`** + ajouter `project_id` | aucune vers `projects_v2` |
| **Calendrier** | `events` (FK contacts) · `calendar_events` · in-memory localStorage | **`calendar_events`** | aucune cohérente |

**3 incohérences silencieuses critiques** :
- `SupabaseService` schizophrène : `getClients()`/`createClient()` lisent/écrivent `leads`, mais `update/delete` écrivent `contacts`.
- `useActivities` persiste en **localStorage** (`propulseo_activities`), jamais migré.
- **Dead code importé** : `financialSyncService.ts` + `activityService.ts` n'existent pas mais sont importés → à purger.

## 2. Stratégie retenue — C : convergence progressive par tranches verticales
Cible = socle unique `projects_v2`/`propulspace` (Stratégie A), **atteinte par tranches** (un concept à la fois) : (1) choisir la table canonique → (2) vue d'union + FK de liaison → (3) basculer les lectures → (4) basculer les écritures (RPC) → (5) **supprimer l'ancien chemin** (pas de coexistence durable). Le portail reste vert après chaque tranche.
- **Pas A (big-bang)** : casse le portail prod, réécriture massive en RPC d'un coup.
- **Pas B (ponts permanents)** : fige la dette (anti-pattern CLAUDE.md « finir les migrations »).
- **C** : industrialise le pattern déjà prouvé (union view → bascule), testable en prod à chaque tranche.

## 3. Points de liaison (ordre de création)
1. `projects_v2.legacy_project_id UUID NULL REFERENCES projects(id)` — réconcilier sans migrer la donnée. Pré-requis.
2. `contacts` = identité unique + index `contacts.email` ; étoffer `project_contacts`.
3. `projects_v2.portal_client_email → contacts.email` (corriger R-009 : index/UNIQUE).
4. Unifier les 2 chemins de conversion → une RPC `admin_convert_lead_to_project`.
5. `accounting_entries.project_id → projects_v2.id` (+ trigger optionnel `invoice paid → accounting_entry` avec dédup).
6. `posts.project_id → projects_v2.id` + supprimer `client_posts`.
7. Aligner les 3 helpers RLS (`is_admin`/`is_team_member`/`is_propulseo_team`) en un seul.

## 4. Décomposition en sous-projets (ordonnés, chacun livrable seul)
- **SP0 — Socle de liaison & décisions** *(à brainstormer en premier)* : FK `legacy_project_id`, index `contacts.email`, valider R-009, aligner helpers RLS, **purger le dead code** (`financialSyncService`, `activityService`, `client_posts`, store persist stale). Trancher la table canonique de chaque concept (§1 validé). **Aucune migration de donnée — juste les rails + décisions.**
- **SP1 — Identité client unifiée** : `contacts` registre unique, `project_contacts` étoffé, vue `client_unified_v2`, corriger `SupabaseService`. Déprécier `clients`/`leads`. *(parallélisable avec SP4)*
- **SP2 — Conversion lead→projet unique** : une RPC `admin_convert_*` pour les 3 pipelines → toujours projet+contact+project_contact+activité. Mapping des statuts.
- **SP3 — Facturation convergente** : `propulspace.invoices` canonique, déprécier `project_invoices_v2`, vue `invoices_unified_v2`, trigger `paid → accounting_entry` (dédup).
- **SP4 — Documents canoniques** : migrer `project_documents_v2 → propulspace.documents`, **corriger R-008** (fuite storage inter-clients). Tranche la plus mûre. *(parallélisable avec SP1)*
- **SP5 — Activités & timeline** : tout sur `project_activities_v2` + `contact_activities`, **migrer le localStorage**, déprécier les 4-5 tables d'activités legacy. `audit_log` séparé.
- **SP6 — Communication & calendrier** : `posts.project_id`, supprimer `client_posts`, unifier `events`/`calendar_events`.

**Ordre** : SP0 → (SP1, SP4) → SP2 → SP3 → SP5 → SP6.

## 5. Contraintes & risques (load-bearing)
- **Schéma `propulspace` non exposé** : absorber dans propulspace = créer un couple vue+RPC à chaque table. N'y mettre que ce qui doit être sous RLS client.
- **2 clients Supabase / 2 sessions** (`supabase` `sb-crm-propulseo-auth` vs `portalSupabase` `sb-propulspace-auth` + anon ; proxy `v2`/`v2Anon`/`v2Portal`). Maintenir la séparation (sinon collision session admin↔client). Le CRM lit via vues **admin** (`*_admin_v2`, SECURITY DEFINER), jamais via les vues client (`portal_project_id()`).
- **R-009** : `portal_client_email` sans UNIQUE → mauvais portail servi si 2 projets même email. Blocker du multi-projets (Q2).
- **R-008** : policy storage `propulspace-documents` sans filtre projet = fuite inter-clients. À corriger avant SP4.
- **Drift client** : `useStore` (Zustand persist `propulseo-store`) réinjecte des données stale au montage. Triple store (`useStore`/`realtimeStore`/`useState`). Vider/migrer le persist.
- **Proxy v2 opaque** : renommer une table `_v2` sans MAJ `V2_TABLE_MAP` = 42P01 silencieux en prod.
- **Casse le portail si** : on touche les vues `propulspace_*_v2` (security_invoker/whitelist), `portal_project_id()`/`portal_client_email`, les RPC `admin_*` (pas de filet TS), le trigger `guard_portal_columns_admin_only`, ou `V2_TABLE_MAP`.
- **Types `database.ts` en retard** sur migrations 270+ (RPC `admin_*` en `any` dans `adminRpc.ts`). Régénérer après chaque RPC.

## 6. Questions à trancher (Product Owner)
1. **Anciens modules/tables** : supprimer définitivement `clients`/`projects`/`leads`/CRMBotOne/CRMERP, ou garder en lecture seule durant la transition ?
2. **Un client = combien de projets ?** 1 projet = 1 client (actuel), ou N projets/client avec 1 portail par projet vs 1 portail multi-projets ? (Impacte R-009, UNIQUE `portal_client_email`.)
3. **Identité client** : `contacts` (CRM) ou `auth.users` (portail) fait autorité ? Les clients portail apparaissent-ils dans Contacts ?
4. **Compta** : `propulspace.invoices` payée génère-t-elle auto une `accounting_entry`, ou saisie manuelle (réconciliation) ?
5. **Pipeline leads** : 3 pipelines (site web/ERP/qualif) + vue d'agrégation, ou 1 table `leads` unifiée (mapping statuts FR/EN) ?
6. **Activation portail** : à la signature ? à la conversion lead→projet ? manuellement (actuel) ?
7. **Documents** : `propulspace.documents` seule (y compris docs internes non-client), ou espace doc interne séparé ?
8. **Communication** : un post est-il toujours rattaché à un projet (`project_id` NOT NULL) ou peut rester « agence » ?
9. **Tâches** : garder `checklist_items_v2` (interne) vs `project_steps` (client) distincts, ou une entité + flag `visible_to_client` ?
10. **`user_profiles` vs `users`** : finir la migration vers `users` ou garder les deux ?

## 7. Fichiers load-bearing
`src/lib/supabase.ts` (proxy v2 + 3 clients) · `src/modules/LeadsV3/hooks/useConvertLeadToProject.ts` (chemin nu à aligner) · migration `…propulspace_256` (conversion complète = bon modèle) · `…propulspace_254` (vue d'union = pattern) · `src/modules/EspaceClient/admin/lib/adminRpc.ts` (catalogue RPC) · `…propulspace_265_idx_portal_client_email` (R-009, vérifier appliquée).
