# PROPUL'SPACE — Plan validé Phase 1 (Database & Infrastructure)

> **Status** : ✅ Validé par Lyes Triki, 2026-05-15
> **PRD source** : `docs/PRD_PROPULSPACE_v2_EN.md`
> **Branche** : `feature/propulspace-phase-1-db`
> **Durée Phase 1** : 4 jours (J1-J4)

---

## 1. Contexte

Propul'Space = portail client premium intégré au CRM existant. Couvre le parcours complet **prospect anonyme → client actif** en 8 phases (Phase 0 à Phase 7).

Cible 12 mois : **20-30 clients premium**.
Effort total : **45-55 jours dev** sur 6-8 mois.

---

## 2. Audit du codebase existant (synthèse)

**Stack** : React 18 + TS 5 + Vite 5 + Supabase + Zustand + react-router-dom 7 + shadcn/Radix + Tailwind 3 + RHF/Zod + Recharts + FullCalendar + TipTap + Framer Motion.

**Architecture DB existante** :
- Schéma `public` : `users` (avec flags `can_view_*` + rôle)
- Schéma `v2` : `projects`, `project_briefs`, `brief_invitations`, `clients`, `checklist_items`, `project_activities`, etc.
- → La logique multi-schémas est déjà en place dans le projet

**Modules existants** (post-cleanup V1/V2) :
- Pipeline V3 : `LeadsV3`, `ProjectsV3`, `ProjectsV3Completed`, `ProjectDetailsV3Preview`, `DashboardV3`, `CRMERPLeadDetails`
- Production : `Communication`, `CommunicationKPI`, `ContactDetails`
- Outils : `AgencyVault`, `ProceduresManager`, `PersonalTasks`, `Accounting`, `Settings`
- Portails non utilisés (à supprimer fin de projet) : `ClientPortal/`, `ClientBrief/`

**Edge Functions vivantes** : `admin-create-user`, `admin-update-password`, `admin-toggle-user-status`, `admin-delete-user`, `enrich-siret`, `sync-social-metrics`, `track-open`.

**Edge Functions mortes** (à supprimer) : `generate-quote-pdf`, `generate-ai-summary`, `gmail-sync`, `calculate-monthly-metrics`, `ringover-call`, `sync-project-budget`, `instagram-oauth`, `linkedin-oauth`, `create-project-from-brief`, `send-brief-notification`.

---

## 3. Toutes les décisions validées

### Architecture & frontend

| # | Sujet | Décision |
|---|---|---|
| 1 | Module frontend | Nouveau dossier `src/modules/EspaceClient/` |
| 2 | Anciens portails | `ClientPortal/` + `ClientBrief/` figés, suppression fin projet |
| 3 | Auth client | Magic link Brevo + compte démo pré-rempli |
| 4 | Domaine | `espace.propulseo-site.com` (sous-domaine) |
| 5 | Design system | Light theme, fond off-white, violet `#7C3AED`, typo Inter |

### Base de données

| # | Sujet | Décision |
|---|---|---|
| 6 | Schéma DB | Nouveau `propulspace` dédié |
| 7 | Stratégie staging | Direct sur prod (migrations 100% additives) |
| 8 | Garde-fou | Migration par migration avec validation Lyes |
| 9 | Tables étendues | `users`, `clients`, `projects` avec colonnes `portal_*` |
| 10 | Filet ultime | PITR Supabase Pro |

### Facturation

| # | Sujet | Décision |
|---|---|---|
| 11 | Représentée par | Etienne Guimbard seul |
| 12 | Numérotation | `PS-1031` puis `PS-1032`, etc. |
| 13 | TVA | Franchise art. 293 B du CGI → `vat_rate DEFAULT 0` |
| 14 | Échéances multiples | Table dédiée `invoice_installments` |
| 15 | Sync compta | Auto vers module `Accounting` |
| 16 | Infos légales | Micro-entreprise, SIRET 98108609300011, 5 av. des Arrouturous 64320 Idron |

### Intégrations externes

