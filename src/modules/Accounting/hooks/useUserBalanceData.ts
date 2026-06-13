import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import type { AccountingEntry } from '../../../hooks/useMonthlyAccounting';
import type { UserBalanceData, CanonicalTotals } from '../types/userBalance';

const MAIN_USERS = [
  '9405f2c9-07d4-49c9-bc2c-7c2d40b07acc', // Paul
  '470c709c-abce-48c8-b8b3-320cd98a5ed5', // Team
  '590e317b-f7a5-4b02-887e-9f3b480618b8', // Antoine
  '5b27ba64-74e9-4f5a-99f5-a5e5fa36f9d4'  // Baptiste
];

const KNOWN_ID_TO_NAME: Record<string, string> = {
  '470c709c-abce-48c8-b8b3-320cd98a5ed5': 'Team',
  '9405f2c9-07d4-49c9-bc2c-7c2d40b07acc': 'Paul',
  '590e317b-f7a5-4b02-887e-9f3b480618b8': 'Antoine',
  'fd88df0b-5f3f-41e5-ba50-d58025293a52': 'Paul'
};

const USER_MAP: Record<string, string> = {
  '9405f2c9-07d4-49c9-bc2c-7c2d40b07acc': 'Paul',
  '470c709c-abce-48c8-b8b3-320cd98a5ed5': 'Team',
  '590e317b-f7a5-4b02-887e-9f3b480618b8': 'Antoine',
  'fd88df0b-5f3f-41e5-ba50-d58025293a52': 'Paul',
  '5b27ba64-74e9-4f5a-99f5-a5e5fa36f9d4': 'Baptiste'
};

const CANONICAL_USERS = ['Team', 'Paul', 'Antoine'];

function normalizeToCanonical(nameOrId?: string | null): string | null {
  if (!nameOrId) return null;
  const lower = nameOrId.toLowerCase();
  if (lower.includes('team') || lower.includes('etienne')) return 'Team';
  if (lower.includes('paul')) return 'Paul';
  if (lower.includes('antoine')) return 'Antoine';
  return null;
}

