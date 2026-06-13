# 🔧 Dépannage - Colonnes CRM

## Problème : Colonne "position" manquante

### ❌ Erreur rencontrée
```
ERROR: 42703: column "position" of relation "crm_columns" does not exist
LINE 16: INSERT INTO crm_columns (id, title, color, header_color, position) VALUES
```

### 🔍 Diagnostic
Cette erreur indique que la table `crm_columns` existe mais qu'elle n'a pas la structure attendue.

### 🛠️ Solutions

#### Option 1 : Migration de correction simplifiée (Recommandée)
```sql
-- Exécuter la migration de correction simplifiée
-- supabase/migrations/20250131_fix_crm_columns_simple.sql
```

Cette migration évite tous les conflits et gère proprement le cas UUID.

Cette migration :
- Vérifie et ajoute les colonnes manquantes
- Met à jour les données existantes
- Crée les index et triggers nécessaires

#### Option 2 : Diagnostic manuel
```sql
-- Exécuter le script de diagnostic
-- scripts/diagnose-crm-columns.sql
```

#### Option 3 : Recréation complète (En dernier recours)
```sql
-- Supprimer la table existante
DROP TABLE IF EXISTS crm_columns CASCADE;

-- Recréer avec la structure complète
-- Puis exécuter la migration originale
```

### 📋 Étapes de résolution

1. **Exécuter le diagnostic**
   ```bash
   # Dans Supabase Dashboard > SQL Editor
   # Copier-coller : scripts/diagnose-crm-columns.sql
   ```

2. **Appliquer la correction**
   ```bash
   # Dans Supabase Dashboard > SQL Editor
   # Copier-coller : supabase/migrations/20250131_fix_crm_columns_simple.sql
   ```

3. **Vérifier la correction**
   ```bash
   # Dans Supabase Dashboard > SQL Editor
   # Copier-coller : scripts/test-crm-columns.sql
   ```

### 🔍 Vérifications post-correction

#### Structure de la table
```sql
-- Vérifier que toutes les colonnes sont présentes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'crm_columns'
ORDER BY ordinal_position;
```

#### Données
```sql
-- Vérifier les colonnes par défaut
SELECT * FROM crm_columns WHERE is_active = true ORDER BY position;
```

#### Index et triggers
```sql
-- Vérifier les index
SELECT indexname FROM pg_indexes WHERE tablename = 'crm_columns';

-- Vérifier les triggers
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'crm_columns';
```

### 🚨 Problèmes courants

#### 1. Table partiellement créée
- **Symptôme** : Certaines colonnes existent, d'autres non
- **Solution** : Utiliser la migration de correction

#### 2. Permissions insuffisantes
- **Symptôme** : Erreur de permission lors de l'ALTER TABLE
- **Solution** : Vérifier les droits de l'utilisateur connecté

#### 3. Conflit de contraintes
- **Symptôme** : Erreur lors de l'insertion des données par défaut
- **Solution** : Vérifier les contraintes existantes

### 📞 Support

Si le problème persiste après avoir essayé ces solutions :

1. **Collecter les informations** :
   - Résultat du script de diagnostic
   - Messages d'erreur complets
   - Version de Supabase

2. **Vérifier la console** :
   - Logs d'erreur dans Supabase Dashboard
   - Historique des migrations

3. **Tester en local** :
   - Créer une base de test
   - Reproduire le problème

### 🔄 Rollback

En cas de problème majeur :
```sql
-- Désactiver toutes les colonnes
UPDATE crm_columns SET is_active = false;

-- Ou supprimer complètement
DROP TABLE IF EXISTS crm_columns CASCADE;
```

### ✅ Vérification finale

Après correction, le système doit :
- ✅ Afficher 6 colonnes par défaut
- ✅ Permettre l'ajout de nouvelles colonnes
- ✅ Sauvegarder les modifications
- ✅ Persister les suppressions
- ✅ Mettre à jour les compteurs automatiquement