| # | Sujet | Décision |
|---|---|---|
| 17 | Emails | Brevo (compte à créer, templates from scratch) |
| 18 | RDV | Cal.com Cloud free tier |
| 19 | Stripe | Compte créé Phase 3 |
| 20 | DocuSeal | Compte créé Phase 3 |
| 21 | Pappers | Déjà branché via `enrich-siret`, à étendre |
| 22 | WhatsApp | Simple lien `wa.me` en V1 |
| 23 | reCAPTCHA v3 | Latent — activé si spam |

### Fonctionnalités spécifiques

| # | Sujet | Décision |
|---|---|---|
| 24 | Bidirectionnalité espace ↔ fiche projet | **Principe architectural #1** — pas de silos |
| 25 | AgencyVault | Réutilisé pour credentials clients (multi-tenant) |
| 26 | Activation client existant | Bouton "Activer Propul'Space" depuis fiche projet |
| 27 | Migration anciens leads | Aucune |
| 28 | Scoring qualité V1 | Simplifié : budget (40) + décision (30) = 70 max |

### Sécurité & observabilité

| # | Sujet | Décision |
|---|---|---|
| 29 | Sentry | Installé dès Phase 1 |
| 30 | UptimeRobot | Avant pilote (Phase 8) |
| 31 | RLS | 0 fuite tolérée — suite Vitest dédiée |
| 32 | Audit log | Obligatoire RGPD sur CUD sensible |
| 33 | Soft delete | Sur entités sensibles, retention 10 ans |

### Équipe & pilote

| # | Sujet | Décision |
|---|---|---|
| 34 | Équipe | Lyes seul + Claude web (avis) + Claude Code (exécution) |
| 35 | Pilote test | Précieuse — pas de deadline serrée |
| 36 | Workflow git | Branche dédiée `feature/propulspace-phase-1-db`, merge dans `main` après validation Phase 1 |

---

## 4. Plan détaillé Phase 1 (J1-J4)

### J1 — Foundations (~6h)

- Brancher Sentry (`@sentry/react` + DSN dans env)
- Migration **010** — `propulspace_schema_init.sql` :
  - `CREATE SCHEMA propulspace`
  - Permissions (GRANT USAGE, ALTER DEFAULT PRIVILEGES)
  - `CREATE SEQUENCE invoice_number_seq START 1031`
  - Fonction `next_invoice_number()` → `'PS-' || nextval(...)`
- Migration **020** — `propulspace_extend_existing.sql` :
  - `ALTER TABLE users ADD COLUMN portal_*` (7 colonnes)
  - `ALTER TABLE clients ADD COLUMN portal_*` (5 colonnes)
  - `ALTER TABLE projects ADD COLUMN portal_*` (5 colonnes)
  - Toutes avec `DEFAULT` ou `NULL` → impact zéro sur app actuelle

### J2 — Tables Propul'Space (~7h)

- Migration **030** — `propulspace_qualification.sql` :
  - `qualification_leads` (30+ champs, indexes email/phone/status)
  - `qualification_uploads` (FK + CASCADE)
- Migration **040** — `propulspace_portal_tables.sql` :
  - `project_steps`, `documents` (versioning + soft delete)
  - `invoices` (`vat_rate DEFAULT 0`)
  - `invoice_installments` (échéances)
  - `signatures`, `onboarding_responses`
- Migration **050** — `propulspace_webhooks_audit.sql` :
  - `stripe_webhook_events`, `docuseal_webhook_events` (event_id UNIQUE)
  - `audit_log`, `analytics_events`

### J3 — Sécurité (~7h)

- Migration **060** — `propulspace_rls_policies.sql` :
  - ~30 politiques RLS (admin full / client read filtré / anon bloqué)
- Migration **070** — `propulspace_storage_buckets.sql` :
  - Buckets `propulspace-uploads` + `propulspace-documents` + RLS storage
- Migration **999** — `propulspace_rollback.sql` (commenté par défaut)
- Suite tests RLS Vitest (100% pass, 0 leakage)

### J4 — Validation (~5h)

