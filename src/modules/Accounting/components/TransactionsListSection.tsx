import { motion } from 'framer-motion';
import { FileText, Eye, Receipt, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { TransactionRow } from './TransactionRow';

export function TransactionsListSection({
  selectedMonth,
  accounting_entries
}: {
  selectedMonth: Date;
  accounting_entries: any[] | undefined;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-3xl bg-gradient-to-br from-surface-2 to-surface-2/50 border border-border/50 overflow-hidden"
    >
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-surface-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-white">
                Transactions - {selectedMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-xs text-muted-foreground">
                {accounting_entries?.length || 0} transaction(s) ce mois
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Eye className="h-3 w-3 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Temps réel</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {accounting_entries && accounting_entries.length > 0 ? (
          <div className="space-y-2">
            {accounting_entries.slice(0, 8).map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                index={index}
              />
            ))}
            {accounting_entries.length > 8 && (
              <div className="text-center pt-4">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-white"
                >
                  Voir les {accounting_entries.length - 8} autres transactions
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-surface-3/50 border border-border/50 flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Aucune transaction</h3>
            <p className="text-muted-foreground text-sm text-center max-w-md mb-4">
              Aucune transaction enregistrée pour {selectedMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
