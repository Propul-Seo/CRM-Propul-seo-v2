# Baseline — schéma `propulspace` (snapshot 2026-05-17)

> Source : introspection MCP Supabase, project ERP `tbuqctfgjjxnevmsvucl`.
>
> Ce document décrit **l'état final** du schéma `propulspace` après application des 15 migrations historiques (`propulspace_010` → `_150`). Pour le SQL exact, voir les fichiers de migration correspondants.

## Tables (12)

| Table | Lignes (prod) | Trigger audit | Migration | Câblage code |
|---|---|---|---|---|
| `audit_log` | 5 | ❌ (jamais !) | 030 | 🟠 orphelin (R-005) |
| `qualification_leads` | 0 | ✅ | 040 + 090 + 100 | ✅ flow `/diagnostic` + admin Vue 9 |
| `qualification_uploads` | 0 | ❌ | 040 | ✅ `FileUploadZone` |
| `project_steps` | 4 | ❌ | 050 | ✅ `usePortalData` |
| `documents` | 0 | ✅ | 050 | ✅ `DocumentsPage` |
| `invoices` | 2 | ✅ | 050 | ✅ `InvoicesPage` |
| `invoice_installments` | 0 | ❌ | 050 | ✅ via `InvoicesPage` |
| `signatures` | 1 | ✅ | 050 | ✅ `SignaturesPage` |
| `onboarding_responses` | 0 | ❌ | 050 | 🟠 prévu Sprint B.2 |
| `stripe_webhook_events` | 0 | ❌ | 060 | 🟠 prévu Sprint B.3 |
| `docuseal_webhook_events` | 0 | ❌ | 060 | 🟠 prévu Sprint B.4 |
| `analytics_events` | 0 | ❌ | 060 | 🟠 backlog tracking |

## Vues (6 dans `public.*`)

> Toutes les vues sont `security_invoker = true` (RLS de la table sous-jacente appliquée).

| Vue (public) | Cible (propulspace) | Migration | Câblage |
|---|---|---|---|
| `qualification_leads_v2` | `qualification_leads` | 120 | ✅ `useQualificationDraft` |
| `propulspace_invoices_v2` | `invoices` | 130 | ✅ `usePortalData` |
| `propulspace_invoice_installments_v2` | `invoice_installments` | 130 | ✅ `usePortalData` |
| `propulspace_documents_v2` | `documents` | 130 | ✅ `usePortalData` |
| `propulspace_signatures_v2` | `signatures` | 130 | ✅ `usePortalData` |
| `propulspace_project_steps_v2` | `project_steps` | 130 | ✅ `usePortalData` |

## Fonctions (4)

| Fonction | Rôle | Migration | Sécurité |
|---|---|---|---|
| `propulspace.next_invoice_number()` | Compteur factures `PS-XXXX` atomique | 010 | SECURITY DEFINER, EXECUTE → service_role |
| `propulspace.audit_trigger_fn()` | Trigger générique d'audit | 030 | SECURITY DEFINER, EXECUTE → service_role |
| `propulspace.is_admin()` | RLS helper : check role ∈ ('admin', 'manager') | 070 | STABLE SECURITY DEFINER, EXECUTE → authenticated |
| `propulspace.portal_project_id()` | RLS helper : résolution projet par email | 070 + **140** (refactor) | STABLE SECURITY DEFINER, EXECUTE → authenticated |

### Évolution de `portal_project_id()`

- **v1 (créée en 070)** : lit `public.users.portal_linked_project_id WHERE auth_user_id = auth.uid() AND portal_enabled = true`
- **v2 (REPLACE en 140 — ADR-001)** : lit `projects_v2.id WHERE portal_client_email = (SELECT email FROM auth.users WHERE id = auth.uid())`

## Sequences (1)

| Sequence | Start | Migration |
|---|---|---|
| `propulspace.invoice_number_seq` | 1031 | 010 |

## Storage buckets (2)

| Bucket | Public | Limite | MIME autorisés | Migration |
|---|---|---|---|---|
| `propulspace-uploads` | ❌ | 25 Mo | images + PDF | 080 |
| `propulspace-documents` | ❌ | 50 Mo | Office + PDF + images + txt/csv | 080 |

## RLS policies (récap)

> Détail complet : voir [`20260515191852_propulspace_070_rls_policies.sql`](20260515191852_propulspace_070_rls_policies.sql) + [`20260515192051_propulspace_080_storage_buckets.sql`](20260515192051_propulspace_080_storage_buckets.sql) + [`20260516111449_propulspace_110_qualification_public_rls.sql`](20260516111449_propulspace_110_qualification_public_rls.sql).

| Table | Admin | Client portail | Anon |
|---|---|---|---|
| `qualification_leads` | FOR ALL | — | INSERT + UPDATE + SELECT (drafts) 🔴 R-011 |
| `qualification_uploads` | FOR ALL | — | — |
| `project_steps` | FOR ALL | SELECT (visible_to_client) | — |
| `documents` | FOR ALL | SELECT + INSERT (uploads client) | — |
| `invoices` | FOR ALL | SELECT (status ≠ draft) | — |
| `invoice_installments` | FOR ALL | SELECT (via subquery invoices) | — |
| `signatures` | FOR ALL | SELECT | — |
| `onboarding_responses` | FOR ALL | SELECT + UPDATE | — |
| `audit_log` | SELECT only | — | — |
| `analytics_events` | SELECT only | — | — |
| `stripe_webhook_events` | — | — | — (service_role bypass) |
| `docuseal_webhook_events` | — | — | — (service_role bypass) |

## Risques sécurité connus (voir PROGRESS_PROPULSPACE.md)

| ID | Sévérité | Description courte |
|---|---|---|
| R-008 | 🟠 | Fuite cross-tenant Storage (`ps_docs_storage_client_read` sans filtre projet) |
| R-009 | 🟠 | `portal_client_email` sans INDEX ni UNIQUE |
| R-011 | 🔴 | Fuite RGPD : anon peut SELECT tous les drafts qualification |
| R-012 | 🟠 | Vues `SELECT *` exposent colonnes admin |
| R-013 | 🟠 | GRANTs anon INSERT/UPDATE excessifs sur tables portail |

## Reconstitution depuis zéro

Les 15 fichiers `.sql` `propulspace_*` versionnés dans ce dossier suffisent à reconstituer le schéma complet sur une base neuve. Ordre d'application chronologique (par timestamp) :

```
20260515183614  010_schema_init
20260515183733  020_extend_existing
20260515184427  030_audit_log
20260515184632  040_qualification
20260515184848  050_portal_tables
20260515185024  060_webhooks_analytics
20260515191852  070_rls_policies
20260515192051  080_storage_buckets
20260515194639  090_phase2_prep
20260516110432  100_qualification_files_phase2
20260516111449  110_qualification_public_rls
20260516111845  120_qualification_public_view
20260516113658  130_portal_views
20260516114658  140_portal_auth_via_email
20260516115321  150_skip_portal_clients
```

Le fichier `20260515999999_propulspace_999_rollback.sql` reste un script d'urgence (lignes commentées par défaut, à activer manuellement seulement si besoin de tout détruire).
