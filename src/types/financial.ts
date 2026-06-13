// Types pour l'automatisation financière : Projet → Revenus → Comptabilité

export interface RevenueEntry {
  id: string;
  project_id: string;
  amount: number;
  revenue_date: string;
  type: 'project_signed' | 'project_milestone' | 'project_completed' | 'project_budget' | 'recurring' | 'other';
  client_id: string;
  client_name: string;
  description: string;
  category: 'services' | 'products' | 'maintenance' | 'consulting' | 'other';
  status: 'pending' | 'confirmed' | 'paid' | 'projected';
  invoice_number?: string;
  payment_method?: string;
  payment_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AccountingTransaction {
  id: string;
  transaction_type: 'revenue' | 'expense';
  amount: number;
  date: string;
  reference_id: string; // project_id ou autre référence
  reference_type: 'project' | 'client' | 'expense' | 'other';
  description: string;
  category: 'services_income' | 'products_income' | 'maintenance_income' | 'consulting_income' | 'projected_revenue' | 'other_income' | 'office_expense' | 'marketing_expense' | 'other_expense';
  client_id?: string;
  client_name?: string;
  project_name?: string;
  invoice_number?: string;
  payment_method?: string;
  is_recurring?: boolean;
  recurring_frequency?: 'monthly' | 'quarterly' | 'yearly';
  created_at: string;
  updated_at: string;
}

export interface ProjectFinancialData {
  project_id: string;
  project_name: string;
  client_id: string;
  client_name: string;
  total_budget: number;
  revenue_generated: number;
  accounting_entries: AccountingTransaction[];
  milestones: ProjectMilestone[];
  status: 'draft' | 'signed' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  name: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'completed' | 'paid';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  total_revenue: number;
  total_expenses: number;
  net_result: number;
  project_revenue: number;
  project_count: number;
  average_project_value: number;
  monthly_growth: number;
  top_clients: Array<{
    client_id: string;
    client_name: string;
    total_revenue: number;
    project_count: number;
  }>;
  revenue_by_category: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthly_evolution: Array<{
    month: string;
    revenue: number;
    expenses: number;
    net_result: number;
  }>;
}

export interface FinancialNotification {
  id: string;
  type: 'project_signed' | 'accounting_updated' | 'revenue_added' | 'milestone_reached' | 'payment_received' | 'success' | 'error' | 'info';
  title: string;
  message: string;
  project_id?: string;
  project_name?: string;
  timestamp: string;
  read: boolean;
  auto_dismiss: boolean;
}

// Types pour les événements de synchronisation
export interface FinancialSyncEvent {
  type: 'revenue_created' | 'project_added' | 'accounting_updated' | 'sync_completed' | 'sync_error' | 'budget_revenue_synced' | 'budget_accounting_synced' | 'budget_revenue_sync_failed' | 'budget_accounting_sync_failed' | 'accounting_totals_updated';
  project_id: string;
  project_name: string;
  data?: Record<string, unknown>;
  error?: string;
  timestamp: string;
}

// Configuration pour l'automatisation
export interface FinancialAutomationConfig {
  auto_create_revenue: boolean;
  auto_update_accounting: boolean;
  auto_notifications: boolean;
  default_revenue_category: string;
  default_accounting_category: string;
  milestone_tracking: boolean;
  payment_reminders: boolean;
  sync_frequency: 'immediate' | 'hourly' | 'daily';
}

// Types pour les erreurs et rollback
export interface FinancialRollbackData {
  project_id: string;
  revenue_entries: string[];
  accounting_accounting_entries: string[];
  timestamp: string;
  reason: string;
}

export interface FinancialError {
  type: 'revenue_creation_failed' | 'accounting_update_failed' | 'sync_failed' | 'rollback_failed';
  project_id: string;
  message: string;
  timestamp: string;
  stack?: string;
}

// Nouveau type pour la synchronisation des budgets
export interface BudgetSyncEvent {
  id: string;
  project_id: string;
  project_name: string;
  old_budget: number;
  new_budget: number;
  revenue_entry_id?: string;
  accounting_entry_id?: string;
  sync_status: 'pending' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
}

// Configuration pour la synchronisation budget
export interface BudgetSyncConfig {
  auto_sync_enabled: boolean;
  revenue_category: string;
  accounting_category: string;
  notification_enabled: boolean;
  rollback_on_error: boolean;
}

// Données consolidées pour l'affichage des budgets
export interface ProjectBudgetData {
  project_id: string;
  project_name: string;
  client_id: string;
  client_name: string;
  budget_amount: number;
  revenue_entry?: RevenueEntry;
  accounting_entry?: AccountingTransaction;
  sync_status: 'synced' | 'pending' | 'error';
  last_sync_at?: string;
} 