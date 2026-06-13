# 🎯 Guide du Système d'Activités CRM

## 📋 Vue d'ensemble

Le système d'activités a été étendu pour synchroniser les activités entre le **CRM Principal**, **CRM Bot One** et **CRM BYW**. Chaque module peut maintenant créer, gérer et synchroniser ses activités avec le système central.

## 🏗️ Architecture

### Tables créées
- `crm_bot_one_activities` - Activités spécifiques au CRM Bot One
- `crm_byw_activities` - Activités spécifiques au CRM BYW
- Synchronisation automatique vers `activities` (table principale)

### Fonctionnalités
- ✅ **Création d'activités** dans chaque module
- ✅ **Synchronisation automatique** vers le CRM Principal
- ✅ **Triggers automatiques** pour BYW (changements de statut)
- ✅ **Sécurité RLS** par utilisateur
- ✅ **Index optimisés** pour les performances

## 🚀 Déploiement

### 1. Script principal
```sql
-- Exécuter dans l'ordre :
\i deploy_activities_system.sql
```

### 2. Scripts individuels (optionnel)
```sql
-- Pour CRM Bot One uniquement
\i create_activities_crm_bot_one.sql

-- Pour CRM BYW uniquement  
\i create_activities_crm_byw.sql

-- Fonctions de synchronisation avancées
\i create_activities_sync_functions.sql
```

### 3. Tests
```sql
-- Vérifier le déploiement
\i test_activities_system.sql
```

## 📊 Utilisation

### CRM Bot One

#### Créer une activité
```sql
SELECT create_bot_one_record_activity(
  'record_id_uuid',           -- ID de l'enregistrement Bot One
  'Titre de l''activité',     -- Titre
  'Description optionnelle',  -- Description
  NOW(),                      -- Date (par défaut: maintenant)
  'bot_one_record',           -- Type (par défaut)
  'haute',                    -- Priorité: haute/moyenne/basse
  'a_faire'                   -- Statut: a_faire/en_cours/termine
);
```

#### Récupérer les activités d'un enregistrement
```sql
SELECT * FROM get_bot_one_record_activities('record_id_uuid');
```

### CRM BYW

#### Créer une activité
```sql
SELECT create_byw_record_activity(
  'record_id_uuid',           -- ID de l'enregistrement BYW
  'Titre de l''activité',     -- Titre
  'Description optionnelle',  -- Description
  NOW(),                      -- Date (par défaut: maintenant)
  'byw_record',               -- Type (par défaut)
  'moyenne',                  -- Priorité: haute/moyenne/basse
  'a_faire'                   -- Statut: a_faire/en_cours/termine
);
```

#### Récupérer les activités d'un enregistrement
```sql
SELECT * FROM get_byw_record_activities('record_id_uuid');
```

### Activités automatiques BYW

Les activités suivantes sont créées automatiquement lors des changements :

| Changement | Activité créée | Priorité | Statut |
|------------|----------------|----------|---------|
| `presentation_envoye` → 'Oui' | "Présentation envoyée à [Company]" | Moyenne | Terminé |
| `rdv` → 'Planifié' | "RDV planifié avec [Company]" | Haute | À faire |
| `demo` → 'Programmée' | "Démo programmée pour [Company]" | Haute | À faire |
| `client` → 'Client' | "Conversion client: [Company]" | Haute | Terminé |
| `perdu` → 'Oui' | "Lead perdu: [Company]" | Basse | Terminé |

## 🔄 Synchronisation

### Synchronisation automatique
- Chaque activité créée dans Bot One ou BYW est automatiquement synchronisée vers `activities`
- Le champ `related_module` indique la source : `crm_bot_one` ou `crm_byw`

### Synchronisation manuelle
```sql
-- Synchroniser toutes les activités
SELECT * FROM sync_all_activities_to_main();

-- Obtenir toutes les activités d'un utilisateur
SELECT * FROM get_user_all_activities('user_id_uuid');
```

## 📈 Statistiques

### Par module
```sql
SELECT * FROM get_activities_stats_by_module('user_id_uuid');
```

### Requêtes utiles
```sql
-- Activités de la semaine
SELECT * FROM crm_bot_one_activities 
WHERE date_utc >= date_trunc('week', NOW())
  AND user_id = auth.uid();

-- Activités en retard
SELECT * FROM crm_byw_activities 
WHERE status = 'a_faire' 
  AND date_utc < NOW()
  AND user_id = auth.uid();
```

## 🔒 Sécurité

### RLS (Row Level Security)
- Chaque utilisateur ne peut voir que ses propres activités
- Les politiques RLS sont configurées automatiquement
- Accès sécurisé via `auth.uid()`

### Permissions
- `SELECT` : Voir ses activités
- `INSERT` : Créer des activités
- `UPDATE` : Modifier ses activités  
- `DELETE` : Supprimer ses activités

## 🛠️ Maintenance

### Nettoyage des doublons
```sql
SELECT * FROM cleanup_duplicate_activities();
```

### Vérification de l'intégrité
```sql
-- Vérifier les tables
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%activities%';

-- Vérifier les fonctions
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%activity%';
```

## 🐛 Dépannage

### Problèmes courants

1. **Erreur "Enregistrement non trouvé"**
   - Vérifier que l'ID de l'enregistrement existe
   - Vérifier que l'enregistrement appartient à l'utilisateur

2. **Activités non synchronisées**
   - Vérifier que la table `activities` existe
   - Exécuter `sync_all_activities_to_main()`

3. **Triggers automatiques ne fonctionnent pas**
   - Vérifier que le trigger `trigger_byw_automatic_activities` existe
   - Vérifier les permissions sur la fonction `create_byw_automatic_activities`

### Logs et monitoring
```sql
-- Vérifier les activités récentes
SELECT 
  'crm_bot_one' as source,
  COUNT(*) as count,
  MAX(created_at) as last_activity
FROM crm_bot_one_activities
WHERE created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'crm_byw' as source,
  COUNT(*) as count,
  MAX(created_at) as last_activity
FROM crm_byw_activities
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

## 📝 Notes importantes

- Les activités sont **automatiquement synchronisées** vers le CRM Principal
- Les **triggers automatiques** ne fonctionnent que pour BYW
- Chaque utilisateur ne voit que **ses propres activités**
- Les **index** sont optimisés pour les requêtes fréquentes
- Le système est **compatible** avec l'architecture existante

## 🎉 Résultat

Après déploiement, vous aurez :
- ✅ Système d'activités unifié sur les 3 CRM
- ✅ Synchronisation automatique en temps réel
- ✅ Activités automatiques pour BYW
- ✅ Interface sécurisée par utilisateur
- ✅ Performance optimisée avec index
