# SP1 — Identité client unifiée (fusion CRM ↔ Propul'Space)

> Tranche SP1 de la Stratégie C. Cadrée 2026-06-08 à partir d'un workflow multi-agents
> (4 explorateurs sur le code réel + 2 architectes + 1 revue adversariale).
> Doc archi : `docs/superpowers/2026-06-05-crm-propulspace-fusion-architecture.md` — pré-requis : SP0 livré (ADR-005).
> **Principe : `contacts` devient le registre identité canonique. Le portail reste vert à chaque palier.**

## 1. Objectif
Faire de `contacts` la **source de vérité unique** de l'identité client, exposer une vue
canonique `client_unified_v2`, **fermer la fuite RLS** sur `project_contacts` (aujourd'hui
lisible/écrivable par tout authentifié, y compris un client portail), et **supprimer le code
mort schizophrène** (`supabaseService` lit/écrit `leads` mais update/delete sur `contacts`).
Aucune dépendance nouvelle ; chaque étape laisse le portail fonctionnel.

## 2. Périmètre

### Dans SP1
- **Purge dead code TS** : `supabaseService.ts` + `useKanbanPipeline.ts` (0 import externe à confirmer à l'impl.).
- **Migration 286** (atomique) : vue `client_unified_v2` + **durcissement RLS `project_contacts`**.
- **Migration 287** : archivage des tables legacy `leads` / `clients` (fin de SP1, grace period).
- **Front** : fix du bug silencieux `usePortalAuth` (R-009), type `ClientUnifiedRow`, régénération `database.ts`.

### Hors SP1 (reporté)
- Consolidation des 2 chemins de conversion lead→projet (RPC unique) → **SP2**.
- Le switcher multi-projets portail (ADR-004) → backlog.
- Q5 (1 table `leads` unifiée vs 3 pipelines + vue) → **SP2**.
- Le branchement du portail sur `client_unified_v2` (le portail lit déjà `projects_v2.client_*`, on n'y touche pas en SP1).
- Toute écriture portail sur `contacts` (le portail n'écrit jamais `contacts`).

## 3. Décisions (ratifient ADR-005, complètent les Q ouvertes)
- **Q1 — legacy `leads`/`clients`** : **grace period** (choix validé). `clients` est vide / 0 usage confirmé → DROP direct. `leads` → `RENAME TO leads_legacy_archive` (réversible), DROP définitif **après ~1 semaine** d'observation, **à reconfirmer avant l'étape 287**.
- **Q2 — multi-projets** : pas de `UNIQUE` sur `portal_client_email` (déjà ADR-004/005, index simple mig. 265 en place). SP1 corrige seulement le `.maybeSingle()` cassant.
- **Q3 — identité** : `contacts` fait autorité (ADR-005). `client_unified_v2` est alimentée par `contacts` + `project_contacts`, jamais par `auth.users`.
- **DM-01 — écritures `project_contacts`** : restent **directes** pour l'équipe interne (`useProjectContactsV3` utilise la session admin / `is_team_member()`), pas de passage par RPC en SP1.
- **YAGNI** : pas de colonnes snapshot `contact_email`/`contact_full_name` sur `project_contacts` (la vue lit `contacts` en jointure — colonnes inutiles tant qu'aucune dénormalisation n'est requise).

## 4. Livrable 1 — Purge dead code (tsc + build verts après chaque retrait)
| # | Cible (à reconfirmer 0 import à l'impl.) | Action |
|---|---|---|
| **P1** | `src/services/supabaseService.ts` — incohérent (getClients/createClient → `leads`, update/delete → `contacts`), aucun import externe | Supprimer le fichier + retirer un éventuel ré-export de barrel. |
| **P2** | `src/hooks/useKanbanPipeline.ts` — aucun import externe | Supprimer le fichier + barrel éventuel. |

> Gain bonus : ces fichiers portent une partie des erreurs `tsc` strictes pré-existantes (cf. 22 erreurs dans `supabaseService.ts`).

## 5. Livrable 2 — Migrations SQL

### Migration 286 — `client_unified_v2` + RLS `project_contacts` (ATOMIQUE, à coller en un seul bloc)
> **Critique adversariale intégrée** : la vue et le durcissement RLS DOIVENT être dans la même
> transaction. Sinon, fenêtre où la vue existe sans le filtre portail = fuite.
> **Et** : garder une policy `FOR ALL` (équipe) en plus de la `FOR SELECT` portail, sinon les
> écritures CRM (`useProjectContactsV3`) cassent (RLS bloquant par défaut).

```sql
BEGIN;

-- 1. Vue canonique identité client (read-only, pattern mig. 254)
DROP VIEW IF EXISTS public.client_unified_v2;
CREATE VIEW public.client_unified_v2
  WITH (security_invoker = true) AS
SELECT
  c.id, c.email, c.name, c.phone, c.company, c.sector,
  c.status::text AS status, c.source, c.lead_score, c.website,
  c.created_at, c.updated_at,
  pc.project_id,
  pc.role::text AS contact_role
FROM public.contacts c
INNER JOIN public.project_contacts pc
  ON pc.contact_id = c.id AND pc.role = 'primary';

REVOKE ALL ON public.client_unified_v2 FROM anon;   -- règle maison (mig. 195)
GRANT SELECT ON public.client_unified_v2 TO authenticated;

-- 2. Durcissement RLS project_contacts : remplacer les policies permissives
DROP POLICY IF EXISTS "project_contacts_read"  ON public.project_contacts;
DROP POLICY IF EXISTS "project_contacts_write" ON public.project_contacts;

-- 2a. Lecture : équipe interne OU client portail de CE projet uniquement
CREATE POLICY "project_contacts_select"
  ON public.project_contacts FOR SELECT TO authenticated
  USING (
    public.is_team_member()
    OR project_id = propulspace.portal_project_id()
  );

-- 2b. Écriture : équipe interne seule (FOR ALL, sinon INSERT/UPDATE/DELETE CRM bloqués)
CREATE POLICY "project_contacts_write_team"
  ON public.project_contacts FOR ALL TO authenticated
  USING (public.is_team_member())
  WITH CHECK (public.is_team_member());

COMMENT ON VIEW public.client_unified_v2 IS
  'Vue canonique identité client (contacts + project_contacts role=primary). SP1 fusion.';

COMMIT;
```

### Migration 287 — Archivage legacy (fin de SP1, après reconfirmation Q1)
```sql
-- clients : vide / 0 usage confirmé -> DROP direct
DROP TABLE IF EXISTS public.clients;

-- leads : archivage réversible (DROP définitif ~1 semaine plus tard, migration séparée)
ALTER TABLE IF EXISTS public.leads RENAME TO leads_legacy_archive;
```

## 6. Livrable 3 — Front
| Fichier | Action |
|---|---|
| `src/modules/EspaceClient/shared/hooks/usePortalAuth.ts:39` | **Fix R-009** : `.maybeSingle()` → `.limit(1).maybeSingle()` (ne plante plus en cas de collision d'email — surtout PAS `.single()`, qui throw sur 0 résultat). Si besoin de déterminisme multi-projets, ajouter un `.order(<colonne récence vérifiée>, { ascending:false })` à l'impl. |
| `src/types/client-unified.ts` (créer) | Type `ClientUnifiedRow` (13 colonnes de la vue) — type custom (Supabase ne génère pas les vues). |
| `src/types/database.ts` | Régénérer après migration 286 (ou ajout ciblé). Tant que la vue ne casse aucun type existant, régénération non bloquante. |

> Le hook portail `usePortalClientIdentity` (consommation de la vue côté portail) est **reporté** : aucun besoin en SP1, le portail garde `projects_v2.client_*`. La vue sert d'abord le CRM et prépare SP2.

## 7. Tests
- **Vitest** `usePortalAuth` (régression R-009) : 2 projets même `portal_client_email` → ne renvoie plus d'erreur PGRST116, retourne 1 projet ; email sans projet → `null` sans throw.
- **SQL d'isolation** (à jouer en SQL Editor avec un JWT client test, documenté dans `supabase/seed/sp1-rls-checks.sql`) : un client portail sur `project_contacts` ne voit QUE les lignes de son projet ; un `INSERT` portail est refusé ; l'équipe interne lit/écrit normalement.

## 8. Contraintes load-bearing (ne PAS toucher)
Vues `propulspace_*_v2` · `portal_project_id()` / `portal_client_email` · RPC `admin_*` · trigger `guard_portal_columns_admin_only` · `V2_TABLE_MAP` · les 2 clients Supabase / 2 sessions · les policies `projects_v2_*` (mig. 261/262). SP1 ne modifie que `project_contacts` (RLS) et ajoute la vue `client_unified_v2`.

## 9. Definition of Done
- [ ] P1–P2 supprimés · `tsc -b --noEmit` pas plus rouge qu'avant · `npm run build` vert.
- [ ] Migration 286 appliquée à la main (vue + 2 nouvelles policies visibles) · `database.ts` à jour.
- [ ] Fix `usePortalAuth` + test de régression vert.
- [ ] Tests SQL d'isolation `project_contacts` : portail cloisonné, équipe OK (par Lyes).
- [ ] Portail vert (smoke login client + dashboard) · CRM : page projet / contacts OK (par Lyes).
- [ ] Migration 287 **différée** : à appliquer après ~1 semaine + reconfirmation Q1.
- [ ] Commits séparés par item, branche dédiée SP1.

## 10. Risques / vigilance
- **RLS 286** : si une autre voie écrit `project_contacts` sans session admin (à vérifier au-delà de `useProjectContactsV3`), elle casserait. Auditer les écrivains avant d'appliquer.
- **`is_team_member()`** : la policy en dépend ; confirmer sa sémantique (rôle non-NULL, mig. 259) couvre bien sales/marketing/etc.
- **287** : DROP `clients` irréversible — confirmer 0 donnée utile avant. `leads` archivé d'abord (réversible).
- **Numéros de migration** : 286/287 indicatifs (285 = hotfix anon). À renuméroter en continu si SP4 est appliqué entre-temps.
