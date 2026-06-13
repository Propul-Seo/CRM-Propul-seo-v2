# Déploiement du Système de Réponses aux Messages

## Objectif
Permettre aux utilisateurs de répondre à des messages spécifiques dans le chat d'équipe, avec affichage du message original cité.

## Fonctionnalités Implémentées

### 1. Base de Données
- **Champ ajouté** : `reply_to_message_id` dans la table `messages`
- **Index** : Optimisation des requêtes de réponses
- **Fonction SQL** : `get_reply_message_info()` pour récupérer les infos des messages de réponse

### 2. Interface Utilisateur
- **Bouton de réponse** : Icône de réponse sur chaque message
- **Sélecteur de messages** : Modal pour choisir le message auquel répondre
- **Indicateur de réponse** : Affichage visuel quand on répond à un message
- **Affichage des réponses** : Message original cité avec ligne violette et nom de l'expéditeur

### 3. Composants Créés
- `MessageReply.tsx` : Affichage du message de réponse
- `ReplySelector.tsx` : Sélection du message auquel répondre
- Modifications de `TeamChatGrouped.tsx` et `useTeamChatSimple.ts`

## Étapes de Déploiement

### 1. Migration Base de Données
Exécuter le script `add_reply_system.sql` dans Supabase :

```sql
-- Ajouter le champ reply_to_message_id
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Créer l'index et la fonction
-- (voir le fichier complet)
```

### 2. Déploiement Frontend
Les composants sont déjà créés et intégrés dans le système existant.

### 3. Test de la Fonctionnalité
1. Ouvrir l'application et aller dans le chat d'équipe
2. Cliquer sur l'icône de réponse (↩️) d'un message
3. Sélectionner le message auquel répondre dans le modal
4. Taper la réponse et l'envoyer
5. Vérifier l'affichage du message original cité

## Utilisation

### Pour l'Utilisateur
1. **Répondre à un message** : Cliquer sur l'icône ↩️
2. **Sélectionner le message** : Choisir dans la liste des messages récents
3. **Taper la réponse** : Le placeholder change en "Tapez votre réponse..."
4. **Envoyer** : Bouton change en "Répondre"

### Affichage des Réponses
- **Ligne violette** : Indicateur visuel de la réponse
- **Nom de l'expéditeur** : En bleu, au-dessus du contenu cité
- **Contenu cité** : Message original en texte gris plus petit
- **Réponse** : Nouveau message en dessous

## Structure Technique

### Base de Données
```sql
messages table:
- id (UUID, PK)
- content (TEXT)
- user_id (UUID, FK)
- channel_id (UUID, FK)
- reply_to_message_id (UUID, FK, nullable) ← NOUVEAU
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Composants React
- **État local** : `replyToMessageId`, `showReplySelector`
- **Fonctions** : `handleSelectReply`, `handleCancelReply`
- **Props** : Transmission de l'ID de réponse à `sendMessage`

## Vérification
✅ Migration SQL exécutée  
✅ Composants frontend intégrés  
✅ Boutons de réponse visibles  
✅ Sélecteur de messages fonctionnel  
✅ Affichage des réponses correct  
✅ Envoi de réponses opérationnel  

## Rollback
Si nécessaire, supprimer le champ ajouté :

```sql
ALTER TABLE messages DROP COLUMN IF EXISTS reply_to_message_id;
DROP FUNCTION IF EXISTS get_reply_message_info(UUID);
DROP INDEX IF EXISTS idx_messages_reply_to;
```
