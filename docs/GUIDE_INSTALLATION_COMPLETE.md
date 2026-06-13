# Guide d'Installation Complet - Système Multi-Utilisateurs Propulseo CRM

## 🎯 Objectif

Ce guide vous permettra de configurer complètement le système de gestion multi-utilisateurs de Propulseo CRM en résolvant définitivement l'erreur "Database error saving new user".

## ⚡ Solution Rapide (TL;DR)

```bash
# 1. Appliquer la migration complète
supabase db push

# 2. Tester le système
npm run test:user-creation

# 3. Créer les comptes de test
npm run test:create-users
```

## 📋 Prérequis

- ✅ Projet Supabase configuré
- ✅ Variables d'environnement configurées
- ✅ CLI Supabase installé
- ✅ Node.js et npm installés

## 🔧 Étape 1: Configuration des Variables d'Environnement

### 1.1 Fichier .env.local

Créez ou mettez à jour votre fichier `.env.local` :

```env
# Configuration Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Configuration optionnelle
VITE_APP_NAME=Propulseo CRM
VITE_APP_VERSION=1.0.0
```

### 1.2 Vérification des Variables

```bash
# Vérifier que les variables sont correctement définies
echo "URL: $VITE_SUPABASE_URL"
echo "ANON: $VITE_SUPABASE_ANON_KEY"
echo "SERVICE: $SUPABASE_SERVICE_ROLE_KEY"
```

## 🗄️ Étape 2: Migration de la Base de Données

### 2.1 Appliquer la Migration Complète

```bash
# Se connecter à Supabase
supabase login

# Lier le projet (si pas déjà fait)
supabase link --project-ref your-project-id

# Appliquer toutes les migrations
supabase db push
```

### 2.2 Vérifier la Migration

La migration `20250130_fix_user_system_complete.sql` va :

- ✅ Nettoyer les conflits de tables (`users` vs `user_profiles`)
- ✅ Créer une table `users` unifiée
- ✅ Configurer un trigger robuste pour la création automatique de profils
- ✅ Créer les fonctions RPC nécessaires
- ✅ Activer RLS (Row Level Security)
- ✅ Créer les index pour les performances

### 2.3 Logs de Migration

Vérifiez les logs dans Supabase Dashboard > Database > Logs pour confirmer :

```
✅ Migration réussie - Système d'utilisateurs opérationnel
- Tables créées: 4
- Triggers créés: 1
- Fonctions créées: 3
```

## 🧪 Étape 3: Tests du Système

### 3.1 Installation des Dépendances

```bash
# Dans le dossier docs/
cd docs/
npm install --legacy-peer-deps
```

### 3.2 Test de Structure

```bash
# Vérifier la structure de la base de données
npm run test:user-creation
```

**Résultat attendu :**
```
🔍 Vérification de la structure de la base de données...
📊 Tables trouvées: [ 'users', 'teams', 'user_assignments', 'notifications' ]
✅ Fonction handle_new_user: disponible
✅ Fonction create_user_profile_if_missing: disponible
✅ Fonction get_user_permissions: disponible
🔧 Triggers: Configurés
```

### 3.3 Test de Création d'Utilisateur

Le script va automatiquement :

1. ✅ Créer un utilisateur auth
2. ✅ Vérifier que le profil est créé automatiquement
3. ✅ Tester la connexion
4. ✅ Nettoyer les données de test

**Résultat attendu :**
```
🧪 Test de création d'utilisateur...
📝 Création de l'utilisateur auth...
✅ Utilisateur auth créé: [UUID]
⏳ Attente de la création du profil...
✅ Profil créé automatiquement: Utilisateur Test sales
🔐 Test de connexion...
✅ Connexion réussie: [UUID]
🧹 Nettoyage...
✅ Utilisateur de test supprimé
🎉 Test terminé avec succès !
```

## 👥 Étape 4: Création des Comptes de Test

### 4.1 Comptes Multi-Utilisateurs

```bash
# Créer les 4 comptes de test
npm run test:create-users
```

**Comptes créés :**

| Nom | Email | Mot de passe | Rôle |
|-----|-------|--------------|------|
| Etienne Admin | etienne@propulseo.com | 000000 | admin |
| Paul Developer | paul@propulseo.com | 000000 | developer |
| Antoine Sales | antoine@propulseo.com | 000000 | sales |
| Baptiste Sales | baptiste@propulseo.com | 000000 | sales |

### 4.2 Vérification des Comptes

Dans Supabase Dashboard > Authentication > Users, vous devriez voir les 4 comptes créés.

## 🚀 Étape 5: Test de l'Application

### 5.1 Démarrer l'Application

```bash
# Retourner au dossier racine du projet
cd ..

# Démarrer l'application
npm run dev
```

### 5.2 Test de Connexion

1. **Ouvrir l'application** : `http://localhost:5173`

2. **Se connecter avec un compte de test** :
   - Email: `etienne@propulseo.com`
   - Mot de passe: `000000`

