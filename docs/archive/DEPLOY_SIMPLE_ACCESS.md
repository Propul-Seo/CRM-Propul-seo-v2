# 🚀 **Guide de Déploiement - Contrôle d'Accès Simple**

## 📋 **Prérequis**
- Base de données Supabase fonctionnelle
- Tables `channels` et `users` existantes
- Accès administrateur à Supabase

## 🔧 **Étape 1 : Appliquer la Migration**

### **Option A : Via Supabase CLI**
```bash
# Dans le dossier du projet
supabase db push

# Ou spécifiquement cette migration
supabase db push --include-all
```

### **Option B : Via Supabase Dashboard**
1. Aller dans **Database** > **SQL Editor**
2. Copier le contenu de `supabase/migrations/20250131_simple_channel_access.sql`
3. Exécuter le script

## ✅ **Étape 2 : Vérifier la Migration**

### **Vérifier les nouvelles colonnes**
```sql
-- Vérifier que les colonnes ont été ajoutées
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'channels' 
AND column_name IN ('is_public', 'allowed_users', 'allowed_roles')
ORDER BY ordinal_position;
```

### **Vérifier les politiques RLS**
```sql
-- Vérifier que les politiques ont été créées
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'channels';
```

### **Vérifier les fonctions**
```sql
-- Vérifier que les fonctions ont été créées
SELECT 
  proname,
  prosrc IS NOT NULL as has_source
FROM pg_proc 
WHERE proname IN ('can_access_channel', 'get_accessible_channels');
```

## 🎯 **Étape 3 : Configuration Initiale**

### **Configurer les canaux existants**
La migration configure automatiquement :
- **Canal "général"** : Public (visible par tous)
- **Canal "projets"** : Privé (rôles `admin`, `manager`)
- **Canal "support"** : Privé (rôles `admin`, `developer`, `sales`)

### **Vérifier la configuration**
```sql
-- Vérifier la configuration des canaux
SELECT 
  name,
  is_public,
  allowed_roles,
  allowed_users
FROM channels
ORDER BY name;
```

## 🧪 **Étape 4 : Tests**

### **Test 1 : Accès aux canaux publics**
```sql
-- Se connecter avec un utilisateur normal
-- Vérifier qu'il peut voir le canal "général"
SELECT * FROM channels WHERE name = 'général';
```

### **Test 2 : Accès aux canaux privés**
```sql
-- Se connecter avec un utilisateur admin
-- Vérifier qu'il peut voir tous les canaux
SELECT * FROM channels;

-- Se connecter avec un utilisateur sales
-- Vérifier qu'il ne peut voir que les canaux autorisés
SELECT * FROM channels;
```

### **Test 3 : Fonction de vérification**
```sql
-- Tester la fonction can_access_channel
SELECT can_access_channel(
  (SELECT id FROM channels WHERE name = 'projets'),
  auth.uid()
);
```

## 🚨 **Résolution des Problèmes**

### **Erreur : "operator does not exist: user_role = text"**
**Cause** : Le champ s'appelle `role` et non `user_role`
**Solution** : Utiliser `role::text` dans les comparaisons

### **Erreur : "column does not exist"**
**Cause** : La migration n'a pas été appliquée
**Solution** : Vérifier que le script SQL a été exécuté

### **Erreur : "policy already exists"**
**Cause** : Les politiques existent déjà
**Solution** : La migration utilise `DROP POLICY IF EXISTS`

## 📱 **Étape 5 : Test Frontend**

### **1. Redémarrer l'application**
```bash
npm run dev
```

### **2. Tester l'interface**
- Aller dans **Team Chat**
- Cliquer sur 🛡️ "Contrôler l'accès" sur un canal
- Vérifier que le modal s'ouvre
- Tester la configuration public/privé

### **3. Vérifier les permissions**
- Se connecter avec différents rôles
- Vérifier que seuls les canaux autorisés sont visibles
- Tester l'envoi de messages

## 🔄 **Rollback (si nécessaire)**

### **Supprimer les nouvelles colonnes**
```sql
-- ATTENTION : Cela supprimera toutes les configurations d'accès
ALTER TABLE channels 
DROP COLUMN IF EXISTS is_public,
DROP COLUMN IF EXISTS allowed_users,
DROP COLUMN IF EXISTS allowed_roles;
```

### **Supprimer les politiques**
```sql
DROP POLICY IF EXISTS "Contrôle d'accès aux canaux" ON channels;
DROP POLICY IF EXISTS "Contrôle d'accès aux messages" ON messages;
```

### **Supprimer les fonctions**
```sql
DROP FUNCTION IF EXISTS can_access_channel(UUID, UUID);
DROP FUNCTION IF EXISTS get_accessible_channels(UUID);
```

## 📊 **Vérification Finale**

### **Checklist de déploiement**
- [ ] Migration SQL exécutée sans erreur
- [ ] Nouvelles colonnes présentes dans `channels`
- [ ] Politiques RLS créées
- [ ] Fonctions utilitaires créées
- [ ] Configuration initiale appliquée
- [ ] Frontend fonctionne sans erreur
- [ ] Permissions testées avec différents rôles

## 🎉 **Succès !**

Une fois toutes les étapes validées, vous avez un **système de contrôle d'accès simple et efficace** pour vos canaux de discussion !

**Support** : En cas de problème, vérifiez les logs Supabase et les erreurs dans la console du navigateur.
