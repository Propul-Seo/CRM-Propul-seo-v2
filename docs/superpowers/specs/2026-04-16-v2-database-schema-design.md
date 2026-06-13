# Schéma Base de Données V2 — Propul'SEO CRM

**Date** : 2026-04-16
**Statut** : Validé (design approuvé)
**Scope** : Toutes les tables nécessaires aux modules V2

---

## Décisions structurantes

| Décision | Choix |
|----------|-------|
| Organisation | Schéma PostgreSQL séparé `v2` |
| Migration | Tables existantes `public.projects_v2` etc. → `v2.projects` etc. |
| Briefs | Tables séparées par type (siteweb, erp, comm) |
| Accès sensibles | Chiffrement pgcrypto (login, password, notes) |
| Dashboard KPIs | Vues matérialisées + cron refresh 15 min |
| Facturation | Jalons de paiement à pourcentage modulable |
| Checklist | Templates réutilisables + items custom par projet |
| Features | Bibliothèque de snippets de code avec prix/temps |
| Audit | Logs automatiques via triggers SQL |
| V1 | Inchangée, FK cross-schema vers `public.users` et `public.clients` |

---

## Vue d'ensemble des tables

```
v2 (schéma)
├── projects                    -- table cœur
├── checklist_templates         -- modèles de tâches réutilisables
├── checklist_items             -- items checklist par projet
├── briefs_siteweb              -- brief spécialisé Site Web
├── briefs_erp                  -- brief spécialisé ERP
├── briefs_comm                 -- brief spécialisé Communication
├── comm_tasks                  -- tâches de production comm
├── comm_posts                  -- posts réseaux sociaux
├── comm_cycles                 -- cycles mensuels comm
├── invoices                    -- factures
├── payment_milestones          -- jalons de paiement modulables
├── project_accesses            -- coffre-fort accès (chiffré)
├── feature_templates           -- bibliothèque de features/code
├── project_features            -- features associées à un projet
├── notifications               -- notifications in-app
├── audit_logs                  -- logs d'audit automatiques
├── project_documents           -- fichiers et documents
├── project_activities          -- journal/timeline du projet
├── follow_ups                  -- suivi rdv/appels/emails
├── kpi_overview (MAT. VIEW)    -- KPIs globaux dashboard
└── kpi_monthly  (MAT. VIEW)    -- KPIs mensuels dashboard
```

**Total : 19 tables + 2 vues matérialisées**

---

## 1. Table cœur — `v2.projects`

Migration de `public.projects_v2` → `v2.projects`.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| name | text | NOT NULL | Nom du projet |
| description | text | | |
| client_id | uuid | FK → public.clients(id) | Client associé |
| assigned_to | uuid | FK → public.users(id) | Responsable |
| presta_type | text[] | NOT NULL | ['web','seo','erp','communication'] |
| status | text | NOT NULL, DEFAULT 'prospect' | prospect, brief_received, quote_sent, in_progress, review, delivered, maintenance, on_hold, closed |
| sw_status | text | | Pipeline Site Web |
| erp_status | text | | Pipeline ERP |
| comm_status | text | | Pipeline Communication |
| budget | numeric(12,2) | | Budget HT |
| start_date | date | | |
| end_date | date | | |
| completion_score | integer | DEFAULT 0 | Score de complétion 0-100 |
| ai_summary | text | | Résumé IA |
| portal_token | text | UNIQUE | Token accès portail client |
| brief_token | text | UNIQUE | Token accès formulaire brief |
| position | integer | DEFAULT 0 | Ordre dans le kanban |
| is_archived | boolean | DEFAULT false | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |
| created_by | uuid | FK → public.users(id) | |

---

## 2. Checklist & Templates

### `v2.checklist_templates`

Bibliothèque de tâches types réutilisables par type de presta et phase.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| name | text | NOT NULL | Nom du template ("Template Site Web Pro") |
| presta_type | text | NOT NULL | web, erp, communication |
| phase | text | NOT NULL | onboarding, conception, developpement, recette, post_livraison |
| title | text | NOT NULL | Titre de la tâche |
| description | text | | |
| priority | text | DEFAULT 'medium' | low, medium, high, urgent |
| estimated_hours | numeric(5,1) | | Heures estimées |
| position | integer | DEFAULT 0 | Ordre dans la phase |
| is_active | boolean | DEFAULT true | |
| created_at | timestamptz | DEFAULT now() | |
| created_by | uuid | FK → public.users(id) | |

