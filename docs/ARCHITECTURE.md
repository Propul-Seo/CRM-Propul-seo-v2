# Architecture du Projet Propulseo CRM

## Vue d'ensemble

Propulseo CRM est une application de gestion de relation client (CRM) conçue spécifiquement pour les agences SEO et marketing digital. L'architecture du projet suit les principes de conception modernes, avec une séparation claire des responsabilités et une organisation modulaire.

## Organisation des modules

Les modules métiers volumineux sont organisés dans des sous-dossiers dédiés dans `src/modules/`.
Chaque module suit la structure suivante :

```
src/modules/NomDuModule/
  index.tsx           # Entrée principale du module
  [SousComposant].tsx # Sous-composants spécifiques (optionnel)
  types.ts            # Types spécifiques au module (optionnel)
  README.md           # Documentation du module
```

**Exemple : module CRM**
```
src/modules/CRM/
  index.tsx
  CRMList.tsx
  CRMDetails.tsx
  types.ts
  README.md
```

## Conventions
- Utiliser `index.tsx` comme point d'entrée du module
- Documenter chaque module dans un `README.md` dédié
- Ajouter les sous-composants et types spécifiques dans le dossier du module
- Utiliser l'alias `@/modules/NomDuModule` pour importer un module

## Exemple d'import
```tsx
import { CRM } from '@/modules/CRM';
```

## Avantages
- Lisibilité et maintenabilité accrues
- Documentation locale à chaque module
- Facilité d’extension et de refactoring

## Structure des Dossiers

```
/src
├── assets/           # Images, fonts et ressources statiques
├── components/       # Composants React réutilisables
│   ├── admin/        # Composants d'administration
│   ├── auth/         # Composants d'authentification
│   ├── charts/       # Graphiques et visualisations
│   ├── common/       # Composants génériques
│   ├── dialogs/      # Fenêtres modales
│   ├── layout/       # Structure de page
│   ├── modules/      # Modules fonctionnels
│   └── ui/           # Composants UI de base (shadcn/ui)
├── hooks/            # Hooks React personnalisés
├── lib/              # Bibliothèques et utilitaires
├── services/         # Services d'API et logique métier
│   ├── api/          # Services d'API
│   └── supabase/     # Intégration Supabase
├── store/            # Gestion d'état global (Zustand)
│   └── slices/       # Slices du store
├── types/            # Types TypeScript
└── utils/            # Fonctions utilitaires
```

## Principes Architecturaux

### 1. Architecture Modulaire

L'application est divisée en modules fonctionnels indépendants, chacun responsable d'une partie spécifique de l'application (CRM, Tâches, Calendrier, etc.). Cette approche permet :
- Une meilleure séparation des préoccupations
- Une maintenance plus facile
- La possibilité de travailler sur des modules en parallèle
- Une réutilisation des composants entre modules

### 2. Gestion d'État

Nous utilisons Zustand comme solution de gestion d'état global, avec une approche par slices pour organiser l'état par domaine fonctionnel. Cela offre :
- Une API simple et intuitive
- Des performances optimales avec des re-rendus minimaux
- Une intégration facile avec TypeScript
- Une persistance automatique des données importantes

### 3. Intégration avec Supabase

L'application s'intègre avec Supabase pour :
- L'authentification des utilisateurs
- Le stockage des données en temps réel
- La gestion des fichiers
- Les fonctions serverless (Edge Functions)

La communication avec Supabase est encapsulée dans des services dédiés, ce qui permet de changer facilement de fournisseur si nécessaire.

### 4. Composants UI

L'interface utilisateur est construite avec :
- React et TypeScript pour la logique des composants
- Tailwind CSS pour le styling
- shadcn/ui pour les composants de base
- Framer Motion pour les animations
- Lucide React pour les icônes

Cette combinaison offre un bon équilibre entre flexibilité, performance et facilité de développement.

## Flux de Données

1. **Entrée utilisateur** → Les composants React capturent les interactions utilisateur
2. **Actions** → Les actions sont déclenchées, généralement via des fonctions du store Zustand
3. **Services** → Les services effectuent les opérations nécessaires (API, calculs, etc.)
4. **Store** → L'état global est mis à jour
5. **Rendu** → Les composants se mettent à jour en fonction du nouvel état

## Sécurité

- **Authentification** : Gérée par Supabase Auth
- **Autorisation** : Basée sur les rôles utilisateur et les politiques RLS (Row Level Security)
- **Validation des données** : Effectuée côté client avec Zod et côté serveur avec les contraintes PostgreSQL
- **Protection contre les attaques courantes** : XSS, CSRF, injections SQL

## Performance

- **Code splitting** : Chargement à la demande des modules
- **Memoization** : Utilisation de React.memo, useMemo et useCallback pour éviter les calculs inutiles
- **Optimisation des rendus** : Utilisation de clés stables et de techniques d'évitement des re-rendus
- **Lazy loading** : Chargement différé des images et des composants lourds

## Tests

- **Tests unitaires** : Avec Vitest pour les fonctions et les hooks
- **Tests de composants** : Avec React Testing Library
- **Tests d'intégration** : Pour vérifier l'interaction entre les modules
- **Tests end-to-end** : Pour valider les parcours utilisateur complets

## Déploiement

L'application est conçue pour être déployée sur diverses plateformes :
- Netlify pour le frontend
- Supabase pour le backend et la base de données
- Vercel comme alternative pour le déploiement frontend

## Extensibilité

L'architecture est conçue pour être facilement extensible :
- Nouveaux modules fonctionnels
- Nouvelles intégrations tierces
- Support multilingue
- Thèmes personnalisables

## Bonnes Pratiques

- **Code propre** : Formatage cohérent, nommage explicite
- **Documentation** : JSDoc pour les fonctions, README pour les modules
- **Gestion des erreurs** : Capture et traitement centralisés
- **Accessibilité** : Conformité WCAG 2.1 AA
- **Internationalisation** : Support multilingue via i18n