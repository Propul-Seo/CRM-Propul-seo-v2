# /database — Scripts SQL du projet

## Structure

```
database/
├── migrations/    → VIDE — les vraies migrations sont dans /supabase/migrations/
├── seeds/         → Données de test et scripts de seed
├── diagnostics/   → Scripts de diagnostic, debug, vérification
├── one_off/       → Scripts ponctuels de création (tables, fonctions, colonnes)
├── deploy/        → Scripts d'orchestration de déploiement
├── cleanup/       → Scripts de nettoyage (suppression, désactivation RLS)
├── fixes/         → Scripts de correction (bugs, contraintes, permissions)
└── README.md      → Ce fichier
```

## Source of truth pour les migrations

Les migrations officielles sont dans **`/supabase/migrations/`** (format Supabase CLI).
Les fichiers ici sont des scripts ad-hoc exécutés manuellement via le SQL Editor Supabase.

## Convention de nommage

Pour les **nouveaux** scripts :

```
YYYYMMDD_domaine_action.sql
```

Exemples :
- `20260207_crm_add_priority_column.sql`
- `20260207_chat_fix_rls_policies.sql`
- `20260207_accounting_seed_categories.sql`

## Variantes existantes

Beaucoup de scripts ont des variantes historiques (`_fixed`, `_final`, `_v2`, `_complete`, `_simple`).
Elles ont été conservées pour traçabilité. Règle générale :

| Suffixe | Signification |
|---------|--------------|
| `_v2`, `_v3` | Itération successive — la version la plus haute est la bonne |
| `_fixed` | Correction d'un bug dans la version précédente — utiliser celle-ci |
| `_final` | Dernière version validée — utiliser celle-ci |
| `_complete` | Version exhaustive (inclut tout) — préférer à `_simple` |
| `_simple` | Version minimale — souvent obsolète si `_complete` existe |
| `_clean`, `_corrected` | Nettoyage ou correction — utiliser celle-ci |
| `_working` | Version qui fonctionne après debug — utiliser `_working_fixed` si elle existe |

### Groupes de variantes notables

**Activities** : 5 versions de deploy → utiliser `deploy_activities_final_fixed.sql`
**Reactions** : 7 versions de setup → utiliser `setup_reactions_working_fixed.sql`
**Commercial** : `fix_commercial_functions.sql` → `_v2` → `_v3` (utiliser `_v3`)
**BYW** : `create_byw_fixed.sql` remplace `create_byw_complete.sql`
**CRM setup** : `setup_crm_simple_fixed.sql` remplace `setup_crm_simple_final.sql`

## Comment ajouter un nouveau script

1. Déterminer la catégorie (fix, seed, diagnostic, one_off, cleanup)
2. Nommer avec la convention `YYYYMMDD_domaine_action.sql`
3. Placer dans le bon dossier
4. **Ne jamais mettre de `.sql` à la racine du repo**
5. Si c'est une migration pérenne, utiliser `supabase migration new` à la place