### `v2.checklist_items`

Items concrets par projet. Copiés depuis les templates ou créés manuellement.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| project_id | uuid | FK → v2.projects(id) ON DELETE CASCADE | |
| template_id | uuid | FK → v2.checklist_templates(id), NULLABLE | NULL = item custom |
| phase | text | NOT NULL | Phase (libre, modulable par projet) |
| title | text | NOT NULL | |
| description | text | | |
| status | text | DEFAULT 'todo' | todo, in_progress, done, skipped |
| priority | text | DEFAULT 'medium' | |
| assigned_to | uuid | FK → public.users(id) | |
| due_date | date | | |
| completed_at | timestamptz | | |
| estimated_hours | numeric(5,1) | | |
| actual_hours | numeric(5,1) | | Pour suivi rentabilité |
| position | integer | DEFAULT 0 | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

---

## 3. Briefs spécialisés

### `v2.briefs_siteweb`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| project_id | uuid | FK → v2.projects(id) ON DELETE CASCADE, UNIQUE | Un seul brief par projet |
| pack | text | | starter, professionnel, entreprise, sur_mesure |
| nb_pages | integer | | |
| niveau_seo | text | | basique, avance, premium |
| objective | text | | |
| target_audience | text | | |
| design_references | text[] | | URLs de sites de référence |
| techno | text | | wordpress, custom, shopify... |
| has_blog | boolean | DEFAULT false | |
| has_ecommerce | boolean | DEFAULT false | |
| has_multilingual | boolean | DEFAULT false | |
| specific_features | text | | Demandes hors cadre |
| submitted_at | timestamptz | | NULL = brouillon |
| submitted_by | text | | Email/nom du client |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### `v2.briefs_erp`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| project_id | uuid | FK → v2.projects(id) ON DELETE CASCADE, UNIQUE | |
| modules | text[] | NOT NULL | gestion_commerciale, crm, stocks, etc. |
| nb_utilisateurs | integer | | |
| outils_integres | text[] | | Outils existants à connecter |
| objective | text | | |
| target_audience | text | | |
| budget_range | text | | <5k, 5k-15k, 15k-30k, 30k+ |
| existing_system | text | | Système actuel du client |
| specific_features | text | | |
| submitted_at | timestamptz | | |
| submitted_by | text | | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### `v2.briefs_comm`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| project_id | uuid | FK → v2.projects(id) ON DELETE CASCADE, UNIQUE | |
| type | text | | abonnement, branding, photos_videos |
| pack | text | | starter, premium, excellence |
| platforms | text[] | | instagram, linkedin, facebook, tiktok |
| objective | text | | |
| target_audience | text | | |
| tone_of_voice | text | | professionnel, décontracté, luxe... |
| posting_frequency | text | | 3x/semaine, quotidien... |
| has_photo_shooting | boolean | DEFAULT false | |
| has_video | boolean | DEFAULT false | |
| brand_guidelines | text | | Lien ou description charte graphique |
| specific_features | text | | |
| submitted_at | timestamptz | | |
| submitted_by | text | | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

---

## 4. Module Communication

### `v2.comm_tasks`

Organisation du travail de production.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| project_id | uuid | FK → v2.projects(id) ON DELETE CASCADE | |
| cycle_id | uuid | FK → v2.comm_cycles(id) ON DELETE SET NULL | |
| title | text | NOT NULL | |
| description | text | | |
| status | text | DEFAULT 'todo' | todo, in_progress, review, done |
| priority | text | DEFAULT 'medium' | low, medium, high, urgent |
| assigned_to | uuid | FK → public.users(id) | |
| due_date | date | | |
| due_hour | time | | Heure cible (ex: 10:00) |
| category | text | | creation, shooting, montage, redaction, publication |
| post_id | uuid | FK → v2.comm_posts(id) ON DELETE SET NULL | Lien vers le post associé |
| position | integer | DEFAULT 0 | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### `v2.comm_posts`

