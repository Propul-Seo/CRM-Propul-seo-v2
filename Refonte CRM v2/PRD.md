# PRD — Refonte V2 Gestion de Projets

> CRM Propul'seo — Spécifications pour implémentation via Claude Code
> Version 1.0 — Avril 2026

---

## 1. Contexte

### Problème

Le module gestion de projets est trop basique : 3 colonnes Kanban, une checklist libre sans templates, aucun journal d'activité, aucun stockage d'accès client, aucune gestion documentaire. L'équipe (4+ personnes) perd des informations critiques.

### Objectif

Le CRM doit devenir la seule source de vérité. Il doit se remplir automatiquement au maximum (sync Gmail, détection IA, triggers auto). Seules 4 actions restent manuelles : rédiger un CR d'appel, valider un accès détecté, déplacer une carte Kanban, logger une décision orale.

### Périmètre

Uniquement le module gestion de projets. Ne PAS toucher : CRM (pipeline leads), Communication (chat), CRM ERP, Bot One, Calendar, Settings.

---

## 2. Audit du code V1

### Fichiers clés à modifier

| Fichier | Lignes | Action | Détail |
|---------|--------|--------|--------|
| `src/modules/ProjectsManager/hooks/useProjectDragDrop.ts` | ~120 | Refonte | COLUMN_CONFIG : 3 → 9 colonnes. Pipeline rules. |
| `src/modules/ProjectsManager/components/ProjectKanban.tsx` | ~100 | Refonte | Layout 9 colonnes scrollable. Cartes enrichies. |
| `src/modules/ProjectsManager/components/ProjectCard.tsx` | ~80 | Refonte | Badges presta, deadline colorée, score, dernière activité. |
| `src/modules/ProjectDetails/index.tsx` | 433 | Refonte majeure | Éclater en 7 sous-composants (1 par onglet). |
| `src/hooks/useProjectChecklists.ts` | ~120 | Refonte | Phases, templates, sous-tâches, assignation. |
| `src/types/database.ts` | ~500 | Extension | Types des nouvelles tables. |
| `src/types/supabase-types.ts` | ~80 | Extension | Row/Insert/Update types. |
| `src/modules/Dashboard/` | ~1170 | Extension | KPIs projet. |
| `src/components/notifications/MentionNotificationCenter.tsx` | ~200 | Extension | Alertes projet. |

### Ce qu'on réutilise tel quel

- `@dnd-kit/core` + `@dnd-kit/sortable` : drag & drop en place
- `cmdk` : installé dans package.json, jamais utilisé — pour recherche Cmd+K
- `RealtimeProvider` : Supabase Realtime déjà câblé
- shadcn/ui complet, Zustand store, Recharts, sonner, lucide-react
- `react-beautiful-dnd` : utilisé par CRM Kanban leads (séparé, ne pas toucher)

### Tables existantes à modifier

**projects** — ajouter :
- `type text[] DEFAULT '{}'` — types de presta (web, seo, erp, saas)
- `completion_score integer DEFAULT 0`
- `last_activity_at timestamptz`
- Étendre les statuts à 9 valeurs

**project_checklists** — ajouter :
- `phase text DEFAULT 'general'`
- `parent_task_id uuid REFERENCES project_checklists(id)` — sous-tâches
- `sort_order integer DEFAULT 0`
- `status text DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done'))`

**accounting_entries** — ajouter :
- `project_id uuid REFERENCES projects(id)` — facturation par projet

---

## 3. Migration SQL

Créer `supabase/migrations/20260404_project_management_v2.sql` :

