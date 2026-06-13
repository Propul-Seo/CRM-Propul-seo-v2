import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useContactDetailsData } from './hooks/useContactDetailsData';
import { ContactDetailsHeader } from './components/ContactDetailsHeader';
import { ContactInfoSidebar } from './components/ContactInfoSidebar';
import { ActivitiesList } from './components/ActivitiesList';
import { EditContactForm } from './components/EditContactForm';
import { ActivityFormModal } from './components/ActivityFormModal';
import type { ContactDetailsProps } from './types';

export default function ContactDetails({ contactId, onBack }: ContactDetailsProps) {
  const data = useContactDetailsData(contactId);

  if (data.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement du contact...</p>
        </div>
      </div>
    );
  }

  if (!data.contact) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Contact non trouvé</p>
          <Button onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen p-6">
      <ContactDetailsHeader
        contact={data.contact}
        onBack={onBack}
        onEdit={() => data.setEditingContact(true)}
        onNewActivity={() => data.setShowActivityForm(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ContactInfoSidebar contact={data.contact} />
        <ActivitiesList
          activities={data.activities}
          activitiesLoading={data.activitiesLoading}
          onMarkCompleted={data.handleMarkActivityCompleted}
          onEdit={data.handleEditActivity}
          onDelete={data.handleDeleteActivity}
          onNewActivity={() => data.setShowActivityForm(true)}
        />
      </div>

      {data.editingContact && (
        <EditContactForm
          editForm={data.editForm}
          setEditForm={data.setEditForm}
          crmUsers={data.crmUsers}
          onSave={data.handleSaveContact}
          onCancel={() => data.setEditingContact(false)}
        />
      )}

      {data.showActivityForm && (
        <ActivityFormModal
          editingActivity={data.editingActivity}
          activityForm={data.activityForm}
          setActivityForm={data.setActivityForm}
          onSubmit={data.editingActivity ? data.handleUpdateActivity : data.handleAddActivity}
          onClose={() => { data.setShowActivityForm(false); data.setEditingActivity(null); }}
        />
      )}
    </div>
  );
}
