import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { Contact, useContacts } from '../../../hooks/useContacts';
import { useContactActivities } from '../../../hooks/useContactActivities';
import { useCRMUsers } from '../../../hooks/useCRMUsers';
import { createFrenchDateTime } from '../../../utils/frenchDateUtils';
import { toast } from 'sonner';
import type { ContactActivity, ActivityFormState, EditFormState } from '../types';

const defaultActivityForm: ActivityFormState = {
  type: 'call',
  title: '',
  description: '',
  activity_date: new Date().toISOString().slice(0, 16),
  status: 'scheduled',
};

export function useContactDetailsData(contactId: string) {
  const { getContactById, updateContact } = useContacts();
  const {
    activities,
    loading: activitiesLoading,
    createActivity,
    markActivityCompleted,
    updateActivity,
    deleteActivity,
  } = useContactActivities(contactId);
  const { users: crmUsers } = useCRMUsers();

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ContactActivity | null>(null);
  const [editingContact, setEditingContact] = useState(false);
  const [activityForm, setActivityForm] = useState<ActivityFormState>({ ...defaultActivityForm });
  const [editForm, setEditForm] = useState<EditFormState>({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    status: 'prospect',
    project_price: undefined,
    source: 'website',
    notes: '',
    assigned_to: '',
    no_show: 'Non',
  });

  useLayoutEffect(() => {
    const mainContainer = document.querySelector('main.overflow-y-auto');
    if (mainContainer) mainContainer.scrollTop = 0;
    window.scrollTo(0, 0);
    loadContactDetails();
  }, [contactId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const mainContainer = document.querySelector('main.overflow-y-auto');
      if (mainContainer) mainContainer.scrollTop = 0;
      window.scrollTo(0, 0);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [contactId]);

  const loadContactDetails = useCallback(async () => {
    if (!contactId) return;

    setLoading(true);
    try {
      const contactData = await getContactById(contactId) as Contact | null;
      if (contactData) {
        setContact(contactData);
        const contactWithExtras = contactData as Contact & { notes?: string; assigned_to?: string; no_show?: string };
        setEditForm({
          company_name: contactData.company || '',
          contact_name: contactData.name || '',
          email: contactData.email || '',
          phone: contactData.phone || '',
          website: contactData.website || '',
          status: contactData.status,
          project_price: contactData.project_price,
          source: contactData.source || 'website',
          notes: (contactWithExtras.notes as unknown as string) || '',
          assigned_to: contactWithExtras.assigned_to || '',
          no_show: contactWithExtras.no_show === 'Oui' ? 'Oui' : 'Non',
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du contact:', error);
      toast.error('Erreur lors du chargement du contact');
    } finally {
      setLoading(false);
    }
  }, [contactId, getContactById]);

  const handleSaveContact = async () => {
    if (!contact) return;

    type AllowedStatus = 'prospect' | 'presentation_envoyee' | 'meeting_booke' | 'offre_envoyee' | 'en_attente' | 'signe';
    const allowedStatuses: AllowedStatus[] = ['prospect', 'presentation_envoyee', 'meeting_booke', 'offre_envoyee', 'en_attente', 'signe'];
    const isValidStatus = (status: string): status is AllowedStatus => allowedStatuses.includes(status as AllowedStatus);
    const safeStatus = isValidStatus(editForm.status) ? editForm.status : 'prospect';
    const noShowValue = editForm.no_show === 'Oui' ? 'Oui' : 'Non';

    const updateData: Record<string, unknown> = {
      name: editForm.contact_name,
      company: editForm.company_name,
      email: editForm.email,
      phone: editForm.phone,
      website: editForm.website,
      status: safeStatus,
      project_price: editForm.project_price,
      source: editForm.source,
      notes: editForm.notes,
      assigned_to: editForm.assigned_to && editForm.assigned_to !== 'none' && editForm.assigned_to.trim() !== ''
        ? editForm.assigned_to
        : null,
      no_show: noShowValue,
    };

    const result = await updateContact(contact.id, updateData as any);

    if (result.success) {
      setContact(result.data as unknown as Contact);
      setEditingContact(false);
      toast.success('Contact mis à jour avec succès');
      await loadContactDetails();
    } else {
      toast.error('Erreur lors de la mise à jour du contact');
    }
  };

  const handleAddActivity = async () => {
    if (!contact) return;

    try {
      const [datePart, timePart] = activityForm.activity_date.split('T');
      const frenchDateTime = createFrenchDateTime(datePart, timePart);

      const result = await createActivity({
        contact_id: contact.id,
        type: activityForm.type,
        title: activityForm.title,
        description: activityForm.description,
        activity_date: frenchDateTime,
        status: activityForm.status,
      });

      if (result.success) {
        toast.success('Activité ajoutée avec succès !');
        setShowActivityForm(false);
        setEditingActivity(null);
        setActivityForm({ ...defaultActivityForm });
        await loadContactDetails();
      } else {
        toast.error('Erreur lors de l\'ajout de l\'activité');
      }
    } catch {
      toast.error('Erreur lors de l\'ajout de l\'activité');
    }
  };

  const handleMarkActivityCompleted = async (activityId: string) => {
    try {
      const result = await markActivityCompleted(activityId);
      if (result.success) {
        toast.success('Activité marquée comme effectuée !');
        setTimeout(() => {
          setShowActivityForm(true);
          setActivityForm({ ...defaultActivityForm });
        }, 500);
      } else {
        toast.error('Erreur lors de la mise à jour du statut');
      }
    } catch {
      toast.error('Erreur lors du marquage de l\'activité');
    }
  };

  const handleEditActivity = (activity: ContactActivity) => {
    setEditingActivity(activity);
    setActivityForm({
      type: activity.type,
      title: activity.title,
      description: activity.description || '',
      activity_date: activity.activity_date,
      status: activity.status,
    });
    setShowActivityForm(true);
  };

  const handleUpdateActivity = async () => {
    if (!editingActivity) return;

    try {
      const [datePart, timePart] = activityForm.activity_date.split('T');
      const frenchDateTime = createFrenchDateTime(datePart, timePart);

      const result = await updateActivity(editingActivity.id, {
        type: activityForm.type,
        title: activityForm.title,
        description: activityForm.description,
        activity_date: frenchDateTime,
        status: activityForm.status,
      });

      if (result.success) {
        toast.success('Activité modifiée avec succès !');
        setShowActivityForm(false);
        setEditingActivity(null);
        setActivityForm({ ...defaultActivityForm });
        await loadContactDetails();
      } else {
        toast.error('Erreur lors de la modification de l\'activité');
      }
    } catch {
      toast.error('Erreur lors de la modification de l\'activité');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette activité ? Cette action est irréversible.')) {
      try {
        const result = await deleteActivity(activityId);
        if (result.success) {
          toast.success('Activité supprimée avec succès !');
          await loadContactDetails();
        } else {
          toast.error('Erreur lors de la suppression de l\'activité');
        }
      } catch {
        toast.error('Erreur lors de la suppression de l\'activité');
      }
    }
  };

  return {
    contact,
    loading,
    activities,
    activitiesLoading,
    crmUsers,
    showActivityForm,
    setShowActivityForm,
    editingActivity,
    setEditingActivity,
    editingContact,
    setEditingContact,
    activityForm,
    setActivityForm,
    editForm,
    setEditForm,
    handleSaveContact,
    handleAddActivity,
    handleMarkActivityCompleted,
    handleEditActivity,
    handleUpdateActivity,
    handleDeleteActivity,
  };
}
