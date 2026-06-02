import { useEffect, useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { getEffectivePaymentStatus } from '@/modules/Accounting/lib/paymentStatus';
import type { AccountingEntry, MonthlyMetrics } from './useMonthlyAccounting';

export interface AnnualStats {
  totalRevenues: number;
  totalCollected: number; // revenus encaissés (statut payé) ; le reste = en attente
  totalExpenses: number;
  totalResult: number;
  averageRevenue: number;
  averageExpenses: number;
  activeMonths: number;
  totalMonths: number;
  monthlyStats: {
    [month: string]: {
      revenues: number;
      collected: number;
      expenses: number;
      result: number;
      count: number;
    };
  };
}

export const useAnnualAccounting = () => {
  const [annualStats, setAnnualStats] = useState<AnnualStats>({
    totalRevenues: 0,
    totalCollected: 0,
    totalExpenses: 0,
    totalResult: 0,
    averageRevenue: 0,
    averageExpenses: 0,
    activeMonths: 0,
    totalMonths: 0,
    monthlyStats: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger toutes les données de l'année en cours
  const fetchAnnualData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentYear = new Date().getFullYear();
      const startMonthKey = `${currentYear}-01`; // Janvier de l'année en cours
      const endMonthKey = `${currentYear + 1}-01`; // Janvier de l'année suivante

      // Récupérer toutes les accounting_entries de l'année en cours
      const { data: accounting_entries, error: txError } = await supabase
        .from('accounting_entries')
        .select('*')
        .gte('month_key', startMonthKey)
        .lt('month_key', endMonthKey)
        .order('entry_date', { ascending: false });

      if (txError) throw new Error(txError.message);

      // Calculer les statistiques annuelles depuis les vraies données
      const monthlyStats: { [month: string]: { revenues: number; collected: number; expenses: number; result: number; count: number } } = {};

      // Initialiser tous les mois de l'année en cours
      for (let month = 1; month <= 12; month++) {
        const monthKey = `${currentYear}-${month.toString().padStart(2, '0')}`;
        monthlyStats[monthKey] = {
          revenues: 0,
          collected: 0,
          expenses: 0,
          result: 0,
          count: 0
        };
      }

      // Remplir avec les vraies données comptables
      if (accounting_entries) {
        logger.debug('📊 Données comptables récupérées:', accounting_entries.length, 'entrées');
        
        accounting_entries.forEach(entry => {
          const monthKey = entry.month_key;
          const amount = parseFloat(entry.amount || 0);
          
          console.log(`📝 Entrée: ${entry.type} - ${amount}€ - Mois: ${monthKey}`);
          
          if (monthlyStats[monthKey]) {
            if (entry.type === 'revenue') {
              monthlyStats[monthKey].revenues += amount;
              if (getEffectivePaymentStatus(entry) === 'paid') {
                monthlyStats[monthKey].collected += amount;
              }
              console.log(`💰 Revenu ajouté pour ${monthKey}: ${amount}€ (Total: ${monthlyStats[monthKey].revenues}€)`);
            } else if (entry.type === 'expense') {
              monthlyStats[monthKey].expenses += amount;
              console.log(`💸 Dépense ajoutée pour ${monthKey}: ${amount}€ (Total: ${monthlyStats[monthKey].expenses}€)`);
            }
            monthlyStats[monthKey].count += 1;
          } else {
            console.log(`⚠️ Mois non trouvé: ${monthKey}`);
          }
        });

        // Calculer les résultats par mois
        Object.keys(monthlyStats).forEach(monthKey => {
          monthlyStats[monthKey].result = monthlyStats[monthKey].revenues - monthlyStats[monthKey].expenses;
          console.log(`📈 Mois ${monthKey}: Revenus=${monthlyStats[monthKey].revenues}€, Dépenses=${monthlyStats[monthKey].expenses}€, Résultat=${monthlyStats[monthKey].result}€`);
        });
      }

      // Calculer les totaux annuels
      const totalRevenues = Object.values(monthlyStats).reduce((sum, month) => sum + month.revenues, 0);
      const totalCollected = Object.values(monthlyStats).reduce((sum, month) => sum + month.collected, 0);
      const totalExpenses = Object.values(monthlyStats).reduce((sum, month) => sum + month.expenses, 0);
      const totalResult = totalRevenues - totalExpenses;

      logger.debug('🔢 Calcul des totaux:');
      Object.keys(monthlyStats).forEach(monthKey => {
        console.log(`  ${monthKey}: Revenus=${monthlyStats[monthKey].revenues}€, Dépenses=${monthlyStats[monthKey].expenses}€`);
      });
      console.log(`📊 TOTAUX: Revenus=${totalRevenues}€, Dépenses=${totalExpenses}€, Résultat=${totalResult}€`);

      // Calculer les mois actifs (avec des accounting_entries)
      const activeMonths = Object.values(monthlyStats).filter(month =>
        month.revenues > 0 || month.expenses > 0
      ).length;

      // Calculer les moyennes (sur les mois actifs uniquement)
      const averageRevenue = activeMonths > 0 ? totalRevenues / activeMonths : 0;
      const averageExpenses = activeMonths > 0 ? totalExpenses / activeMonths : 0;

      logger.debug('💰 Calcul annuel:', {
        totalRevenues,
        totalExpenses,
        totalResult,
        activeMonths,
        averageRevenue,
        averageExpenses,
        monthlyStats
      });

      setAnnualStats({
        totalRevenues,
        totalCollected,
        totalExpenses,
        totalResult,
        averageRevenue,
        averageExpenses,
        activeMonths,
        totalMonths: 12,
        monthlyStats
      });

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
      toast.error('Erreur chargement données annuelles: ' + msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les données au montage
  useEffect(() => {
    fetchAnnualData();
  }, [fetchAnnualData]);

  return {
    annualStats,
    loading,
    error,
    refreshData: fetchAnnualData
  };
}; 