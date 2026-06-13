import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { useCRMUsers } from '@/hooks/useCRMUsers';
import { routes } from '@/lib/routes';
import { useCRMERPLeadDetails } from './hooks/useCRMERPLeadDetails';
import { useCRMERPActivities } from './hooks/useCRMERPActivities';
import { useCRMERPLeadAssign } from './hooks/useCRMERPLeadAssign';
import { CRMERPLeadDetailsPage } from './CRMERPLeadDetailsPage';
import type { ActivityType } from './types';

export function CRMERPLeadDetails() {
  const navigate = useNavigate();
  const { leadId: leadIdParam } = useParams<{ leadId: string }>();
  const { currentUser } = useStore();
  const leadId = leadIdParam ?? null;

  const { lead, loading, refetch, updateLead } = useCRMERPLeadDetails(leadId);
  const { activities, addActivity, updateActivity, deleteActivity } = useCRMERPActivities(leadId);
  const { assign } = useCRMERPLeadAssign(leadId, refetch);
  const { crmUsers } = useCRMUsers();

  const [dbUserId, setDbUserId] = useState<string | null>(null);

  // Resolve auth user -> users table id
  useEffect(() => {
    if (!currentUser?.id) return;
    supabase.from('users').select('id').eq('auth_user_id', currentUser.id).single()
      .then(({ data }) => { if (data) setDbUserId(data.id); });
  }, [currentUser?.id]);

  const users = (crmUsers ?? []).map((u: { id: string; name: string; email: string }) => ({
    id: u.id, name: u.name, email: u.email,
  }));

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleEdit = useCallback(() => {
    if (!leadId) return;
    navigate(`${routes.leadsV3}?edit=${leadId}`);
  }, [navigate, leadId]);

  const handleAddActivity = useCallback(async (type: ActivityType, content: string) => {
    await addActivity(type, content, dbUserId);
  }, [addActivity, dbUserId]);

  if (loading || !lead) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <CRMERPLeadDetailsPage
      lead={lead}
      activities={activities}
      users={users}
      onBack={handleBack}
      onEdit={handleEdit}
      onAssign={assign}
      onAddActivity={handleAddActivity}
      onUpdateActivity={updateActivity}
      onDeleteActivity={deleteActivity}
    />
  );
}