```sql
-- ============================================================
-- MODIFICATIONS DES TABLES EXISTANTES
-- ============================================================

-- 1. Étendre projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS type text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS completion_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;

-- 2. Étendre project_checklists
ALTER TABLE project_checklists
  ADD COLUMN IF NOT EXISTS phase text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES project_checklists(id),
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done'));

-- 3. Étendre accounting_entries
ALTER TABLE accounting_entries
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id);

-- ============================================================
-- NOUVELLES TABLES
-- ============================================================

-- Journal / Timeline
CREATE TABLE IF NOT EXISTS project_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id),
  type text NOT NULL CHECK (type IN ('email','call','decision','task','file','access','status','invoice','system')),
  content text NOT NULL,
  is_auto boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_activities_project ON project_activities(project_id, created_at DESC);

-- Coffre-fort accès
CREATE TABLE IF NOT EXISTS project_accesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('hosting','cms','analytics','social','tools','design')),
  service_name text NOT NULL,
  url text,
  login_encrypted text,
  password_encrypted text,
  status text DEFAULT 'missing' CHECK (status IN ('active','missing','broken','expired','pending_validation')),
  detected_from_email boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Documents versionnés
CREATE TABLE IF NOT EXISTS project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text CHECK (category IN ('contract','brief','mockup','report','deliverable','invoice','other')),
  version integer DEFAULT 1,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Templates de checklist
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_type text NOT NULL CHECK (project_type IN ('web','seo','erp','saas')),
  phase text NOT NULL,
  title text NOT NULL,
  default_priority text DEFAULT 'medium',
  sort_order integer NOT NULL
);

-- Brief structuré
CREATE TABLE IF NOT EXISTS project_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  objective text,
  target_audience text,
  pages text,
  techno text,
  design_references text,
  notes text,
  status text DEFAULT 'draft' CHECK (status IN ('draft','validated','frozen')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications projet
CREATE TABLE IF NOT EXISTS project_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id),
  project_id uuid REFERENCES projects(id),
  type text NOT NULL,
  title text NOT NULL,
  body text,
  read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

-- Sync Gmail (Sprint 3)
CREATE TABLE IF NOT EXISTS email_syncs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  gmail_id text UNIQUE NOT NULL,
  from_address text NOT NULL,
  to_address text NOT NULL,
  subject text NOT NULL,
  body_summary text,
  email_type text,
  has_attachments boolean DEFAULT false,
  synced_at timestamptz DEFAULT now()
);

-- Moteur workflows
CREATE TABLE IF NOT EXISTS automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  trigger_event text NOT NULL,
  action_type text NOT NULL,
  config jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_accesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_manage_project_activities" ON project_activities FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_manage_project_accesses" ON project_accesses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_manage_project_documents" ON project_documents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "anyone_read_task_templates" ON task_templates FOR SELECT USING (true);
CREATE POLICY "auth_manage_project_briefs" ON project_briefs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "users_own_notifications" ON project_notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "auth_manage_email_syncs" ON email_syncs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_manage_automation_rules" ON automation_rules FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE project_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE project_notifications;

-- ============================================================
-- TRIGGERS — auto-alimentation du journal
-- ============================================================

CREATE OR REPLACE FUNCTION log_checklist_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.completed = false AND NEW.completed = true THEN
    INSERT INTO project_activities (project_id, user_id, type, content, is_auto, metadata)
    VALUES (NEW.project_id, auth.uid(), 'task', 'Tâche terminée : ' || NEW.title, true, jsonb_build_object('task_id', NEW.id));
    UPDATE projects SET last_activity_at = now() WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_document_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_activities (project_id, user_id, type, content, is_auto, metadata)
  VALUES (NEW.project_id, NEW.uploaded_by, 'file', 'Document uploadé : ' || NEW.name || ' (V' || NEW.version || ')', true, jsonb_build_object('document_id', NEW.id));
  UPDATE projects SET last_activity_at = now() WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_access_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_activities (project_id, type, content, is_auto, metadata)
  VALUES (NEW.project_id, 'access', 'Accès ajouté : ' || NEW.service_name || ' (' || NEW.category || ')', true, jsonb_build_object('access_id', NEW.id));
  UPDATE projects SET last_activity_at = now() WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_checklist_activity AFTER UPDATE ON project_checklists FOR EACH ROW EXECUTE FUNCTION log_checklist_activity();
CREATE TRIGGER trg_document_activity AFTER INSERT ON project_documents FOR EACH ROW EXECUTE FUNCTION log_document_activity();
CREATE TRIGGER trg_access_activity AFTER INSERT ON project_accesses FOR EACH ROW EXECUTE FUNCTION log_access_activity();
```

