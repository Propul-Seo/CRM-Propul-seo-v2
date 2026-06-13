# 📋 STANDARDS DE DÉVELOPPEMENT - CRM PROFESSIONNEL

## 🎯 **OBJECTIFS**

Ce document définit les standards de code et les bonnes pratiques à suivre pour maintenir un code de qualité, lisible et maintenable.

## 📝 **CONVENTIONS DE NOMNAGE**

### **Composants React**
```typescript
// ✅ Bon - PascalCase
const ProjectEditDialog = () => { ... };
const UserProfile = () => { ... };
const RevenueChart = () => { ... };

// ❌ Mauvais
const projectEditDialog = () => { ... };
const user_profile = () => { ... };
```

### **Hooks Personnalisés**
```typescript
// ✅ Bon - camelCase avec préfixe 'use'
const useAuth = () => { ... };
const useSupabaseData = () => { ... };
const useProjectCRUD = () => { ... };

// ❌ Mauvais
const Auth = () => { ... };
const supabaseData = () => { ... };
```

### **Services**
```typescript
// ✅ Bon - camelCase avec suffixe 'Service'
const supabaseService = { ... };
const authService = { ... };
const projectService = { ... };

// ❌ Mauvais
const SupabaseService = { ... };
const auth_service = { ... };
```

### **Types et Interfaces**
```typescript
// ✅ Bon - PascalCase
interface Project {
  id: string;
  name: string;
}

type ProjectStatus = 'planning' | 'in_progress' | 'completed';

// ❌ Mauvais
interface project { ... }
type project_status = 'planning' | 'in_progress';
```

### **Constantes**
```typescript
// ✅ Bon - UPPER_SNAKE_CASE
const API_ENDPOINTS = { ... };
const STATUS_COLORS = { ... };
const DEFAULT_CONFIG = { ... };

// ❌ Mauvais
const apiEndpoints = { ... };
const statusColors = { ... };
```

## 🏗️ **STRUCTURE DES FICHIERS**

### **Organisation des Imports**
```typescript
// 1. Imports React
import React, { useState, useEffect } from 'react';

// 2. Imports tiers
import { toast } from 'sonner';
import { format } from 'date-fns';

// 3. Imports UI
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

// 4. Imports hooks
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';

// 5. Imports types
import { Project, Contact } from '@/types';

// 6. Imports utilitaires
import { formatCurrency, formatDate } from '@/utils';

// 7. Imports constants
import { STATUS_COLORS, PROJECT_STATUSES } from '@/utils/constants';
```

### **Structure d'un Composant**
```typescript
// 1. Imports
import React from 'react';

// 2. Types
interface ComponentProps {
  title: string;
  data: any[];
}

// 3. Composant principal
export const ComponentName: React.FC<ComponentProps> = ({ title, data }) => {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Handlers
  const handleClick = () => { ... };
  
  // 6. Effects
  useEffect(() => { ... }, []);
  
  // 7. Render
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
};
```

## 🔧 **BONNES PRATIQUES**

### **Gestion d'État**
```typescript
// ✅ Bon - Utiliser des hooks personnalisés
const useProjectState = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  
  const addProject = useCallback((project: Project) => {
    setProjects(prev => [...prev, project]);
  }, []);
  
  return { projects, loading, addProject };
};

// ❌ Mauvais - État global partout
const [projects, setProjects] = useState([]);
const [loading, setLoading] = useState(false);
```

### **Gestion d'Erreurs**
```typescript
// ✅ Bon - Try/catch avec messages explicites
const createProject = async (project: Project) => {
  try {
    setLoading(true);
    const result = await supabase
      .from('projects')
      .insert(project);
    
    if (result.error) {
      throw new Error(`Erreur lors de la création: ${result.error.message}`);
    }
    
    toast.success('Projet créé avec succès');
    return result.data;
  } catch (error) {
    console.error('Erreur création projet:', error);
    toast.error('Impossible de créer le projet');
    throw error;
  } finally {
    setLoading(false);
  }
};
```

### **Validation des Données**
```typescript
// ✅ Bon - Validation avec Zod ou fonctions dédiées
const validateProject = (project: Partial<Project>): project is Project => {
  return !!(
    project.name &&
    project.name.length > 0 &&
    project.name.length <= 100
  );
};

// ❌ Mauvais - Pas de validation
const createProject = (project: any) => { ... };
```

