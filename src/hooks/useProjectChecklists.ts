import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface ChecklistItem {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  completed: boolean;
  assigned_to?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export function useProjectChecklists(projectId: string) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Charger les checklists depuis Supabase
  const loadChecklists = async () => {
    try {
      setLoading(true);
      
      logger.debug('🔍 Chargement des checklists pour le projet:', projectId);
      
      const { data, error } = await supabase
        .from('project_checklists')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('❌ Erreur lors du chargement des checklists:', error);
        
        // Si la table n'existe pas, on continue avec une liste vide
        if (error.message.includes('relation "project_checklists" does not exist')) {
          logger.debug('⚠️ Table project_checklists n\'existe pas encore');
          setChecklistItems([]);
          setProgress(0);
          return;
        }
        
        toast.error('Erreur lors du chargement des tâches');
        return;
      }

      logger.debug('✅ Checklists chargées:', data);
      setChecklistItems(data || []);
      
      // Calculer le progrès
      const completedItems = data?.filter(item => item.completed).length || 0;
      const totalItems = data?.length || 0;
      setProgress(totalItems > 0 ? (completedItems / totalItems) * 100 : 0);
      
    } catch (error) {
      logger.error('❌ Erreur lors du chargement des checklists:', error);
      toast.error('Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  // Ajouter une nouvelle tâche
  const addChecklistItem = async (item: Omit<ChecklistItem, 'id' | 'project_id' | 'created_at' | 'updated_at'>) => {
    try {
      logger.debug('➕ Ajout de tâche:', item);
      
      const { data, error } = await supabase
        .from('project_checklists')
        .insert([{
          ...item,
          project_id: projectId
        }])
        .select()
        .single();

      if (error) {
        logger.error('❌ Erreur lors de l\'ajout de la tâche:', error);
        
        // Si la table n'existe pas, on affiche un message d'erreur spécifique
        if (error.message.includes('relation "project_checklists" does not exist')) {
          toast.error('Table des tâches non créée. Exécutez le script SQL d\'abord.');
          return null;
        }
        
        toast.error('Erreur lors de l\'ajout de la tâche');
        return null;
      }

      logger.debug('✅ Tâche ajoutée:', data);
      setChecklistItems(prev => [...prev, data]);
      toast.success('Tâche ajoutée avec succès');
      
      // Recalculer le progrès
      await loadChecklists();
      
      return data;
    } catch (error) {
      logger.error('❌ Erreur lors de l\'ajout de la tâche:', error);
      toast.error('Erreur lors de l\'ajout de la tâche');
      return null;
    }
  };

  // Modifier une tâche
  const updateChecklistItem = async (itemId: string, updates: Partial<ChecklistItem>) => {
    try {
      const { data, error } = await supabase
        .from('project_checklists')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        logger.error('Erreur lors de la modification de la tâche:', error);
        toast.error('Erreur lors de la modification de la tâche');
        return null;
      }

      setChecklistItems(prev => 
        prev.map(item => item.id === itemId ? data : item)
      );
      
      // Recalculer le progrès
      await loadChecklists();
      
      return data;
    } catch (error) {
      logger.error('Erreur lors de la modification de la tâche:', error);
      toast.error('Erreur lors de la modification de la tâche');
      return null;
    }
  };

  // Supprimer une tâche
  const deleteChecklistItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('project_checklists')
        .delete()
        .eq('id', itemId);

      if (error) {
        logger.error('Erreur lors de la suppression de la tâche:', error);
        toast.error('Erreur lors de la suppression de la tâche');
        return false;
      }

      setChecklistItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Tâche supprimée avec succès');
      
      // Recalculer le progrès
      await loadChecklists();
      
      return true;
    } catch (error) {
      logger.error('Erreur lors de la suppression de la tâche:', error);
      toast.error('Erreur lors de la suppression de la tâche');
      return false;
    }
  };

  // Basculer le statut d'une tâche
  const toggleChecklistItem = async (itemId: string) => {
    const item = checklistItems.find(item => item.id === itemId);
    if (!item) return;

    const updatedItem = await updateChecklistItem(itemId, {
      completed: !item.completed
    });

    if (updatedItem) {
      toast.success(updatedItem.completed ? 'Tâche marquée comme terminée' : 'Tâche marquée comme en cours');
    }
  };

  // Charger les données au montage et quand projectId change
  useEffect(() => {
    if (projectId) {
      loadChecklists();
    }
  }, [projectId]);

  return {
    checklistItems,
    loading,
    progress,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    toggleChecklistItem,
    loadChecklists
  };
} 