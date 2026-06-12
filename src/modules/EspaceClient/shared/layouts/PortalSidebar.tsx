import { ChevronRight, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { BrandPill } from '@/modules/EspaceClient/shared/components';
import type { PortalTab } from '@/modules/EspaceClient/shared/constants';
import { PORTAL_NAV } from './portal-nav';

interface PortalSidebarProps {
  activeTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  clientName: string;
  projectName?: string;
  /** La page Profil est active (elle n'est pas un onglet de PORTAL_NAV). */
  profileActive: boolean;
  onProfile: () => void;
  onLogout: () => void;
  initials: string;
}

/**
 * Sidebar de navigation du portail client (desktop uniquement, `lg:` et plus).
 * Remplace l'ancienne barre d'onglets du header. Le décalage
 * `--ps-header-top` réserve la place du bandeau d'aperçu admin.
 */
export function PortalSidebar({
  activeTab,
  onTabChange,
  clientName,
  projectName,
  profileActive,
  onProfile,
  onLogout,
  initials,
}: PortalSidebarProps) {
  return (
    <aside
      className="fixed bottom-0 left-0 top-[var(--ps-header-top,0px)] z-30 hidden w-[248px] flex-col border-r border-[var(--ps-border-soft)] bg-[var(--ps-bg-elevated)] lg:flex"
      aria-label="Navigation principale"
    >
      {/* Marque */}
      <div className="px-5 pb-4 pt-5">
        <BrandPill />
        <p className="ps-eyebrow ps-eyebrow-muted mt-2.5">
          Espace client
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-0.5">
          {PORTAL_NAV.map(item => {
            const Icon = item.icon;
            const active = !profileActive && item.key === activeTab;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => onTabChange(item.key)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] font-medium tracking-tight transition-[background-color,color,transform] duration-200 [transition-timing-function:var(--ps-ease)] active:scale-[0.99]',
                    active
                      ? 'bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)]'
                      : 'text-[var(--ps-fg-secondary)] hover:bg-[var(--ps-bg-subtle)] hover:text-[var(--ps-fg)]',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.3 : 1.9} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Identité + actions */}
      <div className="border-t border-[var(--ps-border-soft)] p-3">
        <button
          type="button"
          onClick={onProfile}
          aria-current={profileActive ? 'page' : undefined}
          className={cn(
            'group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-[background-color,color,transform] duration-200 [transition-timing-function:var(--ps-ease)] active:scale-[0.99]',
            profileActive
              ? 'bg-[var(--ps-primary-subtle)]'
              : 'hover:bg-[var(--ps-bg-subtle)]',
          )}
        >
          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-[var(--ps-primary-subtle)] ring-offset-1 ring-offset-[color:var(--ps-bg-elevated)]">
            <AvatarFallback className="ps-brand-gradient text-[11px] font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold leading-tight tracking-tight text-[var(--ps-fg)]">
              {clientName}
            </span>
            <span className="block truncate text-[11px] leading-tight text-[var(--ps-fg-muted)]">
              {projectName ?? 'Mon profil'}
            </span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--ps-fg-muted)] transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium text-[var(--ps-fg-muted)] transition-[background-color,color,transform] duration-200 [transition-timing-function:var(--ps-ease)] hover:bg-[var(--ps-bg-subtle)] hover:text-[var(--ps-fg)] active:scale-[0.99]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