### **Performance**
```typescript
// ✅ Bon - Memoization et callbacks optimisés
const ProjectList = React.memo(({ projects }: { projects: Project[] }) => {
  const handleEdit = useCallback((id: string) => {
    // Logique d'édition
  }, []);
  
  return (
    <div>
      {projects.map(project => (
        <ProjectItem 
          key={project.id} 
          project={project} 
          onEdit={handleEdit}
        />
      ))}
    </div>
  );
});

// ❌ Mauvais - Re-renders inutiles
const ProjectList = ({ projects }) => {
  const handleEdit = (id) => { ... };
  
  return projects.map(project => (
    <ProjectItem project={project} onEdit={handleEdit} />
  ));
};
```

## 📚 **DOCUMENTATION**

### **JSDoc pour les Fonctions**
```typescript
/**
 * Crée un nouveau projet dans la base de données
 * @param project - Les données du projet à créer
 * @param userId - L'ID de l'utilisateur créateur
 * @returns Promise<Project> - Le projet créé
 * @throws Error - Si la création échoue
 */
const createProject = async (
  project: Omit<Project, 'id' | 'created_at' | 'updated_at'>,
  userId: string
): Promise<Project> => {
  // Implémentation
};
```

### **Commentaires Inline**
```typescript
// ✅ Bon - Commentaires explicatifs
const calculateRevenue = (transactions: Transaction[]): number => {
  // Filtre uniquement les revenus (pas les dépenses)
  const revenues = transactions.filter(t => t.type === 'revenue');
  
  // Calcule la somme totale
  return revenues.reduce((sum, t) => sum + t.amount, 0);
};

// ❌ Mauvais - Commentaires évidents
const sum = transactions.reduce((a, b) => a + b, 0); // Additionne tout
```

## 🧪 **TESTS**

### **Structure des Tests**
```typescript
// ✅ Bon - Tests organisés
describe('ProjectService', () => {
  describe('createProject', () => {
    it('should create a project successfully', async () => {
      // Arrange
      const projectData = { name: 'Test Project' };
      
      // Act
      const result = await createProject(projectData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('Test Project');
    });
    
    it('should throw error for invalid data', async () => {
      // Arrange
      const invalidData = { name: '' };
      
      // Act & Assert
      await expect(createProject(invalidData)).rejects.toThrow();
    });
  });
});
```

## 🔒 **SÉCURITÉ**

### **Validation des Entrées**
```typescript
// ✅ Bon - Validation stricte
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Évite XSS
    .substring(0, 100); // Limite la longueur
};

// ❌ Mauvais - Pas de validation
const handleSubmit = (data: any) => {
  // Utilise directement les données
};
```

### **Gestion des Tokens**
```typescript
// ✅ Bon - Tokens sécurisés
const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
};

// ❌ Mauvais - Tokens en dur
const API_TOKEN = 'sk-123456789';
```

## 📊 **MÉTRIQUES DE QUALITÉ**

### **Objectifs**
- **Couverture de tests**: > 80%
- **Complexité cyclomatique**: < 10
- **Longueur de fonction**: < 50 lignes
- **Longueur de fichier**: < 500 lignes
- **Duplication de code**: < 5%

### **Outils de Qualité**
- **ESLint**: Vérification du code
- **Prettier**: Formatage automatique
- **TypeScript**: Typage strict
- **Husky**: Hooks Git
- **Lint-staged**: Vérification avant commit

## 🚀 **WORKFLOW GIT**

### **Conventional Commits**
```bash
# ✅ Bon
git commit -m "feat: add project creation dialog"
git commit -m "fix: resolve user authentication issue"
git commit -m "docs: update API documentation"
git commit -m "refactor: simplify project validation logic"

# ❌ Mauvais
git commit -m "update"
git commit -m "fix stuff"
git commit -m "wip"
```

### **Branches**
```bash
# ✅ Bon
feature/user-authentication
bugfix/project-creation-error
hotfix/security-vulnerability
refactor/optimize-database-queries

# ❌ Mauvais
feature
bugfix
fix
```

## 📋 **CHECKLIST DE QUALITÉ**

### **Avant Commit**
- [ ] Code formaté avec Prettier
- [ ] Pas d'erreurs ESLint
- [ ] Tests passent
- [ ] Types TypeScript valides
- [ ] Documentation mise à jour
- [ ] Pas de console.log en production

### **Avant Pull Request**
- [ ] Code review effectuée
- [ ] Tests ajoutés si nécessaire
- [ ] Documentation mise à jour
- [ ] Performance vérifiée
- [ ] Sécurité validée

---

**Objectif: Code professionnel, maintenable et évolutif !** 🎯
