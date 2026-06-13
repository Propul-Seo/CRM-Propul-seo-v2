# Gestion des Colonnes CRM

## Vue d'ensemble

Le système de gestion des colonnes CRM a été amélioré pour offrir une persistance complète. Maintenant, quand vous supprimez une colonne, elle reste supprimée même après rechargement de la page.

## Fonctionnalités

### ✅ Colonnes persistantes
- Les colonnes sont stockées en base de données Supabase
- Les modifications sont sauvegardées automatiquement
- Les suppressions sont définitives (soft delete)

### ✅ Gestion des colonnes
- **Ajouter** : Créer une nouvelle colonne avec titre et identifiant
- **Modifier** : Changer le titre d'une colonne existante
- **Supprimer** : Désactiver une colonne (soft delete)
- **Réactiver** : Remettre en service une colonne supprimée

### ✅ Sécurité
- Vérification qu'aucun contact n'utilise la colonne avant suppression
- Protection contre la suppression de colonnes essentielles

## Utilisation

### 1. Accéder au gestionnaire de colonnes
- Ouvrir le module CRM
- Cliquer sur l'icône ⚙️ (Paramètres)
- Sélectionner "Gérer les colonnes du CRM"

### 2. Modifier une colonne
- Cliquer dans le champ de titre
- Modifier le texte
- La modification est sauvegardée automatiquement

### 3. Supprimer une colonne
- Cliquer sur l'icône 🗑️ (Poubelle)
- La colonne est désactivée si aucun contact ne l'utilise
- Message d'erreur si des contacts utilisent encore la colonne

### 4. Ajouter une colonne
- Remplir le champ "Nom de la colonne"
- Sélectionner l'identifiant dans la liste déroulante
- Cliquer sur "Ajouter"

## Structure de la base de données

### Table `crm_columns`
```sql
CREATE TABLE crm_columns (
  id TEXT PRIMARY KEY,           -- Identifiant unique de la colonne
  title TEXT NOT NULL,           -- Titre affiché
  color TEXT NOT NULL,           -- Couleur de fond (CSS classes)
  header_color TEXT NOT NULL,    -- Couleur de l'en-tête (CSS classes)
  is_active BOOLEAN DEFAULT true, -- État actif/inactif
  position INTEGER NOT NULL,     -- Ordre d'affichage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Colonnes par défaut
1. **prospect** - Prospects
2. **presentation_envoyee** - Présentation Envoyée
3. **meeting_booke** - Meeting Booké
4. **offre_envoyee** - Offre Envoyée
5. **en_attente** - En Attente
6. **signe** - Signés

## Migration

### Appliquer la migration
```bash
# Dans Supabase Dashboard
# Migrations > Apply migration: 20250131_create_crm_columns.sql
```

### Vérifier l'installation
```bash
# Exécuter le script de test
# scripts/test-crm-columns.sql
```

## Dépannage

### Colonne ne s'affiche pas
- Vérifier que `is_active = true` en base
- Vérifier que la colonne existe dans la table `crm_columns`

### Erreur lors de la suppression
- Vérifier qu'aucun contact n'utilise le statut de la colonne
- Utiliser la requête : `SELECT COUNT(*) FROM contacts WHERE status = 'nom_colonne'`

### Colonne supprimée par erreur
- Mettre à jour en base : `UPDATE crm_columns SET is_active = true WHERE id = 'nom_colonne'`
- Ou utiliser la fonction de réactivation dans l'interface

## API

### Hook `useCRMColumns`
```typescript
const {
  columns,           // Liste des colonnes actives
  loading,           // État de chargement
  error,             // Erreur éventuelle
  addColumn,         // Ajouter une colonne
  updateColumn,      // Modifier une colonne
  deleteColumn,      // Supprimer une colonne
  reactivateColumn,  // Réactiver une colonne
  updateColumnCounts, // Mettre à jour les compteurs
  refetch            // Recharger les données
} = useCRMColumns();
```

## Maintenance

### Nettoyage des colonnes supprimées
```sql
-- Voir toutes les colonnes (actives et inactives)
SELECT * FROM crm_columns ORDER BY is_active DESC, position;

-- Supprimer définitivement une colonne inactive
DELETE FROM crm_columns WHERE id = 'nom_colonne' AND is_active = false;
```

### Réorganisation des positions
```sql
-- Réorganiser les positions après suppression
UPDATE crm_columns 
SET position = subquery.new_position 
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY position) as new_position 
  FROM crm_columns 
  WHERE is_active = true
) as subquery 
WHERE crm_columns.id = subquery.id;
```
