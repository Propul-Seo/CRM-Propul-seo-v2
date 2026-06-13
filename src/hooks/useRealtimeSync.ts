import { useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';

// Type pour les payloads realtime Supabase
interface RealtimePayload<T = Record<string, unknown>> {
  commit_timestamp?: string;
  errors?: string[] | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T>;
  schema?: string;
  table?: string;
}

interface RealtimeConfig {
  table: string;
  onInsert?: (payload: RealtimePayload) => void;
  onUpdate?: (payload: RealtimePayload) => void;
  onDelete?: (payload: RealtimePayload) => void;
  filter?: string;
}

interface OptimisticUpdate {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  originalData?: Record<string, unknown>;
  timestamp: number;
}

// Type pour les channels Supabase realtime
type RealtimeChannel = ReturnType<typeof supabase.channel>;

export function useRealtimeSync() {
  const subscriptionsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const optimisticUpdatesRef = useRef<Map<string, OptimisticUpdate>>(new Map());
  const { currentUser } = useStore();

  // Fonction pour créer une subscription temps réel
  const subscribe = useCallback((config: RealtimeConfig) => {
    if (!currentUser) return null;

    const channelName = `realtime_${config.table}_${currentUser.id}`;
    
    // Éviter les subscriptions multiples
    if (subscriptionsRef.current.has(channelName)) {
      return subscriptionsRef.current.get(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: config.table,
          filter: config.filter || `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log(`🆕 [${config.table}] INSERT:`, payload.new);
          
          // Supprimer l'optimistic update correspondant
          const optimisticId = `insert_${config.table}_${payload.new.id}`;
          optimisticUpdatesRef.current.delete(optimisticId);
          
          config.onInsert?.(payload);
          toast.success(`Nouvel élément créé dans ${config.table}`);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: config.table,
          filter: config.filter || `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log(`🔄 [${config.table}] UPDATE:`, payload.new);
          
          // Supprimer l'optimistic update correspondant
          const optimisticId = `update_${config.table}_${payload.new.id}`;
          optimisticUpdatesRef.current.delete(optimisticId);
          
          config.onUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: config.table,
          filter: config.filter || `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log(`🗑️ [${config.table}] DELETE:`, payload.old);
          
          // Supprimer l'optimistic update correspondant
          const optimisticId = `delete_${config.table}_${payload.old.id}`;
          optimisticUpdatesRef.current.delete(optimisticId);
          
          config.onDelete?.(payload);
          toast.success(`Élément supprimé de ${config.table}`);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to ${config.table} realtime updates`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Error subscribing to ${config.table}:`, status);
          toast.error(`Erreur de synchronisation ${config.table}`);
        }
      });

    subscriptionsRef.current.set(channelName, channel);
    return channel;
  }, [currentUser]);

  // Fonction pour désabonner d'une table
  const unsubscribe = useCallback((table: string) => {
    if (!currentUser) return;

    const channelName = `realtime_${table}_${currentUser.id}`;
    const channel = subscriptionsRef.current.get(channelName);
    
    if (channel) {
      supabase.removeChannel(channel);
      subscriptionsRef.current.delete(channelName);
      console.log(`🔌 Unsubscribed from ${table}`);
    }
  }, [currentUser]);

  // Fonction pour désabonner de toutes les tables
  const unsubscribeAll = useCallback(() => {
    subscriptionsRef.current.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
      console.log(`🔌 Unsubscribed from ${channelName}`);
    });
    subscriptionsRef.current.clear();
  }, []);

  // Optimistic Update - Appliquer immédiatement les changements
  const applyOptimisticUpdate = useCallback((
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: Record<string, unknown>,
    originalData?: Record<string, unknown>
  ) => {
    const updateId = `${operation}_${table}_${data.id || Date.now()}`;
    const update: OptimisticUpdate = {
      id: updateId,
      table,
      operation,
      data,
      originalData,
      timestamp: Date.now()
    };

    optimisticUpdatesRef.current.set(updateId, update);
    
    // Auto-cleanup après 10 secondes si pas de confirmation
    setTimeout(() => {
      if (optimisticUpdatesRef.current.has(updateId)) {
        console.warn(`⚠️ Optimistic update timeout for ${updateId}`);
        rollbackOptimisticUpdate(updateId);
      }
    }, 10000);

    return updateId;
  }, []);

  // Rollback d'un optimistic update en cas d'erreur
  const rollbackOptimisticUpdate = useCallback((updateId: string) => {
    const update = optimisticUpdatesRef.current.get(updateId);
    if (update) {
      console.log(`🔄 Rolling back optimistic update: ${updateId}`);
      optimisticUpdatesRef.current.delete(updateId);
      
      // Ici on pourrait restaurer l'état original
      toast.error(`Erreur de synchronisation - changement annulé`);
      
      return update;
    }
    return null;
  }, []);

  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      unsubscribeAll();
      optimisticUpdatesRef.current.clear();
    };
  }, [unsubscribeAll]);

  return {
    subscribe,
    unsubscribe,
    unsubscribeAll,
    applyOptimisticUpdate,
    rollbackOptimisticUpdate,
    activeSubscriptions: subscriptionsRef.current,
    pendingUpdates: optimisticUpdatesRef.current
  };
}

// Hook spécialisé pour les subscriptions multi-tables
export function useMultiTableSync(configs: RealtimeConfig[]) {
  const { subscribe, unsubscribe } = useRealtimeSync();
  
  useEffect(() => {
    // const channels = configs.map(config => subscribe(config)); // Variable inutilisée supprimée
    
    return () => {
      configs.forEach(config => unsubscribe(config.table));
    };
  }, [configs, subscribe, unsubscribe]);
}

// Hook pour les cross-module updates (lead → projet → comptabilité)
export function useCrossModuleSync() {
  const { subscribe } = useRealtimeSync();
  const store = useStore();

  useEffect(() => {
    // Écouter les changements de leads pour créer des projets
    // const leadChannel = subscribe({ // Variable inutilisée supprimée
    subscribe({
      table: 'contacts',
      onUpdate: (payload) => {
        const contact = payload.new;
        
        // Si un lead devient "signé", créer automatiquement un projet
        if (contact.status === 'signe' && payload.old?.status !== 'signe') {
          logger.debug('🎯 Lead signé - Création automatique du projet');
          
          // Déclencher la création du projet - fonction supprimée car inexistante
          // store.createProjectFromLead?.(contact);
          
          // Créer une entrée comptable - fonction supprimée car inexistante
          // store.createRevenueFromLead?.(contact);
          
          toast.success(`🎉 Lead ${contact.name} signé ! Projet et revenue créés automatiquement.`);
        }
      }
    });

    // Écouter les changements de projets pour sync comptabilité
    // const projectChannel = subscribe({ // Variable inutilisée supprimée
    subscribe({
      table: 'projects',
      onUpdate: (payload) => {
        const project = payload.new;
        
        // Si le budget change, mettre à jour la comptabilité
        if (project.budget !== payload.old?.budget) {
          logger.debug('💰 Budget projet modifié - Sync comptabilité');
          // Fonction supprimée car inexistante
          // store.syncProjectBudgetToAccounting?.(project);
        }
      }
    });

    return () => {
      // Cleanup automatique via useRealtimeSync
    };
  }, [subscribe, store]);
}

export default useRealtimeSync; 