---

## 4. Seed data — Templates de checklist

Créer `supabase/migrations/20260404_seed_task_templates.sql` :

```sql
-- Template Création Web (21 tâches)
INSERT INTO task_templates (project_type, phase, title, default_priority, sort_order) VALUES
  ('web', 'onboarding', 'Brief initial validé', 'high', 1),
  ('web', 'onboarding', 'Accès récupérés (hébergement, domaine, analytics)', 'high', 2),
  ('web', 'onboarding', 'Contenu reçu du client (textes, images, logo)', 'medium', 3),
  ('web', 'onboarding', 'Kick-off meeting effectué', 'medium', 4),
  ('web', 'onboarding', 'Planning projet défini et validé', 'medium', 5),
  ('web', 'conception', 'Arborescence du site validée', 'medium', 6),
  ('web', 'conception', 'Maquettes desktop livrées', 'high', 7),
  ('web', 'conception', 'Maquettes mobile livrées', 'high', 8),
  ('web', 'conception', 'Validation client des maquettes', 'high', 9),
  ('web', 'developpement', 'Environnement de dev configuré', 'low', 10),
  ('web', 'developpement', 'Intégration des pages principales', 'high', 11),
  ('web', 'developpement', 'Fonctionnalités dynamiques développées', 'high', 12),
  ('web', 'developpement', 'Optimisation SEO on-page', 'medium', 13),
  ('web', 'developpement', 'Tests cross-browser et responsive', 'medium', 14),
  ('web', 'recette', 'Recette interne effectuée', 'high', 15),
  ('web', 'recette', 'Recette client effectuée', 'high', 16),
  ('web', 'recette', 'Mise en production', 'high', 17),
  ('web', 'recette', 'Formation client effectuée', 'medium', 18),
  ('web', 'recette', 'Redirections anciennes URLs configurées', 'medium', 19),
  ('web', 'post_livraison', 'Garantie correctifs active (30 jours)', 'medium', 20),
  ('web', 'post_livraison', 'Rapport SEO M+1 produit', 'medium', 21),
  ('web', 'post_livraison', 'Proposition maintenance envoyée', 'low', 22);

-- Template SEO (14 tâches)
INSERT INTO task_templates (project_type, phase, title, default_priority, sort_order) VALUES
  ('seo', 'onboarding_audit', 'Brief SEO validé (objectifs, mots-clés, concurrence)', 'high', 1),
  ('seo', 'onboarding_audit', 'Accès récupérés (Search Console, Analytics, CMS)', 'high', 2),
  ('seo', 'onboarding_audit', 'Audit technique du site réalisé', 'high', 3),
  ('seo', 'onboarding_audit', 'Audit sémantique et concurrentiel réalisé', 'high', 4),
  ('seo', 'onboarding_audit', 'Stratégie SEO définie et validée', 'high', 5),
  ('seo', 'optimisation_technique', 'Corrections techniques prioritaires appliquées', 'high', 6),
  ('seo', 'optimisation_technique', 'Structure des URLs optimisée', 'medium', 7),
  ('seo', 'optimisation_technique', 'Temps de chargement amélioré', 'medium', 8),
  ('seo', 'optimisation_technique', 'Balisage structuré (Schema.org) mis en place', 'medium', 9),
  ('seo', 'contenu_netlinking', 'Calendrier éditorial défini', 'medium', 10),
  ('seo', 'contenu_netlinking', 'Contenus optimisés publiés', 'high', 11),
  ('seo', 'contenu_netlinking', 'Stratégie de netlinking en cours', 'medium', 12),
  ('seo', 'contenu_netlinking', 'Suivi des positions activé', 'low', 13),
  ('seo', 'reporting', 'Rapport mensuel produit et envoyé', 'high', 14);

-- Template ERP/SaaS (14 tâches)
INSERT INTO task_templates (project_type, phase, title, default_priority, sort_order) VALUES
  ('erp', 'cadrage', 'Brief fonctionnel validé', 'high', 1),
  ('erp', 'cadrage', 'Cahier des charges rédigé et validé', 'high', 2),
  ('erp', 'cadrage', 'Accès environnement récupérés', 'high', 3),
  ('erp', 'cadrage', 'Architecture technique définie', 'high', 4),
  ('erp', 'cadrage', 'Planning par sprints défini', 'medium', 5),
  ('erp', 'developpement_iteratif', 'Sprint 1 : MVP / core features livré', 'high', 6),
  ('erp', 'developpement_iteratif', 'Démo client par sprint effectuée', 'high', 7),
  ('erp', 'developpement_iteratif', 'Tests unitaires et d''intégration en place', 'medium', 8),
  ('erp', 'developpement_iteratif', 'Retours client traités et documentés', 'high', 9),
  ('erp', 'recette_deploiement', 'Recette fonctionnelle complète', 'high', 10),
  ('erp', 'recette_deploiement', 'Tests de charge et sécurité réalisés', 'high', 11),
  ('erp', 'recette_deploiement', 'Déploiement en production', 'high', 12),
  ('erp', 'recette_deploiement', 'Formation utilisateurs et documentation', 'medium', 13),
  ('erp', 'maintenance', 'Contrat de maintenance signé', 'medium', 14);

-- Dupliquer ERP pour SaaS (mêmes tâches)
INSERT INTO task_templates (project_type, phase, title, default_priority, sort_order)
SELECT 'saas', phase, title, default_priority, sort_order FROM task_templates WHERE project_type = 'erp';
```

