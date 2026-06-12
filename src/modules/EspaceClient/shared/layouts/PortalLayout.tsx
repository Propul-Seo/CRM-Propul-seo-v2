import { useEffect, type ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PortalSidebar } from './PortalSidebar';
import { PortalTabBar } from './PortalTabBar';
import { PortalContactFab } from './PortalContactFab';
import { BrandPill } from '@/modules/EspaceClient/shared/components';
import { AGENCY_NAME, type PortalTab } from '@/modules/EspaceClient/shared/constants';
import './portal-theme.css';

interface PortalLayoutProps {
  children: ReactNode;
  activeTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  clientName: string;
  projectName?: string;
  /** La page Profil est affichée (atteinte via le bloc identité, pas un onglet). */
  profileActive: boolean;
  onProfile: () => void;
  onLogout: () => void;
  /** WhatsApp du membre assigné, transmis au FAB de contact. */
  whatsappNumber?: string | null;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

/**
 * Layout du portail client : sidebar de navigation sur desktop (`lg+`),
 * header compact + barre d'onglets en bas sur mobile. Le décalage
 * `--ps-header-top` (bandeau d'aperçu admin) est respecté des deux côtés.
 */
export function PortalLayout({
  children,
  activeTab,
  onTabChange,
  clientName,
  projectName,
  profileActive,
  onProfile,
  onLogout,
  whatsappNumber,
}: PortalLayoutProps) {
  // Force le thème clair tant que le portail est monté (le CRM pose une
  // classe `dark` globale sur <html>). Restaure fidèlement au démontage.
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    html.classList.remove('dark');
    return () => {
      if (hadDark) html.classList.add('dark');
    };
  }, []);

  const initials = getInitials(clientName);

  return (
    <div className="propulspace-portal ps-theme-night min-h-screen">
      <PortalSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        clientName={clientName}
        projectName={projectName}
        profileActive={profileActive}
        onProfile={onProfile}
        onLogout={onLogout}
        initials={initials}
      />

      {/* Header mobile/tablette : marque + accès profil + déconnexion.
          `fixed` (et non sticky) : il reste visible quel que soit le scroll.
          La navigation vit dans la barre du bas (PortalTabBar). */}
      <header className="ps-frosted fixed inset-x-0 top-[var(--ps-header-top,0px)] z-30 border-b border-[var(--ps-border-soft)] lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <BrandPill />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onProfile}
              aria-label="Mon profil"
              className="rounded-full transition-transform duration-200 [transition-timing-function:var(--ps-ease)] hover:scale-105 active:scale-95"
            >
              <Avatar className="h-9 w-9 ring-2 ring-[var(--ps-primary-subtle)] ring-offset-2 ring-offset-[color:var(--ps-bg-elevated)]">
                <AvatarFallback className="ps-brand-gradient text-[12px] font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              aria-label="Se déconnecter"
              className="h-9 w-9 rounded-full p-0 text-[var(--ps-fg-muted)] hover:bg-[var(--ps-bg-subtle)] hover:text-[var(--ps-fg)]"
            >
              <LogOut className="h-[15px] w-[15px]" />
            </Button>
          </div>
        </div>
      </header>

      {/* Colonne de contenu : décalée de la sidebar sur desktop, du header
          fixe (h-14) sur mobile. */}
      <div className="flex min-h-screen flex-col pt-14 lg:pl-[248px] lg:pt-0">
        <main className="ps-fade-in mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:px-8 md:pt-10 lg:pb-14">
          {children}
        </main>

        <footer className="border-t border-[var(--ps-border-soft)] py-5 text-center text-[11px] text-[var(--ps-fg-muted)]">
          <span className="font-medium tracking-tight">{AGENCY_NAME}</span>
          <span className="mx-2 opacity-40">·</span>
          <a href="#" className="transition-colors duration-200 hover:text-[var(--ps-fg-secondary)] hover:underline">Mentions légales</a>
          <span className="mx-2 opacity-40">·</span>
          <a href="#" className="transition-colors duration-200 hover:text-[var(--ps-fg-secondary)] hover:underline">Confidentialité</a>
          <span className="mx-2 opacity-40">·</span>
          <span className="ps-num opacity-70">© 2026</span>
        </footer>
      </div>

      <PortalTabBar activeTab={activeTab} onTabChange={onTabChange} />
      <PortalContactFab projectName={projectName} whatsappNumber={whatsappNumber} />
    </div>
  );
}
