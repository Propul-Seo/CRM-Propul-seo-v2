import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction de debug pour diagnostiquer le problème d'email
  const debugUserEmail = async () => {
    try {
      // Récupérer user auth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      logger.debug('🔍 Auth user:', authUser);
      logger.debug('🔍 Auth email:', authUser?.email);
      logger.debug('🔍 Auth ID:', authUser?.id);

      // Récupérer profil
      if (authUser) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        logger.debug('🔍 Profile data:', profile);
        logger.debug('🔍 Profile email:', profile?.email);
        logger.debug('🔍 Profile error:', profileError);

        // Vérifier la session actuelle
        const { data: { session } } = await supabase.auth.getSession();
        logger.debug('🔍 Current session:', session);
        logger.debug('🔍 Session user email:', session?.user?.email);
      }
    } catch (error) {
      logger.error('🔍 Debug error:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Debug lors du chargement initial
      if (session?.user) {
        logger.debug('🔍 Initial session user:', session.user.email);
        debugUserEmail();
      }
    }).catch((error) => {
      logger.error('Erreur lors de la récupération de la session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Debug lors des changements d'auth
      if (session?.user) {
        logger.debug('🔍 Auth state change user:', session.user.email);
        debugUserEmail();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      logger.debug('🔍 Tentative de connexion avec email:', email);
      
      // Vérification de la connectivité réseau
      if (!navigator.onLine) {
        toast.error('Pas de connexion internet. Veuillez vérifier votre connexion réseau.');
        return { success: false, error: 'network_error', message: 'Pas de connexion internet' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      logger.debug('🔍 Résultat connexion:', { data, error });
      logger.debug('🔍 User connecté:', data?.user?.email);

      if (error) {
        // Handle email not confirmed error specifically
        if (error.message.includes('Email not confirmed')) {
          toast.error('Votre email n\'est pas encore confirmé. Veuillez vérifier votre boîte mail et cliquer sur le lien de confirmation.');
          return { success: false, error: 'email_not_confirmed', message: error.message };
        }
        
        // Handle network errors
        if (error.message.includes('fetch') || error.message.includes('network')) {
          toast.error('Erreur de connexion réseau. Veuillez vérifier votre connexion internet et réessayer.');
          return { success: false, error: 'network_error', message: 'Erreur de connexion réseau' };
        }
        
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      toast.success('Connexion réussie !');
      return { success: true, data };
    } catch (error) {
      logger.error('Erreur de connexion:', error);
      
      // Gestion spécifique des erreurs de réseau
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Erreur de connexion réseau. Veuillez vérifier votre connexion internet et réessayer.');
        return { success: false, error: 'network_error', message: 'Erreur de connexion réseau' };
      }
      
      const message = error instanceof Error ? error.message : 'Erreur de connexion';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string = 'sales') => {
    try {
      setLoading(true);
      
      // SOLUTION TEMPORAIRE : Désactiver la confirmation email
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
          // Désactiver la confirmation email temporairement
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      // SOLUTION TEMPORAIRE : Traiter comme une connexion directe
      if (data.user) {
        // Si l'utilisateur est créé mais pas de session, essayer de se connecter directement
        if (!data.session) {
          logger.debug('🔄 Tentative de connexion automatique après création...');
          
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            logger.debug('⚠️ Connexion automatique échouée:', signInError.message);
            toast.success('Compte créé ! Veuillez vous connecter manuellement.');
            return { success: true, data, needsConfirmation: true };
          }

          if (signInData.session) {
            logger.debug('✅ Connexion automatique réussie !');
            toast.success('Compte créé et connecté avec succès !');
            return { success: true, data: signInData, needsConfirmation: false };
          }
        } else {
          logger.debug('✅ Session créée immédiatement');
          toast.success('Compte créé avec succès !');
          return { success: true, data, needsConfirmation: false };
        }
      }

      toast.success('Compte créé avec succès !');
      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de création de compte';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      toast.success('Email de confirmation renvoyé ! Vérifiez votre boîte mail.');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du renvoi';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      toast.success('Déconnexion réussie');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de déconnexion';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resendConfirmation,
  };
}

import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

type QueryBuilder = PostgrestFilterBuilder<unknown, unknown, unknown[], string, unknown>;

export function useSupabaseData<T>(
  table: string,
  query?: (queryBuilder: QueryBuilder) => QueryBuilder
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let queryBuilder = supabase.from(table).select('*');
      
      if (query) {
        queryBuilder = query(queryBuilder);
      }

      const { data: result, error: fetchError } = await queryBuilder;

      if (fetchError) {
        setError(fetchError.message);
        toast.error(`Erreur lors du chargement: ${fetchError.message}`);
        return;
      }

      setData(result || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [table]);

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    loading,
    error,
    refetch,
  };
}