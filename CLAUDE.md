# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Propul'SEO CRM** is a professional CRM/ERP application built with React, TypeScript, and Supabase. It manages leads, projects, tasks, accounting, communication/content production, and team collaboration for a French digital agency.

## Workflow Rules

- **Fin de sprint** : à la fin de chaque sprint, effectuer un code review (`/review`) puis sauvegarder la session avec `/token-saver fin`.
- **Suivi du contexte** : surveiller en permanence l'utilisation du contexte. Dès que le contexte atteint **50%**, prévenir immédiatement l'utilisateur avec ce message : `⚠️ Contexte à 50% — je sauvegarde la session et on repart à neuf.`, puis exécuter automatiquement `/token-saver fin` sans attendre de confirmation.
- **V2 uniquement** : toutes les modifications UI/fonctionnelles doivent être apportées aux modules **V2** (`CommunicationManager`, `ERPManager`, `SiteWebManager`, `ProjectsManagerV2`, `DashboardV2`, etc.). Ne jamais modifier les anciens modules (`Communication`, `CRM`, `ProjectsManager`, `Dashboard`, etc.) sauf demande explicite.

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
├── App.tsx                 # Root component with auth flow
├── components/
│   ├── ui/                 # shadcn/ui components (Button, Card, Dialog, etc.)
│   ├── layout/             # Layout.tsx, Header.tsx, Sidebar.tsx
│   ├── auth/               # SupabaseAuth.tsx, AccessCodeDialog, UserSelector
│   ├── realtime/           # RealtimeProvider.tsx
│   ├── mobile/             # Mobile-specific components (BottomNav, FAB, etc.)
│   ├── calendar/           # Calendar components (SimpleCalendar, EventModal)
│   ├── crm/                # Shared CRM components (bot-one/)
│   ├── notifications/      # Toast, Chat, Financial, Sync notifications
│   └── [feature]/          # Feature-specific components
├── modules/                # Main application modules (lazy-loaded)
│   ├── Dashboard/          # KPIs and overview
│   ├── CRM/                # Lead management (main CRM pipeline)
│   ├── CRMBotOne/          # Secondary CRM pipeline
│   ├── CRMERP/             # ERP-style CRM with kanban
│   ├── CRMERPLeadDetails/  # Lead detail pages for CRMERP
│   ├── Communication/      # Content production management (kanban/calendar/dashboard)
│   ├── CommunicationKPI/   # Communication analytics & performance
│   ├── Contacts/           # Contact list
│   ├── ContactDetails/     # Contact detail view
│   ├── ContactDetailsBotOne/ # Bot One contact details
│   ├── ClientDetails/      # Client detail view
│   ├── ProjectsManager/    # Active project management
│   ├── ProjectDetails/     # Project detail view
│   ├── CompletedProjectsManager/ # Completed projects archive
│   ├── TaskManager/        # Task management with templates
│   ├── Accounting/         # Financial tracking
│   └── Settings/           # User/app settings, team management, archives
├── hooks/
│   ├── supabase/           # Supabase query/CRUD hooks (refactored from useSupabaseData.ts)
│   │   ├── useSupabaseQuery.ts    # Base query hook
│   │   ├── useQueryHooks.ts       # Entity-specific query hooks
│   │   ├── use*CRUD.ts            # CRUD operations per entity
│   │   └── index.ts               # Barrel export
│   ├── useAuth.ts          # Supabase authentication
│   ├── useContacts.ts      # Contact/lead management
│   ├── useProjects.ts      # Project CRUD
│   ├── useTasks.ts         # Task management
│   └── use*.ts             # Domain-specific hooks
├── services/               # Business logic services
│   ├── archiveService.ts   # Archive/restore functionality
│   ├── supabaseService.ts  # Core Supabase operations
│   ├── ringoverService.ts  # Ringover phone integration
│   └── *.ts                # Activity/prospect services
├── store/
│   ├── useStore.ts         # Main store (combines slices)
│   ├── slices/             # Zustand store slices
│   │   ├── authSlice.ts
│   │   ├── navigationSlice.ts
│   │   ├── crmSlice.ts
│   │   ├── projectsSlice.ts
│   │   ├── tasksSlice.ts
│   │   ├── accountingSlice.ts
│   │   ├── activitiesSlice.ts
│   │   └── uiSlice.ts
│   ├── selectors.ts        # Memoized selectors
│   ├── helpers.ts
│   └── types.ts
├── lib/
│   ├── supabase.ts         # Supabase client singleton
│   └── utils.ts            # cn() and utility functions
├── types/
│   ├── database.ts         # Generated Supabase types
│   └── *.ts                # Domain types (crmBotOne, financial, activity, etc.)
├── utils/                  # Utility functions and constants
└── pages/
    └── ClientDetailsBotOne.tsx  # Page wrapper
```

### Key Patterns

**Module Navigation**: The app uses a single-page architecture with module switching via `useStore().activeModule`. Modules are lazy-loaded in `Layout.tsx`.

**Data Flow**:
- Supabase is the source of truth for all persistent data
- `store/slices/` handle UI state (split into 8 slices: auth, navigation, crm, projects, tasks, accounting, activities, ui)
- `hooks/supabase/` encapsulate all Supabase queries and CRUD operations
- Domain hooks in `hooks/` compose supabase hooks with business logic

**Authentication**: Managed via `useAuth` hook and `SupabaseAuth` component. The `Layout` component checks user permissions before rendering modules. Admin check: `currentUser?.email === 'team@propulseo-site.com'` or `is_admin()` SQL function.

**Realtime**: `RealtimeProvider` wraps the app for Supabase real-time subscriptions.

**User table**: The main table is `users` (not `user_profiles`), with `auth_user_id` FK to Supabase auth. Roles: admin, sales, marketing, developer, manager, ops.

### Database Schema

Key tables:
- `users` - User data with roles and permissions (`can_view_communication`, etc.)
- `clients` - CRM contacts with pipeline status (prospect, devis, signe, livre, perdu)
- `projects` - Project tracking with status and budget
- `tasks` - Task management linked to projects/clients
- `calendar_events` - Calendar with event types
- `accounting_entries` - Financial records
- `activities` / `prospect_activities` - Activity tracking
- `posts` / `post_assets` / `post_comments` - Communication module content
- `post_metrics` - Communication KPI data per post
- Materialized views: `kpi_monthly_overview`, `kpi_daily_metrics`, `kpi_top_posts`

Supabase migrations are in `supabase/migrations/`.

### Edge Functions

Located in `supabase/functions/`:
- `admin-create-user`, `admin-update-password`, `admin-toggle-user-status` - User management
- `generate-quote-pdf` - PDF generation
- `calculate-monthly-metrics` - Financial metrics
- `ringover-call` - Phone integration
- `sync-project-budget` - Budget sync

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
