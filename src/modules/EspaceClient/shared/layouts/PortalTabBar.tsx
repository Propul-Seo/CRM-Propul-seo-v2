import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Receipt,
  PenLine,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PortalTab } from '@/modules/EspaceClient/shared/constants';

interface TabDef {
  key: PortalTab;
  label: string;
  icon: typeof LayoutDashboard;
  primary: boolean;
}

const TABS: TabDef[] = [
  { key: 'dashboard',  label: 'Accueil',     icon: LayoutDashboard, primary: true },
  { key: 'project',    label: 'Projet',      icon: FolderKanban,    primary: true },
  { key: 'documents',  label: 'Documents',   icon: FileText,        primary: true },
  { key: 'invoices',   label: 'Factures',    icon: Receipt,         primary: true },
  { key: 'signatures', label: 'Signatures',  icon: PenLine,         primary: false },
  { key: 'help',       label: 'Aide',        icon: HelpCircle,      primary: false },
];

interface PortalTabBarProps {
  activeTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  variant: 'mobile' | 'desktop';
}

export function PortalTabBar({ activeTab, onTabChange, variant }: PortalTabBarProps) {
  const visibleTabs = variant === 'mobile' ? TABS.filter(t => t.primary) : TABS;

  if (variant === 'mobile') {
    return (
      <nav
        aria-label="Navigation principale"
        className="ps-safe-bottom ps-frosted fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--ps-border-soft)] md:hidden"
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
                  active
                    ? 'bg-[var(--ps-primary-subtle)] scale-100'
                    : 'bg-transparent scale-95 group-hover:bg-[var(--ps-bg-subtle)]',
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.8} />
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

  return (
    <nav
      aria-label="Navigation principale"
      className="hidden gap-0.5 border-t border-[var(--ps-border-soft)] px-3 md:flex"
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
              'relative flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-[13px] font-medium tracking-tight transition-all duration-200 [transition-timing-function:var(--ps-ease)]',
              'my-1.5',
              active
                ? 'bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)] shadow-[inset_0_0_0_1px_rgba(124,58,237,0.12)]'
                : 'text-[var(--ps-fg-secondary)] hover:bg-[var(--ps-bg-subtle)] hover:text-[var(--ps-fg)]',
            )}
          >
            <Icon className="h-[15px] w-[15px]" strokeWidth={active ? 2.4 : 1.9} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
