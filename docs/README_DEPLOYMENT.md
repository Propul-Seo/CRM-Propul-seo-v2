# Guide de Deploiement Base de Donnees

## Pre-requis

- Acces au dashboard Supabase (projet `tbuqctfgjjxnevmsvucl`, region `eu-west-3`)
- Compte admin (`team@propulseo-site.com`)
- Supabase CLI installe (`npx supabase --version`)

## Deployer une migration Supabase (methode standard)

```bash
# 1. Creer une nouvelle migration
npx supabase migration new ma_description

# 2. Editer le fichier genere dans supabase/migrations/

# 3. Appliquer en local (si DB locale configuree)
npx supabase db push

# 4. Appliquer en production
npx supabase db push --linked
```

## Executer un script SQL ad-hoc

1. Ouvrir le SQL Editor dans le dashboard Supabase
2. Trouver le script dans `/database/` (voir `/database/README.md` pour la structure)
3. Copier-coller et executer
4. Verifier les resultats avec un script de `/database/diagnostics/`

## Ordre d'execution pour un nouveau deploiement

Les migrations dans `/supabase/migrations/` sont numerotees et s'executent dans l'ordre.
Pour les scripts ad-hoc, suivre cet ordre general :

1. **Tables** : `database/one_off/create_*.sql` ou `setup_*.sql`
2. **Fixes** : `database/fixes/fix_*.sql` si necessaire
3. **Seeds** : `database/seeds/test_*.sql` pour les donnees de test
4. **Diagnostics** : `database/diagnostics/check_*.sql` pour verifier

## Staging vs Production

| | Staging | Production |
|---|---------|-----------|
| Projet Supabase | Branche dev (si activee) | `tbuqctfgjjxnevmsvucl` |
| Methode | SQL Editor ou CLI | Supabase MCP ou CLI |
| Seeds | Oui | Non |
| RLS | Peut etre desactive pour debug | Toujours actif |

## Edge Functions

Les Edge Functions sont dans `/supabase/functions/`. Deployer via :

```bash
npx supabase functions deploy nom-de-la-fonction
```

Ou via le MCP Supabase (`deploy_edge_function`).

## En cas de probleme

1. Executer le diagnostic adapte : `database/diagnostics/`
2. Consulter les runbooks : `docs/runbooks/`
3. Verifier les logs Supabase dans le dashboard
