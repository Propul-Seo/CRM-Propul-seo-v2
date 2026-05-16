import { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface PortalUserRow {
  id: string;
  email: string;
  auth_user_id: string | null;
  is_active: boolean | null;
  portal_enabled: boolean | null;
  portal_linked_project_id: string | null;
  onboarding_completed: boolean;
}

export interface PortalProject {
  id: string;
  name: string | null;
  client_name: string | null;
  status: string | null;
}

// État de l'authentification portail. Combine session Supabase + ligne `users`
// + projet lié. Permet aux guards de prendre une décision sans re-fetcher.
export type PortalAuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'no-user-row';      session: Session }
  | { status: 'portal-disabled';  session: Session; userRow: PortalUserRow }
  | { status: 'no-project';       session: Session; userRow: PortalUserRow }
  | { status: 'ready';            session: Session; userRow: PortalUserRow; project: PortalProject };

export interface UsePortalAuthResult {
  state: PortalAuthState;
  signInWithMagicLink: (email: string, redirectTo?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

async function loadAuthState(session: Session | null): Promise<PortalAuthState> {
  if (!session) return { status: 'unauthenticated' };

  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('id, email, auth_user_id, is_active, portal_enabled, portal_linked_project_id, onboarding_completed')
    .eq('auth_user_id', session.user.id)
    .maybeSingle();

  if (userErr || !userRow) return { status: 'no-user-row', session };

  const row = userRow as PortalUserRow;
  if (!row.portal_enabled || row.is_active === false) {
    return { status: 'portal-disabled', session, userRow: row };
  }
  if (!row.portal_linked_project_id) {
    return { status: 'no-project', session, userRow: row };
  }

  const { data: project, error: projErr } = await supabase
    .from('projects_v2')
    .select('id, name, client_name, status')
    .eq('id', row.portal_linked_project_id)
    .maybeSingle();

  if (projErr || !project) return { status: 'no-project', session, userRow: row };

  return {
    status: 'ready',
    session,
    userRow: row,
    project: project as PortalProject,
  };
}

export function usePortalAuth(): UsePortalAuthResult {
  const [state, setState] = useState<PortalAuthState>({ status: 'loading' });

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const next = await loadAuthState(data.session);
    setState(next);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const next = await loadAuthState(data.session);
      if (!cancelled) setState(next);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      const next = await loadAuthState(session);
      if (!cancelled) setState(next);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithMagicLink = useCallback<UsePortalAuthResult['signInWithMagicLink']>(
    async (email, redirectTo) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo ?? `${window.location.origin}/espace-client`,
          shouldCreateUser: false,
        },
      });
      return { error: error?.message ?? null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { state, signInWithMagicLink, signOut, refresh };
}
