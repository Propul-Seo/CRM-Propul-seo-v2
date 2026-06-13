import type { StateCreator } from 'zustand';
import { toast } from 'sonner';
import type { Store, CrmSlice, Metrics } from '../types';
import { stubAction } from '../helpers';

const INITIAL_METRICS: Metrics = {
  monthlyRevenue: 0,
  clientCount: 0,
  conversionRate: 0,
  activeProjects: 0,
  monthlyGrowth: 0,
  salesMetrics: {
    leadsGenerated: 0,
    leadsConverted: 0,
    averageDealSize: 0,
    salesCycle: 0,
  },
  marketingMetrics: {
    websiteVisitors: 0,
    socialFollowers: 0,
    emailSubscribers: 0,
    campaignROI: 0,
  },
};

export const createCrmSlice: StateCreator<Store, [], [], CrmSlice> = (set) => ({
  clients: [],
  quotes: [],
  users: [],
  campaigns: [],
  leads: [],
  metrics: INITIAL_METRICS,
  chartData: [],
  chatGroups: [],
  chatMessages: {},

  // Client actions (placeholder - Supabase)
  addClient: (client) => stubAction('client creation', client),
  updateClient: (id, client) => stubAction('client update', id, client),
  deleteClient: (id) => stubAction('client deletion', id),

  // Quote actions (placeholder - Supabase)
  addQuote: (quote) => stubAction('quote creation', quote),
  updateQuote: (id, quote) => stubAction('quote update', id, quote),
  deleteQuote: (id) => stubAction('quote deletion', id),

  // Campaign actions (placeholder - Supabase)
  addCampaign: (campaign) => stubAction('campaign creation', campaign),
  updateCampaign: (id, campaign) => stubAction('campaign update', id, campaign),
  deleteCampaign: (id) => stubAction('campaign deletion', id),

  // Lead actions (placeholder - Supabase)
  addLead: (lead) => stubAction('lead creation', lead),
  updateLead: (id, lead) => stubAction('lead update', id, lead),
  deleteLead: (id) => stubAction('lead deletion', id),

  // Chat actions (placeholder - Supabase)
  addChatGroup: (group) => stubAction('chat group creation', group),
  updateChatGroup: (id, group) => stubAction('chat group update', id, group),
  deleteChatGroup: (id) => stubAction('chat group deletion', id),
  addChatMessage: (groupId, message) => stubAction('chat message creation', groupId, message),
  updateChatMessage: (groupId, messageId, message) => stubAction('chat message update', groupId, messageId, message),
  deleteChatMessage: (groupId, messageId) => stubAction('chat message deletion', groupId, messageId),

  // Initialize empty data
  initializeEmptyData: () => {
    set({
      clients: [],
      tasks: [],
      events: [],
      quotes: [],
      users: [],
      campaigns: [],
      leads: [],
      chatGroups: [],
      chatMessages: {},
      metrics: INITIAL_METRICS,
      chartData: [],
    });
    toast.success('CRM initialisé - Prêt pour les données Supabase');
  },
});
