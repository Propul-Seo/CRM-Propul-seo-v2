import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { formatCurrency } from '../../../utils';
import { getCategoryLabel, getCategoryColorClasses } from '../constants';

export function TransactionRow({
  transaction,
  index
}: {
  transaction: any;
  index: number;
}) {
  const isRevenue = transaction.type === 'revenue';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group flex items-center justify-between p-4 rounded-xl bg-surface-2/30 hover:bg-surface-2/50 border border-transparent hover:border-border/50 transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center
          ${isRevenue ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}
        `}>
          {isRevenue ? (
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          ) : (
            <TrendingDown className="h-5 w-5 text-rose-400" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{transaction.description}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(transaction.entry_date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Badge className={`
          ${isRevenue
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }
        `}>
          {isRevenue ? 'Revenu' : 'Dépense'}
        </Badge>
        {isRevenue && transaction.revenue_category && (
          <Badge className={getCategoryColorClasses(transaction.revenue_category)}>
            {getCategoryLabel(transaction.revenue_category)}
          </Badge>
        )}
        <p className={`text-lg font-semibold ${isRevenue ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isRevenue ? '+' : '-'}{formatCurrency(transaction.amount)}
        </p>
      </div>
    </motion.div>
  );
}
