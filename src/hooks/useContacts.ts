import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';
import { getCurrentUtcDate } from '../utils/dateUtils';
import { logger } from '@/lib/logger';

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  sector?: string;
  website?: string;
  status: 'prospect' | 'presentation_envoyee' | 'meeting_booke' | 'offre_envoyee' | 'en_attente' | 'signe';
  total_revenue?: number;
  project_price?: number;
  assigned_to?: string;
  assigned_user_name?: string;
  next_activity_date?: string;
  source?: string;
  lead_score?: number;
  notes?: string[];
  tags?: string[];
  last_contact?: string;
  no_show?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContactData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  sector?: string;
  website?: string;
  status?: 'prospect' | 'proposition_envoyee' | 'meeting_booke' | 'offre_envoyee' | 'en_attente' | 'signe';
  project_price?: number;
  source?: string;
  notes?: string;
  tags?: string[];
  no_show?: string;
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useStore();

  // Fonction utilitaire pour nettoyer les tableaux
  const cleanArray = (arr: unknown[] | null | undefined): string[] => {
    if (!arr || !Array.isArray(arr)) return [];
    return arr
      .map((item) => {
        if (item === null || item === undefined) return '';
        try {
          return String(item);
        } catch {
          return '';
        }
      })
      .map((s) => s.trim())
      .filter((s) => s !== '');
  };

  // Fonction utilitaire pour convertir les notes en tableau
  const notesToArray = (notes: string | string[] | null | undefined): string[] => {
    if (!notes) return [];
    if (Array.isArray(notes)) return cleanArray(notes);
    if (typeof notes === 'string') {
      const trimmed = notes.trim();
      return trimmed ? [trimmed] : [];
    }
    return [];
  };

  // Recuperer tous les contacts de l'utilisateur connecte
  const fetchContacts = async () => {
    if (!currentUser?.id) {
      setError('Utilisateur non connecte');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Recuperer l'utilisateur depuis la table users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', currentUser.id)
        .single();

      if (userError) {
        logger.error('Erreur recuperation utilisateur', 'useContacts', { code: userError.code });
        setError('Erreur lors de la recuperation de l\'utilisateur');
        return;
      }

      if (!userData) {
        setError('Profil utilisateur non trouve');
        return;
      }

      // Recuperer les contacts de cet utilisateur
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (contactsError) {
        logger.error('Erreur recuperation contacts', 'useContacts', { code: contactsError.code });
        setError('Erreur lors de la recuperation des contacts');
        return;
      }

      setContacts(contactsData || []);
      logger.debug('Contacts charges', 'useContacts', { count: contactsData?.length || 0 });
    } catch (err) {
      logger.exception(err as Error, 'useContacts');
      setError('Erreur lors de la recuperation des contacts');
    } finally {
      setLoading(false);
    }
  };

  // Creer un nouveau contact
  const createContact = async (contactData: CreateContactData) => {
    if (!currentUser?.id) {
      toast.error('Utilisateur non connecte');
      return { success: false, error: 'Utilisateur non connecte' };
    }

    setLoading(true);

    try {
      // Recuperer l'utilisateur depuis la table users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', currentUser.id)
        .single();

      if (userError || !userData) {
        toast.error('Profil utilisateur non trouve');
        return { success: false, error: 'Profil utilisateur non trouve' };
      }

      // Preparer les donnees du contact avec nettoyage des tableaux
      const contactToCreate = {
        user_id: userData.id,
        name: contactData.name.trim(),
        email: contactData.email.trim(),
        phone: contactData.phone?.trim() || null,
        address: contactData.address?.trim() || null,
        company: contactData.company?.trim() || null,
        sector: contactData.sector?.trim() || null,
        website: contactData.website?.trim() || null,
        status: contactData.status || 'prospect',
        project_price: contactData.project_price || null,
        source: contactData.source || 'website',
        notes: notesToArray(contactData.notes),
        tags: cleanArray(contactData.tags),
        no_show: contactData.no_show || 'Non',
        lead_score: 50,
        total_revenue: 0
      };

      const { data: newContact, error: createError } = await supabase
        .from('contacts')
        .insert([contactToCreate])
        .select()
        .single();

      if (createError) {
        logger.error('Erreur creation contact', 'useContacts', { code: createError.code });
        toast.error(`Erreur lors de la creation du contact: ${createError.message}`);
        return { success: false, error: createError.message };
      }

      // Ajouter le nouveau contact a la liste
      setContacts(prev => [newContact, ...prev]);
      toast.success('Contact cree avec succes');
      logger.info('Contact cree', 'useContacts', { contactId: newContact.id });
      return { success: true, data: newContact };

    } catch (err) {
      const error = err as Error;
      logger.exception(error, 'useContacts');
      toast.error(`Erreur lors de la creation du contact: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Mettre a jour un contact
  const updateContact = async (contactId: string, updates: Partial<CreateContactData>) => {
    setLoading(true);

    try {
      // Preparer les donnees mises a jour avec nettoyage des tableaux
      const updateData: Record<string, unknown> = {
        updated_at: getCurrentUtcDate()
      };

      // Ajouter les champs mis a jour
      if (updates.name !== undefined) updateData.name = updates.name.trim();
      if (updates.email !== undefined) updateData.email = updates.email.trim();
      if (updates.phone !== undefined) updateData.phone = updates.phone?.trim() || null;
      if (updates.address !== undefined) updateData.address = updates.address?.trim() || null;
      if (updates.company !== undefined) updateData.company = updates.company?.trim() || null;
      if (updates.sector !== undefined) updateData.sector = updates.sector?.trim() || null;
      if (updates.website !== undefined) updateData.website = updates.website?.trim() || null;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.project_price !== undefined) updateData.project_price = updates.project_price;
      if (updates.source !== undefined) updateData.source = updates.source;
      if (updates.no_show !== undefined) updateData.no_show = updates.no_show;

      // Gerer assigned_to (personne assignee)
      if ((updates as Record<string, unknown>).assigned_to !== undefined) {
        const assignedTo = (updates as Record<string, unknown>).assigned_to;
        updateData.assigned_to = assignedTo && assignedTo !== '' && assignedTo !== 'none'
          ? assignedTo
          : null;
      }

      // Gerer les notes
      if (updates.notes !== undefined) {
        updateData.notes = notesToArray(updates.notes);
      }

      // Gerer les tags
      if (updates.tags !== undefined) {
        updateData.tags = cleanArray(updates.tags);
      }

      const { data: updatedContact, error: updateError } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId)
        .select()
        .single();

      if (updateError) {
        logger.error('Erreur mise a jour contact', 'useContacts', { contactId, code: updateError.code });
        toast.error(`Erreur lors de la mise a jour du contact: ${updateError.message}`);
        return { success: false, error: updateError.message };
      }

      // Mettre a jour le contact dans la liste
      setContacts(prev =>
        prev.map(contact =>
          contact.id === contactId ? updatedContact : contact
        )
      );

      toast.success('Contact mis a jour avec succes');
      logger.info('Contact mis a jour', 'useContacts', { contactId });
      return { success: true, data: updatedContact };

    } catch (err) {
      const error = err as Error;
      logger.exception(error, 'useContacts');
      toast.error(`Erreur lors de la mise a jour du contact: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un contact
  const deleteContact = async (contactId: string) => {
    setLoading(true);

    try {
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (deleteError) {
        logger.error('Erreur suppression contact', 'useContacts', { contactId, code: deleteError.code });
        toast.error(`Erreur lors de la suppression du contact: ${deleteError.message}`);
        return { success: false, error: deleteError.message };
      }

      // Retirer le contact de la liste
      setContacts(prev => prev.filter(contact => contact.id !== contactId));
      toast.success('Contact supprime avec succes');
      logger.info('Contact supprime', 'useContacts', { contactId });
      return { success: true };

    } catch (err) {
      const error = err as Error;
      logger.exception(error, 'useContacts');
      toast.error(`Erreur lors de la suppression du contact: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Recuperer un contact par ID
  const getContactById = async (contactId: string) => {
    try {
      const { data: contact, error } = await supabase
        .from('contacts')
        .select('*, users!assigned_to(name)')
        .eq('id', contactId)
        .single();

      if (error) {
        logger.error('Erreur recuperation contact par ID', 'useContacts', { contactId, code: error.code });
        return null;
      }

      // Traiter les donnees jointes pour avoir assigned_user_name
      if (contact) {
        const contactWithUser = contact as Contact & { users?: { name: string } };
        contactWithUser.assigned_user_name = contactWithUser.users?.name || undefined;
      }

      return contact;
    } catch (err) {
      logger.exception(err as Error, 'useContacts');
      return null;
    }
  };

  // Charger les contacts au montage du composant
  useEffect(() => {
    if (currentUser?.id) {
      fetchContacts();
    }
  }, [currentUser?.id]);

  return {
    contacts,
    loading,
    error,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    getContactById
  };
}
