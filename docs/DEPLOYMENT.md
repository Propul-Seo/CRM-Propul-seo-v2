# Guide de Déploiement Propulseo CRM

Ce document détaille les étapes nécessaires pour déployer l'application Propulseo CRM dans différents environnements.

## Prérequis

- Node.js 18.x ou supérieur
- npm 9.x ou supérieur
- Compte Supabase
- Compte Netlify (pour le déploiement frontend)

## Configuration des Variables d'Environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```
# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-supabase

# Configuration de l'application
VITE_APP_NAME=Propulseo CRM
VITE_APP_VERSION=1.0.0
VITE_API_URL=https://votre-api.com

# Intégrations (optionnel)
VITE_GOOGLE_MAPS_API_KEY=votre-clé-google-maps
VITE_STRIPE_PUBLIC_KEY=votre-clé-publique-stripe
```

## Déploiement Local (Développement)

1. Installez les dépendances :
   ```bash
   npm install
   ```

2. Démarrez le serveur de développement :
   ```bash
   npm run dev
   ```

3. L'application sera disponible à l'adresse `http://localhost:5173`

## Build de Production

Pour créer une version optimisée pour la production :

```bash
npm run build
```

Les fichiers de build seront générés dans le dossier `dist/`.

## Déploiement sur Netlify

### Méthode 1 : Déploiement Automatique (CI/CD)

1. Connectez votre dépôt GitHub à Netlify
2. Configurez les paramètres de build :
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Ajoutez les variables d'environnement dans les paramètres du site Netlify
4. Activez les déploiements automatiques sur les push

### Méthode 2 : Déploiement Manuel

1. Installez Netlify CLI :
   ```bash
   npm install -g netlify-cli
   ```

2. Connectez-vous à votre compte Netlify :
   ```bash
   netlify login
   ```

3. Créez un fichier `netlify.toml` à la racine du projet :
   ```toml
   [build]
     publish = "dist"
     command = "npm run build"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

4. Déployez l'application :
   ```bash
   netlify deploy --prod
   ```

## Configuration de Supabase

### Base de Données

1. Créez un nouveau projet Supabase
2. Exécutez les migrations SQL depuis le dossier `supabase/migrations`
3. Configurez les politiques de sécurité Row Level Security (RLS)

### Authentification

1. Activez les fournisseurs d'authentification souhaités (email/mot de passe, Google, etc.)
2. Configurez les redirections après connexion/déconnexion
3. Personnalisez les templates d'emails

### Storage

1. Créez les buckets nécessaires pour le stockage des fichiers
2. Configurez les politiques d'accès aux buckets

### Edge Functions

1. Déployez les fonctions Edge depuis le dossier `supabase/functions`
2. Configurez les variables d'environnement pour les fonctions

## Intégrations Tierces

### Google Calendar

1. Créez un projet dans Google Cloud Console
2. Activez l'API Google Calendar
3. Configurez les identifiants OAuth
4. Ajoutez les URLs de redirection autorisées

### Stripe (Paiements)

1. Créez un compte Stripe
2. Configurez les webhooks pour les notifications de paiement
3. Ajoutez les clés API dans les variables d'environnement

## Optimisations de Performance

### Compression des Assets

Utilisez des outils comme `imagemin` pour optimiser les images :

```bash
npm install -g imagemin-cli
imagemin src/assets/* --out-dir=src/assets/optimized
```

### Analyse de Bundle

Utilisez l'outil d'analyse de bundle de Vite pour identifier les opportunités d'optimisation :

```bash
npm run build -- --report
```

## Surveillance et Logging

### Sentry

Pour configurer Sentry pour la surveillance des erreurs :

1. Créez un compte Sentry et un projet
2. Installez le SDK Sentry :
   ```bash
   npm install @sentry/react
   ```
3. Initialisez Sentry dans votre application :
   ```typescript
   import * as Sentry from '@sentry/react';
   
   Sentry.init({
     dsn: "votre-dsn-sentry",
     environment: process.env.NODE_ENV,
     release: "propulseo-crm@1.0.0",
   });
   ```

## Tests Avant Déploiement

Exécutez les tests avant chaque déploiement :

```bash
# Tests unitaires
npm run test

# Tests de build
npm run build

# Vérification des types TypeScript
npm run typecheck

# Linting
npm run lint
```

## Déploiement Multi-Environnement

### Staging

```bash
# Avec Netlify CLI
netlify deploy --alias staging

# Ou avec des variables d'environnement spécifiques
VITE_APP_ENV=staging npm run build
netlify deploy --prod --dir=dist
```

### Production

```bash
# Avec Netlify CLI
netlify deploy --prod

# Ou avec des variables d'environnement spécifiques
VITE_APP_ENV=production npm run build
netlify deploy --prod --dir=dist
```

## Rollback

En cas de problème après déploiement :

```bash
# Avec Netlify CLI
netlify sites:rollback
```

## Checklist de Déploiement

- [ ] Toutes les variables d'environnement sont configurées
- [ ] Les tests passent
- [ ] Le build se termine sans erreur
- [ ] Les migrations de base de données sont appliquées
- [ ] Les politiques RLS sont configurées
- [ ] Les intégrations tierces sont testées
- [ ] Les performances sont optimisées
- [ ] La surveillance est en place

## Maintenance

### Mises à Jour de Dépendances

Vérifiez régulièrement les mises à jour de dépendances :

```bash
npm outdated
npm update
```

Pour les mises à jour majeures :

```bash
npx npm-check-updates -u
npm install
```

### Sauvegarde de la Base de Données

Configurez des sauvegardes régulières de votre base de données Supabase via le dashboard Supabase.

## Support

En cas de problème lors du déploiement, contactez l'équipe technique à support@propulseo.com.