# Migration : Ajout du champ Website aux contacts

## 📋 Description

Cette migration ajoute un champ `website` (optionnel) à la table `contacts` pour permettre de saisir l'URL du site internet des leads/clients.

## 🗄️ Changements de base de données

### Nouvelle colonne
- **Nom** : `website`
- **Type** : `TEXT`
- **Nullable** : `true` (optionnel)
- **Commentaire** : "Site internet du contact (optionnel)"

### Structure mise à jour
```sql
ALTER TABLE contacts ADD COLUMN website TEXT;
COMMENT ON COLUMN contacts.website IS 'Site internet du contact (optionnel)';
```

## 🚀 Application de la migration

### Option 1 : Interface SQL Supabase (Recommandée)
1. Aller dans l'interface Supabase de votre projet
2. Naviguer vers **SQL Editor**
3. Exécuter le script `scripts/add-website-column.sql`

### Option 2 : Script Node.js
```bash
# Installer les dépendances si nécessaire
npm install @supabase/supabase-js dotenv

# Exécuter le script
node scripts/add-website-to-contacts.js
```

### Option 3 : Migration manuelle
```sql
-- Vérifier si la colonne existe
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'contacts' AND column_name = 'website';

-- Ajouter la colonne si elle n'existe pas
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS website TEXT;

-- Ajouter le commentaire
COMMENT ON COLUMN contacts.website IS 'Site internet du contact (optionnel)';
```

## 🎯 Fonctionnalités ajoutées

### Interface utilisateur
- ✅ Champ "Site Web" dans le formulaire de création de contact
- ✅ Champ "Site Web" dans le formulaire d'édition de contact
- ✅ Affichage du site web dans la fiche détaillée du contact
- ✅ Lien cliquable vers le site web (s'ouvre dans un nouvel onglet)

### Logique métier
- ✅ Validation du format URL (optionnel)
- ✅ Stockage en base de données
- ✅ Mise à jour des types TypeScript
- ✅ Gestion CRUD complète

## 🔧 Vérification

Après la migration, vérifiez que :

1. **La colonne existe** :
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'contacts' AND column_name = 'website';
```

2. **L'interface fonctionne** :
   - Créer un nouveau contact avec un site web
   - Éditer un contact existant pour ajouter/modifier le site web
   - Voir le site web affiché dans la fiche détaillée

## 📝 Notes importantes

- Le champ est **optionnel** - les contacts existants ne sont pas affectés
- Les URLs sont stockées telles quelles (pas de validation stricte)
- Le champ est inclus dans toutes les opérations CRUD
- Compatible avec la recherche et le filtrage existants

## 🚨 Dépannage

### Erreur "column already exists"
- La migration a déjà été appliquée
- Aucune action requise

### Erreur de permissions
- Vérifier que l'utilisateur a les droits ALTER sur la table contacts
- Contacter l'administrateur de la base de données

### Problèmes d'interface
- Vérifier que le code a été déployé
- Vider le cache du navigateur
- Vérifier la console pour les erreurs JavaScript
