import { useEffect, type ReactNode } from 'react';
import { LogOut, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PortalTabBar } from './PortalTabBar';
import { PortalContactFab } from './PortalContactFab';
import { AGENCY_NAME, type PortalTab } from '@/modules/EspaceClient/shared/constants';
import './portal-theme.css';

interface PortalLayoutProps {
  children: ReactNode;
  activeTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  clientName: string;
  projectName?: string;
  onLogout: () => void;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

export function PortalLayout({
  children,
  activeTab,
  onTabChange,
  clientName,
  projectName,
  onLogout,
}: PortalLayoutProps) {
  // Force light theme while the portal is mounted (the CRM admin uses
  // a global `dark` class on <html>). The portal is only ever mounted from
  // inside the CRM, which always sets `dark` — so we unconditionally
  // restore it on unmount (idempotent if it was never removed).
  // Force light theme while the portal is mounted. Mémorise l'état initial
  // pour restaurer fidèlement au démontage — robuste aux contextes hors CRM
  // (Storybook, tests, future page standalone).
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    html.classList.remove('dark');
    return () => {
      if (hadDark) html.classList.add('dark');
    };
  }, []);

  return (
    <div className="propulspace-portal flex min-h-screen flex-col">
      <header className="ps-frosted sticky top-0 z-20 border-b border-[var(--ps-border-soft)]">
        <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div
              className="ps-brand-gradient flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-bold tracking-tight text-white shadow-[0_2px_8px_-2px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.18)]"
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
              {AGENCY_NAME}
            </div>
            <span className="hidden h-5 w-px bg-[var(--ps-border)] sm:block" />
            <span className="hidden text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--ps-text-muted)] sm:inline">
              Espace client
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden text-right sm:block">
              <p className="text-[13px] font-semibold leading-tight tracking-tight text-[var(--ps-text-primary)]">
                {clientName}
              </p>
              {projectName && (
                <p className="text-[11px] leading-tight text-[var(--ps-text-muted)]">
                  {projectName}
                </p>
              )}
            </div>
            <Avatar
              className="h-9 w-9 ring-2 ring-[var(--ps-primary-subtle)] ring-offset-2 ring-offset-white transition-transform duration-200 [transition-timing-function:var(--ps-ease)] hover:scale-105"
            >
              <AvatarFallback
                className="ps-brand-gradient text-[12px] font-bold text-white"
              >
                {getInitials(clientName)}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              aria-label="Se déconnecter"
              className="h-9 w-9 rounded-full p-0 text-[var(--ps-text-muted)] hover:bg-[var(--ps-background-subtle)] hover:text-[var(--ps-text-primary)]"
            >
              <LogOut className="h-[15px] w-[15px]" />
            </Button>
          </div>
        </div>
        <PortalTabBar activeTab={activeTab} onTabChange={onTabChange} variant="desktop" />
      </header>

      <main className="ps-fade-in mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-8 md:px-6 md:pb-14 md:pt-10">
        {children}
      </main>

      <footer className="border-t border-[var(--ps-border-soft)] bg-white/40 py-5 text-center text-[11px] text-[var(--ps-text-muted)]">
        <span className="font-medium tracking-tight">{AGENCY_NAME}</span>
        <span className="mx-2 opacity-40">·</span>
        <a href="#" className="hover:underline">Mentions légales</a>
        <span className="mx-2 opacity-40">·</span>
        <a href="#" className="hover:underline">Confidentialité</a>
        <span className="mx-2 opacity-40">·</span>
        <span className="opacity-70">© 2026</span>
      </footer>

      <PortalTabBar activeTab={activeTab} onTabChange={onTabChange} variant="mobile" />
      <PortalContactFab projectName={projectName} />
    </div>
  );
}
