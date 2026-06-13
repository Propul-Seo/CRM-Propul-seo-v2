# Checklist Sécurité - CRM Propul'SEO

## Actions Immédiates (CRITIQUES)

### 1. Régénérer les clés API
- [ ] Aller sur [Supabase Dashboard](https://supabase.com/dashboard) > Settings > API
- [ ] Cliquer "Regenerate" sur la clé `anon`
- [ ] Mettre à jour `.env` avec la nouvelle clé
- [ ] Redéployer l'application
- [ ] Vérifier que l'ancienne clé ne fonctionne plus

### 2. Configurer les variables d'environnement
- [ ] Copier `.env.example` vers `.env`
- [ ] Remplir `VITE_SUPABASE_URL`
- [ ] Remplir `VITE_SUPABASE_ANON_KEY`
- [ ] Vérifier que `.env` est dans `.gitignore`

### 3. Nettoyer l'historique Git (si repo public)
```bash
# Installer BFG Repo-Cleaner
brew install bfg

# Nettoyer les secrets de l'historique
bfg --delete-files .env.backup
bfg --replace-text secrets-to-remove.txt

# Force push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

## Validation Post-Déploiement

### Tests de sécurité
- [ ] Tenter d'accéder à l'API sans token → Doit échouer
- [ ] Tenter d'accéder aux données d'un autre user → Doit échouer
- [ ] Inspecter le bundle JS en prod → Aucune clé visible
- [ ] Vérifier les headers réseau → Pas de tokens exposés

### Vérification du code
```bash
# Aucun secret dans le code
grep -rE "(eyJ|sk_live|pk_live)" src/

# Vérifier les fichiers ignorés
git status --ignored

# Build sans erreur
npm run build
```

## Audit RLS Supabase

### Exécuter l'audit
1. Aller sur Supabase Dashboard > SQL Editor
2. Exécuter `supabase/migrations/001_audit_rls.sql`
3. Vérifier qu'aucune table sensible n'est sans RLS

### Appliquer les politiques
1. Exécuter `supabase/migrations/002_enable_rls_all_tables.sql`
2. Tester chaque table manuellement
3. Vérifier les logs d'erreur

## Maintenance Continue

### Hebdomadaire
- [ ] Vérifier les logs Supabase pour accès anormaux
- [ ] Auditer les nouvelles tables créées

### Mensuelle
- [ ] Rotation des clés API si nécessaire
- [ ] Revue des politiques RLS
- [ ] Mise à jour des dépendances de sécurité

### Trimestrielle
- [ ] Audit de sécurité complet
- [ ] Test de pénétration basique
- [ ] Revue des permissions utilisateurs

## Contacts

- **Responsable sécurité** : [À définir]
- **En cas d'incident** : [Contact d'urgence]
- **Supabase Support** : support@supabase.io
