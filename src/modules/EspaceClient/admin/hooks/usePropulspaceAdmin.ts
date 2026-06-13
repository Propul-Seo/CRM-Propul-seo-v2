import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// État d'accès à l'admin Propul'Space. Source de vérité = `public.users.role`
// (pas user_metadata qui peut être manipulé côté client). Aligné sur
// `propulspace.is_admin()` côté SQL.
export type PropulspaceAdminState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'forbidden';   session: Session; role: string | null }
  | { status: 'authorized';  session: Session; role: 'admin' | 'manager'; userId: string };

async function loadState(session: Session | null): Promise<PropulspaceAdminState> {
  if (!session) return { status: 'unauthenticated' };
  const { data, error } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', session.user.id)
    .maybeSingle();
  if (error || !data) return { status: 'forbidden', session, role: null };
  const role = (data as { id: string; role: string }).role;
  if (role === 'admin' || role === 'manager') {
    return { status: 'authorized', session, role, userId: (data as { id: string }).id };
  }
  return { status: 'forbidden', session, role };
}

export function usePropulspaceAdmin(): PropulspaceAdminState {
  const [state, setState] = useState<PropulspaceAdminState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const next = await loadState(data.session);
      if (!cancelled) setState(next);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const next = await loadState(session);
      if (!cancelled) setState(next);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  return state;
}
