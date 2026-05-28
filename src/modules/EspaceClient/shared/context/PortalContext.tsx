import { createContext, useContext, type ReactNode } from 'react';
import type { PortalProject } from '@/modules/EspaceClient/shared/hooks/usePortalAuth';

interface PortalContextValue {
  email: string;
  project: PortalProject;
  signOut: () => Promise<void>;
}

const PortalContext = createContext<PortalContextValue | null>(null);

interface PortalProviderProps {
  value: PortalContextValue;
  children: ReactNode;
}

export function PortalProvider({ value, children }: PortalProviderProps) {
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

// Hook consommateur — utilisable uniquement à l'intérieur d'un PortalGuard
// status='ready'.
export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('usePortal must be used inside <PortalProvider> (route protégée par PortalGuard)');
  }
  return ctx;
}
