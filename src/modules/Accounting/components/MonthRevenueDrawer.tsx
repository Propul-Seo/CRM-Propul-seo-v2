import { useEffect, useState } from 'react';
import { TrendingUp, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/utils';
import { Badge } from '@/components/ui/badge';
import type { AccountingEntry } from '@/hooks/useMonthlyAccounting';
import { getCategoryLabel, getCategoryColorClasses } from '../constants';

interface MonthRevenueDrawerProps {
  month: Date | null;
  onClose: () => void;
}

function monthKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function MonthRevenueDrawer({ month, onClose }: MonthRevenueDrawerProps) {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!month) return;
    let active = true;
    setLoading(true);
    setError(false);
    setEntries([]); // évite d'afficher le total du mois précédent pendant le fetch
    const key = monthKeyOf(month);
    (async () => {
      const { data, error: err } = await supabase
        .from('accounting_entries')
        .select('*')
        .eq('type', 'revenue')
        .eq('month_key', key)
        .order('entry_date', { ascending: true });
      if (!active) return;
      if (err) setError(true);
      else setEntries((data as AccountingEntry[]) || []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [month]);

  if (!month) return null;

  const monthLabel = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const totalCA = entries.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md">
      <button
        type="button"
        aria-label="Fermer le détail du chiffre d'affaires"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col border-l border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.13),transparent_34%),linear-gradient(180deg,rgba(18,16,28,0.98),rgba(8,8,14,0.99))] shadow-[-28px_0_80px_rgba(0,0,0,0.42)]">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-500/15 text-cyan-200">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Détail du chiffre d'affaires</h2>
                <p className="mt-1 text-sm capitalize text-violet-100/60">{monthLabel}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-100/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] p-3">
            <p className="text-xs text-cyan-100/55">CA du mois</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-cyan-300">{formatCurrency(totalCA)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">Revenus du mois</h3>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-violet-100/70">
              {entries.length}
            </span>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-cyan-400" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-dashed border-rose-500/25 bg-rose-500/[0.06] px-4 py-8 text-center text-rose-200/80">
              <p className="text-sm font-medium">Erreur lors du chargement des revenus</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] px-4 py-8 text-center text-violet-100/55">
              <p className="text-sm font-medium">Aucun revenu pour ce mois</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{e.description}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-violet-100/50">
                        {new Date(e.entry_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                      {e.revenue_category && (
                        <Badge className={getCategoryColorClasses(e.revenue_category)}>{getCategoryLabel(e.revenue_category)}</Badge>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-cyan-300">{formatCurrency(Number(e.amount))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
