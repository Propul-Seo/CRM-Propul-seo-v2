# Session State — 2026-05-15 fin (cleanup V1/V2 massif)

## Branch
**main** — synchronisée avec origin/main (commit `c319dab`)

## Sommaire éclair
Session de gros nettoyage : suppression complète V1/V2, app 100% V3. Coolify deploy déclenché en fin de session.

## Completed cette session

### Nettoyage V1/V2 massif (commit `5be7091` — 42 700 lignes supprimées sur 328 fichiers)
- **17 modules supprimés** : Dashboard, MonthlyDashboard, ClientDetails, CRM, CRMBotOne, ContactDetailsBotOne, CRMERP, ProjectsManager, ProjectDetails, CompletedProjectsManager, Contacts, CommunicationClients, CommunicationManager, ERPManager, SiteWebManager, ProjectDetailsV2, TaskManager
- **ProjectsManagerV2** réduit à `hooks/` uniquement (utilisé par ClientBrief)
- **Composants orphelins** supprimés : `components/crm/`, `dialogs/`, `calendar/`, `activities/`, `prospect-activities/`, `realtime/`, plusieurs notifications/mobile/common isolés
- **Découplages V3 préalables** : LeadsV3 utilise CRMERPLeadDetails/types, ProjectDetailsV3Preview a ses propres mocks/, ProjectsV3 utilise useProjectsV3 (copie de useProjectsV2), DashboardV3 navigate routes V3 only
- **Sidebar** : 2 sections (Admin + CRM Propulseo + Système), sections "Pôles V2" et "CRM V1" supprimées
- **Layout + routes.ts + mobile nav** : références legacy supprimées
- **Code review fixed** (4 findings) : suppression 2 hooks dead code (useMockChecklist, useMockProjects), DashboardV3/useDashboardData typage strict + path aliases, suppression moduleToRoute

### Dashboard V3 simplifié (commit `c319dab`)
- Suppression `TasksCard`, `UrgentTasksAlert`, `AiSummariesSection` (240 lignes)
- Garde : Revenue, Contacts, Projets, QuickStats, RDV à venir, RevenueChart, Objectifs

### Audits 3 agents en parallèle
- Agent deps modules : SAFE
- Agent routes/UI : AUCUN orphelin
- Agent DB/Supabase : ~30 composants orphelins supplémentaires identifiés et supprimés
- **Erreur d'audit rattrapée** : `activities-hub/` supprimé puis restauré (utilisé par SyntheseTabV3.tsx)

### Déploiement
- Coolify deploy `j118yeqht7l7npyth9q3w4gl` queued
- Gitleaks pre-commit ✅ no leaks

## Next Tasks (par priorité)

### 🟠 P1 — Hardening Supabase (toujours différé)
1. Activer leaked password protection (Auth Settings)
2. Réduire OTP expiry à 600s
3. Restreindre 2 buckets Storage publics
4. Retirer 3 materialized views `kpi_*` de l'API REST
5. Upgrade Postgres
6. Fix récursion infinie policy `channel_members`

### 🟡 P2 — Dette technique restante
- **Fiche détail Lead V3 absente** : clic lead V3 ouvre toujours fiche V1 (ContactDetails, CRMERPLeadDetails). Conservées comme "fonctions mère" pour l'instant.
- **Hooks/services/types orphelins** (option B reportée du gros cleanup) : ~16 hooks, 3 services, 6 types morts à virer dans `src/hooks/`, `src/services/`, `src/types/`. Aucun impact visuel, juste hygiène.
- Sidebar.tsx, 5 fichiers V3 > 200L

### 🟢 P3 — Refacto
- `DashboardV3` = clone de Dashboard V1 supprimé. Refacto déjà fait via héritage de structure ; rien d'urgent.

## Blockers
Aucun.

## Key Context
- Branch : **main** (clean, commit `c319dab`)
- Prod : https://crm.propulseo-site.com (deploy en cours `j118yeqht7l7npyth9q3w4gl`)
- Dev local : `npm run dev` → port libre (5173 → 5174 → 5175 si occupés)
- Coolify : token API dans `.env`, UUID app `el094rjbgs6iefsvaws6qs0w`
- Login admin : lyestriki@yahoo.fr
- Hook gitleaks : actif sur `.githooks/pre-commit` (vérifié ce jour, ✅ no leaks)
- **Modules V1 "fonctions mère" conservés** : Communication, CommunicationKPI (utilisés par V3), ContactDetails, CRMERPLeadDetails (fiches détail leads V3), ClientBrief, ClientPortal (routes publiques /brief, /portal)
- **Métriques cleanup** : `src/modules/` 33 → 17 dossiers, ~42 940 lignes nettes supprimées sur 2 commits

## Comment redéployer
```bash
TOKEN=$(grep "^CoolifyToken=" .env | cut -d'=' -f2-)
curl -X GET "https://coolify.propulseo-site.com/api/v1/deploy?uuid=el094rjbgs6iefsvaws6qs0w&force=false" \
  -H "Authorization: Bearer $TOKEN"
```
