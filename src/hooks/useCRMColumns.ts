import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface CRMColumn {
  id: string; // UUID de la base
  columnId: string; // Identifiant unique de la colonne (ex: 'nouveaux', 'qualifies')
  title: string;
  color: string;
  headerColor: string;
  isActive: boolean;
  position: number;
  count?: number;
}

export function useCRMColumns() {
  const [columns, setColumns] = useState<CRMColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Charger les colonnes depuis Supabase
  const fetchColumns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('crm_columns')
        .select('*')
        .eq('is_active', true)
        .order('position');

      if (fetchError) throw fetchError;

      // Transformer les données pour correspondre à l'interface
      const transformedColumns = data?.map(col => ({
        id: col.id,
        columnId: col.column_id,
        title: col.title,
        color: col.color,
        headerColor: col.header_color,
        isActive: col.is_active,
        position: col.position,
        count: 0 // Sera mis à jour séparément
      })) || [];

      setColumns(transformedColumns);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      logger.error('❌ Erreur lors du chargement des colonnes CRM:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Ajouter une nouvelle colonne
  const addColumn = useCallback(async (column: Omit<CRMColumn, 'id' | 'columnId' | 'position' | 'isActive'>) => {
    try {
      const newPosition = columns.length > 0 ? Math.max(...columns.map(col => col.position), 0) + 1 : 1;
      
      // Générer un column_id unique basé sur le titre
      const columnId = column.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      const { data, error } = await supabase
        .from('crm_columns')
        .insert({
          column_id: columnId,
          title: column.title,
          color: column.color,
          header_color: column.headerColor,
          is_active: true,
          position: newPosition
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Colonne ajoutée avec succès');
      await fetchColumns(); // Recharger les colonnes
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('❌ Erreur détaillée lors de l\'ajout de la colonne:', err);
      toast.error('Erreur lors de l\'ajout de la colonne: ' + errorMessage);
      throw err;
    }
  }, [columns, fetchColumns]);

  // Mettre à jour une colonne
  const updateColumn = useCallback(async (columnId: string, updates: Partial<CRMColumn>) => {
    try {
      const updateData: Record<string, string | number | boolean> = {};

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.headerColor !== undefined) updateData.header_color = updates.headerColor;
      if (updates.position !== undefined) updateData.position = updates.position;

      const { error } = await supabase
        .from('crm_columns')
        .update(updateData)
        .eq('id', columnId);

      if (error) throw error;

      toast.success('Colonne mise à jour avec succès');
      await fetchColumns(); // Recharger les colonnes
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur lors de la mise à jour: ' + errorMessage);
      throw err;
    }
  }, [fetchColumns]);

  // Supprimer une colonne (désactiver au lieu de supprimer définitivement)
  const deleteColumn = useCallback(async (columnId: string) => {
    try {
      // Trouver la colonne pour obtenir son titre
      const column = columns.find(col => col.id === columnId);
      if (!column) {
        toast.error('Colonne non trouvée');
        return;
      }

      // Mapper les titres des colonnes vers les statuts des contacts
      const statusMapping: { [key: string]: string } = {
        'Prospects': 'prospect',
        'Présentation Envoyée': 'presentation_envoyee',
        'Meeting Booké': 'meeting_booke',
        'No Show': 'no_show',
        'Offre Envoyée': 'offre_envoyee',
        'En Attente': 'en_attente',
        'Signés': 'signe'
      };

      const contactStatus = statusMapping[column.title];
      if (!contactStatus) {
        toast.error('Statut de contact non reconnu pour cette colonne');
        return;
      }

      // Vérifier le nombre de contacts dans cette colonne
      let count = 0;
      let countError = null;
      
      if (column.title === 'No Show') {
        // Pour la colonne No Show, compter les contacts avec no_show = 'Oui'
        const { count: noShowCount, error } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('no_show', 'Oui');
        count = noShowCount || 0;
        countError = error;
      } else {
        // Pour les autres colonnes, utiliser le statut
        const { count: statusCount, error } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('status', contactStatus);
        count = statusCount || 0;
        countError = error;
      }

      if (countError) throw countError;

      // Si il y a des contacts, les déplacer vers "Prospects" par défaut
      if (count && count > 0) {
        console.log(`🔄 Déplacement de ${count} contact(s) vers "Prospects" avant suppression...`);
        
        // Déplacer tous les contacts vers le statut "prospect"
        let updateError = null;
        if (column.title === 'No Show') {
          // Pour No Show, remettre no_show à 'Non'
          const { error } = await supabase
            .from('contacts')
            .update({ no_show: 'Non' })
            .eq('no_show', 'Oui');
          updateError = error;
        } else {
          // Pour les autres colonnes, changer le statut
          const { error } = await supabase
            .from('contacts')
            .update({ status: 'prospect' })
            .eq('status', contactStatus);
          updateError = error;
        }

        if (updateError) {
          logger.error('❌ Erreur lors du déplacement des contacts:', updateError);
          toast.error(`Erreur lors du déplacement des contacts: ${updateError.message}`);
          return;
        }

        toast.success(`${count} contact(s) déplacés vers "Prospects"`);
      }

      // Désactiver la colonne
      const { error } = await supabase
        .from('crm_columns')
        .update({ is_active: false })
        .eq('id', columnId);

      if (error) throw error;

      toast.success(`Colonne "${column.title}" supprimée avec succès`);
      await fetchColumns(); // Recharger les colonnes
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur lors de la suppression: ' + errorMessage);
      throw err;
    }
  }, [columns, fetchColumns]);

  // Réactiver une colonne supprimée
  const reactivateColumn = useCallback(async (columnId: string) => {
    try {
      const { error } = await supabase
        .from('crm_columns')
        .update({ is_active: true })
        .eq('id', columnId);

      if (error) throw error;

      toast.success('Colonne réactivée avec succès');
      await fetchColumns(); // Recharger les colonnes
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur lors de la réactivation: ' + errorMessage);
      throw err;
    }
  }, [fetchColumns]);

  // Supprimer une colonne avec destination personnalisée
  const deleteColumnWithDestination = useCallback(async (columnId: string, destinationStatus: string) => {
    try {
      // Trouver la colonne pour obtenir son titre
      const column = columns.find(col => col.id === columnId);
      if (!column) {
        toast.error('Colonne non trouvée');
        return;
      }

      // Mapper les titres des colonnes vers les statuts des contacts
      const statusMapping: { [key: string]: string } = {
        'Prospects': 'prospect',
        'Présentation Envoyée': 'presentation_envoyee',
        'Meeting Booké': 'meeting_booke',
        'No Show': 'no_show',
        'Offre Envoyée': 'offre_envoyee',
        'En Attente': 'en_attente',
        'Signés': 'signe'
      };

      const contactStatus = statusMapping[column.title];
      if (!contactStatus) {
        toast.error('Statut de contact non reconnu pour cette colonne');
        return;
      }

      // Vérifier le nombre de contacts dans cette colonne
      const { count, error: countError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('status', contactStatus);

      if (countError) throw countError;

      // Si il y a des contacts, les déplacer vers la destination choisie
      if (count && count > 0) {
        console.log(`🔄 Déplacement de ${count} contact(s) vers "${destinationStatus}"...`);
        
        // Déplacer tous les contacts vers le statut de destination
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ status: destinationStatus })
          .eq('status', contactStatus);

        if (updateError) {
          logger.error('❌ Erreur lors du déplacement des contacts:', updateError);
          toast.error(`Erreur lors du déplacement des contacts: ${updateError.message}`);
          return;
        }

        toast.success(`${count} contact(s) déplacés vers "${destinationStatus}"`);
      }

      // Désactiver la colonne
      const { error } = await supabase
        .from('crm_columns')
        .update({ is_active: false })
        .eq('id', columnId);

      if (error) throw error;

      toast.success(`Colonne "${column.title}" supprimée avec succès`);
      await fetchColumns(); // Recharger les colonnes
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur lors de la suppression: ' + errorMessage);
      throw err;
    }
  }, [columns, fetchColumns]);

  // Mettre à jour les compteurs des colonnes
  const updateColumnCounts = useCallback(async () => {
    try {
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('status, no_show');

      if (contactsError) throw contactsError;

      // Mapper les titres des colonnes vers les statuts des contacts
      const statusMapping: { [key: string]: string } = {
        'Prospects': 'prospect',
        'Présentation Envoyée': 'presentation_envoyee',
        'Meeting Booké': 'meeting_booke',
        'No Show': 'no_show',
        'Offre Envoyée': 'offre_envoyee',
        'En Attente': 'en_attente',
        'Signés': 'signe'
      };

      // Compter les contacts par statut
      const statusCounts: Record<string, number> = {};
      let noShowCount = 0;
      
      contacts?.forEach(contact => {
        // Compter No Show à part
        if (contact.no_show === 'Oui') {
          noShowCount++;
          return; // Ne pas compter dans les autres statuts pour éviter les doublons
        }
        // Compte normal pour les autres
        statusCounts[contact.status] = (statusCounts[contact.status] || 0) + 1;
      });

      // Mettre à jour les compteurs dans l'état local
      setColumns(prevColumns => 
        prevColumns.map(col => {
          // Gestion spéciale pour la colonne "No Show"
          if (col.title === 'No Show') {
            return {
              ...col,
              count: noShowCount
            };
          }
          
          const contactStatus = statusMapping[col.title];
          return {
            ...col,
            count: contactStatus ? (statusCounts[contactStatus] || 0) : 0
          };
        })
      );
    } catch (err) {
      logger.error('❌ Erreur lors de la mise à jour des compteurs:', err);
    }
  }, []);

  // Charger les colonnes au montage du composant
  // Synchronisation temps réel
  useEffect(() => {
    fetchColumns();

    // Créer la subscription temps réel
    subscriptionRef.current = supabase
      .channel('crm_columns_realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'crm_columns'
        },
        (payload) => {
          logger.debug('🔄 Colonne CRM modifiée:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const newColumn = {
              id: payload.new.id,
              columnId: payload.new.column_id,
              title: payload.new.title,
              color: payload.new.color,
              headerColor: payload.new.header_color,
              isActive: payload.new.is_active,
              position: payload.new.position,
              count: 0
            };
            setColumns(prev => [...prev, newColumn].sort((a, b) => a.position - b.position));
            toast.success('Nouvelle colonne ajoutée !');
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setColumns(prev => prev.map(col => 
              col.id === payload.new.id 
                ? {
                    ...col,
                    columnId: payload.new.column_id,
                    title: payload.new.title,
                    color: payload.new.color,
                    headerColor: payload.new.header_color,
                    isActive: payload.new.is_active,
                    position: payload.new.position
                  }
                : col
            ).sort((a, b) => a.position - b.position));
            toast.success('Colonne mise à jour !');
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setColumns(prev => prev.filter(col => col.id !== payload.old.id));
            toast.success('Colonne supprimée !');
          }
        }
      )
      .subscribe();

    // Nettoyage
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [fetchColumns]);

  return {
    columns,
    loading,
    error,
    addColumn,
    updateColumn,
    deleteColumn,
    deleteColumnWithDestination,
    reactivateColumn,
    updateColumnCounts,
    refetch: fetchColumns
  };
}
