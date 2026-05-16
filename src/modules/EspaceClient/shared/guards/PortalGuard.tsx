import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { usePortalAuth } from '@/modules/EspaceClient/shared/hooks/usePortalAuth';
import { PortalProvider } from '@/modules/EspaceClient/shared/context/PortalContext';
import '@/modules/EspaceClient/shared/layouts/portal-theme.css';

interface PortalGuardProps {
  children: ReactNode;
}

// Gate d'accès aux routes /espace-client/* (hors login + pages de statut).
// Redirige selon l'état de PortalAuth, ou pose le PortalProvider quand prêt.
export function PortalGuard({ children }: PortalGuardProps) {
  const { state, signOut } = usePortalAuth();

  if (state.status === 'loading') {
    return (
      <div className="propulspace-portal flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--ps-primary)]" />
      </div>
    );
  }

  if (state.status === 'unauthenticated' || state.status === 'no-user-row') {
    return <Navigate to="/espace-client/login" replace />;
  }

  if (state.status === 'portal-disabled') {
    return <Navigate to="/espace-client/suspended" replace />;
  }

  if (state.status === 'no-project') {
    return <Navigate to="/espace-client/expired" replace />;
  }

  return (
    <PortalProvider value={{ userRow: state.userRow, project: state.project, signOut }}>
      {children}
    </PortalProvider>
  );
}
