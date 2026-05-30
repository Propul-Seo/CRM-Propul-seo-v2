import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ReceiptText } from 'lucide-react';
import { MobileHeader } from '../../components/mobile/MobileHeader';
import { cn } from '../../lib/utils';
import { useAccountingData } from './hooks/useAccountingData';
import { RevenueBreakdownSection } from './components/RevenueBreakdownSection';
import { MonthlySummarySection } from './components/MonthlySummarySection';
import { MonthlyTransactionsModal } from './MonthlyTransactionsModal';
import type { AccountingEntry } from '../../hooks/useMonthlyAccounting';

export function Accounting() {
  const {
    selectedMonth,
    mounted,
    currentYear,
    isMobile,
    annualStats,
    accounting_entries,
    currentMonthStats,
    loading,
    containerVariants,
    refreshAnnualData,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useAccountingData();

  const [showTransactionsModal, setShowTransactionsModal] = useState(false);

  const handleAdd = async (entry: Omit<AccountingEntry, 'id' | 'created_at' | 'updated_at'>) => {
    const result = await addTransaction(entry);
    if (result.success) {
      refreshAnnualData();
    }
    return result;
  };

  const handleUpdate = async (id: string, updates: Partial<AccountingEntry>) => {
    const result = await updateTransaction(id, updates);
    if (result.success) {
      refreshAnnualData();
    }
    return result;
  };

  const handleDelete = async (id: string) => {
    const result = await deleteTransaction(id);
    if (result.success) {
      refreshAnnualData();
    }
    return result;
  };

  return (
    <div className={cn(
      "min-h-screen bg-[#020205] text-[#ede9fe] relative overflow-hidden",
      isMobile && "pb-20"
    )}>
      {isMobile && <MobileHeader title="Comptabilité" />}

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(139,92,246,0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
        {!isMobile && (
          <>
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#8B5CF6]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#A78BFA]/5 rounded-full blur-3xl" />
          </>
        )}
      </div>

      <div className={cn(
        "relative z-10 max-w-[1600px] mx-auto",
        isMobile ? "p-4" : "p-4 lg:p-5"
      )}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-border border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Chargement des données financières...</p>
            </div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={mounted ? "visible" : "hidden"}
            className="space-y-4"
          >
            <div className={cn("flex", isMobile ? "justify-stretch" : "justify-end")}>
              <button
                type="button"
                onClick={() => setShowTransactionsModal(true)}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300/25 bg-gradient-to-r from-emerald-300 to-cyan-300 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-[0_18px_48px_rgba(34,211,238,0.18)] transition hover:scale-[1.01] hover:shadow-[0_20px_60px_rgba(34,211,238,0.25)]",
                  isMobile && "w-full"
                )}
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter une transaction</span>
                <ReceiptText className="h-4 w-4 opacity-70" />
              </button>
            </div>

            <RevenueBreakdownSection
              annualStats={annualStats}
              currentYear={currentYear}
              selectedMonth={selectedMonth}
              isMobile={isMobile}
            />

            <MonthlySummarySection
              selectedMonth={selectedMonth}
              currentMonthStats={currentMonthStats}
              isMobile={isMobile}
            />
          </motion.div>
        )}
      </div>

      <MonthlyTransactionsModal
        open={showTransactionsModal}
        onClose={() => setShowTransactionsModal(false)}
        month={selectedMonth}
        accounting_entries={(accounting_entries || []) as AccountingEntry[]}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        loading={loading}
      />
    </div>
  );
}
