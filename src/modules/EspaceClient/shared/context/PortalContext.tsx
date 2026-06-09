import { createContext, useContext, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PortalProject } from '@/modules/EspaceClient/shared/hooks/usePortalAuth';
import type { Database } from '@/types/database';
import type { V2Client } from '@/lib/supabase';

interface PortalContextValue {
  email: string;
  project: PortalProject;
  signOut: () => Promise<void>;
  previewMode: boolean;
  // Client de lecture selon le mode : portail (session client) en usage réel,
  // admin (session CRM, droit is_admin) en aperçu admin. `db` = proxy pour
  // `.from()`, `storage` = vrai SupabaseClient pour Storage/RPC/functions/auth.
  db: V2Client;
  storage: SupabaseClient<Database>;
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
