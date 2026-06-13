import { supabase } from '@/lib/supabase';

export interface YearlyStats {
  year: number;
  total_income: number;
  total_expenses: number;
  net_profit: number;
  projects_completed: number;
  tasks_completed: number;
  new_clients: number;
}

export interface ArchivedAccountingEntry {
  id: string;
  year: number;
  user_id: string;
  original_id: string;
  entry_date: string;
  description: string;
  amount: number;
  type: 'revenue' | 'expense';
  category: string;
  month_key: string;
  client_id: string | null;
  created_by: string;
  archived_at: string;
  original_data: Record<string, unknown>;
}

export class ArchiveService {
  static async getArchivedYears(): Promise<number[]> {
    const { data, error } = await supabase
      .from('yearly_stats')
      .select('year')
      .order('year', { ascending: false });

    if (error) {
      console.error('Erreur chargement années archivées:', error);
      return [];
    }
    return (data || []).map((r: { year: number }) => r.year);
  }

  static async getYearlyStats(year: number): Promise<YearlyStats | null> {
    const { data, error } = await supabase
      .from('yearly_stats')
      .select('*')
      .eq('year', year)
      .single();

    if (error) {
      console.error('Erreur chargement stats:', error);
      return null;
    }
    return data as YearlyStats;
  }

  static async getArchiveSummary(year: number): Promise<{ transactions: number; projects: number; tasks: number }> {
    const [txRes, projRes, taskRes] = await Promise.all([
      supabase.from('archived_accounting_entries').select('id', { count: 'exact', head: true }).eq('year', year),
      supabase.from('archived_projects').select('id', { count: 'exact', head: true }).eq('year', year),
      supabase.from('archived_tasks').select('id', { count: 'exact', head: true }).eq('year', year),
    ]);

    return {
      transactions: txRes.count || 0,
      projects: projRes.count || 0,
      tasks: taskRes.count || 0,
    };
  }

  static async getArchivedAccountingEntries(year: number): Promise<ArchivedAccountingEntry[]> {
    const { data, error } = await supabase
      .from('archived_accounting_entries')
      .select('*')
      .eq('year', year)
      .order('entry_date', { ascending: false });

    if (error) {
      console.error('Erreur chargement transactions archivées:', error);
      return [];
    }
    return (data || []) as ArchivedAccountingEntry[];
  }

  static async recalculateYearlyStatsFromArchive(year: number): Promise<{ success: boolean; stats?: YearlyStats }> {
    try {
      const { data: entries } = await supabase
        .from('archived_accounting_entries')
        .select('amount, type')
        .eq('year', year);

      const total_income = (entries || [])
        .filter((e: { type: string }) => e.type === 'revenue')
        .reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0);

      const total_expenses = (entries || [])
        .filter((e: { type: string }) => e.type === 'expense')
        .reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0);

      const { data: projCount } = await supabase
        .from('archived_projects')
        .select('id', { count: 'exact', head: true })
        .eq('year', year);

      const { error: updateError } = await supabase
        .from('yearly_stats')
        .update({
          total_income,
          total_expenses,
          net_profit: total_income - total_expenses,
          updated_at: new Date().toISOString(),
        })
        .eq('year', year);

      if (updateError) throw updateError;

      const stats = await this.getYearlyStats(year);
      return { success: true, stats: stats || undefined };
    } catch (err) {
      console.error('Erreur recalcul stats:', err);
      return { success: false };
    }
  }

  static async archiveYear(year: number): Promise<{ success: boolean; archived: { transactions: number; projects: number; tasks: number }; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;

      // Archive accounting entries
      const { data: entries } = await supabase
        .from('accounting_entries')
        .select('*')
        .gte('entry_date', `${year}-01-01`)
        .lte('entry_date', `${year}-12-31`);

      let archivedTx = 0;
      if (entries && entries.length > 0) {
        const archiveRows = entries.map((e: Record<string, unknown>) => ({
          year,
          user_id: userId,
          original_id: e.id,
          entry_date: e.entry_date,
          description: e.description,
          amount: e.amount,
          type: e.type,
          category: e.category,
          month_key: e.month_key,
          client_id: e.client_id,
          created_by: e.created_by,
          original_data: e,
        }));
        const { error: insertErr } = await supabase.from('archived_accounting_entries').insert(archiveRows);
        if (insertErr) throw insertErr;
        archivedTx = entries.length;

        const ids = entries.map((e: Record<string, unknown>) => e.id);
        await supabase.from('accounting_entries').delete().in('id', ids);
      }

      // Archive completed projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .in('status', ['termine', 'completed', 'livre'])
        .lte('created_at', `${year}-12-31T23:59:59`);

      let archivedProj = 0;
      if (projects && projects.length > 0) {
        const archiveProj = projects.map((p: Record<string, unknown>) => ({
          year,
          user_id: userId,
          original_id: p.id,
          name: p.name,
          client_id: p.client_id,
          client_name: p.client_name,
          status: p.status,
          start_date: p.start_date,
          end_date: p.end_date,
          budget: p.budget,
          total_amount: p.total_amount,
          assigned_to: p.assigned_to,
          original_data: p,
        }));
        await supabase.from('archived_projects').insert(archiveProj);
        archivedProj = projects.length;
      }

      // Archive completed tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .in('status', ['termine', 'completed', 'done'])
        .lte('created_at', `${year}-12-31T23:59:59`);

      let archivedTasks = 0;
      if (tasks && tasks.length > 0) {
        const archiveTasks = tasks.map((t: Record<string, unknown>) => ({
          year,
          user_id: userId,
          original_id: t.id,
          title: t.title,
          project_id: t.project_id,
          client_id: t.client_id,
          status: t.status,
          assigned_to: t.assigned_to,
          completed_at: t.completed_at,
          original_data: t,
        }));
        await supabase.from('archived_tasks').insert(archiveTasks);
        archivedTasks = tasks.length;
      }

      // Calculate and store yearly stats
      const total_income = (entries || [])
        .filter((e: Record<string, unknown>) => e.type === 'revenue')
        .reduce((sum: number, e: Record<string, unknown>) => sum + Number(e.amount), 0);
      const total_expenses = (entries || [])
        .filter((e: Record<string, unknown>) => e.type === 'expense')
        .reduce((sum: number, e: Record<string, unknown>) => sum + Number(e.amount), 0);

      await supabase.from('yearly_stats').upsert({
        user_id: userId,
        year,
        total_income,
        total_expenses,
        net_profit: total_income - total_expenses,
        projects_completed: archivedProj,
        tasks_completed: archivedTasks,
        new_clients: 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'year' });

      return {
        success: true,
        archived: { transactions: archivedTx, projects: archivedProj, tasks: archivedTasks },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur archivage:', err);
      return { success: false, archived: { transactions: 0, projects: 0, tasks: 0 }, error: message };
    }
  }

  static async updateArchivedEntry(id: string, data: Partial<Pick<ArchivedAccountingEntry, 'description' | 'amount' | 'type' | 'entry_date'>>): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('archived_accounting_entries')
      .update(data)
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  static async deleteArchivedEntry(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('archived_accounting_entries')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  static async addArchivedEntry(year: number, data: { description: string; amount: number; type: string; entry_date: string }): Promise<{ success: boolean; error?: string }> {
    const { data: user } = await supabase.auth.getUser();
    const userId = user?.user?.id;

    const { error } = await supabase.from('archived_accounting_entries').insert({
      year,
      user_id: userId,
      description: data.description,
      amount: data.amount,
      type: data.type,
      entry_date: data.entry_date,
      created_by: userId,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  }
}
