# 🚀 CRM PROFESSIONNEL

**Système de gestion de la relation client moderne et performant**

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-5.0-orange.svg)](https://vitejs.dev/)

## 📋 **FONCTIONNALITÉS**

### 🎯 **CRM & Gestion des Leads**
- ✅ **Création de contacts** avec formulaire complet
- ✅ **Pipeline des leads** avec statuts et valeurs
- ✅ **Recherche et filtres** avancés
- ✅ **Métriques** en temps réel

### 📊 **Gestion de Projets**
- ✅ **Création de projets** avec champs essentiels
- ✅ **Édition de projets** avec interface moderne
- ✅ **Statuts et progression** visuels
- ✅ **Suppression sécurisée**

### 💰 **Comptabilité**
- ✅ **Gestion des revenus** et dépenses
- ✅ **Graphiques** interactifs
- ✅ **Rapports** détaillés
- ✅ **Synchronisation** temps réel

### 📅 **Calendrier**
- ✅ **Événements** et rendez-vous
- ✅ **Synchronisation** Google Calendar
- ✅ **Interface** responsive
- ✅ **Notifications** automatiques

### 🔧 **Autres Modules**
- ✅ **Dashboard** avec KPIs
- ✅ **Gestion des tâches**
- ✅ **Paramètres** utilisateur
- ✅ **Authentification** sécurisée

## 🏗️ **ARCHITECTURE**

```
src/
├── components/           # Composants réutilisables
│   ├── ui/             # Composants UI (shadcn/ui)
│   ├── layout/         # Mise en page
│   ├── dialogs/        # Modales
│   ├── charts/         # Graphiques
│   └── common/         # Composants communs
├── modules/            # Modules métier
│   ├── Dashboard/      # Tableau de bord
│   ├── CRM/           # Gestion CRM
│   ├── ProjectsManager/ # Gestion projets
│   ├── Accounting/    # Comptabilité
│   └── Calendar/      # Calendrier
├── hooks/             # Hooks personnalisés
├── services/          # Services API
├── store/             # État global (Zustand)
├── types/             # Types TypeScript
├── utils/             # Utilitaires
└── lib/               # Configuration
```

## 🚀 **INSTALLATION**

### **Prérequis**
- Node.js 18+ 
- npm ou yarn
- Compte Supabase

### **Installation rapide**
```bash
# Cloner le projet
git clone <repository-url>
cd crm-professionnel

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local

# Démarrer le serveur de développement
npm run dev
```

### **Configuration Supabase**
1. Créer un projet Supabase
2. Copier les clés dans `.env.local`
3. Exécuter les migrations SQL
4. Configurer l'authentification

## 🔧 **DÉVELOPPEMENT**

### **Scripts disponibles**
```bash
# Développement
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Prévisualisation build

# Qualité de code
npm run lint         # Vérification ESLint
npm run type-check   # Vérification TypeScript

# Tests
npm run test         # Tests unitaires
npm run test:e2e     # Tests end-to-end
```

### **Standards de code**
- **TypeScript** strict
- **ESLint** + **Prettier**
- **Conventions** de nommage
- **Documentation** JSDoc

### **Structure des modules**
```
modules/ModuleName/
├── index.tsx          # Point d'entrée
├── components/        # Composants spécifiques
├── hooks/            # Hooks spécifiques
├── types.ts          # Types spécifiques
└── README.md         # Documentation
```

## 📚 **DOCUMENTATION**

### **Guides**
- [Guide d'installation](docs/GUIDE_INSTALLATION_COMPLETE.md)
- [Guide des composants](docs/GUIDE_COMPOSANTS_TEST.md)
- [Guide de déploiement](docs/DEPLOYMENT.md)

### **Architecture**
- [Architecture générale](docs/ARCHITECTURE.md)
- [Organisation du code](docs/CODE_ORGANIZATION.md)
- [Standards de développement](docs/CODING_STANDARDS.md)

### **Troubleshooting**
- [Guide de résolution](docs/TROUBLESHOOTING_CONNECTION.md)
- [Rapport d'audit](docs/AUDIT_REPORT.md)
- [Corrections appliquées](docs/CORRECTIONS_SUMMARY.md)

## 🛠️ **TECHNOLOGIES**

### **Frontend**
- **React 18** - Interface utilisateur
- **TypeScript** - Typage statique
- **Vite** - Build tool rapide
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Composants UI

### **Backend**
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Base de données
- **Row Level Security** - Sécurité
- **Real-time** - Synchronisation

### **État & Gestion**
- **Zustand** - État global
- **React Query** - Cache serveur
- **React Hook Form** - Formulaires

### **Graphiques & UI**
- **Recharts** - Graphiques
- **Lucide React** - Icônes
- **Sonner** - Notifications

## 🔒 **SÉCURITÉ**

- ✅ **Authentification** Supabase
- ✅ **Row Level Security** (RLS)
- ✅ **Validation** côté client/serveur
- ✅ **HTTPS** obligatoire
- ✅ **Sanitisation** des données

## 📊 **PERFORMANCES**

- ✅ **Lazy loading** des modules
- ✅ **Code splitting** automatique
- ✅ **Optimisation** des images
- ✅ **Cache** intelligent
- ✅ **Compression** gzip

## 🤝 **CONTRIBUTION**

### **Workflow Git**
1. Fork du projet
2. Créer une branche feature
3. Développer avec tests
4. Pull request avec description
5. Review et merge

### **Standards**
- **Conventional Commits**
- **Pull Request Template**
- **Code Review** obligatoire
- **Tests** requis

## 📄 **LICENCE**

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 **SUPPORT**

- 📧 **Email**: support@crm-professionnel.com
- 📖 **Documentation**: [docs/](docs/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/.../issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/.../discussions)

---

**Développé avec ❤️ par l'équipe CRM Professionnel**

*Version 1.0.0 - Dernière mise à jour: Janvier 2025*