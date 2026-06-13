import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import {
  CRMBotOneRecord,
  CRMBotOneColumn,
  CRMBotOneRecordForm,
  CRMBotOneColumnForm,
  CRMBotOneFilters,
  CRMBotOneStats,
  CRMBotOneRecordInsert,
  CRMBotOneRecordUpdate,
  CRMBotOneColumnInsert,
  CRMBotOneColumnUpdate,
  CRMBotOneActivity,
  CRMBotOneActivityForm,
  CRMBotOneActivityUpdate,
} from '../types/crmBotOne';

// Types pour les payloads realtime
interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T> & { id?: string };
}

export function useCRMBotOne() {
  const [records, setRecords] = useState<CRMBotOneRecord[]>([]);
  const [columns, setColumns] = useState<CRMBotOneColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CRMBotOneStats | null>(null);

  // Charger les colonnes
  const fetchColumns = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('crm_bot_one_columns')
        .select('*')
        .order('column_order');

      if (fetchError) throw fetchError;
      setColumns((data || []) as CRMBotOneColumn[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      logger.error('Erreur lors du chargement des colonnes:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les enregistrements
  const fetchRecords = useCallback(async (filters?: CRMBotOneFilters) => {
    try {
      setLoading(true);
      let query = supabase
        .from('crm_bot_one_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      let filteredRecords = (data || []) as CRMBotOneRecord[];

      // Filtrage côté client pour la recherche textuelle
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredRecords = filteredRecords.filter(record => {
          return Object.values(record.data).some(value =>
            String(value).toLowerCase().includes(searchTerm)
          );
        });
      }

      setRecords(filteredRecords);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      logger.error('Erreur lors du chargement des enregistrements:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les statistiques
  const fetchStats = useCallback(async () => {
    try {
      const { data: recordsData, error: recordsError } = await supabase
        .from('crm_bot_one_records')
        .select('status, tags, created_at');

      if (recordsError) throw recordsError;

      const typedRecords = (recordsData || []) as CRMBotOneRecord[];
      const totalRecords = typedRecords.length;
      const recordsByStatus: Record<string, number> = {};
      const recordsByTag: Record<string, number> = {};
      const recentActivity = typedRecords.filter(record => {
        const recordDate = new Date(record.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return recordDate >= weekAgo;
      }).length;

      typedRecords.forEach(record => {
        recordsByStatus[record.status] = (recordsByStatus[record.status] || 0) + 1;
        record.tags?.forEach(tag => {
          recordsByTag[tag] = (recordsByTag[tag] || 0) + 1;
        });
      });

      setStats({
        totalRecords,
        recordsByStatus,
        recordsByTag,
        recentActivity
      });
    } catch (err) {
      logger.error('Erreur lors du chargement des statistiques:', err);
    }
  }, []);

  // Créer un enregistrement
  const createRecord = useCallback(async (recordData: CRMBotOneRecordForm): Promise<CRMBotOneRecord> => {
    try {
      const insertData: CRMBotOneRecordInsert = {
        data: recordData.data,
        status: recordData.status || 'active',
        tags: recordData.tags || [],
        next_activity_date: recordData.next_activity_date || null
      };

      const { data, error } = await supabase
        .from('crm_bot_one_records')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newRecord = data as CRMBotOneRecord;
      setRecords(prev => [newRecord, ...prev]);
      toast.success('Enregistrement créé avec succès');
      return newRecord;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur lors de la création: ' + errorMessage);
      throw err;
    }
  }, []);

  // Mettre à jour un enregistrement
  const updateRecord = useCallback(async (id: string, updates: Partial<CRMBotOneRecordForm>): Promise<CRMBotOneRecord> => {
    try {
      // Préparer les données de mise à jour
      const updateData: CRMBotOneRecordUpdate = { ...updates };

      // Gérer next_activity_date spécifiquement
      if (updates.next_activity_date !== undefined) {
        updateData.next_activity_date = updates.next_activity_date === '' || updates.next_activity_date === null
          ? null
          : updates.next_activity_date;
      }

      const { data, error } = await supabase
        .from('crm_bot_one_records')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedRecord = data as CRMBotOneRecord;
      setRecords(prev => prev.map(record =>
        record.id === id ? updatedRecord : record
      ));
      toast.success('Enregistrement mis à jour avec succès');
      return updatedRecord;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur lors de la mise à jour: ' + errorMessage);
      throw err;
    }
  }, []);

  // Supprimer un enregistrement
  const deleteRecord = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('crm_bot_one_records')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecords(prev => prev.filter(record => record.id !== id));
      toast.success('Enregistrement supprimé avec succès');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur lors de la suppression: ' + errorMessage);
      throw err;
    }
  }, []);

  // Créer une colonne
  const createColumn = useCallback(async (columnData: CRMBotOneColumnForm): Promise<CRMBotOneColumn> => {
    try {
      const newOrder = Math.max(...columns.map(col => col.column_order), 0) + 1;

      const insertData: CRMBotOneColumnInsert = {
        ...columnData,
        column_order: newOrder
      };

      const { data, error } = await supabase
        .from('crm_bot_one_columns')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newColumn = data as CRMBotOneColumn;
      setColumns(prev => [...prev, newColumn]);
      toast.success('Colonne créée avec succès');
      return newColumn;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur lors de la création de la colonne: ' + errorMessage);
      throw err;
    }
  }, [columns]);

  // Mettre à jour une colonne
  const updateColumn = useCallback(async (id: string, updates: Partial<CRMBotOneColumnForm>): Promise<CRMBotOneColumn> => {
    try {
      const updateData: CRMBotOneColumnUpdate = { ...updates };

      const { data, error } = await supabase
        .from('crm_bot_one_columns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedColumn = data as CRMBotOneColumn;
      setColumns(prev => prev.map(col =>
        col.id === id ? updatedColumn : col
      ));
      toast.success('Colonne mise à jour avec succès');
      return updatedColumn;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur lors de la mise à jour de la colonne: ' + errorMessage);
      throw err;
    }
  }, []);

  // Supprimer une colonne
  const deleteColumn = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('crm_bot_one_columns')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setColumns(prev => prev.filter(col => col.id !== id));
      toast.success('Colonne supprimée avec succès');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur lors de la suppression de la colonne: ' + errorMessage);
      throw err;
    }
  }, []);

  // Réorganiser les colonnes
  const reorderColumns = useCallback(async (columnIds: string[]) => {
    try {
      const updates = columnIds.map((id, index) => ({
        id,
        column_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('crm_bot_one_columns')
          .update({ column_order: update.column_order })
          .eq('id', update.id);
      }

      setColumns(prev =>
        prev.sort((a, b) => {
          const aIndex = columnIds.indexOf(a.id);
          const bIndex = columnIds.indexOf(b.id);
          return aIndex - bIndex;
        })
      );
      toast.success('Colonnes réorganisées avec succès');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur lors de la réorganisation: ' + errorMessage);
      throw err;
    }
  }, []);

  // Charger les données au montage
  useEffect(() => {
    fetchColumns();
    fetchRecords();
    fetchStats();
  }, [fetchColumns, fetchRecords, fetchStats]);

  // Synchronisation temps réel
  useEffect(() => {
    // Écouter les changements sur les enregistrements
    const recordsChannel = supabase
      .channel('crm_bot_one_records_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_bot_one_records'
        },
        (payload: RealtimePayload<CRMBotOneRecord>) => {
          logger.debug('Changement détecté sur crm_bot_one_records:', payload);

          if (payload.eventType === 'INSERT') {
            setRecords(prev => [payload.new, ...prev]);
            fetchStats();
          } else if (payload.eventType === 'UPDATE') {
            setRecords(prev =>
              prev.map(record =>
                record.id === payload.new.id ? payload.new : record
              )
            );
            fetchStats();
          } else if (payload.eventType === 'DELETE') {
            setRecords(prev =>
              prev.filter(record => record.id !== payload.old.id)
            );
            fetchStats();
          }
        }
      )
      .subscribe();

    // Écouter les changements sur les colonnes
    const columnsChannel = supabase
      .channel('crm_bot_one_columns_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_bot_one_columns'
        },
        (payload: RealtimePayload<CRMBotOneColumn>) => {
          logger.debug('Changement détecté sur crm_bot_one_columns:', payload);

          if (payload.eventType === 'INSERT') {
            setColumns(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setColumns(prev =>
              prev.map(column =>
                column.id === payload.new.id ? payload.new : column
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setColumns(prev =>
              prev.filter(column => column.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      recordsChannel.unsubscribe();
      columnsChannel.unsubscribe();
    };
  }, [fetchStats]);

  // Fonction pour créer une activité
  const createActivity = useCallback(async (recordId: string, activityData: CRMBotOneActivityForm): Promise<CRMBotOneActivity> => {
    try {
      const { data, error } = await supabase.rpc('create_bot_one_activity', {
        p_record_id: recordId,
        p_title: activityData.title,
        p_description: activityData.description || null,
        p_activity_date: activityData.activity_date,
        p_type: activityData.type,
        p_status: activityData.status
      });

      if (error) throw error;
      return data as CRMBotOneActivity;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error("Erreur lors de la création de l'activité:", errorMessage);
      toast.error("Erreur lors de la création de l'activité");
      throw err;
    }
  }, []);

  // Fonction pour récupérer les activités d'un record
  const getActivities = useCallback(async (recordId: string): Promise<CRMBotOneActivity[]> => {
    try {
      const { data, error } = await supabase.rpc('get_bot_one_activities', {
        p_record_id: recordId
      });

      if (error) throw error;
      return (data || []) as CRMBotOneActivity[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur lors du chargement des activités:', errorMessage);
      return [];
    }
  }, []);

  // Fonction pour mettre à jour une activité
  const updateActivity = useCallback(async (activityId: string, updates: CRMBotOneActivityUpdate): Promise<CRMBotOneActivity> => {
    try {
      const { data, error } = await supabase.rpc('update_bot_one_activity', {
        p_activity_id: activityId,
        p_title: updates.title || null,
        p_description: updates.description || null,
        p_activity_date: updates.activity_date || null,
        p_type: updates.type || null,
        p_status: updates.status || null
      });

      if (error) throw error;
      return data as CRMBotOneActivity;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error("Erreur lors de la mise à jour de l'activité:", errorMessage);
      toast.error("Erreur lors de la mise à jour de l'activité");
      throw err;
    }
  }, []);

  // Fonction pour supprimer une activité
  const deleteActivity = useCallback(async (activityId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('delete_bot_one_activity', {
        p_activity_id: activityId
      });

      if (error) throw error;
      return data as boolean;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error("Erreur lors de la suppression de l'activité:", errorMessage);
      toast.error("Erreur lors de la suppression de l'activité");
      throw err;
    }
  }, []);

  return {
    records,
    columns,
    loading,
    error,
    stats,
    createRecord,
    updateRecord,
    deleteRecord,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    fetchRecords,
    fetchColumns,
    fetchStats,
    createActivity,
    getActivities,
    updateActivity,
    deleteActivity
  };
}
