# 📁 ORGANISATION DU CODE - CRM PROFESSIONNEL

## 🏗️ **STRUCTURE GÉNÉRALE**

```
src/
├── components/           # Composants réutilisables
│   ├── ui/             # Composants UI de base (shadcn/ui)
│   ├── layout/         # Composants de mise en page
│   ├── dialogs/        # Modales et dialogues
│   ├── charts/         # Graphiques et visualisations
│   ├── common/         # Composants communs
│   └── debug/          # Composants de debug (à nettoyer)
├── modules/            # Modules métier
│   ├── Dashboard/      # Tableau de bord
│   ├── CRM/           # Gestion des contacts
│   ├── ProjectsManager/ # Gestion des projets
│   ├── Accounting/    # Comptabilité
│   └── ...
├── hooks/             # Hooks personnalisés
├── services/          # Services API
├── store/             # État global (Zustand)
├── types/             # Types TypeScript
├── utils/             # Utilitaires
└── lib/               # Configuration (Supabase)
```

## 🧹 **NETTOYAGE À EFFECTUER**

### **1. Composants Debug (À SUPPRIMER)**
- ❌ `src/components/debug/` - Tous les fichiers de test
- ❌ `src/examples/` - Exemples de développement
- ❌ `src/stories/` - Storybook (si non utilisé)
- ❌ `src/tests/` - Tests temporaires

### **2. Fichiers Temporaires**
- ❌ `src/main-backup.tsx`
- ❌ `src/App.css` (si non utilisé)
- ❌ `src/.DS_Store`

### **3. Scripts de Debug (À ORGANISER)**
- 📁 `docs/scripts/` - Scripts de diagnostic
- 📁 `docs/migrations/` - Migrations SQL

## 🎯 **STRUCTURE FINALE CIBLE**

```
src/
├── components/
│   ├── ui/            # ✅ Composants UI
│   ├── layout/        # ✅ Layout principal
│   ├── dialogs/       # ✅ Modales
│   ├── charts/        # ✅ Graphiques
│   └── common/        # ✅ Composants communs
├── modules/
│   ├── Dashboard/     # ✅ Tableau de bord
│   ├── CRM/          # ✅ Gestion CRM
│   ├── ProjectsManager/ # ✅ Gestion projets
│   ├── Accounting/   # ✅ Comptabilité
│   ├── Calendar/     # ✅ Calendrier
│   └── Settings/     # ✅ Paramètres
├── hooks/
│   ├── useAuth.ts    # ✅ Authentification
│   ├── useSupabaseData.ts # ✅ Données Supabase
│   └── useStore.ts   # ✅ État global
├── services/
│   ├── supabaseService.ts # ✅ Service Supabase
│   └── api/          # ✅ API REST
├── store/
│   ├── index.ts      # ✅ Store principal
│   └── slices/       # ✅ Slices Zustand
├── types/
│   ├── index.ts      # ✅ Types principaux
│   └── database.ts   # ✅ Types base de données
├── utils/
│   ├── index.ts      # ✅ Utilitaires
│   └── constants.ts  # ✅ Constantes
└── lib/
    └── supabase.ts   # ✅ Configuration Supabase
```

## 🔧 **ACTIONS DE NETTOYAGE**

### **Phase 1: Suppression des fichiers temporaires**
1. Supprimer tous les composants debug
2. Supprimer les exemples de développement
3. Nettoyer les imports inutilisés

### **Phase 2: Organisation des modules**
1. Standardiser la structure des modules
2. Harmoniser les imports
3. Optimiser les composants

### **Phase 3: Documentation**
1. Créer des README pour chaque module
2. Documenter les hooks personnalisés
3. Créer un guide de développement

## 📋 **STANDARDS DE CODE**

### **Naming Conventions**
- ✅ Composants: `PascalCase` (ex: `ProjectEditDialog`)
- ✅ Hooks: `camelCase` avec préfixe `use` (ex: `useAuth`)
- ✅ Services: `camelCase` avec suffixe `Service` (ex: `supabaseService`)
- ✅ Types: `PascalCase` avec suffixe `Type` ou `Interface`

### **Structure des Modules**
```
modules/ModuleName/
├── index.tsx          # Point d'entrée du module
├── components/        # Composants spécifiques au module
├── hooks/            # Hooks spécifiques au module
├── types.ts          # Types spécifiques au module
└── README.md         # Documentation du module
```

### **Imports Organisés**
```typescript
// 1. Imports React
import React from 'react';

// 2. Imports tiers
import { toast } from 'sonner';

// 3. Imports UI
import { Button } from '@/components/ui/button';

// 4. Imports hooks
import { useAuth } from '@/hooks/useAuth';

// 5. Imports types
import { Project } from '@/types';

// 6. Imports utilitaires
import { formatDate } from '@/utils';
```

## 🚀 **PROCHAINES ÉTAPES**

1. **Nettoyer les composants debug**
2. **Organiser les modules**
3. **Standardiser les imports**
4. **Créer la documentation**
5. **Optimiser les performances**

---

**Objectif: Code professionnel, maintenable et évolutif !** 🎯 