export function useUserBalanceData() {
  const [userBalances, setUserBalances] = useState<UserBalanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserBalances = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentDate = new Date();
      const may2025 = new Date(2025, 4, 1);

      const { data: entries, error: fetchError } = await supabase
        .from('accounting_entries')
        .select('*')
        .gte('entry_date', may2025.toISOString().split('T')[0])
        .lte('entry_date', currentDate.toISOString().split('T')[0])
        .order('entry_date', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Discover user columns dynamically
      const possibleUserColumns = ['user_id', 'created_by', 'assigned_to', 'owner_id', 'responsible_user_id', 'responsible_user_name'];
      let allUserIds: string[] = [];

      possibleUserColumns.forEach(col => {
        if (entries && entries.length > 0 && entries[0].hasOwnProperty(col)) {
          const values = [...new Set(entries.map(e => (e as any)[col]).filter(Boolean))];
          if (values.length > 0) {
            allUserIds = [...allUserIds, ...values];
          }
        }
      });

      allUserIds = [...new Set([...allUserIds, ...MAIN_USERS])];

      // Build dynamic users with name mapping
      const dynamicUsers = allUserIds.map(id => {
        let userName = USER_MAP[id];
        if (!userName && entries) {
          const entryWithName = entries.find(e => (e as any).responsible_user_id === id);
          if (entryWithName && (entryWithName as any).responsible_user_name) {
            userName = (entryWithName as any).responsible_user_name;
          }
        }
        return { id, name: userName || `Utilisateur ${id.slice(0, 8)}` };
      });

      // Find entries without responsible_user_id
      const entriesWithoutUser = entries?.filter(entry => !(entry as any).responsible_user_id) || [];

      // Calculate balances per user
      const balances: UserBalanceData[] = dynamicUsers.map(user => {
        let userEntries = entries?.filter(entry => (entry as any).responsible_user_id === user.id) || [];

        // Distribute unattributed entries among main users
        if (MAIN_USERS.includes(user.id) && entriesWithoutUser.length > 0) {
          const userIndex = MAIN_USERS.indexOf(user.id);
          const entriesPerUser = Math.ceil(entriesWithoutUser.length / MAIN_USERS.length);
          const startIndex = userIndex * entriesPerUser;
          const endIndex = Math.min(startIndex + entriesPerUser, entriesWithoutUser.length);
          const assignedEntries = entriesWithoutUser.slice(startIndex, endIndex);
          if (assignedEntries.length > 0) {
            userEntries = [...userEntries, ...assignedEntries];
          }
        }

        const revenues = userEntries
          .filter(entry => entry.type === 'revenue')
          .reduce((sum, entry) => sum + parseFloat(entry.amount.toString()), 0);

        const expenses = userEntries
          .filter(entry => entry.type === 'expense')
          .reduce((sum, entry) => sum + parseFloat(entry.amount.toString()), 0);

        return {
          userId: user.id,
          userName: user.name,
          totalRevenues: revenues,
          totalExpenses: expenses,
          netBalance: revenues - expenses,
          revenueCount: userEntries.filter(entry => entry.type === 'revenue').length,
          expenseCount: userEntries.filter(entry => entry.type === 'expense').length
        };
      });

      // Filter out users with zero data, preserving those with expenses
      const filteredBalances = balances.filter(b => b.totalRevenues > 0 || b.totalExpenses > 0);

      const totalChargesAllUsers = balances.reduce((sum, b) => sum + b.totalExpenses, 0);
      const totalChargesFiltered = filteredBalances.reduce((sum, b) => sum + b.totalExpenses, 0);

      if (totalChargesFiltered < totalChargesAllUsers) {
        const missingUsers = balances.filter(
          b => b.totalExpenses > 0 && !filteredBalances.find(f => f.userId === b.userId)
        );
        missingUsers.forEach(user => {
          if (!filteredBalances.find(f => f.userId === user.userId)) {
            filteredBalances.push(user);
          }
        });
      }

      // Aggregate into canonical users (Team, Paul, Antoine)
      const totalsByCanonical: Record<string, CanonicalTotals> = {
        Team: { revenues: 0, expenses: 0, revenueCount: 0, expenseCount: 0 },
        Paul: { revenues: 0, expenses: 0, revenueCount: 0, expenseCount: 0 },
        Antoine: { revenues: 0, expenses: 0, revenueCount: 0, expenseCount: 0 }
      };

      (entries || []).forEach((entry: AccountingEntry & { responsible_user_id?: string; responsible_user_name?: string }) => {
        let canonical: string | null = null;

        if (entry.responsible_user_id) {
          canonical = KNOWN_ID_TO_NAME[entry.responsible_user_id] || null;
        }
        if (!canonical && entry.responsible_user_name) {
          canonical = normalizeToCanonical(entry.responsible_user_name);
        }
        if (!canonical && entry.description) {
          canonical = normalizeToCanonical(entry.description);
        }

        if (!canonical || !totalsByCanonical[canonical]) return;

        const amount = parseFloat(entry.amount?.toString() || '0');
        if (entry.type === 'revenue') {
          totalsByCanonical[canonical].revenues += amount;
          totalsByCanonical[canonical].revenueCount += 1;
        } else if (entry.type === 'expense') {
          totalsByCanonical[canonical].expenses += amount;
          totalsByCanonical[canonical].expenseCount += 1;
        }
      });

      // Build final canonical balances
      const canonicalBalances: UserBalanceData[] = CANONICAL_USERS.map(userName => {
        const t = totalsByCanonical[userName];
        return {
          userId: userName,
          userName,
          totalRevenues: t.revenues,
          totalExpenses: t.expenses,
          netBalance: t.revenues - t.expenses,
          revenueCount: t.revenueCount,
          expenseCount: t.expenseCount
        };
      });

      const finalBalances = canonicalBalances
        .filter(b => b.totalRevenues > 0 || b.totalExpenses > 0)
        .filter(b => !b.userName.toLowerCase().startsWith('utilisateur '));

      setUserBalances(finalBalances);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur UserBalance:', errorMessage);
      setError(errorMessage);
      toast.error(`Erreur chargement bilans: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBalances();

    const subscription = supabase
      .channel('accounting_entries_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounting_entries' },
        () => {
          setTimeout(() => fetchUserBalances(), 500);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const usersWithData = userBalances.filter(b => b.totalRevenues > 0 || b.totalExpenses > 0);
  const totalRevenues = usersWithData.reduce((sum, b) => sum + b.totalRevenues, 0);
  const totalExpenses = usersWithData.reduce((sum, b) => sum + b.totalExpenses, 0);

  return {
    userBalances,
    usersWithData,
    totalRevenues,
    totalExpenses,
    loading,
    error,
    handleRefresh: fetchUserBalances
  };
}