Posts réseaux sociaux créés en avance.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| project_id | uuid | FK → v2.projects(id) ON DELETE CASCADE | |
| cycle_id | uuid | FK → v2.comm_cycles(id) ON DELETE SET NULL | |
| platform | text | NOT NULL | instagram, linkedin, facebook, tiktok |
| post_type | text | | image, carousel, reel, story, article |
| caption | text | | Texte du post |
| hashtags | text[] | | |
| media_urls | text[] | | Liens Supabase Storage |
| scheduled_at | timestamptz | | Date/heure de publication prévue |
| published_at | timestamptz | | NULL = pas encore publié |
| status | text | DEFAULT 'draft' | draft, ready, scheduled, published |
| notes | text | | Notes internes |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### `v2.comm_cycles`

Cycles mensuels de production.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| project_id | uuid | FK → v2.projects(id) ON DELETE CASCADE | |
| month | integer | NOT NULL | 1-12 |
| year | integer | NOT NULL | |
| status | text | DEFAULT 'planning' | planning, in_progress, review, completed |
| objectives | text | | Objectifs du mois |
| notes | text | | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |
| | | UNIQUE(project_id, month, year) | Un seul cycle par mois par projet |

---

## 5. Facturation & Jalons

### `v2.invoices`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| project_id | uuid | FK → v2.projects(id) ON DELETE CASCADE | |
| title | text | NOT NULL | "Facture acompte 30%" |
| invoice_number | text | UNIQUE | FAC-2026-001 |
| amount | numeric(12,2) | NOT NULL | Montant HT |
| tax_rate | numeric(5,2) | DEFAULT 20 | TVA % |
| amount_ttc | numeric(12,2) | GENERATED ALWAYS AS (amount * (1 + tax_rate/100)) STORED | Calcul auto |
| status | text | DEFAULT 'draft' | draft, sent, paid, overdue, cancelled |
| due_date | date | | |
| paid_at | timestamptz | | |
| paid_amount | numeric(12,2) | | Montant réellement encaissé |
| payment_method | text | | virement, cb, cheque |
| notes | text | | |
| pdf_url | text | | Lien vers le PDF |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### `v2.payment_milestones`

Jalons de paiement modulables.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| project_id | uuid | FK → v2.projects(id) ON DELETE CASCADE | |
| label | text | NOT NULL | "À la signature", "Mi-parcours" |
| percentage | numeric(5,2) | NOT NULL | Pourcentage libre (30.00, 40.00...) |
| amount | numeric(12,2) | | Calculé depuis budget × % |
| invoice_id | uuid | FK → v2.invoices(id) ON DELETE SET NULL | Facture liée |
| status | text | DEFAULT 'pending' | pending, invoiced, paid |
| trigger_phase | text | | Phase checklist qui déclenche le jalon |
| due_date | date | | |
| position | integer | DEFAULT 0 | Ordre d'affichage |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

---

## 6. Coffre-fort accès (chiffré pgcrypto)

### `v2.project_accesses`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| project_id | uuid | FK → v2.projects(id) ON DELETE CASCADE | |
| category | text | NOT NULL | hosting, cms, analytics, social, tools, design |
| label | text | NOT NULL | "OVH Hébergement", "WordPress Admin" |
| url | text | | URL de connexion (en clair) |
| login | bytea | | Identifiant chiffré pgcrypto |
| password_encrypted | bytea | | Mot de passe chiffré pgcrypto |
| notes_encrypted | bytea | | Notes sensibles chiffrées |
| status | text | DEFAULT 'active' | active, missing, broken, expired, pending_validation |
| provided_by | text | | Qui a fourni l'accès |
| expires_at | date | | Date d'expiration |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### Fonctions de chiffrement

