# Session State — 2026-05-16 fin (Phase 2 Sub-phase A + prep front)

## Branch
**feature/propulspace-phase-2-front** — exception "main only" car chantier Propul'Space multi-phases avec design en validation. Mergera dans main quand toute Phase 2 (jusqu'à F) sera stabilisée.

## Completed cette session
- **Pre-flight + migration `propulspace_090_phase2_prep`** : 3 colonnes ajoutées (`projects_v2.portal_client_email`, `users.onboarding_completed`, `qualification_leads.notes`)
- **Sub-phase A foundation** :
  - Structure `src/modules/EspaceClient/` (shared/qualification/client/admin/onboarding)
  - 5 placeholders intégrations Phase 3 (Brevo / Stripe / DocuSeal / Cal.com / Pappers) avec prefix `[PLACEHOLDER-SERVICE]` greppable
  - Shell : `PortalLayout` + `PortalTabBar` + `PortalContactFab` + `portal-theme.css` (polish Linear-like)
  - Route preview temporaire `/espace-client/__preview` dans App.tsx
  - Inter font ajoutée à index.html
- **Chantier #1 — Upgrade tokens** : portal-theme.css passé de 141 → 165 lignes (semantic colors, spacing scale, classes typo, motion durations, focus ring violet, .ps-num, .ps-skeleton, alias retro-compat)
- **Chantier #3 — Types Supabase** :
  - `src/types/database.ts` régénéré via MCP (4602 lignes, public+v2, inclut colonnes Phase 2)
  - `src/types/propulspace.types.ts` créé manuellement (12 interfaces Row, transcrit depuis introspection live — MCP n'exporte pas propulspace)
- **Design handoffs reçus & validés** :
  - v1 : 12 vues principales (Propulspace/design_handoff_propulspace/)
  - v2 : 17 vues annexes + 10 emails (Propulspace/design_handoff_propulspace/design_handoff_propulspace_v2/)
  - Copies dans public/handoff-preview* pour visualisation via Vite
- **Plan d'action figé** : `Propulspace/PHASE_2_PLAN_FRONT.md` (8 sections, 6 étapes d'implém, ~11-13 j estimés)

## Commits cette session
- À créer lors du save final

## Next Task
**Ouvrir `Propulspace/PHASE_2_PLAN_FRONT.md` et enchaîner :**
1. Chantier #4 — Pre-flight DB approfondi (30 min) — vérifier CHECK constraints + RLS sur les 5 tables Phase 2
2. Chantier #5 — Code review shell (déjà fait en fin de cette session — voir commits)
3. Chantier #2 — Primitives TSX partagées (2-3h) — 11 composants dans `shared/components/`
4. Puis étape 1 : Auth + routing (Task A4 + A5 originales)

## Blockers
Aucun bloquant. SMTP custom Brevo pour magic link reporté à Phase 3 (Supabase Auth natif suffit pour Phase 2 dev/test).

## Key Context

### État architecture Propul'Space V1 (figé, ne pas re-discuter)
- "1 espace = 1 projet" → FK `project_id` partout, jamais `client_id`
- Tables : `propulspace.*` (jamais `portal_*` malgré ce que dit le handoff v1 README)
- Users portail : `public.users` avec `portal_enabled`, `portal_linked_project_id`, `onboarding_completed`
- Projets : `public.projects_v2`
- SIRET : `projects_v2.siret` (legacy, sans préfixe `client_`)

### Décisions tech figées
- Routing : option C — react-router pour `/diagnostic`, `/espace-client/*`, `/admin/*` (déjà présent dans App.tsx)
- Magic link : Supabase Auth natif en Phase 2 (Brevo Phase 3 si rate limit problème)
- Mobile : OFF en Phase 2, desktop only
- Design system source de vérité : `Propulspace/design_handoff_propulspace/tokens/*.css` + le portal-theme.css local qui merge tout

### Dette technique notée
1. Policy RLS `authenticated_all_projects_v2` sur `projects_v2` → toujours ouverte. **À resserrer avant la 1ère activation portail réelle.**
2. Token Supabase personal access non configuré → on régénère propulspace.types.ts à la main pour l'instant
3. `PortalLayout.preview.tsx` + route `/espace-client/__preview` à supprimer en Task A5 (quand routes réelles arrivent)
4. WhatsApp number + email contact placeholder dans `shared/constants.ts` (TODO Lyes)

### Project Supabase
- Project ID : `tbuqctfgjjxnevmsvucl`
- Région : eu-west-3, Postgres 17.4.1
- MCP Supabase authentifié

### Livrables design accessibles
- v1 (12 vues) : http://localhost:5173/handoff-preview/mockups/vues-index.html
- v2 (17 vues) : http://localhost:5173/handoff-preview-v2/mockups/vues-index.html
- emails (10) : http://localhost:5173/handoff-preview-v2/emails/index.html
- Code source primitives JSX à convertir : `Propulspace/design_handoff_propulspace/mockups/_lib/`