- Cycle apply → rollback → ré-apply (état identique)
- Vérification impact CRM existant (test manuel des routes admin)
- Génération types TypeScript depuis prod → `src/types/database.ts`
- Setup env vars (Brevo, Cal.com, Sentry DSN)
- Documentation finale `Propulspace/PHASE_1_DONE.md`

---

## 5. Stratégie de sécurité et rollback

### Principe : application directe en prod avec 4 garde-fous

1. **Migrations 100% additives** — que des `CREATE` et `ALTER ADD COLUMN DEFAULT`
2. **Transactions encapsulées** — `BEGIN ... COMMIT` sur chaque migration
3. **Validation Lyes entre chaque migration** — SQL présenté avant application
4. **Migration 999 prête à l'avance** — `DROP SCHEMA propulspace CASCADE` + `ALTER TABLE ... DROP COLUMN`

### Filet ultime : PITR Supabase Pro

Restauration de la prod à n'importe quel point des 7 derniers jours.

### Impact app existante

**Aucun.** Toutes les colonnes ajoutées ont `DEFAULT` ou sont `NULLABLE`. L'app actuelle continue de tourner exactement comme avant.

---

## 6. Points en suspens (à reconfirmer en cours de route)

| # | Point | Quand trancher |
|---|---|---|
| A | Liste des "premium target sectors" pour scoring V2 | Phase 2 |
| B | Validation juridique CGU/MentionsLegales/PolitiqueConfidentialite | Avant pilote (Phase 8) |
| C | Plan Brevo (Free 300/jour → Lite 19€/mois) | Phase 2-3 |
| D | Cal.com cloud vs self-host long terme | Phase 2 |
| E | Plan DocuSeal (free 10/mo → 24€/mo) | Phase 3 |
| F | Multi-user par client | V2 |
| G | API WhatsApp Business vs `wa.me` | V2 |
| H | Date démarrage pilote Précieuse | Phase 7 |

---

## 7. Risques identifiés et mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Migration casse une route admin | Faible | Élevé | Test manuel après chaque migration + PITR |
| RLS mal configurée → fuite client | Moyenne | Critique | Suite Vitest obligatoire avant Phase 2, audit avant pilote |
| Numérotation facture cassée | Faible | Légal critique | Séquence Postgres atomique + lock invoice après envoi |
| Webhooks non idempotents | Moyenne | Élevé | Tables `*_webhook_events` avec `event_id UNIQUE` |
| Quota Brevo dépassé | Faible | Moyen | Monitoring + upgrade auto |
| Lead spam massif | Moyenne | Faible-moyen | Honeypot + rate limit IP + reCAPTCHA fallback |
| Bidirectionnalité mal pensée | Moyenne | Élevé | Design détaillé Phase 4 avant code |
| Compte démo = fuite données | Faible | Élevé | Données synthétiques uniquement |

---

## 8. Prochaines étapes après Phase 1

- **Phase 2 (J5-J12)** — Qualification : form 7 étapes, 13 règles conditionnelles, 5 Edge Functions, anti-spam, Cal.com, admin `/admin/leads-qualifies`, E2E
- **Phase 3 (J13-J20)** — Edge Functions portail actif : Stripe + DocuSeal + PDF FR + emails Brevo + cron
- **Phase 4 (J21-J28)** — Admin module : dashboard, per-client panel, bouton "Activer Propul'Space"
- **Phase 5 (J29-J38)** — Client-facing : layout, 5 tabs, wizard first-login, sticky contact mobile
- **Phase 6 (J39-J43)** — Onboarding form pré-rempli, vault credentials, kickoff Cal.com
- **Phase 7 (J44-J50)** — QA : E2E full journey, multi-tenant leak tests, Lighthouse, audits
- **Phase 8 (J51-J55)** — Pilot launch : activation site, Précieuse, monitoring, mini-survey D+14

---

## 9. Sign-off

| Acteur | Action | Statut |
|---|---|---|
| Lyes Triki | Validation product + technique | ✅ 2026-05-15 |
| Lyes Triki | Go pour migration 010 | ⏳ Après Sentry setup |

---

**Document de référence Phase 1. À mettre à jour si décisions évoluent.**
