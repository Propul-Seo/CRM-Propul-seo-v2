# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Propul'SEO CRM** is a professional CRM/ERP application built with React, TypeScript, and Supabase. It manages leads, projects, tasks, accounting, communication/content production, and team collaboration for a French digital agency.

## Workflow Rules

- **Fin de sprint** : à la fin de chaque sprint, effectuer un code review (`/review`) puis sauvegarder la session avec `/token-saver fin`.
- **Suivi du contexte** : surveiller en permanence l'utilisation du contexte. Dès que le contexte atteint **50%**, prévenir immédiatement l'utilisateur avec ce message : `⚠️ Contexte à 50% — je sauvegarde la session et on repart à neuf.`, puis exécuter automatiquement `/token-saver fin` sans attendre de confirmation.
- **Dernière génération uniquement** : toutes les modifications UI/fonctionnelles vont dans les modules de génération courante — **V3** (`DashboardV3`, `LeadsV3`, `ProjectsV3`, `ProjectsV3Completed`), `ProjectsManagerV2`, `EspaceClient` (portail Propul'Space) et les autres modules actifs listés dans Directory Structure. Les anciens modules (`CRM`, `Dashboard`, `ProjectsManager`, `TaskManager`, `Contacts`…) ont été **supprimés** au nettoyage du 13/06/2026 — ne pas les recréer ni les restaurer sauf demande explicite.

## Commands

```bash
# Development
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # TypeScript check + Vite production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run audit:lines  # Audit file line counts (scripts/audit-lines.mjs)
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
```bash
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The app will fail to start without valid Supabase credentials.

## Architecture

### Tech Stack
- **React 18** + **TypeScript 5** with Vite 5
- **Supabase** for auth, database, and real-time subscriptions
- **Zustand** for client-side state management (sliced store architecture)
- **Tailwind CSS 3** + **shadcn/ui** (Radix primitives) for UI
- **React Hook Form** + **Zod** for forms/validation
- **Recharts** for data visualization
- **FullCalendar** for calendar views
- **@dnd-kit** + **react-beautiful-dnd** for drag & drop
- **Framer Motion** for animations

### Directory Structure

```
src/
├── App.tsx                 # Root: BrowserRouter + auth gate + top-level routes
├── components/
│   ├── ui/                 # shadcn/ui components (Button, Card, Dialog, etc.)
│   ├── layout/             # Layout.tsx (déclare les routes des modules), Sidebar.tsx
│   ├── auth/               # LoginPage.tsx
│   ├── routing/            # Composants de routage partagés
│   ├── mobile/             # Composants mobile
│   ├── notifications/      # Toasts & notifications
│   ├── activities-hub/     # Hub d'activités transverse
│   ├── propulspace/        # Composants portail Propul'Space
│   └── charts/ common/ v3/ # Graphiques, partagés, primitives V3
├── modules/                # Modules applicatifs (lazy-loaded)
│   ├── DashboardV3/        # KPIs et vue d'ensemble
│   ├── LeadsV3/            # CRM leads : onglets Site Web (`contacts`) + ERP (`crmerp_leads`) + qualif
│   ├── CRMERPLeadDetails/  # Fiches détaillées leads ERP
│   ├── ContactDetails/     # Fiche contact
│   ├── ProjectsV3/         # Gestion de projets
│   ├── ProjectsV3Completed/# Projets terminés
│   ├── ProjectsManagerV2/  # Gestion projets V2 (encore routée)
│   ├── ProjectDetailsV3Preview/ # Aperçu fiche projet V3
│   ├── EspaceClient/       # Portail client Propul'Space (admin/ + client/, routes imbriquées)
│   ├── ClientPortal/ + ClientBrief/ # Portail & brief client
│   ├── AgencyVault/        # Coffre-fort agence
│   ├── Communication/      # Production de contenu (kanban/calendrier)
│   ├── CommunicationKPI/   # Analytics communication
│   ├── PersonalTasks/      # Tâches personnelles
│   ├── ProceduresManager/  # Procédures internes (routes imbriquées)
│   ├── Accounting/         # Comptabilité
│   └── Settings/           # Réglages, équipe, archives
├── hooks/
│   ├── supabase/           # Hooks query/CRUD Supabase + realtime.ts (subscriptions)
│   │   ├── useSupabaseQuery.ts    # Base query hook
│   │   ├── useQueryHooks.ts       # Entity-specific query hooks
│   │   ├── use*CRUD.ts            # CRUD operations per entity
│   │   └── index.ts               # Barrel export
│   └── use*.ts             # Hooks domaine (useAuth, useContactActivities, …)
├── services/               # archiveService.ts, automationService.ts
├── store/                  # Zustand : useStore.ts + slices/ (auth, crm, projects, tasks, accounting, ui)
├── lib/                    # supabase.ts (client singleton), routes.ts, utils.ts
├── types/                  # database.ts (types Supabase générés) + types domaine
└── utils/                  # Utilitaires et constantes
```

### Key Patterns

**Routing**: react-router-dom — `BrowserRouter` dans `App.tsx`, routes des modules déclarées dans `components/layout/Layout.tsx` (`<Routes>`), routeurs imbriqués dans certains modules (`EspaceClient`, `ProceduresManager`). Helpers de routes dans `lib/routes.ts`. Modules lazy-loaded. (L'ancien `useStore().activeModule` n'existe plus.)

**Data Flow**:
- Supabase is the source of truth for all persistent data
- `store/slices/` handle UI state (6 slices: auth, crm, projects, tasks, accounting, ui)
- `hooks/supabase/` encapsulate all Supabase queries and CRUD operations
- Domain hooks in `hooks/` compose supabase hooks with business logic

**Authentication**: Managed via `useAuth` hook and `components/auth/LoginPage.tsx`. The `Layout` component checks user permissions before rendering modules. Admin check: `currentUser?.email === 'team@propulseo-site.com'` or `is_admin()` SQL function.

**Realtime**: Supabase real-time subscriptions live in `hooks/supabase/realtime.ts`.

**User table**: The main table is `users` (not `user_profiles`), with `auth_user_id` FK to Supabase auth. Roles: admin, sales, marketing, developer, manager, ops.

### Database Schema

Key tables:
- `users` - User data with roles and permissions (`can_view_communication`, etc.)
- `contacts` - **Les leads du CRM** (pipeline LeadsV3 Site Web : prospect, presentation_envoyee, meeting_booke, offre_envoyee, en_attente, signe)
- `contact_activities` - **Les activités des leads/contacts** (clé `contact_id`, colonne `type` : call/email/meeting/note/task)
- `crmerp_leads` / `crmerp_activities` - Pipeline leads ERP (onglet ERP de LeadsV3) et ses activités
- `projects` - Project tracking with status and budget
- `tasks` - Task management linked to projects/clients
- `calendar_events` - Calendar with event types
- `accounting_entries` - Financial records
- `posts` / `post_assets` / `post_comments` - Communication module content
- `post_metrics` - Communication KPI data per post
- Materialized views: `kpi_monthly_overview`, `kpi_daily_metrics`, `kpi_top_posts`
- Schéma `propulspace` (backend portail client) + vues `v2` (couche API du front portail)

⚠️ Tables legacy VIDES déplacées en corbeille `trash_2026_07_02` (migration 301, 2026-07-02) : `leads`, `lead_notes`, `activities`, `activity_log`, `prospect_activities`, `user_activities` — ne pas les réutiliser ni requêter. `clients` existe mais est vide/inutilisée (un lead reste un `contact`). La corbeille `trash_2026_06_13` a été purgée définitivement (migration 302).

Supabase migrations are in `supabase/migrations/`.

### Edge Functions

Source in `supabase/functions/` (~22 actives en prod) :
- Gestion utilisateurs : `admin-create-user`, `admin-update-password`, `admin-toggle-user-status`
- Portail Propul'Space : `admin-portal-invite`/`-resend-invite`/`-deactivate`, `portal-sign-document`, `portal-contact-message`, `send-portal-email`, `portal-create-checkout-session`
- Paiement/signature : `stripe-webhook`, `docuseal-webhook`, `admin-docuseal-create-submission`
- Social/comm : `linkedin-oauth`, `instagram-oauth`, `sync-social-metrics`, `questionnaire-send-emails`
- Divers : `generate-quote-pdf`, `generate-invoice-pdf`, `calculate-monthly-metrics`, `ringover-call`, `sync-project-budget`, `admin-cleanup-storage`, `gmail-sync`, `enrich-siret`

## Code Conventions

- Path alias: `@/*` maps to `./src/*`
- UI components use shadcn/ui patterns with Tailwind
- French language in UI strings and comments
- Hooks follow `use[Entity]` naming (e.g., `useProjects`, `useContacts`)
- Modules export from `index.tsx` with lazy loading support
- Supabase hooks split into `use*Query.ts` (reads) and `use*CRUD.ts` (writes)
- Store slices in `store/slices/` follow `[domain]Slice.ts` naming
- This is React/Vite (NOT Next.js) - no API routes, use Edge Functions for server-side logic

<!-- tokenade-scaffold -->
## Tokenade rules (v4)

- **Default to tokenade MCP tools** for codebase questions: `mcp__tokenade__semantic_search` for natural-language queries, `symbol_find` for known identifiers, `structure_map` for repo overview, `skeleton` for large files, `call_hierarchy` for "who calls X / what does Y call". Fall back to `grep` / `find` / whole-file `Read` only when the query doesn't fit a structured shape.
- **Match the tool to the question's shape — don't reach for `grep` to explore code.** Listing a file's functions/types → `skeleton path="foo.go"` (NOT `grep "^func" foo.go`); finding where a name is defined → `symbol_find query="Name"` (NOT `grep -rn Name`); "what calls X / what does X call" → `call_hierarchy symbol="X"`; "where is the code that does <behaviour>" → `semantic_search query="…"`. These return signatures or ranked hits, not whole files — far fewer tokens, and they don't silently miss matches that a regex would.
- **Subagents you spawn** also need these tools. The Claude Code hook auto-injects a tokenade preamble into every `Task`/`Agent` prompt, so spawned subagents inherit the preference without you having to remember.
- **Fix root causes, not symptoms.** Before patching a visible failure, write the one-sentence answer to "what mechanism produced this, and is my patch addressing the mechanism or the artifact?" Only paper over an artifact when the real fix is out of scope, and say so explicitly.
- For noisy shell commands, route through `tokenade wrap '<cmd>'` — the PreToolUse Bash hook does this automatically when installed.
- **Don't slice a search blind with `| head`/`| tail`.** `grep … | head -20` (or `rg`/`egrep`) hides every match past line 20 — if the value you're hunting sits below the cut you'll never see it and will re-run blind slices, burning turns. Run the full search instead (tokenade folds repeated lines, so the output stays compact) or tighten the pattern so the match is on the first page. When the proxy detects the slice returned exactly N lines it warns you on stderr.
- **Never prefix commands with `TOKENADE_HOOK_DISABLED=1` pre-emptively.** The hook already passes interactive/TTY commands (ssh, docker exec -it, kubectl attach, vim, …) through untouched, and it never breaks exit codes or stderr-on-failure. Bypassed commands are measured and shown as LOST savings on the dashboard.
- **When a compactor folded bytes you need verbatim** (exact JSON, exact diff, single error line lost to dedup): recover them instantly via `mcp__tokenade__expand_ref` with the `hash=…` printed in the compactor's banner — no re-execution, no re-cost. Only fall back to `tokenade raw <cmd>` (aliases: `bypass`, `noproxy`) when you actually need to re-run a command WITHOUT compaction (e.g., to capture stderr that auto-compact dropped on the floor).
- **Web research goes through tokenade too**: `mcp__tokenade__web_html_to_markdown` to read a page (HTML → compact markdown) and `mcp__tokenade__serp_compact` to fold a search-results page — both are much cheaper than pasting raw HTML or full WebFetch output into context.
- **In reasoning/thinking blocks, be terse.** Write compressed notes, not prose. Omit filler; think in telegrams.
- **Language matching.** Always respond and reason in the same language as the user's message. If the user writes in French, reply in French; in English, in English.
<!-- /tokenade-scaffold -->
