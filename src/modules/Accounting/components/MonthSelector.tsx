import { Button } from '../../../components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function MonthSelector({
  selectedMonth,
  onMonthChange,
  canGoPrev,
  canGoNext
}: {
  selectedMonth: Date;
  onMonthChange: (direction: 'prev' | 'next') => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onMonthChange('prev')}
        disabled={!canGoPrev}
        className="h-10 w-10 p-0 rounded-xl bg-surface-3/50 border border-border/50 text-muted-foreground hover:text-white hover:bg-surface-3 disabled:opacity-30"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="px-4 py-2 rounded-xl bg-surface-3/50 border border-border/50 min-w-[160px] text-center">
        <span className="text-white font-medium capitalize">
          {selectedMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onMonthChange('next')}
        disabled={!canGoNext}
        className="h-10 w-10 p-0 rounded-xl bg-surface-3/50 border border-border/50 text-muted-foreground hover:text-white hover:bg-surface-3 disabled:opacity-30"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