```sql
-- La clé est stockée dans une variable PostgreSQL sécurisée
-- SET app.encryption_key = 'votre-clé-secrète';

CREATE FUNCTION v2.encrypt_access(plain_text text) RETURNS bytea AS $$
  SELECT pgp_sym_encrypt(plain_text, current_setting('app.encryption_key'));
$$ LANGUAGE sql SECURITY DEFINER;

CREATE FUNCTION v2.decrypt_access(encrypted bytea) RETURNS text AS $$
  SELECT pgp_sym_decrypt(encrypted, current_setting('app.encryption_key'));
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 7. Bibliothèque de features

### `v2.feature_templates`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| name | text | NOT NULL | "Module Panier E-commerce" |
| description | text | | |
| category | text | NOT NULL | site_web, erp |
| subcategory | text | | ecommerce, formulaire, dashboard, api, auth... |
| code_snippet | text | | Code source / snippet |
| repo_url | text | | Lien vers le repo ou branche git |
| tech_stack | text[] | | ['react', 'node', 'postgres'] |
| estimated_hours | numeric(5,1) | | Temps de mise en place |
| price | numeric(10,2) | | Prix facturé au client |
| is_active | boolean | DEFAULT true | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |
| created_by | uuid | FK → public.users(id) | |

### `v2.project_features`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| project_id | uuid | FK → v2.projects(id) ON DELETE CASCADE | |
| template_id | uuid | FK → v2.feature_templates(id) | |
| status | text | DEFAULT 'planned' | planned, in_progress, done, cancelled |
| custom_price | numeric(10,2) | | Prix négocié (override) |
| custom_hours | numeric(5,1) | | Heures ajustées |
| notes | text | | |
| completed_at | timestamptz | | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

---

## 8. Tables transversales

### `v2.notifications`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| user_id | uuid | FK → public.users(id) ON DELETE CASCADE | |
| project_id | uuid | FK → v2.projects(id) ON DELETE CASCADE | |
| type | text | NOT NULL | brief_received, invoice_overdue, task_assigned, milestone_reached, access_expired, status_changed |
| title | text | NOT NULL | |
| message | text | | |
| is_read | boolean | DEFAULT false | |
| link | text | | Lien interne |
| created_at | timestamptz | DEFAULT now() | |

### `v2.audit_logs`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| user_id | uuid | FK → public.users(id) | |
| project_id | uuid | FK → v2.projects(id) ON DELETE SET NULL | |
| table_name | text | NOT NULL | Nom de la table modifiée |
| record_id | uuid | NOT NULL | ID de la ligne modifiée |
| action | text | NOT NULL | insert, update, delete |
| old_data | jsonb | | Snapshot avant |
| new_data | jsonb | | Snapshot après |
| ip_address | inet | | |
| created_at | timestamptz | DEFAULT now() | |

### `v2.project_documents`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| project_id | uuid | FK → v2.projects(id) ON DELETE CASCADE | |
| category | text | NOT NULL | contract, brief, mockup, report, deliverable, invoice, other |
| name | text | NOT NULL | |
| file_url | text | NOT NULL | Lien Supabase Storage |
| file_size | integer | | Taille en bytes |
| mime_type | text | | |
| version | integer | DEFAULT 1 | |
| uploaded_by | uuid | FK → public.users(id) | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### `v2.project_activities`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| project_id | uuid | FK → v2.projects(id) ON DELETE CASCADE | |
| user_id | uuid | FK → public.users(id) | |
| type | text | NOT NULL | email, call, meeting, decision, task, file, access, status, invoice, system |
| title | text | NOT NULL | |
| description | text | | |
| metadata | jsonb | | Données contextuelles |
| is_auto | boolean | DEFAULT false | true = généré par trigger |
| created_at | timestamptz | DEFAULT now() | |

### `v2.follow_ups`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| project_id | uuid | FK → v2.projects(id) ON DELETE CASCADE | |
| type | text | NOT NULL | rdv, appel, email, autre |
| title | text | NOT NULL | |
| description | text | | |
| follow_up_date | timestamptz | | |
| completed_at | timestamptz | | |
| assigned_to | uuid | FK → public.users(id) | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

---

## 9. Vues matérialisées (Dashboard)

### `v2.kpi_overview`

```sql
CREATE MATERIALIZED VIEW v2.kpi_overview AS
SELECT
  SUM(budget) FILTER (WHERE status IN ('in_progress','delivered','maintenance')) AS total_ca,
  SUM(budget) FILTER (WHERE 'communication' = ANY(presta_type) AND comm_status = 'en_production') AS mrr_comm,
  SUM(budget) FILTER (WHERE 'web' = ANY(presta_type) OR 'seo' = ANY(presta_type)) AS ca_siteweb,
  SUM(budget) FILTER (WHERE 'erp' = ANY(presta_type)) AS ca_erp,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS projects_active,
  COUNT(*) FILTER (WHERE status = 'delivered' AND updated_at >= date_trunc('month', now())) AS projects_delivered,
  (SELECT COUNT(*) FROM v2.invoices WHERE status = 'sent') AS invoices_pending,
  (SELECT COUNT(*) FROM v2.invoices WHERE status = 'overdue') AS invoices_overdue,
  AVG(completion_score) AS completion_avg,
  now() AS refreshed_at
