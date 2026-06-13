import { motion } from 'framer-motion';
import { BarChart3, EyeOff, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { RevenueChart } from '../../../components/charts/RevenueChart';
import { EmptyState } from '../../../components/common/EmptyState';
import { cn } from '../../../lib/utils';
import { itemVariants } from '../lib/animations';

interface RevenueChartSectionProps {
  isPrivacyMode: boolean;
  isMobile: boolean;
  accountingLoading: boolean;
  accountingEntries: unknown[] | null | undefined;
  onNavigateToAccounting: () => void;
}

export function RevenueChartSection({ isPrivacyMode, isMobile, accountingLoading, accountingEntries, onNavigateToAccounting }: RevenueChartSectionProps) {
  return (
    <motion.div variants={itemVariants} className={cn(isMobile ? "col-span-2" : "col-span-12 lg:col-span-8")}>
      <div className={cn(
        "overflow-hidden rounded-2xl border border-violet-500/25 bg-[radial-gradient(circle_at_18%_10%,rgba(147,51,234,0.13),transparent_32%),linear-gradient(180deg,rgba(17,14,26,0.86),rgba(7,7,13,0.9))] shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl",
        isMobile ? "p-4" : "p-5"
      )}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/20 text-violet-200">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Évolution du chiffre d'affaires</h3>
              <p className="text-xs text-violet-100/58">Comparaison mensuelle</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToAccounting}
            className="rounded-lg border border-white/[0.08] bg-white/[0.035] text-violet-100/66 hover:bg-white/[0.07] hover:text-white"
          >
            Voir détails
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className={cn("rounded-xl border border-white/[0.08] bg-black/[0.12]", isMobile ? "h-60" : "h-[360px]")}>
          {isPrivacyMode ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <EyeOff className="h-12 w-12 text-violet-100/28 mx-auto mb-3" />
                <p className="text-violet-100/52">Données masquées</p>
              </div>
            </div>
          ) : accountingLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-white/10 border-t-violet-400 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-violet-100/52">Chargement des données...</p>
              </div>
            </div>
          ) : accountingEntries && (accountingEntries as unknown[]).length > 0 ? (
            <RevenueChart isPrivacyMode={false} />
          ) : (
            <EmptyState
              icon={<BarChart3 className="h-8 w-8" />}
              title="Aucune donnée comptable"
              description="Ajoutez des entrées pour visualiser l'évolution."
              actionLabel="Ajouter une entrée"
              onAction={onNavigateToAccounting}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
