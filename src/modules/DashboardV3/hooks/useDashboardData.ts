import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { routes } from '@/lib/routes';
import {
  useSupabaseContacts,
  useSupabaseTasks,
  useSupabaseAccountingEntries,
  useSupabaseLeads,
} from '@/hooks/useSupabaseData';
import { useProjectsV3 } from '@/modules/ProjectsV3/hooks/useProjectsV3';
import { useLeadsV3SiteWeb } from '@/modules/LeadsV3/hooks/useLeadsV3SiteWeb';
import { statusToColumn } from '@/modules/ProjectsV3/utils/statusMapping';

interface AccountingEntryShape {
  month_key?: string;
  created_at: string;
  type: string;
  amount: string | number;
}

interface TaskShape {
  priority?: string;
  status: string;
}

export function useDashboardData() {
  const navigate = useNavigate();
  const { dashboardObjectives } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { count: contactsCount } = useSupabaseContacts();
  const { projects } = useProjectsV3();
  const siteWebCrm = useLeadsV3SiteWeb();
  const { data: tasks } = useSupabaseTasks();
  const { data: accountingEntries, loading: accountingLoading } = useSupabaseAccountingEntries();
  const { data: leads, count: leadsCount } = useSupabaseLeads();
  const projectsCount = projects.length;

  const currentYear = new Date().getFullYear();
  let currentYearRevenue = 0;
  try {
    currentYearRevenue = (accountingEntries as unknown as AccountingEntryShape[] | undefined)
      ?.filter(entry => {
        const entryYear = entry.month_key
          ? parseInt(entry.month_key.split('-')[0])
          : new Date(entry.created_at).getFullYear();
        return entryYear === currentYear && entry.type === 'revenue';
      })
      ?.reduce((sum, entry) => sum + parseFloat(String(entry.amount) || '0'), 0) || 0;
  } catch {
    currentYearRevenue = 0;
  }

  const activeProjectsCount = projects.filter(p => statusToColumn(p.status) !== 'en_pause').length;
  const crmOfferLeads = siteWebCrm.leads.filter(lead => lead.normalized_status === 'offre_envoyee');

  const urgentTasks = (tasks as unknown as TaskShape[] | undefined)?.filter(
    t => t.priority === 'urgent' && t.status !== 'completed'
  ) || [];
  const pendingTasks = tasks?.filter(t => (t.status as string) === 'pending' || t.status === 'in_progress') || [];

  const objectives = dashboardObjectives.map(obj => {
    let current = 0;
    switch (obj.type) {
      case 'revenue':
        current = currentYearRevenue;
        break;
      case 'projects':
        current = projectsCount || 0;
        break;
      case 'activeProjects':
        current = activeProjectsCount;
        break;
      default:
        current = 0;
    }
    return { ...obj, current };
  });

  const handleNavigateToAccounting = () => navigate(routes.accounting);
  const handleNavigateToCRM = () => navigate(routes.leadsV3);
  const handleNavigateToLead = (id: string) => navigate(routes.clientDetail(id));
  const handleNavigateToProjects = () => navigate(routes.projectsV3);
  const handleNavigateToTasks = () => navigate(routes.personalTasks);
  const handleNavigateToProject = (id: string) => navigate(routes.projectV3Preview(id));

  const formattedDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    mounted,
    projects,
    leads,
    crmOfferLeads,
    currentYear,
    currentYearRevenue,
    contactsCount,
    leadsCount,
    projectsCount,
    activeProjectsCount,
    urgentTasks,
    pendingTasks,
    objectives,
    accountingEntries,
    accountingLoading,
    formattedDate,
    handleNavigateToAccounting,
    handleNavigateToCRM,
    handleNavigateToLead,
    handleNavigateToProjects,
    handleNavigateToTasks,
    handleNavigateToProject,
  };
}