FROM v2.projects
WHERE is_archived = false;
```

### `v2.kpi_monthly`

```sql
CREATE MATERIALIZED VIEW v2.kpi_monthly AS
SELECT
  EXTRACT(MONTH FROM created_at)::integer AS month,
  EXTRACT(YEAR FROM created_at)::integer AS year,
  SUM(budget) FILTER (WHERE 'web' = ANY(presta_type) OR 'seo' = ANY(presta_type)) AS ca_siteweb,
  SUM(budget) FILTER (WHERE 'erp' = ANY(presta_type)) AS ca_erp,
  SUM(budget) FILTER (WHERE 'communication' = ANY(presta_type)) AS ca_comm,
  COUNT(*) AS new_projects,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_projects,
  now() AS refreshed_at
FROM v2.projects
WHERE is_archived = false
GROUP BY month, year
ORDER BY year DESC, month DESC;
```

### Refresh cron (toutes les 15 minutes)

```sql
SELECT cron.schedule('refresh-kpi-overview', '*/15 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY v2.kpi_overview');
SELECT cron.schedule('refresh-kpi-monthly', '*/15 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY v2.kpi_monthly');
```

---

## 10. Triggers d'audit automatique

```sql
CREATE FUNCTION v2.audit_trigger_func() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO v2.audit_logs (user_id, table_name, record_id, action, old_data)
    VALUES (auth.uid(), TG_TABLE_NAME, OLD.id, 'delete', to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO v2.audit_logs (user_id, table_name, record_id, action, old_data, new_data)
    VALUES (auth.uid(), TG_TABLE_NAME, OLD.id, 'update', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO v2.audit_logs (user_id, table_name, record_id, action, new_data)
    VALUES (auth.uid(), TG_TABLE_NAME, NEW.id, 'insert', to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Appliqué sur toutes les tables du schéma `v2` :
- `v2.projects`
- `v2.invoices`
- `v2.payment_milestones`
- `v2.checklist_items`
- `v2.project_accesses`
- `v2.comm_tasks`
- `v2.comm_posts`

---

## 11. Configuration Supabase

### Exposer le schéma `v2` via l'API REST

```sql
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, v2';
NOTIFY pgrst, 'reload config';
```

### Usage côté client TypeScript

```ts
// Requête sur le schéma v2
const { data } = await supabase.schema('v2').from('projects').select('*');

// Requête avec jointure cross-schema
const { data } = await supabase.schema('v2').from('projects').select(`
  *,
  client:public.clients(name, email),
  assigned:public.users(name, role)
`);
```

### Extension pgcrypto

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Extension pg_cron (pour refresh des vues)

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

---

## 12. Diagramme des relations

```
public.users ←──────────────────────────────────────────────┐
public.clients ←─────────────────────────┐                  │
                                         │                  │
v2.projects ─────────────────────────────┼──────────────────┤
├── v2.checklist_items ──→ v2.checklist_templates           │
├── v2.briefs_siteweb                                       │
├── v2.briefs_erp                                           │
├── v2.briefs_comm                                          │
├── v2.comm_tasks ──→ v2.comm_posts                         │
├── v2.comm_posts ──→ v2.comm_cycles                        │
├── v2.comm_cycles                                          │
├── v2.invoices ←── v2.payment_milestones                   │
├── v2.project_accesses (chiffré pgcrypto)                  │
├── v2.project_features ──→ v2.feature_templates            │
├── v2.project_documents                                    │
├── v2.project_activities                                   │
├── v2.follow_ups                                           │
├── v2.notifications ──→ public.users                       │
└── v2.audit_logs                                           │
                                                            │
Toutes les FK assigned_to/user_id/created_by ──→ public.users
```

---

## 13. RLS (Row Level Security)

Toutes les tables du schéma `v2` auront RLS activé avec ces policies de base :

```sql
-- Lecture : utilisateurs authentifiés
CREATE POLICY "Authenticated read" ON v2.[table]
  FOR SELECT USING (auth.role() = 'authenticated');

-- Écriture : admin ou assigné
CREATE POLICY "Admin or assigned write" ON v2.[table]
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND (role = 'admin' OR id = [table].assigned_to))
  );
```

Policies spécifiques pour :
- `audit_logs` : lecture seule pour tous, écriture uniquement via triggers (SECURITY DEFINER)
- `project_accesses` : lecture restreinte aux admin et assigned_to du projet
- `notifications` : lecture/écriture uniquement pour le `user_id` concerné
