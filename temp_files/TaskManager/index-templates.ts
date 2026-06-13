// Export des composants du système de templates de tâches

// Composants principaux
export { TaskTemplateSystem } from './TaskTemplateSystem';
export { ProjectTemplateManager } from './ProjectTemplateManager';
export { ProjectTemplateModal } from './ProjectTemplateModal';
export { ProjectTemplateIntegration } from '../ProjectsManager/ProjectTemplateIntegration';
export { TemplateDemo } from './TemplateDemo';

// Types et utilitaires
export { 
  WEB_PROJECT_TEMPLATE,
  createTasksFromTemplate,
  getTemplateStats,
  type ProjectTemplate,
  type TemplateTask
} from './projectTemplates';

// Réexport des composants UI nécessaires
export { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
export { Button } from '../../components/ui/button';
export { Badge } from '../../components/ui/badge';
export { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
export { Checkbox } from '../../components/ui/checkbox';
