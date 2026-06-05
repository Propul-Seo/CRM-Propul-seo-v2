import { type ReactNode } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { usePropulspaceAdmin } from './hooks/usePropulspaceAdmin';
import { useForcePortalSurface } from '@/modules/EspaceClient/shared/hooks/useForcePortalSurface';
import { StatusPage } from '@/modules/EspaceClient/shared/components';
import '@/modules/EspaceClient/shared/layouts/portal-theme.css';

interface PropulspaceAdminGuardProps {
  children: ReactNode;
}

// Gate d'accès aux pages /admin/* Propul'Space. Aligné sur la fonction SQL
// `propulspace.is_admin()` : rôles 'admin' ou 'manager'.
export function PropulspaceAdminGuard({ children }: PropulspaceAdminGuardProps) {
  useForcePortalSurface('dark');
  const state = usePropulspaceAdmin();

  if (state.status === 'loading') {
    return (
      <div className="propulspace-portal ps-theme-dark flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--ps-primary)]" />
      </div>
    );
  }

  if (state.status === 'unauthenticated') {
    return <Navigate to="/" replace />;
  }

  if (state.status === 'forbidden') {
    return (
      <div className="propulspace-portal ps-theme-dark min-h-screen">
        <StatusPage
          icon={ShieldAlert}
          tone="red"
          title="Accès réservé à l'équipe"
          subtitle="Cette page est réservée aux administrateurs Propul'SEO. Si vous pensez que c'est une erreur, contactez l'équipe."
          footnote={`Rôle détecté : ${state.role ?? 'non défini'}`}
        />
      </div>
    );
  }

  // Le CRM pose un thème sombre dans :root ; on scope le back-office en
  // ps-theme-dark (valeurs de tokens sombres) + un fond opaque via les tokens.
  return <div className="propulspace-portal ps-theme-dark min-h-screen bg-[var(--ps-bg)] text-[var(--ps-fg)]">{children}</div>;
}
