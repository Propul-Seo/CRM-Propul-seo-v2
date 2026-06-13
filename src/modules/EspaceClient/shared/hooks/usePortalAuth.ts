import { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { portalSupabase as supabase } from '@/lib/supabase';
import { portalBase } from '@/modules/EspaceClient/shared/portalHost';

export interface PortalProject {
  id: string;
  name: string | null;
  client_name: string | null;
  status: string | null;
  portal_client_email: string | null;
}

// État de l'auth portail. Source de vérité : projects_v2.portal_client_email
// matche l'email de la session Supabase Auth. Le client n'a JAMAIS besoin
// d'une row dans public.users (réservée aux internes Propul'SEO).
export type PortalAuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'no-project';  session: Session; email: string }
  | { status: 'ready';       session: Session; email: string; project: PortalProject };

export interface UsePortalAuthResult {
  state: PortalAuthState;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithMagicLink: (email: string, redirectTo?: string) => Promise<{ error: string | null }>;
  /** Vérifie le code à 6 chiffres reçu par email (OTP, immunisé au pré-chargement des liens). */
  verifyMagicCode: (email: string, token: string) => Promise<{ error: string | null }>;
  requestPasswordReset: (email: string, redirectTo?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

async function loadAuthState(session: Session | null): Promise<PortalAuthState> {
  if (!session) return { status: 'unauthenticated' };
  const email = session.user.email;
  if (!email) return { status: 'no-project', session, email: '' };

  // R-009 — collision d'email (ADR-004/005 : pas de UNIQUE sur portal_client_email).
  // `.limit(1).maybeSingle()` ne plante JAMAIS : il borne à 1 ligne avant le
  // singularize, donc aucun PGRST116 « multiple rows ». Surtout PAS `.single()`,
  // qui throw sur 0 résultat (cas client sans projet). Multi-projets = SP2.
  const { data, error } = await supabase
    .from('projects_v2')
    .select('id, name, client_name, status, portal_client_email')
    .eq('portal_client_email', email)
    .limit(1)
    .maybeSingle();

  if (error || !data) return { status: 'no-project', session, email };
  return { status: 'ready', session, email, project: data as PortalProject };
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
    // Listener enregistré AVANT getSession : l'event INITIAL_SESSION
    // de Supabase Auth couvre le cas du premier load. Évite la race
    // entre getSession et un SIGNED_IN provoqué par un magic link.
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      const next = await loadAuthState(session);
      if (!cancelled) setState(next);
    });
    // Fallback : sur certains navigateurs (Safari ITP, PWA, parfois localStorage
    // vide), l'event INITIAL_SESSION n'est pas émis → l'état resterait 'loading'
    // indéfiniment. On force un getSession() au mount pour garantir une
    // transition vers 'unauthenticated' (ou 'ready' si session restaurée).
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const next = await loadAuthState(data.session);
      if (!cancelled) setState(next);
    })();
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Code review C-2 (A.2b) : shouldCreateUser: false. Les clients portail sont
  // créés UNIQUEMENT via l'invitation admin (Sprint A.2a). Autoriser la création
  // ici permettrait à n'importe qui de spammer auth.users avec des emails forgés.
  const signInWithMagicLink = useCallback<UsePortalAuthResult['signInWithMagicLink']>(
    async (email, redirectTo) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo ?? `${window.location.origin}${portalBase() || '/'}`,
          shouldCreateUser: false,
        },
      });
      return { error: error?.message ?? null };
    },
    [],
  );

  // Vérifie le code à 6 chiffres (type 'email'). Succès → onAuthStateChange
  // déclenche la transition vers 'ready' (puis redirection côté login).
  const verifyMagicCode = useCallback<UsePortalAuthResult['verifyMagicCode']>(
    async (email, token) => {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
      return { error: error?.message ?? null };
    },
    [],
  );

  // A.2b — login direct par email + mot de passe (post-SetupPasswordPage).
  // Si Supabase retourne "Invalid login credentials", on traduit en message
  // user-friendly côté UI (cf ClientLoginPage).
  const signInWithPassword = useCallback<UsePortalAuthResult['signInWithPassword']>(
    async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [],
  );

  // A.2b — envoi du lien de réinitialisation. Le lien retombe sur
  // /espace-client/reset-password (recovery token dans le hash), où l'utilisateur
  // saisit son nouveau mot de passe.
  const requestPasswordReset = useCallback<UsePortalAuthResult['requestPasswordReset']>(
    async (email, redirectTo) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo ?? `${window.location.origin}${portalBase()}/reset-password`,
      });
      return { error: error?.message ?? null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { state, signInWithPassword, signInWithMagicLink, verifyMagicCode, requestPasswordReset, signOut, refresh };
}
