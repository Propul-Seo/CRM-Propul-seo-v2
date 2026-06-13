import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../../lib/supabase';

// Hook pour calculer les revenus totaux depuis Supabase
export function useSupabaseRevenueCalculation() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateTotalRevenue = async () => {
    try {
      setLoading(true);
      setError(null);

      // Option 1: Calculer depuis les contacts
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('total_revenue')
        .not('total_revenue', 'is', null);

      if (contactsError) {
        throw contactsError;
      }

      interface ContactWithRevenue {
        total_revenue: number | null;
      }

      const revenueFromContacts = (contacts as ContactWithRevenue[] | null)?.reduce(
        (sum, contact) => sum + (contact.total_revenue || 0),
        0
      ) || 0;

      // Option 2: Calculer depuis la comptabilité (depuis Mai 2025)
      const { data: accountingEntries, error: accountingError } = await supabase
        .from('accounting_entries')
        .select('amount, month_key')
        .eq('type', 'revenue')
        .gte('month_key', '2025-05');

      if (accountingError) {
        throw accountingError;
      }

      interface AccountingEntryWithMonth {
        amount: number | string;
        month_key: string;
      }

      const revenueFromAccounting = (accountingEntries as AccountingEntryWithMonth[] | null)?.reduce(
        (sum, entry) => sum + parseFloat(String(entry.amount)),
        0
      ) || 0;

      const monthsWithData = (accountingEntries as AccountingEntryWithMonth[] | null)
        ?.map(entry => entry.month_key)
        .filter((value, index, self) => self.indexOf(value) === index) || [];
      const numberOfMonths = monthsWithData.length;

      const finalRevenue = revenueFromAccounting > 0 ? revenueFromAccounting : revenueFromContacts;

      logger.debug('Calcul revenus totaux (MAI 2025+):', {
        fromContacts: revenueFromContacts,
        fromAccounting: revenueFromAccounting,
        final: finalRevenue,
        numberOfMonths: numberOfMonths,
        averagePerMonth: numberOfMonths > 0 ? finalRevenue / numberOfMonths : 0,
        monthsWithData: monthsWithData
      });

      setTotalRevenue(finalRevenue);

    } catch (err) {
      logger.error('Erreur calcul revenus:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateTotalRevenue();
  }, []);

  return {
    totalRevenue,
    loading,
    error,
    refetch: calculateTotalRevenue
  };
}
