// Templates de tâches récurrentes pour chaque nouveau projet
// Ces tâches sont créées automatiquement lors de la création d'un projet

export interface TemplateTask {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  estimatedHours?: number;
  dependencies?: string[]; // IDs des tâches dont celle-ci dépend
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  tasks: TemplateTask[];
}

// Template principal pour tous les projets web
export const WEB_PROJECT_TEMPLATE: ProjectTemplate = {
  id: 'web-project-standard',
  name: 'Projet Web Standard',
  description: 'Template complet pour tous les projets web avec toutes les étapes obligatoires',
  tasks: [
    // 1. PRÉPARATION DU PROJET
    {
      id: 'prep-1',
      title: 'Préparation du projet',
      description: 'Définir le nom du projet et créer un dossier organisé sur le drive. Vérifier les documents client (objectifs, charte graphique, contenus) et les intégrer au drive.',
      category: 'Préparation',
      priority: 'high',
      estimatedHours: 2
    },
    {
      id: 'prep-2',
      title: 'Création des comptes',
      description: 'Créer le compte GitHub et le compte Sanity et intégrer les identifiants/mots de passe à l\'excel prévu à cet effet.',
      category: 'Préparation',
      priority: 'high',
      estimatedHours: 1
    },

    // 2. STRUCTURE & DESIGN
    {
      id: 'design-1',
      title: 'Structure des pages',
      description: 'Mettre en place la structure des pages (Home, À propos, Services, Blog, Contact, Mentions légales, Politiques de confidentialité, Gestionnaires de cookies etc…).',
      category: 'Structure & Design',
      priority: 'high',
      estimatedHours: 4,
      dependencies: ['prep-1']
    },
    {
      id: 'design-2',
      title: 'Navigation et charte graphique',
      description: 'Définir la navigation (menu / footer). Définir et/ou appliquer la charte graphique. Intégrer le logo + signature de l\'entreprise (footer).',
      category: 'Structure & Design',
      priority: 'high',
      estimatedHours: 3,
      dependencies: ['design-1']
    },
    {
      id: 'design-3',
      title: 'Favicon',
      description: 'Créer le favicon.',
      category: 'Structure & Design',
      priority: 'medium',
      estimatedHours: 1,
      dependencies: ['design-2']
    },

    // 3. CONTENUS
    {
      id: 'content-1',
      title: 'Intégration des contenus',
      description: 'Intégrer et/ou créer le contenu du site page par page. Vérifier les textes (orthographe, SEO de base : titres H1, H2, meta description).',
      category: 'Contenus',
      priority: 'high',
      estimatedHours: 8,
      dependencies: ['design-1']
    },
    {
      id: 'content-2',
      title: 'Images et médias',
      description: 'Intégrer les images optimisées (format WebP ou compressées). Ajouter les balises alt sur les images.',
      category: 'Contenus',
      priority: 'medium',
      estimatedHours: 4,
      dependencies: ['content-1']
    },
    {
      id: 'content-3',
      title: 'Call to Action',
      description: 'Vérifier la cohérence des CTA (Call to Action).',
      category: 'Contenus',
      priority: 'medium',
      estimatedHours: 2,
      dependencies: ['content-2']
    },

    // 4. FONCTIONNALITÉS TECHNIQUES
    {
      id: 'tech-1',
      title: 'Bandeau cookies et animations',
      description: 'Intégrer le bandeau cookies. Intégrer et/ou vérifier les animations (pas trop lourdes / fluides).',
      category: 'Fonctionnalités',
      priority: 'medium',
      estimatedHours: 3,
      dependencies: ['content-3']
    },
    {
      id: 'tech-2',
      title: 'Liens et redirections',
      description: 'Vérifier les liens internes et externes (aucun lien cassé). Configurer les redirections si besoin (404, anciennes URLs).',
      category: 'Fonctionnalités',
      priority: 'medium',
      estimatedHours: 2,
      dependencies: ['tech-1']
    },

    // 5. OPTIMISATIONS
    {
      id: 'optim-1',
      title: 'Performance et accessibilité',
      description: 'Optimiser les performances (lazy load, images, nettoyage du code). Vérifier l\'accessibilité/lisibilité (contraste, tailles de texte, labels).',
      category: 'Optimisations',
      priority: 'medium',
      estimatedHours: 4,
      dependencies: ['tech-2']
    },
    {
      id: 'optim-2',
      title: 'SEO technique',
      description: 'Configurer le SEO technique : balises title & meta description uniques, sitemap.xml, robots.txt etc. Ajouter Google Analytics ou autre tracking (si demandé).',
      category: 'Optimisations',
      priority: 'medium',
      estimatedHours: 3,
      dependencies: ['optim-1']
    },

    // 6. ADDONS
    {
      id: 'addons-1',
      title: 'Back-end et formulaires',
      description: 'Création du back-end Sanity. Mise en place du formulaire de contact Resend. Autre module/plateforme demandée ou conseillée.',
      category: 'Addons',
      priority: 'medium',
      estimatedHours: 6,
      dependencies: ['optim-2']
    },

    // 7. VÉRIFICATIONS AVANT MISE EN LIGNE
    {
      id: 'test-1',
      title: 'Tests multi-navigateurs',
      description: 'Vérifier sur plusieurs navigateurs (Chrome, Safari, Firefox) en local. Vérifier sur mobile/tablette/desktop.',
      category: 'Tests',
      priority: 'high',
      estimatedHours: 3,
      dependencies: ['addons-1']
    },
    {
      id: 'test-2',
      title: 'Tests fonctionnels',
      description: 'Tester tous les formulaires et boutons. Vérifier la cohérence des contenus. Vérifier mentions légales, politique de confidentialité, signature agence.',
      category: 'Tests',
      priority: 'high',
      estimatedHours: 2,
      dependencies: ['test-1']
    },

    // 8. MISE EN LIGNE
    {
      id: 'deploy-1',
      title: 'Configuration domaine et DNS',
      description: 'Configurer le domaine client (DNS sur Vercel). Intégrer les variables d\'environnements (Sanity, Resend, Supabase etc.).',
      category: 'Déploiement',
      priority: 'high',
      estimatedHours: 2,
      dependencies: ['test-2']
    },
    {
      id: 'deploy-2',
      title: 'Configuration email et SSL',
      description: 'Configurer les DNS Resend, vérifier le nom de domaine sur Resend et intégrer les DNS sur l\'hébergeur. Vérifier le certificat SSL (HTTPS actif).',
      category: 'Déploiement',
      priority: 'high',
      estimatedHours: 2,
      dependencies: ['deploy-1']
    },
    {
      id: 'deploy-3',
      title: 'Tests finaux',
      description: 'Faire une dernière passe sur les performances (Lighthouse test).',
      category: 'Déploiement',
      priority: 'medium',
      estimatedHours: 1,
      dependencies: ['deploy-2']
    },

    // 9. POST-LANCEMENT
    {
      id: 'post-1',
      title: 'Livraison client',
      description: 'Envoyer la version finale au client + accès back-office (Sanity Studio).',
      category: 'Post-lancement',
      priority: 'high',
      estimatedHours: 1,
      dependencies: ['deploy-3']
    },
    {
      id: 'post-2',
      title: 'Sauvegarde du projet',
      description: 'Créer une sauvegarde du projet (code + contenus).',
      category: 'Post-lancement',
      priority: 'medium',
      estimatedHours: 1,
      dependencies: ['post-1']
    }
  ]
};

