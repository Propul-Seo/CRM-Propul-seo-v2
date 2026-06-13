import { cn } from '@/lib/utils';
import type { PortalTab } from '@/modules/EspaceClient/shared/constants';
import { PORTAL_NAV } from './portal-nav';

interface PortalTabBarProps {
  activeTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
}

/**
 * Barre de navigation mobile (bas d'écran, `< lg`). Sur desktop la
 * navigation vit dans PortalSidebar.
 */
export function PortalTabBar({ activeTab, onTabChange }: PortalTabBarProps) {
  const visibleTabs = PORTAL_NAV.filter(t => t.primary);

  return (
    <nav
      aria-label="Navigation principale"
      className="ps-safe-bottom ps-frosted fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--ps-border-soft)] lg:hidden"
    >
      {visibleTabs.map(tab => {
        const Icon = tab.icon;
        const active = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors duration-200',
              'min-h-[60px] touch-manipulation',
              active ? 'text-[var(--ps-primary-text)]' : 'text-[var(--ps-fg-muted)]',
            )}
          >
            <span
              className={cn(
                'flex h-7 w-12 items-center justify-center rounded-full transition-all duration-300 [transition-timing-function:var(--ps-ease-out)]',
                'group-active:scale-90',
                active
                  ? 'bg-[var(--ps-primary-subtle)] scale-100'
                  : 'bg-transparent scale-95 group-hover:bg-[var(--ps-bg-subtle)]',
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.9} />
            </span>
            <span className={cn('text-[10.5px] tracking-tight', active ? 'font-semibold' : 'font-medium')}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