---

## 5. Kanban V2

### 5.1 Colonnes (modifier COLUMN_CONFIG dans useProjectDragDrop.ts)

| ID (ProjectStatus) | Titre | Icône (lucide) | Couleur |
|---|---|---|---|
| `prospect` | Prospect | UserPlus | bg-gray-900/30 border-gray-700 |
| `brief_received` | Brief reçu | FileText | bg-blue-900/30 border-blue-700 |
| `quote_sent` | Devis envoyé | Send | bg-indigo-900/30 border-indigo-700 |
| `in_progress` | En cours | Play | bg-green-900/30 border-green-700 |
| `review` | Recette | Eye | bg-orange-900/30 border-orange-700 |
| `delivered` | Livré | CheckCircle | bg-teal-900/30 border-teal-700 |
| `maintenance` | Maintenance | Wrench | bg-purple-900/30 border-purple-700 |
| `on_hold` | En pause | Pause | bg-yellow-900/30 border-yellow-700 |
| `closed` | Clôturé | Archive | bg-gray-800/30 border-gray-600 |

Mapper les anciens statuts : `planning` → `prospect`, `completed` → `closed`.

Le layout doit être scrollable horizontalement pour gérer 9 colonnes.

### 5.2 Pipeline rules (validation dans handleDragEnd)

| Transition vers | Condition | Message d'erreur |
|---|---|---|
| `brief_received` | project_briefs existe pour ce projet | Enregistrez le brief d'abord |
| `quote_sent` | Au moins 1 document catégorie 'contract' ou 'other' | Uploadez le devis dans les documents |
| `in_progress` | Brief validé + ≥1 accès + checklist générée | Vérifiez brief, accès et checklist |
| `delivered` | Toutes tâches phase 'recette' terminées | Terminez la recette avant de livrer |
| `closed` | Aucune facture impayée sur ce projet | Soldez les factures avant de clôturer |

### 5.3 Carte Kanban enrichie (modifier ProjectCard.tsx)

Afficher sur chaque carte :
- Nom du projet + nom du client (join clients via client_id)
- Badge(s) type presta : Web (bleu), SEO (vert), ERP (orange), SaaS (violet)
- Avatar + nom du responsable (join user_profiles via assigned_to)
- DeadlineBadge : vert (> 7j), orange (≤ 7j), rouge (dépassée)
- Barre de progression (progress existant)
- Score de complétude (petit badge circulaire)
- Date dernière activité (last_activity_at)

