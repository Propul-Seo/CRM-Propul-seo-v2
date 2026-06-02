import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
    setSelectedMonth,
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
  const revenueOverviewRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (loading) return;

    let frameId = 0;
    const timeoutId = window.setTimeout(() => alignAccountingOverview(revenueOverviewRef.current), 120);

    frameId = window.requestAnimationFrame(() => {
      alignAccountingOverview(revenueOverviewRef.current);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [loading]);

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

  const previousMonthStats = useMemo(() => {
    const prev = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
    const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    const stats = annualStats.monthlyStats[prevKey];
    return stats ? { revenue: stats.revenues, expenses: stats.expenses, result: stats.result } : null;
  }, [annualStats.monthlyStats, selectedMonth]);

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
            className="space-y-3"
          >
            <div ref={revenueOverviewRef} className="scroll-mt-3">
              <RevenueBreakdownSection
                annualStats={annualStats}
                currentYear={currentYear}
                selectedMonth={selectedMonth}
                isMobile={isMobile}
                onAddTransaction={() => setShowTransactionsModal(true)}
                currentMonthStats={currentMonthStats}
                onSelectMonth={setSelectedMonth}
                monthlySummary={
                  <MonthlySummarySection
                    selectedMonth={selectedMonth}
                    currentMonthStats={currentMonthStats}
                    previousMonthStats={previousMonthStats}
                    isMobile={isMobile}
                  />
                }
              />
            </div>
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

function alignAccountingOverview(target: HTMLDivElement | null) {
  if (!target) return;

  const scrollParent = findScrollParent(target);
  const offset = 12;

  if (scrollParent === window) {
    window.scrollTo({
      top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset),
      behavior: 'auto',
    });
    return;
  }

  const parentRect = scrollParent.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  scrollParent.scrollTo({
    top: Math.max(0, scrollParent.scrollTop + targetRect.top - parentRect.top - offset),
    behavior: 'auto',
  });
}

function findScrollParent(node: HTMLElement): HTMLElement | Window {
  let parent = node.parentElement;

  while (parent) {
    const overflowY = window.getComputedStyle(parent).overflowY;
    if (/(auto|scroll|overlay)/.test(overflowY) && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
    parent = parent.parentElement;
  }

  return window;
}
