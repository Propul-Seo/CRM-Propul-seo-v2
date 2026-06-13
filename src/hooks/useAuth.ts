// Hook d'authentification simplifie et robuste pour Propulseo CRM
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '../store/useStore';
import { logger } from '@/lib/logger';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { setCurrentUser } = useStore();

  useEffect(() => {
    let mounted = true;

    // Fonction d'initialisation
    const initAuth = async () => {
      try {
        logger.debug('Initializing auth...', 'useAuth');

        // Recuperer session actuelle
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          logger.error('Erreur session', 'useAuth', { code: sessionError.name });
          setError(sessionError);
        } else {
          logger.debug('Session loaded', 'useAuth', { userId: session?.user?.id });
          if (mounted) {
            const authUser = session?.user || null;
            setUser(authUser);
            // Synchroniser avec le store
            if (authUser) {
              const currentUser: AuthUser = {
                id: authUser.id,
                email: authUser.email || '',
                name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Utilisateur',
                role: authUser.user_metadata?.role || 'Utilisateur'
              };
              setCurrentUser(currentUser);
            } else {
              setCurrentUser(null);
            }
          }
        }

      } catch (err) {
        logger.exception(err as Error, 'useAuth');
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          logger.debug('Auth initialization complete', 'useAuth');
          setLoading(false);
        }
      }
    };

    // Listener auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.debug('Auth state changed', 'useAuth', { event, userId: session?.user?.id });
        if (mounted) {
          const authUser = session?.user || null;
          setUser(authUser);
          // Synchroniser avec le store
          if (authUser) {
            const currentUser: AuthUser = {
              id: authUser.id,
              email: authUser.email || '',
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Utilisateur',
              role: authUser.user_metadata?.role || 'Utilisateur'
            };
            setCurrentUser(currentUser);
          } else {
            setCurrentUser(null);
          }
          setLoading(false);
        }
      }
    );

    // Initialiser
    initAuth();

    // Timeout de securite
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        logger.warn('Auth timeout - forcing loading false', 'useAuth');
        setLoading(false);
      }
    }, 5000); // 5 secondes max

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      logger.info('User signed in', 'useAuth', { userId: data.user?.id });
      return { data, error: null };
    } catch (err) {
      logger.error('Erreur login', 'useAuth', { error: (err as Error).message });
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: { name: string; role: string }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role
          }
        }
      });
      if (error) throw error;
      logger.info('User signed up', 'useAuth', { userId: data.user?.id });
      return { data, error: null };
    } catch (err) {
      logger.error('Erreur inscription', 'useAuth', { error: (err as Error).message });
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      logger.info('User signed out', 'useAuth');
    } else {
      logger.error('Erreur deconnexion', 'useAuth', { error: error.message });
    }
    return { error };
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user
  };
};
