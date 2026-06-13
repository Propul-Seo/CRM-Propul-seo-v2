# CLAUDE.md — CRM Propul'seo

## Projet

CRM interne agence web Propul'seo. Stack : Vite + React 18 + TypeScript + Supabase + Zustand + shadcn/ui + Tailwind. Dark mode forcé.

## Refonte V2 en cours

On refond le module **gestion de projets**. Le PRD complet est dans `docs/PRD.md`. Lis-le avant de coder.

### Résumé des changements V2

- Kanban : 3 colonnes → 9 colonnes avec pipeline rules
- Fiche projet : 2 onglets → 7 onglets (overview, checklist, journal, accès, docs, brief, facturation)
- Checklist : libre → templates pré-remplis par type de presta
- Journal : nouveau — timeline auto-alimentée par triggers PostgreSQL
- Accès : nouveau — coffre-fort chiffré
- Documents : nouveau — upload + auto-versioning
- Notifications : extension du système existant pour les alertes projet
- Recherche : nouveau — Cmd+K full-text (cmdk déjà installé, jamais utilisé)

### Ce qu'on NE touche PAS

CRM pipeline leads (KanbanPipeline.tsx), Communication (chat), CRM ERP, Bot One, Calendar, Settings, Auth.

## Conventions

- **Supabase** : client depuis `src/lib/supabase.ts`
- **Logging** : `import { logger } from '@/lib/logger'` — jamais console.log
- **Toasts** : `import { toast } from 'sonner'`
- **Icons** : lucide-react
- **UI** : shadcn/ui depuis `src/components/ui/`
- **State** : Zustand global (store/), useState local
- **Types** : TypeScript strict, pas de `any`
- **Styles** : Tailwind, classes `surface-1/2/3` pour dark mode
- **Modules** : `src/modules/NomModule/` avec `index.tsx` + `components/` + `hooks/` + `types.ts`
- **RLS** : activé sur chaque nouvelle table Supabase
- **FK** : ON DELETE CASCADE
- **PK** : uuid gen_random_uuid()
- **Migrations** : `supabase/migrations/YYYYMMDD_description.sql`

## Commandes

```bash
npm run dev      # Dev server
npm run build    # Build
npm run lint     # ESLint
```
