# Session State — 2026-05-14 fin (PROD LIVE + SÉCURISÉ ✅)

## Branch
**main** — synchronisée avec origin/main (commit `77da38f`)

## 🎯 Sommaire éclair

✅ **App prod LIVE** : https://crm.propulseo-site.com (DashboardV3 visible, RLS actives)
✅ **Migration complète vers nouveau système Supabase API keys** (sb_publishable_* + sb_secret_*)
✅ **Ancienne anon legacy DISABLED** côté Supabase (vérifié via MCP get_publishable_keys)
✅ **JWT signing keys rotatés** (asymmetric)
✅ **Hook gitleaks pre-commit** → impossible de re-pousser une clé par erreur
✅ **4 fichiers du repo nettoyés** (clés hardcodées → process.env)
✅ **124/124 tests unit verts + tsc clean**

## Completed cette session

### V3 finalisation
- Templates production V3 (site_web 18 / erp_v2 17) basés sur vrais projets
- Onglet Documents V3 Variante A (dropzone + filtres + 5 sous-composants)
- Sidebar V3 PREVIEW réorganisée + "Gestion projets" déplacée vers Pôles V2
- **DashboardV2 supprimé, DashboardV3 officiel** (visible en prod désormais)
- 4 variantes WIP supprimées (choix fait sur DashboardV3 final)
- Migration BDD : 37 anciens projets re-matérialisés
- Merge `preview/v3-ux-overhaul` → main (48 commits, no-ff)

### Sécurité Supabase (énorme chantier)
- **191 findings → 181** (4 ERROR → 0)
- DROP 3 tables backup avec données sensibles (passwords)
- RLS activée sur `automation_logs`
- DROP 33 policies "public always-true" sur 16 tables CRM
- CREATE policies `authenticated_all_*`
- DROP 14 policies anon trop larges (portail/brief)
- **3 RPC SECURITY DEFINER** : `get_portal_data`, `get_brief_by_short_code`, `upsert_brief_by_short_code`
- Migration frontend `useClientPortal` + `useBriefV2` vers RPC
- 27 tables critiques bloquées en anon (test live confirmé)

### Rotation clés Supabase (résolution fuite GitHub)
- **Migration vers nouveau système** `sb_publishable_*` + `sb_secret_*`
- **Rotation JWT signing keys** vers asymétrique (ES256)
- `Disable JWT-based API keys` → anciennes clés legacy INVALIDES
- `.env` local : nouvelles clés + retrait préfixe VITE_ sur service_role
- Coolify env vars : nouvelles clés avec Build Time flag
- **4 fichiers du repo nettoyés** :
  - `database/diagnostics/diagnostic.js` → process.env
  - `scripts/test-supabase-connection.js` → process.env + check
  - `docs/archive/DEPLOY_ADMIN_UPDATE_PASSWORD.md` → placeholder
  - `docs/runbooks/DEPLOY_ADMIN_UPDATE_PASSWORD.md` → placeholder

### Protection anti-future-fuite
- **gitleaks** installé via brew
- **`.githooks/pre-commit`** scanne le staging area
- **`.gitleaks.toml`** avec 3 règles custom Supabase (legacy JWT + sb_secret + sb_publishable hardcoded)
- `git config core.hooksPath .githooks` actif
- Test live : hook bloque correctement un commit avec `sb_secret_*`

### Déploiement Coolify
- Dockerfile multi-stage Node 22 + nginx
- nginx.conf SPA fallback + gzip + CSP + headers
- Switch Build Pack Nixpacks → Dockerfile
- **Redeploy via API Coolify** (token dans .env, monitor automatique)
- Build prod : 1m47 (HTTP 200, bundle `index-BslcMQYn.js` contient `sb_publishable_*`)

### Code review fixes
- Sidebar.tsx : `any` → `User | null`, imports relatifs → `@/`
- nginx.conf : CSP + headers répliqués dans chaque bloc location
- useClientPortal/useBriefV2 : Array RPC payload handling, cleanup useEffect, deps token

### Résolution finale 401/403
- Erreur 403 `/auth/v1/user` + 401 `/rest/v1/*` après rotation = session JWT obsolète
- Fix : clear localStorage + re-login dans le navigateur
- Tout marche après reconnexion

## Next Tasks (par priorité)

### 🟠 P1 — Hardening Supabase (1h, optionnel)
1. Supabase Auth Settings → activer **leaked password protection**
2. Réduire **OTP expiry** à 600s
3. Restreindre 2 buckets Storage publics (`client-post-assets`, `post-assets`)
4. Retirer 3 materialized views de l'API REST (kpi_*)
5. Upgrade Postgres (version vulnérable détectée)
6. Fix récursion infinie policy `channel_members`

### 🟡 P2 — Polish (différé)
- `Sidebar.tsx` > 200L (314L) : extraire NavSection config dans `sidebarConfig.ts`
- `DocumentsTabV3.tsx` uploader_name hardcodé `'Admin'` → utiliser `currentUser?.name`
- nginx.conf : CSP sur bloc location SVG/images
- 5 fichiers V3 > 200L (ProjectEditModalV3, ProductionTabV3, etc.)
- 55 fonctions `search_path` mutable → ajouter `SET search_path`
- 38 fonctions SECURITY DEFINER anon → audit revoke

### 🟢 P3 — Nice to have
- GitHub Secret Scanning activé sur le repo (Settings → Security)
- Supprimer le backup BDD `checklist_items_v2_backup_20260513` quand prod stable
- Nettoyer templates legacy `web`, `seo`, `saas` si plus utilisés
- "Multiple GoTrueClient instances" warning : refactor pour unifier les 3 clients Supabase

## Blockers
Aucun. Tout fonctionne.

## Key Context
- Branch : **main** (clean, synchronisée, commit `77da38f`)
- Prod : https://crm.propulseo-site.com (HEALTHY, bundle `index-BslcMQYn.js`)
- GitHub : Propul-Seo/CRM-Propul-seo-v2
- Tag safety : `v3-pre-autonomous-session`
- Tests : 124/124 unit + 12/12 E2E
- Coolify : http://146.59.228.186:8000, app UUID `el094rjbgs6iefsvaws6qs0w`
- Token Coolify : dans `.env` (`CoolifyToken=...`) — utilisable via API directement
- Login admin : lyestriki@yahoo.fr
- Format clés Supabase : nouveau système `sb_publishable_*` + `sb_secret_*` + JWT asymétrique
- Hook gitleaks : actif sur `.githooks/pre-commit`

## Comment redeployer (rappel)
```bash
TOKEN=$(grep "^CoolifyToken=" .env | cut -d'=' -f2-)
curl -X GET "http://146.59.228.186:8000/api/v1/deploy?uuid=el094rjbgs6iefsvaws6qs0w&force=true" \
  -H "Authorization: Bearer $TOKEN"
```

## Comment skipper le hook gitleaks (rare, à éviter)
```bash
git commit --no-verify
```

## Si erreur 401/403 après rotation de clés
1. Ouvrir DevTools → Application → Storage → "Clear site data"
2. Recharger avec Cmd+Shift+R
3. Se relogger normalement