---

## 6. Fiche projet — 7 onglets

Éclater `src/modules/ProjectDetails/index.tsx` en composants séparés dans `src/modules/ProjectDetails/components/` :

### 6.1 ProjectOverview.tsx — Vue d'ensemble

Fiche complète du projet en lecture/édition :
- Client (join clients), contacts multiples (join contacts)
- Type de presta (badges), responsable, participants
- Budget, dates début/fin, deadline
- Score de complétude (jauge), dernière activité
- Métriques rapides : tâches terminées/total, accès actifs/manquants, docs uploadés

### 6.2 ProjectChecklist.tsx — Checklist par phase

Refonte de la checklist actuelle :
- Groupement par phase (sections dépliables)
- Chaque tâche : titre, assigné, deadline, priorité, statut (todo/in_progress/done)
- Sous-tâches (parent_task_id)
- À la création du projet : trigger PostgreSQL copie les tâches depuis task_templates selon project.type[]
- Progression auto-calculée

Hook : `useProjectChecklists.ts` (refonte de l'existant)

### 6.3 ProjectTimeline.tsx — Journal

Timeline chronologique inverse :
- Entrées auto (triggers) tagguées "auto" + entrées manuelles (CR d'appel)
- Filtres par type (email, call, decision, task, file, access, status, invoice, system)
- Filtres par auteur
- Formulaire d'ajout manuel (type + contenu)
- Realtime via Supabase subscribe

Hook : `useProjectActivities.ts` (nouveau)

### 6.4 ProjectAccesses.tsx — Coffre-fort accès

Structuré par catégorie (hosting, cms, analytics, social, tools, design) :
- Chaque accès : service, URL, login, password (masqué par défaut), statut
- Statuts avec badge couleur : Actif (vert), Manquant (rouge), Non fonctionnel (orange), Expiré (gris), À valider (bleu)
- Chiffrement des mots de passe via Supabase Vault / pgcrypto
- Bouton copier login/password

Hook : `useProjectAccesses.ts` (nouveau)

### 6.5 ProjectDocuments.tsx — Documents

Upload via Supabase Storage (bucket 'project-documents') :
- Catégorisation : contract, brief, mockup, report, deliverable, invoice, other
- Auto-versioning : si fichier similaire existe → V2, V3...
- Affichage : nom, catégorie, version (badge), date, uploadeur
- Convention de nommage auto : Categorie_Client_VN.ext

Hook : `useProjectDocuments.ts` (nouveau)

### 6.6 ProjectBrief.tsx — Brief & specs

Brief structuré (1 par projet, upsert) :
- Champs : objectif, cible, pages/fonctionnalités, techno, références design, notes
- Statut : brouillon / validé / figé
- Section "Demandes de modification" : liste avec titre, description, statut (en attente/urgent/traité), date

Hook : `useProjectBrief.ts` (nouveau)

### 6.7 ProjectBilling.tsx — Facturation

Connexion avec la table accounting_entries existante (via project_id) :
- Échéancier : liste des factures/paiements liés au projet
- Métriques : montant total, payé, reste à facturer
- Statuts : brouillon, envoyée, payée, en retard
- Alerte si impayée > 30 jours

Hook : réutiliser les hooks Accounting existants + filtre par project_id

---

## 7. Hooks à créer

| Hook | Fichier | Table | Fonctionnalités |
|---|---|---|---|
| `useProjectActivities` | `src/hooks/useProjectActivities.ts` | project_activities | CRUD + Realtime subscribe. Filtres type/auteur. |
| `useProjectAccesses` | `src/hooks/useProjectAccesses.ts` | project_accesses | CRUD. Chiffrement/déchiffrement. |
| `useProjectDocuments` | `src/hooks/useProjectDocuments.ts` | project_documents | CRUD + upload Storage + auto-versioning. |
| `useProjectBrief` | `src/hooks/useProjectBrief.ts` | project_briefs | CRUD upsert (1 brief par projet). |
| `useProjectNotifications` | `src/hooks/useProjectNotifications.ts` | project_notifications | CRUD + mark as read + Realtime. |
| `useTaskTemplates` | `src/hooks/useTaskTemplates.ts` | task_templates | Lecture. Génération checklist à la création projet. |
| `useCompletionScore` | `src/hooks/useCompletionScore.ts` | projects | Calcul multi-critères (15% overview + 20% accès + 30% checklist + 15% journal + 10% docs + 10% factu). |
| `useGlobalSearch` | `src/hooks/useGlobalSearch.ts` | toutes | Full-text PostgreSQL tsvector/tsquery. Résultats groupés. |

---

## 8. Composants UI à créer

| Composant | Fichier | Description |
|---|---|---|
| `GlobalSearch` | `src/components/common/GlobalSearch.tsx` | Command palette Cmd+K avec cmdk. Recherche full-text. |
| `NotificationBell` | `src/components/notifications/NotificationBell.tsx` | Cloche dans Header.tsx, compteur, dropdown. |
| `ProjectStatusBadge` | `src/components/projects/ProjectStatusBadge.tsx` | Badge coloré pour les 9 statuts. |
| `DeadlineBadge` | `src/components/projects/DeadlineBadge.tsx` | Vert (> 7j), orange (≤ 7j), rouge (dépassée). |
| `CompletionScore` | `src/components/projects/CompletionScore.tsx` | Jauge circulaire du score. |
| `PrestaBadge` | `src/components/projects/PrestaBadge.tsx` | Badge type presta : Web (bleu), SEO (vert), ERP (orange), SaaS (violet). |

---

## 9. Ordre d'implémentation

### Sprint 1 — Fondations (Sem. 1-2)

1. Migration SQL (section 3) + seed templates (section 4)
2. Types TypeScript (étendre database.ts + supabase-types.ts)
3. Kanban 9 colonnes (section 5) — modifier useProjectDragDrop.ts + ProjectCard.tsx
4. Fiche projet 7 onglets — éclater ProjectDetails/index.tsx, créer ProjectOverview.tsx
5. Templates checklist — refonte useProjectChecklists.ts

### Sprint 2 — Mémoire du projet (Sem. 3-4)

1. ProjectTimeline.tsx + useProjectActivities.ts (journal avec Realtime)
2. ProjectAccesses.tsx + useProjectAccesses.ts (coffre-fort)
3. ProjectDocuments.tsx + useProjectDocuments.ts (upload + versioning)
4. ProjectChecklist.tsx refonte complète (phases, assigné, deadline, sous-tâches)

### Sprint 3 — Intégrations IA (Sem. 5-6)

1. Edge Function `supabase/functions/gmail-sync/index.ts` (OAuth Gmail + polling + matching)
2. Résumé IA emails (Claude API claude-sonnet-4-20250514)
3. Détection auto accès dans les emails
4. Enrichissement client via Pappers API (SIRET → infos société)

### Sprint 4 — Alertes & workflows (Sem. 7-8)

1. Moteur workflows (automation_rules + Edge Function cron daily-alerts)
2. NotificationBell + extension MentionNotificationCenter
3. Score de complétude auto (useCompletionScore)
4. ProjectBilling.tsx (connexion Accounting)

### Sprint 5 — Dashboard & polish (Sem. 9-10)

1. Dashboard enrichi (KPIs projet : complétude, charge, deadlines, dormants)
2. GlobalSearch Cmd+K (cmdk + full-text PostgreSQL)
3. Vue "Mes tâches du jour" (extension PersonalTasks)
4. ProjectBrief.tsx + brief auto IA (optionnel)
5. Tests, bugs, onboarding équipe

---

## 10. Types TypeScript à ajouter

Ajouter dans `src/types/database.ts` les interfaces des nouvelles tables, puis dans `src/types/supabase-types.ts` les alias Row/Insert/Update correspondants. Suivre exactement le pattern existant (voir les types `activities`, `projects`, `tasks` comme modèle).
