# Modèle de données Propul'Space

> Vue d'ensemble vulgarisée du schéma `propulspace.*` + extensions `public.projects_v2`.
> Pour le SQL exact, voir `supabase/migrations/propulspace_*.sql`.
> Pour les détails techniques, voir `supabase/migrations/_baseline_propulspace_schema.md`.

---

## 1. Vue d'ensemble

Propul'Space est greffé sur le CRM existant via :
- Un schéma dédié `propulspace.*` (12 tables) qui contient toute la donnée portail.
- Des colonnes ajoutées à `public.projects_v2` pour les méta-données portail (lifecycle, branding, facturation).
- 6 vues miroir dans `public.*_v2` exposant les tables propulspace via l'API REST Supabase (avec RLS héritée) : **5 vues portail** créées par migration 130 (`propulspace_*_v2`) + **1 vue qualification** créée par migration 120 (`qualification_leads_v2`).

## 2. Le pivot : `projects_v2.portal_client_email`

C'est la **clé d'entrée** du portail. Quand un projet a un email rempli dans cette colonne :
- Le client peut se connecter via magic link sur `/espace-client/login`.
- Sa session Supabase Auth (`auth.users.email`) est matchée à cette colonne par la fonction `propulspace.portal_project_id()`.
- Toutes les RLS du portail utilisent cette fonction pour filtrer ce que le client voit.

**Conséquence importante** : le client n'a aucune row dans `public.users` (table interne agence). Sa seule existence côté DB est dans `auth.users` (managé par Supabase). C'est l'ADR-001.

## 3. Le cycle de vie d'un projet portail

```
┌──────────────────────────────────────────────────────────────────┐
│  FLOW PUBLIC /diagnostic (anon)                                  │
│  ─────────────────────────────                                   │
│  Lead remplit formulaire 7 étapes                                │
│   → propulspace.qualification_leads (status='draft')             │
│   → propulspace.qualification_uploads (logo, charte, screens)    │
│  Lead soumet                                                     │
│   → status='submitted' + submitted_at=NOW()                      │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  ADMIN — Vue 9 (LeadsQualifiesPage)                              │
│  ──────────────────────────────────                              │
│  Admin contacte le lead → status='contacted'                     │
│  Admin qualifie/disqualifie → 'qualified' ou 'unqualified'       │
│  Admin convertit en projet → 'converted'                         │
│   → création public.projects_v2 (manuel ou auto - cf Sprint A.2) │
│   → qualification_leads.converted_to_project_id renseigné        │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  ADMIN — Activer le portail (Sprint A.2)                         │
│  ──────────────────────────────────                              │
│  Admin remplit projects_v2.portal_client_email                   │
│   → portal_activated_at = NOW()                                  │
│   → portal_visible = true                                        │
│  Admin envoie le 1er magic link                                  │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  CLIENT — Espace portail (/espace-client)                        │
│  ──────────────────────────────────                              │
│  - Dashboard : KPIs (% avancement, prochain jalon, à traiter)    │
│  - Projet : timeline propulspace.project_steps                   │
│  - Documents : GED propulspace.documents                         │
│  - Factures : propulspace.invoices + invoice_installments        │
│  - Signatures : propulspace.signatures (DocuSeal)                │
│  - Profil : email, déconnexion                                   │
│  - Aide : FAQ + contact                                          │
└──────────────────────────────────────────────────────────────────┘
```

## 4. Les 12 tables propulspace par catégorie

### Qualification (2 tables, alimentées par flow public `/diagnostic`)
- **`qualification_leads`** — 30+ champs structurés selon les 7 étapes du formulaire (identité, situation, objectifs, features, brand, budget, décision). Plus quality score, status (draft → converted), notes admin, conversion vers projet.
- **`qualification_uploads`** — fichiers attachés (logo, charte, screenshots site). FK CASCADE vers le lead.

### Portail client (5 tables, alimentées par admin → consultées par client)
- **`project_steps`** — timeline étapes du projet (upcoming/in_progress/completed/blocked) + dates planifiées/réelles + visibilité client.
- **`documents`** — GED (12 types : devis/contrat/facture/livrable/audit/charte/etc.). Soft delete + versioning + flag visible client.
- **`invoices`** — factures FR-conformes. Snapshot client en JSONB. Lien Stripe payment + PDF + hash SHA256 d'intégrité.
- **`invoice_installments`** — acomptes/échéances d'une facture (paiement en plusieurs fois).
- **`signatures`** — intégration DocuSeal. Type (devis/contrat/avenant), statut, URLs signature/PDF signé.

### Onboarding (1 table, prévue Sprint B.2)
- **`onboarding_responses`** — personas, voice, accès Google/hosting/DNS/social, % complétion. Vide aujourd'hui (Vue 12 absente).