3. **Vérifier** :
   - ✅ Connexion réussie
   - ✅ Profil utilisateur chargé
   - ✅ Permissions correctes selon le rôle
   - ✅ Pas d'erreur "Database error saving new user"

### 5.3 Test de Création de Compte

1. **Aller sur la page d'inscription**

2. **Créer un nouveau compte** :
   - Nom: `Test User`
   - Email: `test@example.com`
   - Mot de passe: `test123456`
   - Rôle: `sales`

3. **Vérifier** :
   - ✅ Compte créé sans erreur
   - ✅ Profil utilisateur créé automatiquement
   - ✅ Connexion automatique ou email de confirmation

## 🔒 Étape 6: Vérification de la Sécurité

### 6.1 RLS (Row Level Security)

Le système implémente automatiquement :

- ✅ **Isolation des données** : Chaque utilisateur voit seulement ses données
- ✅ **Permissions par rôle** : Admin > Manager > Developer > Sales
- ✅ **Accès équipe** : Les membres d'équipe peuvent se voir entre eux
- ✅ **Notifications privées** : Chaque utilisateur voit ses propres notifications

### 6.2 Test de Sécurité

1. **Se connecter avec Paul** (`paul@propulseo.com`)
2. **Vérifier** qu'il ne voit que :
   - ✅ Son propre profil
   - ✅ Les membres de son équipe
   - ✅ Ses propres notifications
   - ❌ Pas les données privées d'autres utilisateurs

## 🎯 Étape 7: Tests Multi-Utilisateurs

### 7.1 Test d'Assignation

1. **Se connecter avec Etienne** (admin)
2. **Aller sur la page de test multi-utilisateurs**
3. **Assigner une tâche à Paul**
4. **Se connecter avec Paul**
5. **Vérifier** qu'il voit la tâche assignée

### 7.2 Test des Notifications Temps Réel

1. **Ouvrir deux onglets** avec deux comptes différents
2. **Créer une assignation** depuis un compte
3. **Vérifier** que la notification apparaît en temps réel dans l'autre onglet

## 🐛 Dépannage

### Problème 1: "Invalid API key"

**Solution :**
```bash
# Vérifier les variables d'environnement
echo $VITE_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Récupérer les clés depuis Supabase Dashboard > Settings > API
```

### Problème 2: "Table 'users' doesn't exist"

**Solution :**
```bash
# Réappliquer la migration
supabase db push --debug

# Vérifier les logs de migration
supabase logs
```

### Problème 3: "Profile not created automatically"

**Solution :**
```bash
# Vérifier le trigger
supabase db logs

# Créer manuellement si nécessaire
npm run fix:users
```

### Problème 4: "Permission denied"

**Solution :**
1. Vérifier que RLS est activé
2. Vérifier les politiques de sécurité
3. Vérifier le rôle de l'utilisateur

## 📊 Monitoring et Maintenance

### Logs Importants

```bash
# Logs Supabase
supabase logs

# Logs de l'application (dans la console du navigateur)
localStorage.setItem('debug', 'supabase:*');
```

### Requêtes de Diagnostic

```sql
-- Vérifier les utilisateurs
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- Vérifier les assignations
SELECT * FROM user_assignments ORDER BY created_at DESC LIMIT 10;

-- Vérifier les notifications
SELECT * FROM notifications WHERE is_read = false;

-- Diagnostic complet
SELECT * FROM diagnose_user_creation_issues();
```

## ✅ Checklist de Validation

- [ ] Variables d'environnement configurées
- [ ] Migration appliquée avec succès
- [ ] Tests de structure passés
- [ ] Tests de création d'utilisateur passés
- [ ] Comptes de test créés
- [ ] Connexion fonctionnelle
- [ ] Création de compte sans erreur
- [ ] RLS activé et fonctionnel
- [ ] Assignations multi-utilisateurs testées
- [ ] Notifications temps réel testées

## 🎉 Résultat Final

Après avoir suivi ce guide, vous devriez avoir :

✅ **Système d'authentification robuste** - Création et connexion sans erreur
✅ **Gestion multi-utilisateurs complète** - 4 rôles avec permissions différentes
✅ **Sécurité RLS activée** - Isolation des données par utilisateur
✅ **Assignations fonctionnelles** - Système de tâches entre utilisateurs
✅ **Notifications temps réel** - Via Supabase subscriptions
✅ **Tests automatisés** - Scripts de validation et diagnostic

## 🆘 Support

En cas de problème persistant :

1. **Collecter les informations** :
   ```bash
   npm run diagnose:users > diagnostic.log
   supabase logs > supabase.log
   ```

2. **Vérifier la documentation** :
   - `SOLUTION_USER_CREATION_ERROR.md`
   - `MULTI_USER_VERIFICATION_REPORT.md`

3. **Réinitialiser si nécessaire** :
   ```bash
   # Sauvegarder les données importantes
   # Puis réappliquer la migration
   supabase db push --reset
   ```

Le système est maintenant **prêt pour la production** ! 🚀 