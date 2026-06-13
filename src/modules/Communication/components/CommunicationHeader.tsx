import { Plus, LayoutGrid, Calendar, BarChart3 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import type { ViewMode } from '../types';

interface CommunicationHeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onNewPost: () => void;
  postCount: number;
  isMobile: boolean;
}

export function CommunicationHeader({ currentView, onViewChange, onNewPost, postCount, isMobile }: CommunicationHeaderProps) {
  const views = [
    { id: 'kanban' as ViewMode, label: 'Kanban', icon: LayoutGrid },
    { id: 'calendar' as ViewMode, label: 'Calendrier', icon: Calendar },
    { id: 'dashboard' as ViewMode, label: 'Dashboard', icon: BarChart3 },
  ];

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">
          {isMobile ? 'Comm.' : 'Communication'}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{postCount} post{postCount !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center bg-surface-2 rounded-lg p-0.5">
          {views.map(view => {
            const Icon = view.icon;
            return (
              <button key={view.id} onClick={() => onViewChange(view.id)} className={cn(
                'flex items-center gap-1.5 px-2.5 py-2 md:px-3 md:py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                currentView === view.id
                  ? 'bg-surface-3 text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{view.label}</span>
              </button>
            );
          })}
        </div>
        {!isMobile && (
          <Button onClick={onNewPost}>
            <Plus className="h-4 w-4 mr-2" />Nouveau post
          </Button>
        )}
      </div>
    </div>
  );
}
