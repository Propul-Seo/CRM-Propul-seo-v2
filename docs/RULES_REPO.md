# Regles du Repository

## Fichiers a la racine

La racine du repo contient uniquement :
- Fichiers de config standard (`package.json`, `tsconfig.json`, `vite.config.ts`, etc.)
- `README.md` et `CLAUDE.md`
- Dossiers de code source (`src/`, `supabase/`, `public/`, `scripts/`)
- Dossiers d'organisation (`database/`, `docs/`)

**Interdit a la racine :**
- Fichiers `.sql` → utiliser `/database/` ou `/supabase/migrations/`
- Fichiers `.md` de documentation → utiliser `/docs/`
- Fichiers temporaires → utiliser `/temp_files/` ou ne pas commiter
- Scripts de test → utiliser `/scripts/` ou `/database/seeds/`

## Convention de nommage des fichiers SQL

```
YYYYMMDD_domaine_action.sql
```

- `domaine` : crm, chat, accounting, auth, commercial, reactions, byw, etc.
- `action` : create, fix, add, drop, seed, check, cleanup, deploy

Exemples :
- `20260207_crm_add_priority_column.sql`
- `20260207_chat_fix_rls_policies.sql`

## Ou ranger les nouveaux fichiers

| Type | Dossier | Exemple |
|------|---------|---------|
| Migration perenne | `supabase/migrations/` | Via `supabase migration new` |
| Script ponctuel (creation table, fonction) | `database/one_off/` | `create_*.sql`, `setup_*.sql` |
| Fix de bug DB | `database/fixes/` | `fix_*.sql` |
| Nettoyage de donnees | `database/cleanup/` | `cleanup_*.sql` |
| Donnees de test | `database/seeds/` | `test_*.sql`, `seed_*.sql` |
| Diagnostic / debug | `database/diagnostics/` | `check_*.sql`, `debug_*.sql` |
| Orchestration deploy | `database/deploy/` | `deploy_*.sql` |
| Documentation technique | `docs/architecture/` | `*.md` |
| Guide de deploiement | `docs/runbooks/` | `DEPLOY_*.md` |
| Rapports / historique | `docs/archive/` | `*_REPORT.md` |

## Versions de fichiers

Ne pas utiliser `_final`, `_fixed`, `_complete` dans les nouveaux fichiers.
Utiliser des versions explicites : `_v1`, `_v2`, `_v3`.

Si un fichier remplace un autre, ajouter un commentaire en haut :
```sql
-- Remplace : fix_commercial_functions_v2.sql
-- Raison : ajout gestion des permissions RLS
```

## Code source (src/)

- Pas de fichiers > 200 lignes dans un seul composant
- Hooks dans `hooks/`, composants UI dans `components/`, modules dans `modules/`
- Types dans `types/` ou colocalisees avec le module
- Barrel exports (`index.ts`) pour les modules refactores
