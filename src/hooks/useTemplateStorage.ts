import { useState, useEffect } from 'react';
import { type ProjectTemplate } from '../modules/TaskManager/projectTemplates';

const TEMPLATE_STORAGE_KEY = 'project_templates';
const DEFAULT_TEMPLATE_KEY = 'web-project-standard';

export function useTemplateStorage() {
  const [templates, setTemplates] = useState<Record<string, ProjectTemplate>>({});
  const [loading, setLoading] = useState(true);

  // Charger les templates depuis le localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (stored) {
        const parsedTemplates = JSON.parse(stored);
        setTemplates(parsedTemplates);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sauvegarder les templates dans le localStorage
  const saveTemplates = (newTemplates: Record<string, ProjectTemplate>) => {
    try {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(newTemplates));
      setTemplates(newTemplates);
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des templates:', error);
      return false;
    }
  };

  // Obtenir un template spécifique
  const getTemplate = (templateId: string): ProjectTemplate | null => {
    return templates[templateId] || null;
  };

  // Obtenir le template par défaut
  const getDefaultTemplate = (): ProjectTemplate | null => {
    return templates[DEFAULT_TEMPLATE_KEY] || null;
  };

  // Sauvegarder un template
  const saveTemplate = (template: ProjectTemplate): boolean => {
    const newTemplates = { ...templates, [template.id]: template };
    return saveTemplates(newTemplates);
  };

  // Supprimer un template
  const deleteTemplate = (templateId: string): boolean => {
    if (templateId === DEFAULT_TEMPLATE_KEY) {
      console.warn('Impossible de supprimer le template par défaut');
      return false;
    }
    
    const newTemplates = { ...templates };
    delete newTemplates[templateId];
    return saveTemplates(newTemplates);
  };

  // Lister tous les templates
  const listTemplates = (): ProjectTemplate[] => {
    return Object.values(templates);
  };

  // Réinitialiser le template par défaut
  const resetDefaultTemplate = (defaultTemplate: ProjectTemplate): boolean => {
    const newTemplates = { ...templates, [DEFAULT_TEMPLATE_KEY]: defaultTemplate };
    return saveTemplates(newTemplates);
  };

  return {
    templates,
    loading,
    getTemplate,
    getDefaultTemplate,
    saveTemplate,
    deleteTemplate,
    listTemplates,
    resetDefaultTemplate,
    saveTemplates
  };
}
