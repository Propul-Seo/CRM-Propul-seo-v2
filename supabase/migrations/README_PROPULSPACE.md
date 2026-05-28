# Migrations `propulspace_*` — Note importante

## ⚠️ Ne pas rejouer sur la prod existante

Les fichiers `propulspace_010_*` à `propulspace_150_*` (et `propulspace_999_rollback`) ont été **versionnés a posteriori le 2026-05-17** pour combler un drift entre la prod Supabase et le repo local.

**Ces migrations sont DÉJÀ appliquées en prod** (table `supabase_migrations.schema_migrations`). Les rejouer planterait sur des objets déjà existants (tables, vues, fonctions).

## Quand utiliser ces fichiers

- ✅ **Setup d'un environnement neuf** (clone du repo + `supabase db reset` ou équivalent).
- ✅ **Documentation** : comprendre la genèse du schéma `propulspace`.
- ✅ **Audit historique** : retrouver le contexte de chaque évolution.
- ❌ **Jamais sur la prod** ni sur un env déjà migré.

## ⚠️ Pré-requis bloquant pour `supabase db reset` (B-006)

La migration `propulspace_150_skip_portal_clients.sql` patche la fonction `public.handle_new_user()` mais **ne crée pas le trigger `on_auth_user_created`** qui l'appelle. Ce trigger est créé par une migration CRM antérieure (non identifiée précisément à ce jour).

→ Sur un environnement neuf, vérifier que le trigger existe **après** le `db reset` :
```sql
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```
Si absent, le portail ne fonctionnera pas (les signups via magic link ne déclencheront pas le skip propulspace, et l'INSERT dans `public.users` plantera pour les emails portail).

## Source de vérité

Ces fichiers sont une **photocopie fidèle** des migrations stockées dans `supabase_migrations.schema_migrations` côté prod, récupérées via MCP Supabase. Les commentaires d'en-tête signalent l'origine et la date de versioning a posteriori.

## Documents associés

- [`_baseline_propulspace_schema.md`](_baseline_propulspace_schema.md) — vue d'ensemble du schéma final (tables, vues, fonctions, RLS, storage)
- [`_baseline_projects_v2_portal_columns.md`](_baseline_projects_v2_portal_columns.md) — colonnes `portal_*` et `client_*` sur `public.projects_v2`
- [`../../docs/propulspace-data-model.md`](../../docs/propulspace-data-model.md) — modèle de données vulgarisé
- [`../../.planning/PROGRESS_PROPULSPACE.md`](../../.planning/PROGRESS_PROPULSPACE.md) — journal de suivi + risques actifs

## Risques sécurité critiques connus

À traiter en Sprint A.3 (tests + durcissement RLS) :

- 🔴 **R-011** — fuite RGPD : anon peut SELECT tous les drafts `qualification_leads` (voir `propulspace_110_qualification_public_rls.sql`)
- 🟠 **R-008** — fuite cross-tenant Storage (voir `propulspace_080_storage_buckets.sql`)
- 🟠 **R-013** — GRANTs anon INSERT/UPDATE excessifs (voir `propulspace_130_portal_views.sql`)

Détail complet dans `.planning/PROGRESS_PROPULSPACE.md` section 6.
