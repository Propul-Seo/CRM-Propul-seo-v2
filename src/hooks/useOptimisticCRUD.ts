import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useRealtimeStore } from '../store/realtimeStore';
import { useRealtimeSync } from './useRealtimeSync';
import { toast } from 'sonner';

// Type pour les résultats de succès
interface SuccessData extends Record<string, unknown> {
  id?: string;
  deleted?: boolean;
}

// Type pour les erreurs
interface CRUDError {
  message: string;
  code?: string;
  details?: unknown;
}

interface OptimisticCRUDOptions {
  table: string;
  onSuccess?: (data: SuccessData) => void;
  onError?: (error: CRUDError) => void;
  enableOptimistic?: boolean;
}

export function useOptimisticCRUD(options: OptimisticCRUDOptions) {
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();
  const { applyOptimisticUpdate, rollbackOptimisticUpdate } = useRealtimeSync();

  const create = useCallback(async (data: Record<string, unknown>) => {
    if (!currentUser) {
      toast.error('Utilisateur non connecté');
      return { success: false, error: 'No user' };
    }

    setLoading(true);
    let optimisticId: string | null = null;

    try {
      // Préparer les données avec user_id
      const finalData = {
        ...data,
        user_id: currentUser.id,
        id: `temp_${Date.now()}` // ID temporaire pour l'optimistic update
      };

      // Optimistic Update - Appliquer immédiatement
      if (options.enableOptimistic !== false) {
        optimisticId = applyOptimisticUpdate(options.table, 'insert', finalData);
        
        // Mettre à jour le store immédiatement
        options.onSuccess?.(finalData);
      }

      // Supprimer l'ID temporaire pour l'insertion réelle
      delete finalData.id;

      // Insertion réelle dans Supabase
      const { data: result, error } = await supabase
        .from(options.table)
        .insert([finalData])
        .select()
        .single();

      if (error) throw error;

      // Succès - l'optimistic update sera automatiquement nettoyé par le realtime
      console.log(`✅ [${options.table}] Created successfully:`, result);
      
      if (!options.enableOptimistic) {
        options.onSuccess?.(result);
      }

      return { success: true, data: result };

    } catch (err) {
      const error = err as CRUDError;
      console.error(`❌ [${options.table}] Create error:`, error);

      // Rollback de l'optimistic update
      if (optimisticId) {
        rollbackOptimisticUpdate(optimisticId);
      }

      options.onError?.(error);
      toast.error(`Erreur lors de la création: ${error.message}`);

      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser, options, applyOptimisticUpdate, rollbackOptimisticUpdate]);

  const update = useCallback(async (id: string, updates: Record<string, unknown>) => {
    setLoading(true);
    let optimisticId: string | null = null;

    try {
      // Récupérer les données actuelles pour le rollback
      const { data: currentData } = await supabase
        .from(options.table)
        .select('*')
        .eq('id', id)
        .single();

      // Optimistic Update
      if (options.enableOptimistic !== false && currentData) {
        const optimisticData = { ...currentData, ...updates };
        optimisticId = applyOptimisticUpdate(options.table, 'update', optimisticData, currentData);
        
        // Mettre à jour le store immédiatement
        options.onSuccess?.(optimisticData);
      }

      // Mise à jour réelle
      const { data: result, error } = await supabase
        .from(options.table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ [${options.table}] Updated successfully:`, result);
      
      if (!options.enableOptimistic) {
        options.onSuccess?.(result);
      }

      return { success: true, data: result };

    } catch (err) {
      const error = err as CRUDError;
      console.error(`❌ [${options.table}] Update error:`, error);

      // Rollback de l'optimistic update
      if (optimisticId) {
        rollbackOptimisticUpdate(optimisticId);
      }

      options.onError?.(error);
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);

      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [options, applyOptimisticUpdate, rollbackOptimisticUpdate]);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    let optimisticId: string | null = null;

    try {
      // Récupérer les données pour le rollback
      const { data: currentData } = await supabase
        .from(options.table)
        .select('*')
        .eq('id', id)
        .single();

      // Optimistic Update
      if (options.enableOptimistic !== false && currentData) {
        optimisticId = applyOptimisticUpdate(options.table, 'delete', currentData);
        
        // Supprimer du store immédiatement
        options.onSuccess?.({ deleted: true, id });
      }

      // Suppression réelle
      const { error } = await supabase
        .from(options.table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log(`✅ [${options.table}] Deleted successfully:`, id);
      
      if (!options.enableOptimistic) {
        options.onSuccess?.({ deleted: true, id });
      }

      return { success: true };

    } catch (err) {
      const error = err as CRUDError;
      console.error(`❌ [${options.table}] Delete error:`, error);

      // Rollback de l'optimistic update
      if (optimisticId) {
        rollbackOptimisticUpdate(optimisticId);
      }

      options.onError?.(error);
      toast.error(`Erreur lors de la suppression: ${error.message}`);

      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [options, applyOptimisticUpdate, rollbackOptimisticUpdate]);

  return {
    create,
    update,
    remove,
    loading
  };
}

// Hooks spécialisés pour chaque module avec optimistic updates

export function useOptimisticContacts() {
  const store = useRealtimeStore();
  
  return useOptimisticCRUD({
    table: 'contacts',
    onSuccess: (data) => {
      if (data.deleted) {
        store.removeContact?.(data.id);
      } else {
        store.updateContact?.(data.id, data);
      }
    },
    enableOptimistic: true
  });
}

export function useOptimisticTasks() {
  const store = useRealtimeStore();
  
  return useOptimisticCRUD({
    table: 'tasks',
    onSuccess: (data) => {
      if (data.deleted) {
        store.removeTask?.(data.id);
      } else {
        store.updateTask?.(data.id, data);
      }
    },
    enableOptimistic: true
  });
}

export function useOptimisticProjects() {
  const store = useRealtimeStore();
  
  return useOptimisticCRUD({
    table: 'projects',
    onSuccess: (data) => {
      if (data.deleted) {
        store.removeProject?.(data.id);
      } else {
        store.updateProject?.(data.id, data);
      }
    },
    enableOptimistic: true
  });
}

export function useOptimisticAccounting() {
  const store = useRealtimeStore();
  
  return useOptimisticCRUD({
    table: 'accounting_entries',
    onSuccess: (data) => {
      if (data.deleted) {
        store.removeAccountingEntry?.(data.id);
      } else {
        store.updateAccountingEntry?.(data.id, data);
      }
      
      // Recalculer les métriques automatiquement - fonction supprimée car inexistante
      // store.recalculateMetrics?.();
    },
    enableOptimistic: true
  });
}

export function useOptimisticCalendarEvents() {
  const store = useRealtimeStore();
  
  return useOptimisticCRUD({
    table: 'calendar_events',
    onSuccess: (data) => {
      if (data.deleted) {
        store.removeCalendarEvent?.(data.id);
      } else {
        store.updateCalendarEvent?.(data.id, data);
      }
    },
    enableOptimistic: true
  });
}

export function useOptimisticMessages() {
  const store = useRealtimeStore();
  
  return useOptimisticCRUD({
    table: 'messages',
    onSuccess: (data) => {
      if (data.deleted) {
        store.removeMessage?.(data.id);
      } else {
        store.addMessage?.(data);
      }
    },
    enableOptimistic: true // Messages doivent apparaître instantanément
  });
} 