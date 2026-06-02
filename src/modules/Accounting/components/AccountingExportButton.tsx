import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { buildCsvContent, type AccountingExportRow } from '../lib/exportCsv';
import { triggerCsvDownload } from '../lib/downloadCsv';

interface AccountingExportButtonProps {
  rows: AccountingExportRow[];
  filenameBase: string;
}

export function AccountingExportButton({ rows, filenameBase }: AccountingExportButtonProps) {
  const handleExport = () => {
    if (rows.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }
    triggerCsvDownload(`${filenameBase}.csv`, buildCsvContent(rows));
    toast.success(`${rows.length} ligne${rows.length > 1 ? 's' : ''} exportée${rows.length > 1 ? 's' : ''}`);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-surface-2/80 px-3 text-sm font-medium text-foreground outline-none transition-colors hover:border-white/20 focus:border-primary/60"
    >
      <Download className="h-4 w-4" />
      <span>Exporter CSV</span>
    </button>
  );
}
