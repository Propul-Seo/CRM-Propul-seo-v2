# SP2 — Conversion lead→projet unique (fusion CRM ↔ Propul'Space)

> Tranche SP2 de la Stratégie C. Cadrée 2026-06-08 (brainstorming + cartographie du code réel).
> Doc archi : `docs/superpowers/2026-06-05-crm-propulspace-fusion-architecture.md`. Pré-requis : SP1 livré (contacts/`project_contacts`/RLS).
> **Principe : une seule porte de conversion, toujours complète, pour les 3 pipelines. Le portail reste découplé.**

## 1. Objectif
Aujourd'hui la conversion lead→projet a **3 chemins incohérents** : le questionnaire (`admin_convert_qualif_to_project`, mig 256) fait le travail complet (projet + contact + `project_contacts` primary + activité + GED + marque converti) ; les pipelines **site web** (`contacts.status='signe'`) et **ERP** (`crmerp_leads.status='signes'`) passent par `useConvertLeadToProject` qui crée un **projet nu** (ni contact lié, ni activité, ni GED, ni marquage → portail cassé + risque de double conversion). SP2 unifie tout dans **une seule RPC** qui fait toujours le combo complet.

## 2. Périmètre

### Dans SP2
- **Migration colonnes** : `converted_to_project_id` sur `public.contacts` et `public.crmerp_leads` (la qualif l'a déjà).
- **RPC unifiée** `propulspace.admin_convert_lead_to_project(p_lead_id, p_lead_type)` + wrapper `public.` (pattern mig 252).
- **Front** : `useConvertLeadToProject` (site/ERP) + `useConvertQualifLead` (qualif) pointent sur la nouvelle RPC ; `adminRpc.ts` étendu ; retrait de la case « activer portail » de la conversion qualif.

### Hors SP2 (reporté / inchangé)
- Vue d'agrégation `leads_unified_v2` et fusion physique des tables leads (Q5 = conversion seule). Les 3 listes de leads + leur UI restent telles quelles.
- Toute activation portail (Q6 — voir §3). Le mapping de statut reste trivial (§3).
- Mapping de statut avancé par pipeline (YAGNI).

## 3. Décisions (brainstorming 2026-06-08)
- **Q5 — scope** : **conversion seule**. On garde les 3 tables/listes de leads ; SP2 n'unifie que l'acte de conversion. On ajoute le repère `converted_to_project_id` aux 2 pipelines qui en manquent.
- **Q6 — portail** : **découplé de la conversion**. La RPC ne touche **jamais** au portail (`portal_client_email` reste NULL à la conversion). L'activation se gère depuis la **section Propul'Space admin** (flux existant `PortalStatusSection` / `ActivatePortalDialog` / `usePortalActivation`, livré en A.2a). → On retire la case « activer portail » + l'appel `admin-portal-invite` de la conversion qualif.
- **Statut de départ** : tous les projets convertis démarrent à `brief_received` (inchangé, YAGNI — pas de mapping par pipeline).
- **Ancienne RPC qualif** : `admin_convert_qualif_to_project` **conservée en wrapper fin** appelant la nouvelle (compat / zéro régression), dépréciation après preuve. Le front, lui, bascule directement sur `admin_convert_lead_to_project`.

## 4. Livrable 1 — Migrations SQL (à appliquer à la main)

### Migration 291 — repère de conversion sur site web & ERP
```sql
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS converted_to_project_id uuid NULL
  REFERENCES public.projects_v2(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_converted_to_project_id
  ON public.contacts(converted_to_project_id) WHERE converted_to_project_id IS NOT NULL;

ALTER TABLE public.crmerp_leads
  ADD COLUMN IF NOT EXISTS converted_to_project_id uuid NULL
  REFERENCES public.projects_v2(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_crmerp_leads_converted_to_project_id
  ON public.crmerp_leads(converted_to_project_id) WHERE converted_to_project_id IS NOT NULL;
```

### Migration 292 — RPC unifiée `admin_convert_lead_to_project`
- `propulspace.admin_convert_lead_to_project(p_lead_id uuid, p_lead_type text)` — `SECURITY DEFINER`, garde `is_admin()`, `p_lead_type IN ('qualification','site_web','erp')`.
- **Structure** : (1) garde + refus si déjà converti (selon le type, lit `converted_to_project_id` de la table source) → (2) lecture+mapping de la source vers les champs `projects_v2` → (3) **routine commune** : INSERT `projects_v2` (`brief_received`) + crée/rattache le **contact primary** (`contacts` + `project_contacts`) + INSERT `project_activities_v2` (système « Converti depuis <type> ») + GED `propulspace.documents` (qualif only) + marque la source convertie (`converted_to_project_id = projet`, +`converted_at`/`status` selon table).
- **Mapping par pipeline** (le détail colonne-par-colonne ira dans le plan d'implémentation) :
  - `qualification` → réutilise la logique mig 256 (champs `company_name`, `project_type`, `budget_range`, `desired_timeline`, description composée, GED logo/charte/screenshots).
  - `site_web` → source `contacts` (`name`, `company`, `email`, `phone`, `project_price`→budget, `assigned_to`).
  - `erp` → source `crmerp_leads` (champs équivalents ERP).
- Wrapper `public.admin_convert_lead_to_project(...)` qui appelle la version `propulspace.*` (PostgREST).
- `admin_convert_qualif_to_project` réécrit en wrapper appelant `admin_convert_lead_to_project(p_lead_id, 'qualification')`.

## 5. Livrable 2 — Front
| Fichier | Action |
|---|---|
| `src/modules/LeadsV3/hooks/useConvertLeadToProject.ts` | Remplacer l'INSERT `projects_v2` nu par `supabase.rpc('admin_convert_lead_to_project', { p_lead_id, p_lead_type })` (`site_web`/`erp` selon la source). |
| `src/modules/LeadsV3/hooks/useConvertQualifLead.ts` | Appeler la nouvelle RPC (`p_lead_type='qualification'`). |
| `src/modules/EspaceClient/admin/.../QualificationLeadDetailsSheet.tsx` | **Retirer** la case « activer portail » + l'appel `admin-portal-invite` (activation = via `PortalStatusSection`). |
| `src/modules/EspaceClient/admin/lib/adminRpc.ts` | Ajouter `admin_convert_lead_to_project` à `AdminRpcMap` (types stricts). |
| `src/types/database.ts` | Régénérer après 291/292 (nouvelles colonnes + RPC). |

## 6. Tests
- **Vitest** : `useConvertLeadToProject` et `useConvertQualifLead` (mock `rpc`) — appellent la bonne RPC avec le bon `p_lead_type` ; gestion de l'erreur `already_converted`.
- **SQL** (`supabase/seed/sp2-conversion-checks.sql`, à jouer à la main) : pour chaque type, la conversion crée projet + contact primary + `project_contacts` + activité (+ GED si qualif) + marque la source ; une 2ᵉ conversion lève `already_converted`.

## 7. Contraintes load-bearing (ne PAS casser)
La RPC écrit `project_contacts` → cohérent avec la RLS SP1 durcie (session admin = `is_team_member()`). Ne pas toucher : vues client `propulspace_*_v2`, `portal_project_id()`, trigger `guard_portal_columns_admin_only`, `V2_TABLE_MAP`, les 2 sessions Supabase. La RPC n'écrit **pas** `portal_client_email` (Q6).

## 8. Definition of Done
- [ ] Migrations 291 + 292 appliquées à la main · `database.ts` régénéré.
- [ ] Les 3 pipelines convertissent via la RPC unique · projet complet + source marquée.
- [ ] `tsc` pas plus rouge · `npm run build` vert · tests vitest verts.
- [ ] Checks SQL : combo complet pour les 3 types + refus de double conversion (par Lyes).
- [ ] Smoke test : convertir un lead site web → projet avec contact + historique ; portail toujours géré séparément (par Lyes).
- [ ] Commits séparés par item, branche dédiée SP2.

## 9. Risques / vigilance
- **Mapping champs site/ERP** : `contacts`/`crmerp_leads` ont des colonnes différentes de la qualif → bien cadrer le mapping au plan (champs manquants → valeurs par défaut sûres).
- **Idempotence** : la garde `already_converted` doit lire la bonne colonne selon le type.
- **Compat** : garder `admin_convert_qualif_to_project` en wrapper évite de casser tout appelant résiduel.
- **Numéros** : 291/292 indicatifs (287/290 sont des fichiers différés non encore appliqués).
