# Backlog Sprint Supabase

## Connexion Gmail → Suivi du dossier (PRIORITÉ HAUTE)

**Objectif :** Les emails de la boîte agence se référencent automatiquement sur le bon projet.

**Stack :**
- Gmail API OAuth (Google Workspace)
- Supabase Edge Function (cron toutes les 5min)
- Table `follow_up_entries` en base

**Flux :**
1. L'agence connecte sa boîte Gmail via OAuth → token stocké dans Supabase Vault
2. Edge Function cron lit les nouveaux emails (Gmail API)
3. Matching email → projet via `project_accesses.login` (adresse email client)
4. Crée automatiquement une `follow_up_entry` avec `type: 'email'`, `is_auto: true`, sujet + extrait en summary
5. Notification temps réel via Supabase Realtime

**Déjà prévu dans le code :**
- `detected_from_email: boolean` dans `ProjectAccess`
- Type `email` dans `FollowUpType`
- Adresses email clients dans les accès de chaque projet

**Migrations à écrire :**
- `follow_up_entries` (id, project_id, type, date, summary, follow_up_action, follow_up_date, follow_up_done, assigned_to, is_auto, created_at)
- `gmail_tokens` (agency_id, access_token, refresh_token, expires_at)

---

## Autres items Supabase (sprint précédent)

1. `ProjectBrief` → table `project_briefs` ou JSON sur `projects`
2. `ProjectBilling` → table `follow_up_billing` liée à `accounting_entries`
3. `useMockChecklist` → `useChecklist` CRUD sur `checklist_items`
4. `ProjectDocuments` → Supabase Storage + table `project_documents`
5. `ProjectTimeline` → table `project_activities`
6. `ProjectAccesses` → table `project_accesses`
7. `ProjectFollowUp` → table `follow_up_entries`
8. Remplacer `MOCK_PROJECTS` → `useProjects` hook Supabase
