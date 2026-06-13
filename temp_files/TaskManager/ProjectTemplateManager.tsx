import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Play,
  Settings,
  Eye,
  Plus,
  Calendar,
  Users,
  Target
} from 'lucide-react';
import { 
  WEB_PROJECT_TEMPLATE, 
  getTemplateStats, 
  type ProjectTemplate,
  type TemplateTask 
} from './projectTemplates';

interface ProjectTemplateManagerProps {
  onApplyTemplate?: (template: ProjectTemplate) => void;
  showApplyButton?: boolean;
}

export function ProjectTemplateManager({ 
  onApplyTemplate, 
  showApplyButton = true 
}: ProjectTemplateManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Préparation']));
  
  const stats = getTemplateStats(WEB_PROJECT_TEMPLATE);
  const categories = [...new Set(WEB_PROJECT_TEMPLATE.tasks.map(task => task.category))];
  
  const filteredTasks = selectedCategory === 'all' 
    ? WEB_PROJECT_TEMPLATE.tasks
    : WEB_PROJECT_TEMPLATE.tasks.filter(task => task.category === selectedCategory);
  
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };
  
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Préparation': 'bg-blue-100 text-blue-800 border-blue-200',
      'Structure & Design': 'bg-purple-100 text-purple-800 border-purple-200',
      'Contenus': 'bg-green-100 text-green-800 border-green-200',
      'Fonctionnalités': 'bg-orange-100 text-orange-800 border-orange-200',
      'Optimisations': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Addons': 'bg-pink-100 text-pink-800 border-pink-200',
      'Tests': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Déploiement': 'bg-red-100 text-red-800 border-red-200',
      'Post-lancement': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Template Projet Web Standard</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Ce template crée automatiquement {stats.totalTasks} tâches organisées en {stats.categories.length} catégories
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalTasks}</div>
              <div className="text-sm text-blue-600">Tâches totales</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.totalHours}h</div>
              <div className="text-sm text-green-600">Heures estimées</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.highPriorityTasks}</div>
              <div className="text-sm text-orange-600">Priorité haute</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.estimatedDuration}j</div>
              <div className="text-sm text-purple-600">Durée estimée</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres par catégorie */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          Toutes ({stats.totalTasks})
        </Button>
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category} ({WEB_PROJECT_TEMPLATE.tasks.filter(t => t.category === category).length})
          </Button>
        ))}
      </div>

      {/* Bouton d'application du template */}
      {showApplyButton && onApplyTemplate && (
        <div className="flex justify-center">
          <Button 
            onClick={() => onApplyTemplate(WEB_PROJECT_TEMPLATE)}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
          >
            <Play className="h-5 w-5 mr-2" />
            Appliquer ce template au projet
          </Button>
        </div>
      )}

      {/* Liste des tâches par catégorie */}
      <div className="space-y-4">
        {categories.map(category => {
          const categoryTasks = WEB_PROJECT_TEMPLATE.tasks.filter(task => task.category === category);
          const isExpanded = expandedCategories.has(category);
          
          return (
            <Card key={category} className="border-2">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={getCategoryColor(category)}>
                      {category}
                    </Badge>
                    <span className="font-semibold text-lg">{categoryTasks.length} tâches</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {categoryTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)}h estimées
                    </span>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? '−' : '+'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {categoryTasks.map((task, index) => (
                      <div 
                        key={task.id}
                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getPriorityIcon(task.priority)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            <Badge className={getPriorityColor(task.priority)} variant="outline">
                              {task.priority}
                            </Badge>
                            {task.estimatedHours && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                <Clock className="h-3 w-3 mr-1" />
                                {task.estimatedHours}h
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          
                          {task.dependencies && task.dependencies.length > 0 && (
                            <div className="text-xs text-gray-500">
                              <span className="font-medium">Dépend de :</span> {task.dependencies.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
