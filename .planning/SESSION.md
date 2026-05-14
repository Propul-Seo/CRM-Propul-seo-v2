# Session State — 2026-05-14 fin (sécurité Supabase + Coolify live)

## Branch
**main** (chantier V3 mergé, prod live sur Coolify)

## Completed This Session

### V3 finalisation & merge main
- Templates production V3 refondus (site_web 18 / erp_v2 17) basés sur ses vrais projets (Lutins, Lorett, Précieuse, ServicImmo, Remplacare, Tracker)
- Onglet Documents V3 — Variante A (dropzone XL + filtres pills + liste plate) + 5 sous-composants
- Sidebar V3 PREVIEW réorganisée : Dashboard / Projets en cours / Leads / Comm Production / Comm KPI / Procédures / Projets Terminés. "Gestion des projets" déplacée vers Pôles V2.
- Migration BDD : 37 anciens projets re-matérialisés avec nouveaux templates (Lolett préservé, 14 tâches done)
- Merge `preview/v3-ux-overhaul` → `main` (48 commits, no-ff)
- Push main → GitHub `Propul-Seo/CRM-Propul-seo-v2`

### Sécurité Supabase (chantier majeur)
**Avant : 191 findings advisors (4 ERROR + 187 WARN). Après : 181 findings (0 ERROR).**

- DROP 3 tables backup avec données sensibles (incluait colonne `password` exposée)
- Activation RLS sur `automation_logs`
- DROP 33 policies "public always-true" sur 16 tables CRM critiques
- CREATE policies `authenticated_all_*` propres
- DROP 14 policies anon trop larges sur portail/brief
- CREATE 3 RPC SECURITY DEFINER (`get_portal_data`, `get_brief_by_short_code`, `upsert_brief_by_short_code`) avec search_path figé + GRANT explicite anon
- Migration frontend `useClientPortal` + `useBriefV2` vers RPC
- Tests live confirmés : 27 tables critiques renvoient `[]` en anon, RPC fonctionnent avec token valide

### Déploiement Coolify
- Dockerfile multi-stage (Node 22 alpine builder → nginx alpine serve)
- nginx.conf avec SPA fallback + gzip + cache + CSP + headers sécurité dans chaque bloc location
- .dockerignore complet
- Switch Build Pack Coolify : Nixpacks → Dockerfile (Nixpacks détectait à tort comme "deno")
- Variables d'env VITE_SUPABASE_* configurées avec "Available at Buildtime"
- Container running healthy sur https://crm.propulseo-site.com
- Fix CSP img-src trop restrictif (Google Photos bloqué) → relax `https:` global pour images

### Code review fin de session
- 2 Critical fixés sur Sidebar.tsx : `any` → `User | null`, imports relatifs → path aliases `@/`
- 124/124 tests unit verts, tsc clean

## Next Tasks (ordre de priorité)

### P0 — Strict minimum prod stable
- Aucun. **Tout est live et fonctionne.**

### P1 — Cette semaine (hardening Supabase, 1h)
1. Activer **leaked password protection** dans Supabase Auth Settings (1 clic)
2. Réduire **OTP expiry** à 600s max
3. Restreindre les 2 buckets Storage publics (`client-post-assets`, `post-assets`)
4. Retirer 3 materialized views de l'API REST (`kpi_monthly_overview`, `kpi_daily_metrics`, `kpi_top_posts`)
5. Upgrade Postgres (version vulnérable détectée, ~5 min downtime)
6. Fix récursion infinie policy `channel_members` (bug RLS préexistant)

### P2 — Polish code (différé)
- `Sidebar.tsx` > 200L (314L) : extraire NavSection config dans `sidebarConfig.ts`
- `DocumentsTabV3.tsx` : `uploader_name` hardcodé `'Admin'` → utiliser `currentUser?.name`
- `nginx.conf` : ajouter `Content-Security-Policy` au bloc `location` SVG/images
- 5 fichiers V3 > 200L (ProjectEditModalV3 312L, ProductionTabV3 289L, etc.)
- Rotation anon key + cleanup 4 fichiers du repo avec clé hardcodée
- 55 fonctions avec `search_path` mutable → ajouter `SET search_path`
- 38 fonctions SECURITY DEFINER anon → audit revoke
- Race condition possible dans `useBriefV2` legacy (avant `useBriefByToken`)

### P3 — Features WIP
- DashboardV3Preview : 4 variantes (Cockpit/Hero/Bento/Editorial) commitées en WIP, à valider avant intégration sidebar V3
- Supprimer backups checklist_items_v2_backup_20260513 quand prod stable depuis quelques jours
- Nettoyer templates legacy `web`, `seo`, `saas` quand confirmation plus jamais utilisés

## Blockers
Aucun.

## Key Context
- Branche : **main** (synchronisée avec origin/main)
- Prod : https://crm.propulseo-site.com (Coolify, container healthy)
- Repo GitHub : Propul-Seo/CRM-Propul-seo-v2 (déplacé de lyestriki-29/)
- Tag de safety pré-V3 : `v3-pre-autonomous-session`
- Tests : 124/124 unit + 12/12 E2E
- Architecture portail client : RPC SECURITY DEFINER (pas de policy anon directe) — gold standard Supabase
- Login admin : lyestriki@yahoo.fr
- Coolify dashboard : http://146.59.228.186:8000 (projet `crm-propulseo`)
- Variables env Coolify : VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY avec "Available at Buildtime"
- Backup BDD : `checklist_items_v2_backup_20260513` (148 lignes) — peut être droppé une fois prod validée