### Backend/admin (4 tables — internes ou orphelines)
- **`audit_log`** — RGPD. Triggers attachés sur documents/invoices/signatures/qualification_leads. Pas de lecture UI aujourd'hui (R-005).
- **`stripe_webhook_events`** — idempotency Stripe (Sprint B.3).
- **`docuseal_webhook_events`** — idempotency DocuSeal (Sprint B.4).
- **`analytics_events`** — funnel tracking (backlog).

## 5. Les 6 vues miroir `public.*_v2`

Toutes en `security_invoker = true` (héritent les RLS de la table source).

| Vue (public) | Cible (propulspace) | Consommée par |
|---|---|---|
| `qualification_leads_v2` | `qualification_leads` | `useQualificationDraft` (flow `/diagnostic`) |
| `propulspace_invoices_v2` | `invoices` | `usePortalData.useInvoices` |
| `propulspace_invoice_installments_v2` | `invoice_installments` | `usePortalData.useInstallments` |
| `propulspace_documents_v2` | `documents` | `usePortalData.useDocuments` |
| `propulspace_signatures_v2` | `signatures` | `usePortalData.useSignatures` |
| `propulspace_project_steps_v2` | `project_steps` | `usePortalData.useSteps` |

**Pourquoi ces vues** : par défaut Supabase n'expose que le schéma `public` via l'API REST. Sans ces vues, le code TS devrait passer par un appel cross-schema compliqué. Avec les vues, on fait simplement `supabase.from('propulspace_invoices_v2')`.

## 6. Sécurité — comment ça filtre

### Fonctions helpers
- **`propulspace.is_admin()`** → `true` si l'utilisateur connecté a `role ∈ ('admin', 'manager')` dans `public.users`. Utilisé dans toutes les policies admin.
- **`propulspace.portal_project_id()`** (v2, ADR-001) → renvoie l'`id` du projet dont le `portal_client_email` matche l'email de la session courante. Utilisé dans toutes les policies client.

### Pattern policies
- **Tables admin only** : `qualification_*`, `audit_log`, `analytics_events`, `webhook_events`.
- **Tables admin + client read** : `project_steps` (filtre `visible_to_client`), `invoices` (filtre `status ≠ draft`), `signatures`, `invoice_installments` (via subquery), `documents` (filtre `visible_to_client + deleted_at IS NULL`).
- **Tables admin + client read/write** : `documents` (client peut INSERT si `uploaded_by_client=true`), `onboarding_responses` (client peut UPDATE).

### Storage
- 2 buckets privés : `propulspace-uploads` (25 Mo, formulaires publics) et `propulspace-documents` (50 Mo, GED portail).
- Accès via URLs signées (TTL court).

## 7. Risques sécurité connus

Voir `.planning/PROGRESS_PROPULSPACE.md` section 6 pour le détail. Headlines :

| ID | Sévérité | Sujet |
|---|---|---|
| **R-011** | 🔴 critique | Fuite RGPD : anon peut SELECT tous les drafts `qualification_leads` |
| R-008 | 🟠 | Fuite cross-tenant Storage (policy sans filtre projet) |
| R-009 | 🟠 | `portal_client_email` sans INDEX ni UNIQUE (perf + intégrité) |
| R-012 | 🟠 | Vues `SELECT *` exposent colonnes admin |
| R-013 | 🟠 | GRANTs anon INSERT/UPDATE excessifs |

**Tous ces risques sont traités dans le Sprint A.3** (tests sécurité `portal_project_id()` + durcissement RLS).

## 8. Pont CRM ↔ Portail

| Action | Statut |
|---|---|
| Créer un projet CRM (`projects_v2`) | ✅ V3 CRM |
| Définir `portal_client_email` (activer portail) | ❌ **Sprint A.2** — bouton dédié à créer |
| Promouvoir lead qualifié → projet | ❌ Backlog — manuel aujourd'hui |
| Envoyer 1er magic link au client | ❌ **Sprint A.2** |
| Client se connecte au portail | ✅ flow E2E validé 2026-05-17 |

## 9. Données aujourd'hui (snapshot prod)

```
audit_log                : 5 rows
qualification_leads      : 0 rows  (table prête, pas encore de leads)
qualification_uploads    : 0 rows
project_steps            : 4 rows  (projet test "Propul'seo")
documents                : 0 rows
invoices                 : 2 rows  (factures test [DEMO])
invoice_installments     : 0 rows
signatures               : 1 row   ([DEMO])
onboarding_responses     : 0 rows  (Vue 12 absente)
stripe_webhook_events    : 0 rows  (edge fn absente)
docuseal_webhook_events  : 0 rows  (edge fn absente)
analytics_events         : 0 rows  (tracking absent)
```

Cleanup démo possible :
```sql
DELETE FROM propulspace.invoices WHERE internal_notes = 'demo-portal-v1';
DELETE FROM propulspace.project_steps WHERE label LIKE '[DEMO]%';
DELETE FROM propulspace.signatures WHERE name LIKE '[DEMO]%';
```
