import { memo, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  X,
  ListTodo,
  BarChart3,
  UserCheck,
  Briefcase,
  Archive,
  MessageSquare,
  DollarSign,
  Settings,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { routes } from '../../lib/routes';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: routes.personalTasks,             icon: ListTodo,       label: 'Mes Tâches' },
  { to: routes.dashboard,                 icon: BarChart3,      label: 'Dashboard' },
  { to: routes.leadsV3,                   icon: UserCheck,      label: 'Leads' },
  { to: routes.projectsV3,                icon: Briefcase,      label: 'Projets actifs' },
  { to: routes.projectsV3Completed,       icon: Archive,        label: 'Projets terminés' },
  { to: routes.communicationV3Production, icon: MessageSquare,  label: 'Communication' },
  { to: routes.communicationV3Kpi,        icon: BarChart3,      label: 'KPI Communication' },
  { to: routes.accounting,                icon: DollarSign,     label: 'Comptabilité' },
  { to: routes.settings,                  icon: Settings,       label: 'Paramètres' },
];

export const MobileNavFAB = memo(function MobileNavFAB() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleNav = useCallback((to: string) => {
    navigate(to);
    setIsOpen(false);
  }, [navigate]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-[9998] animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-up menu */}
      {isOpen && (
        <div className="md:hidden fixed bottom-24 right-4 z-[9999] w-56 animate-slide-up">
          <div className="bg-surface-1 border border-border/40 rounded-2xl shadow-2xl overflow-hidden">
            <div className="py-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');

                return (
                  <button
                    key={item.to}
                    onClick={() => handleNav(item.to)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors duration-150",
                      isActive
                        ? "bg-neon/10 text-neon-glow"
                        : "text-muted-foreground hover:bg-surface-2 active:bg-surface-3"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                    <span className={cn("text-sm", isActive ? "font-semibold" : "font-medium")}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          "md:hidden fixed bottom-6 right-6 z-[9999]",
          "w-14 h-14 rounded-full shadow-lg",
          "flex items-center justify-center",
          "transition-all duration-200",
          "active:scale-95 active:shadow-md",
          isOpen
            ? "bg-surface-2 shadow-xl"
            : "bg-primary hover:bg-primary/90"
        )}
        aria-label="Menu de navigation"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-foreground" />
        ) : (
          <LayoutGrid className="w-6 h-6 text-white" />
        )}
      </button>
    </>
  );
});

export default MobileNavFAB;