// Fonction utilitaire pour créer des tâches à partir du template
export function createTasksFromTemplate(
  projectId: string, 
  projectName: string, 
  template: ProjectTemplate = WEB_PROJECT_TEMPLATE
) {
  const now = new Date();
  const baseDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Commencer demain
  
  return template.tasks.map((templateTask, index) => {
    // Calculer la date d'échéance en fonction des dépendances et de la priorité
    let dueDate = new Date(baseDate);
    dueDate.setDate(dueDate.getDate() + index * 2); // Espacer les tâches de 2 jours
    
    // Ajuster la priorité selon la catégorie
    let priority = templateTask.priority;
    if (templateTask.category === 'Préparation' || templateTask.category === 'Déploiement') {
      priority = 'high';
    }
    
    return {
      id: `${projectId}-${templateTask.id}`,
      title: templateTask.title,
      description: templateTask.description,
      status: 'pending' as const,
      priority,
      category: templateTask.category,
      project_id: projectId,
      assigned_to: 'none',
      due_date: dueDate.toISOString().split('T')[0],
      estimated_hours: templateTask.estimatedHours,
      dependencies: templateTask.dependencies?.map(dep => `${projectId}-${dep}`) || [],
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
  });
}

// Fonction pour obtenir les statistiques du template
export function getTemplateStats(template: ProjectTemplate = WEB_PROJECT_TEMPLATE) {
  const totalTasks = template.tasks.length;
  const totalHours = template.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
  const highPriorityTasks = template.tasks.filter(task => task.priority === 'high').length;
  const categories = [...new Set(template.tasks.map(task => task.category))];
  
  return {
    totalTasks,
    totalHours,
    highPriorityTasks,
    categories,
    estimatedDuration: Math.ceil(totalHours / 8) // En jours (8h/jour)
  };
}
