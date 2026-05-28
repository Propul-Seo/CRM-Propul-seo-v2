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
// Redirige selon l'état ou pose le PortalProvider quand un projet est
// trouvé pour l'email connecté.
export function PortalGuard({ children }: PortalGuardProps) {
  const { state, signOut } = usePortalAuth();

  if (state.status === 'loading') {
    return (
      <div className="propulspace-portal flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--ps-primary)]" />
      </div>
    );
  }

  if (state.status === 'unauthenticated') {
    return <Navigate to="/espace-client/login" replace />;
  }

  if (state.status === 'no-project') {
    // Email connecté mais pas de projet associé → on traite comme
    // session expirée / lien invalide.
    return <Navigate to="/espace-client/expired" replace />;
  }

  return (
    <PortalProvider value={{ email: state.email, project: state.project, signOut }}>
      {children}
    </PortalProvider>
  );
}
