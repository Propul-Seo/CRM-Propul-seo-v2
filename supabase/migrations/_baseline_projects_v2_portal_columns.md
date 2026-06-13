# Baseline — colonnes `portal_*` et `client_*` sur `public.projects_v2`

> Snapshot 2026-05-17. Source : `information_schema.columns` (project ERP, `tbuqctfgjjxnevmsvucl`).
>
> Ces colonnes vivent dans le schéma `public` (CRM agence) et **ne sont pas** dans le schéma `propulspace`. Elles sont versionnées par 3 migrations :
> - **Legacy ClientBrief** (avant Propul'Space) → 4 colonnes : `portal_enabled`, `portal_expires_at`, `portal_short_code`, `portal_token`.
> - **`propulspace_020_extend_existing`** → 15 colonnes lifecycle + branding + facturation FR.
> - **`propulspace_090_phase2_prep`** → 1 colonne pivot `portal_client_email`.

## Inventaire complet (22 colonnes)

| Colonne | Type | Nullable | Default | Origine | Statut câblage |
|---|---|---|---|---|---|
| `client_address` | text | ✅ | — | 020 | 🟠 non câblé (B.3) |
| `client_id` | uuid | ✅ | — | legacy CRM | 🟢 — |
| `client_name` | text | ❌ | `''` | legacy CRM | 🟢 — |
| `client_represented_by` | text | ✅ | — | 020 | 🟠 non câblé (B.3) |
| `client_vat_number` | text | ✅ | — | 020 | 🟠 non câblé (B.3) |
| `portal_activated_at` | timestamptz | ✅ | — | 020 | 🟠 non câblé (A.2) |
| `portal_brand_logo_url` | text | ✅ | — | 020 | 🟠 backlog white-label |
| `portal_brand_primary_color` | text | ✅ | — | 020 | 🟠 backlog white-label |
| **`portal_client_email`** | text | ✅ | — | **090** | 🟢 **pivot auth** — lu par `portal_project_id()` + `usePortalAuth` |
| `portal_deactivated_at` | timestamptz | ✅ | — | 020 | 🟠 non câblé (A.2) |
| `portal_deactivation_reason` | text | ✅ | — | 020 | 🟠 non câblé (A.2) |
| `portal_enabled` | boolean | ✅ | `false` | legacy ClientBrief | ⚠️ collision sémantique avec `portal_visible` ci-dessous |
| `portal_expires_at` | timestamptz | ✅ | — | legacy ClientBrief | 🟠 legacy ClientBrief, hors Propul'Space |
| `portal_next_milestone_date` | date | ✅ | — | 020 | 🟢 lu par `DashboardPage` |
| `portal_next_milestone_label` | text | ✅ | — | 020 | 🟢 lu par `DashboardPage` |
| `portal_phase` | text | ✅ | — | 020 | 🟠 non lu côté code (gate B.2) |
| `portal_progress_percent` | integer | ✅ | `0` | 020 | 🟢 lu par `DashboardPage` |
| `portal_published_hours_worked` | numeric | ✅ | `0` | 020 | 🟠 non câblé |
| `portal_short_code` | text | ✅ | — | legacy ClientBrief | 🟠 legacy |
| `portal_token` | uuid | ✅ | — | legacy ClientBrief | 🟠 legacy |
| `portal_url_slug` | text | ✅ | — | 020 | 🟠 non câblé |
| `portal_visible` | boolean | ✅ | `false` | 020 | 🟠 non câblé |

## ⚠️ Collision sémantique connue

- `portal_enabled` (legacy ClientBrief, default `false`) vs `portal_visible` (Propul'Space, default `false`) — deux flags différents pour deux systèmes portails distincts.
- Le commentaire de la migration `020` est explicite : "portal_visible different from legacy portal_enabled used by ClientBrief".
- **À clarifier en V3 CRM** : renommer `portal_visible` en `propulspace_visible` ou rendre `portal_enabled` exclusif legacy.

## Migrations qui ont ajouté ces colonnes

- [`20260415125731_add_portal_token.sql`](20260415125731_add_portal_token.sql) — legacy ClientBrief
- [`20260515183733_propulspace_020_extend_existing.sql`](20260515183733_propulspace_020_extend_existing.sql) — Propul'Space lifecycle + branding + facturation FR
- [`20260515194639_propulspace_090_phase2_prep.sql`](20260515194639_propulspace_090_phase2_prep.sql) — `portal_client_email` (pivot auth ADR-001)

## Risques associés (voir PROGRESS_PROPULSPACE.md)

- **R-009** — `portal_client_email` sans INDEX ni UNIQUE (perf + intégrité)
