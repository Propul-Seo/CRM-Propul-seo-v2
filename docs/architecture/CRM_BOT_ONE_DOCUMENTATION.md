# 📊 CRM Bot One - Documentation Complète

## 🎯 Vue d'ensemble

La page **CRM Bot One** est un système de gestion de données avancé avec colonnes personnalisables, intégré dans l'ERP Propul'SEO. Elle permet aux utilisateurs de créer, gérer et analyser des données structurées avec une flexibilité maximale.

## ✨ Fonctionnalités Principales

### 🔧 Gestion des Colonnes Dynamiques
- **Création de colonnes personnalisées** : Texte, nombre, date, email, URL, booléen, sélection
- **Réorganisation par glisser-déposer** : Interface intuitive pour réorganiser les colonnes
- **Validation des données** : Champs obligatoires et règles de validation personnalisées
- **Valeurs par défaut** : Définition de valeurs par défaut pour chaque colonne

### 📊 Gestion des Enregistrements
- **CRUD complet** : Création, lecture, mise à jour, suppression
- **Recherche avancée** : Recherche textuelle dans tous les champs
- **Filtrage** : Par statut, tags, dates
- **Export des données** : Fonctionnalité d'export (CSV, Excel)

### 🔄 Synchronisation Temps Réel
- **Mise à jour automatique** : Changements synchronisés en temps réel via Supabase Realtime
- **Notifications** : Alertes pour les modifications importantes
- **Collaboration** : Plusieurs utilisateurs peuvent travailler simultanément

## 🏗️ Architecture Technique

### Base de Données Supabase

#### Table `crm_bot_one_records`
```sql
- id (UUID, PK)
- user_id (UUID, FK vers auth.users)
- data (JSONB) - Données dynamiques
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- status (VARCHAR) - Statut de l'enregistrement
- tags (TEXT[]) - Tags associés
```

#### Table `crm_bot_one_columns`
```sql
- id (UUID, PK)
- user_id (UUID, FK vers auth.users)
- column_name (VARCHAR) - Nom de la colonne
- column_type (VARCHAR) - Type de données
- column_order (INTEGER) - Ordre d'affichage
- is_required (BOOLEAN) - Champ obligatoire
- default_value (TEXT) - Valeur par défaut
- options (JSONB) - Options pour les colonnes select
- validation_rules (JSONB) - Règles de validation
- is_default (BOOLEAN) - Colonne par défaut
```

### Sécurité (RLS)
- **Isolation des données** : Chaque utilisateur ne voit que ses propres données
- **Politiques granulaires** : SELECT, INSERT, UPDATE, DELETE séparés
- **Authentification requise** : Accès uniquement pour les utilisateurs connectés

## 🚀 Utilisation

### Accès à la Page
1. Se connecter à l'ERP Propul'SEO
2. Cliquer sur **"CRM - Bot One"** dans la sidebar
3. La page se charge avec les colonnes par défaut

### Création d'une Colonne
1. Aller dans l'onglet **"Gestion des colonnes"**
2. Cliquer sur **"+ Ajouter une colonne"**
3. Remplir le formulaire :
   - Nom de la colonne
   - Type de données
   - Champ obligatoire (oui/non)
   - Valeur par défaut
   - Options (pour les colonnes select)
4. Cliquer sur **"Créer"**

### Création d'un Enregistrement
1. Aller dans l'onglet **"Enregistrements"**
2. Cliquer sur **"+ Nouvel enregistrement"**
3. Remplir les champs selon les colonnes définies
4. Ajouter des tags si nécessaire
5. Cliquer sur **"Sauvegarder"**

### Recherche et Filtrage
1. Utiliser la barre de recherche pour rechercher du texte
2. Cliquer sur **"Filtres"** pour accéder aux filtres avancés
3. Filtrer par statut, tags, ou dates
4. Les résultats se mettent à jour automatiquement

## 📁 Structure des Fichiers

```
src/
├── modules/CRMBotOne/
│   └── index.tsx                    # Page principale
├── components/crm/bot-one/
│   ├── CRMBotOneTable.tsx          # Tableau des enregistrements
│   ├── ColumnManager.tsx           # Gestion des colonnes
│   └── RecordModal.tsx             # Modal de création/édition
├── hooks/
│   └── useCRMBotOne.ts             # Hook de gestion des données
├── types/
│   └── crmBotOne.ts                # Types TypeScript
└── components/ui/
    ├── tabs.tsx                    # Composant onglets
    ├── switch.tsx                  # Composant switch
    └── textarea.tsx                # Composant textarea
```

## 🔧 Configuration

### Variables d'Environnement
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Permissions Utilisateur
- **can_view_leads** : Permission requise pour accéder à la page
- Les utilisateurs admin ont accès complet
- Les autres utilisateurs voient uniquement leurs données

## 🧪 Tests

### Script de Test SQL
Un script de test complet est disponible dans `test_crm_bot_one.sql` :
- Vérification de la structure des tables
- Test des politiques RLS
- Test des opérations CRUD
- Vérification des index et triggers

### Tests Fonctionnels
1. **Création de colonnes** : Vérifier que les colonnes se créent correctement
2. **Création d'enregistrements** : Tester l'insertion de données
3. **Synchronisation temps réel** : Ouvrir la page dans deux onglets et vérifier la synchronisation
4. **Permissions** : Tester l'accès avec différents utilisateurs

## 🐛 Dépannage

### Problèmes Courants

#### La page ne se charge pas
- Vérifier la connexion Supabase
- Vérifier les permissions utilisateur
- Consulter la console pour les erreurs

#### Les colonnes ne s'affichent pas
- Vérifier que l'utilisateur est connecté
- Vérifier les politiques RLS
- Recharger la page

#### La synchronisation temps réel ne fonctionne pas
- Vérifier la configuration Realtime dans Supabase
- Vérifier la connexion WebSocket
- Consulter les logs Supabase

### Logs de Débogage
Les logs sont disponibles dans la console du navigateur :
- `🔄 Changement détecté` : Synchronisation temps réel
- `❌ Erreur` : Erreurs de chargement
- `✅ Succès` : Opérations réussies

## 📈 Métriques et Statistiques

La page affiche plusieurs métriques :
- **Total des enregistrements** : Nombre total d'enregistrements
- **Activité récente** : Enregistrements créés cette semaine
- **Tags uniques** : Nombre de tags différents utilisés
- **Statuts** : Nombre de statuts différents

## 🔮 Évolutions Futures

### Fonctionnalités Prévues
- **Import/Export CSV** : Import et export de données en masse
- **Templates de colonnes** : Modèles prédéfinis pour différents types de données
- **Workflows** : Automatisation des processus métier
- **API REST** : Endpoints pour l'intégration externe
- **Rapports avancés** : Graphiques et analyses poussées

### Améliorations Techniques
- **Cache intelligent** : Mise en cache des données fréquemment utilisées
- **Pagination avancée** : Gestion optimisée des grandes quantités de données
- **Recherche full-text** : Recherche plus performante avec PostgreSQL
- **Audit trail** : Historique complet des modifications

## 📞 Support

Pour toute question ou problème :
1. Consulter cette documentation
2. Vérifier les logs de la console
3. Tester avec le script SQL fourni
4. Contacter l'équipe de développement

---

**Version** : 1.0.0  
**Dernière mise à jour** : 31 janvier 2025  
**Auteur** : Équipe Propul'SEO
