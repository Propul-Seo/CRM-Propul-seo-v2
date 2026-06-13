# Guide de Déploiement - Correction du Compteur de Messages Non Lus

## Problème Résolu

Le compteur de messages non lus (badge rouge avec le nombre) restait affiché même après avoir lu tous les messages d'un canal. Ce problème était dû à une gestion locale du compteur qui n'était pas synchronisée avec la base de données.

## Solution Implémentée

### 1. Nouvelle Table de Suivi
- **Table :** `channel_read_status`
- **Fonction :** Suivre le dernier message lu par utilisateur dans chaque canal
- **Sécurité :** RLS (Row Level Security) activé avec politiques appropriées

### 2. Fonctions SQL
- **`get_channel_unread_count(p_channel_id, p_user_id)`** : Calcule le nombre exact de messages non lus
- **`mark_channel_as_read(p_channel_id, p_user_id)`** : Marque un canal comme lu

### 3. Modifications du Code
- **Hook `useTeamChatSimple.ts`** : Utilise les nouvelles fonctions SQL
- **Comptage en temps réel** : Mise à jour automatique lors de la réception de nouveaux messages
- **Persistance** : Le statut de lecture est maintenant sauvegardé en base

## Étapes de Déploiement

### Étape 1 : Appliquer la Migration
```bash
# Dans votre projet Supabase
supabase db push
```

### Étape 2 : Vérifier la Migration
```bash
# Exécuter le script de test
psql -h [HOST] -U [USER] -d [DB] -f scripts/test-channel-read-status.sql
```

### Étape 3 : Redéployer l'Application
```bash
# Reconstruire et redéployer
npm run build
npm run deploy
```

## Vérification

### ✅ Compteur Correct
- Le badge rouge disparaît après avoir lu tous les messages
- Le compteur se met à jour en temps réel
- Persistance entre les sessions

### ✅ Fonctionnalités Maintenues
- Réception en temps réel des nouveaux messages
- Sélection de canaux
- Gestion des utilisateurs

## Structure de la Base

```sql
channel_read_status
├── id (UUID, PK)
├── user_id (UUID, FK vers auth.users)
├── channel_id (UUID, FK vers channels)
├── last_read_at (TIMESTAMP)
├── last_message_id (UUID, FK vers messages)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## Index et Performance

- **`idx_channel_read_status_user_channel`** : Optimise les requêtes par utilisateur/canal
- **`idx_channel_read_status_channel`** : Optimise les requêtes par canal
- **`idx_channel_read_status_last_read`** : Optimise les requêtes temporelles

## Sécurité

- **RLS activé** : Chaque utilisateur ne voit que ses propres statuts
- **Politiques strictes** : SELECT, UPDATE, INSERT limités à l'utilisateur authentifié
- **Fonctions SECURITY DEFINER** : Exécution avec les privilèges du créateur

## Rollback

En cas de problème, vous pouvez revenir à l'ancienne logique :

```sql
-- Supprimer la table
DROP TABLE IF EXISTS channel_read_status CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS get_channel_unread_count(UUID, UUID);
DROP FUNCTION IF EXISTS mark_channel_as_read(UUID, UUID);

-- Supprimer le trigger
DROP TRIGGER IF EXISTS trigger_update_channel_read_status_updated_at ON channel_read_status;

-- Supprimer la fonction de mise à jour
DROP FUNCTION IF EXISTS update_channel_read_status_updated_at();
```

## Support

En cas de problème lors du déploiement :
1. Vérifier les logs Supabase
2. Exécuter le script de test
3. Vérifier les permissions RLS
4. Contrôler la connectivité à la base de données
