import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface SimpleMessage {
  id: string;
  content: string;
  user_id: string;
  channel_id: string;
  created_at: string;
  user?: {
    id: string;
    name?: string;
    avatar_url?: string;
  };
}

export interface SimpleChannel {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  unreadCount?: number;
}

export interface SimpleUser {
  id: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
}

export const useTeamChatSimple = () => {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [channels, setChannels] = useState<SimpleChannel[]>([]);
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers le bas
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Charger les canaux (version ultra simple)
  const loadChannels = useCallback(async () => {
    if (!user) {
      logger.debug('❌ loadChannels: user est undefined, arrêt du chargement');
      return;
    }

    // Éviter de recharger si les canaux sont déjà chargés
    if (channels.length > 0) {
      logger.debug('✅ Canaux déjà chargés, skip du rechargement');
      return;
    }

    logger.debug('🔄 Chargement des canaux...');

    try {
      setLoading(true);
      setError(null);

      const { data: channelsData, error: channelsError } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true });

      if (channelsError) throw new Error(channelsError.message);

      logger.debug('📊 Canaux récupérés:', channelsData?.length || 0);

      // Canaux sans comptage - tous les messages sont considérés comme lus
      const channelsWithUnreadCount = (channelsData || []).map(channel => ({
        ...channel,
        unreadCount: 0 // Forcer à 0 car l'utilisateur a déjà tout lu
      }));

      setChannels(channelsWithUnreadCount);

      // Sélectionner le premier canal si aucun n'est sélectionné
      if (!selectedChannel && channelsWithUnreadCount && channelsWithUnreadCount.length > 0) {
        setSelectedChannel(channelsWithUnreadCount[0].id);
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
      toast.error('Erreur chargement canaux: ' + msg);
    } finally {
      setLoading(false);
    }
  }, [selectedChannel, user, channels.length]);

  // Charger les messages d'un canal (version INSTANTANÉE)
  const loadMessages = useCallback(async (channelId: string) => {
    if (!channelId || !user) {
      logger.debug('❌ loadMessages: channelId ou user manquant', { channelId, user });
      return;
    }

    logger.debug('📖 Chargement messages pour canal:', channelId);

    try {
      // Charger les messages AVEC leurs réponses
          const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      ;

      if (messagesError) {
        logger.error('❌ Erreur Supabase:', messagesError);
        throw new Error(messagesError.message);
      }

      logger.debug('📨 Messages chargés:', messagesData?.length || 0);
      
          // Debug des réponses
    const messagesWithReplies = messagesData?.filter(m => m.reply_to_message_id && m.reply_to_message_id !== null);
    
    // Messages avec réponses trouvés
    if (messagesWithReplies && messagesWithReplies.length > 0) {
      logger.debug('✅ Messages avec réponses trouvés:', messagesWithReplies.length);
    }

      // Récupérer les informations utilisateur depuis la liste des utilisateurs chargés
      const messagesWithRealUsers = (messagesData || []).map(message => {
        // Chercher l'utilisateur dans la liste des utilisateurs chargés
        const userInfo = users.find(u => u.id === message.user_id);
        
        if (userInfo) {
          return {
            ...message,
            user: { 
              id: message.user_id, 
              name: userInfo.name || 'Utilisateur',
              avatar_url: userInfo.avatar_url
            }
          };
        } else {
          // Fallback avec notre mapping direct des utilisateurs
          const userMap: { [key: string]: string } = {
            '470c709c-abce-48c8-b8b3-320cd98a5ed5': 'Team',
            '590e317b-f7a5-4b02-887e-9f3b480618b8': 'Antoine',
            '5b27ba64-74e9-4f5a-99f5-a5e5fa36f9d4': 'Baptiste',
            '9405f2c9-07d4-49c9-bc2c-7c2d40b07acc': 'Paul',
            'fd88df0b-5f3f-41e5-ba50-d58025293a52': 'Paul'
          };
          
          const userName = userMap[message.user_id] || 'Utilisateur';
          return {
            ...message,
            user: { 
              id: message.user_id, 
              name: userName,
              avatar_url: undefined
            }
          };
        }
      });

      setMessages(messagesWithRealUsers);
      
      // Réinitialiser le compteur pour ce canal (INSTANTANÉ)
      setChannels(prev => prev.map(channel => 
        channel.id === channelId 
          ? { ...channel, unreadCount: 0 }
          : channel
      ));
      
      scrollToBottom();

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
      toast.error('Erreur chargement messages: ' + msg);
    }
  }, [scrollToBottom, user]);

  // Fonction pour réinitialiser le compteur d'un canal
  const resetChannelUnreadCount = useCallback((channelId: string) => {
    logger.debug('🔄 resetChannelUnreadCount pour le canal:', channelId);
    
    setChannels(prev => prev.map(channel => 
      channel.id === channelId 
        ? { ...channel, unreadCount: 0 }
        : channel
    ));
  }, []);

  // Charger les utilisateurs
  const loadUsers = useCallback(async () => {
    // Éviter de recharger si les utilisateurs sont déjà chargés
    if (users.length > 0) {
      logger.debug('✅ Utilisateurs déjà chargés, skip du rechargement');
      return;
    }

    try {
      logger.debug('🔄 Chargement des utilisateurs depuis la base de données...');
      
      // Récupérer les utilisateurs depuis la table users avec leurs avatars
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, avatar_url, created_at')
        .order('name', { ascending: true });

      if (usersError) {
        logger.error('❌ Erreur récupération utilisateurs:', usersError);
        throw new Error(usersError.message);
      }

      if (usersData && usersData.length > 0) {
        logger.debug('✅ Utilisateurs récupérés depuis la base:', usersData.length);
        setUsers(usersData);
      } else {
        logger.debug('⚠️ Aucun utilisateur trouvé, utilisation du mapping de fallback');
        
        // Fallback avec notre mapping direct des utilisateurs
        const userMap: { [key: string]: string } = {
          '470c709c-abce-48c8-b8b3-320cd98a5ed5': 'Team',
          '590e317b-f7a5-4b02-887e-9f3b480618b8': 'Antoine',
          '5b27ba64-74e9-4f5a-99f5-a5e5fa36f9d4': 'Baptiste',
          '9405f2c9-07d4-49c9-bc2c-7c2d40b07acc': 'Paul',
          'fd88df0b-5f3f-41e5-ba50-d58025293a52': 'Paul'
        };

        // Créer la liste des utilisateurs avec le mapping
        const fallbackUsers = Object.entries(userMap).map(([id, name]) => ({
          id,
          name,
          avatar_url: undefined,
          created_at: new Date().toISOString()
        }));

        setUsers(fallbackUsers);
        logger.debug('👥 Utilisateurs chargés avec mapping de fallback:', fallbackUsers);
      }

    } catch (err) {
      logger.error('❌ Erreur chargement utilisateurs:', err);
      
      // En cas d'erreur, utiliser le mapping de fallback
      const userMap: { [key: string]: string } = {
        '470c709c-abce-48c8-b8b3-320cd98a5ed5': 'Team',
        '590e317b-f7a5-4b02-887e-9f3b480618b8': 'Antoine',
        '5b27ba64-74e9-4f5a-99f5-a5e5fa36f9d4': 'Baptiste',
        '9405f2c9-07d4-49c9-bc2c-7c2d40b07acc': 'Paul',
        'fd88df0b-5f3f-41e5-ba50-d58025293a52': 'Paul'
      };

      const fallbackUsers = Object.entries(userMap).map(([id, name]) => ({
        id,
        name,
        avatar_url: undefined,
        created_at: new Date().toISOString()
      }));

      setUsers(fallbackUsers);
      logger.debug('👥 Utilisateurs chargés avec mapping de fallback (erreur):', fallbackUsers);
    }
  }, [users.length]);

  // Envoyer un message
  const sendMessage = useCallback(async (content: string, channelId?: string, replyToMessageId?: string) => {
    if (!user || !content.trim()) return;

    const targetChannelId = channelId || selectedChannel;
    if (!targetChannelId) {
      toast.error('Aucun canal sélectionné');
      return;
    }

    try {
      setSending(true);

      const messageData: { content: string; user_id: string; channel_id: string; reply_to_message_id?: string } = {
        content: content.trim(),
        user_id: user.id,
        channel_id: targetChannelId
      };

      // Ajouter l'ID du message de réponse si il existe
      if (replyToMessageId) {
        messageData.reply_to_message_id = replyToMessageId;
      }

      const { data: newMessage, error: sendError } = await supabase
        .from('messages')
        .insert(messageData)
        .select('*')
        .single();

      if (sendError) throw new Error(sendError.message);

      toast.success(replyToMessageId ? 'Réponse envoyée' : 'Message envoyé');
      
      if (targetChannelId) {
        loadMessages(targetChannelId);
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
      toast.error('Erreur envoi message: ' + msg);
    } finally {
      setSending(false);
    }
  }, [user, selectedChannel, loadMessages]);

  // Créer un nouveau canal
  const createChannel = useCallback(async (name: string, description?: string) => {
    if (!user || !name.trim()) return;

    try {
      setLoading(true);

      const { data: newChannel, error: createError } = await supabase
        .from('channels')
        .insert({
          name: name.trim(),
          description: description?.trim() || ''
        })
        .select('*')
        .single();

      if (createError) throw new Error(createError.message);

      toast.success('Canal créé');
      loadChannels();

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
      toast.error('Erreur création canal: ' + msg);
    } finally {
      setLoading(false);
    }
  }, [user, loadChannels]);

  // Charger les canaux et utilisateurs au montage (optimisé)
  useEffect(() => {
    if (user && !authLoading) {
      logger.debug('✅ Utilisateur chargé, chargement des données...');
      
      // Charger canaux et utilisateurs en parallèle (plus rapide)
      Promise.all([
        loadChannels(),
        loadUsers()
      ]).then(() => {
        logger.debug('🚀 Chargement initial terminé');
      }).catch((error) => {
        logger.error('❌ Erreur lors du chargement initial:', error);
      });
    } else {
      logger.debug('⏳ En attente de l\'utilisateur...', { user, authLoading });
    }
  }, [user, authLoading, loadChannels, loadUsers]);

  // Charger les messages quand le canal change
  useEffect(() => {
    if (selectedChannel) {
      logger.debug('🔄 Canal sélectionné, chargement des messages:', selectedChannel);
      loadMessages(selectedChannel);
    }
  }, [selectedChannel, loadMessages]);

  return {
    messages,
    channels,
    users,
    loading,
    error,
    sending,
    selectedChannel,
    sendMessage,
    createChannel,
    setSelectedChannel,
    currentUser: user,
    messagesEndRef,
    scrollToBottom,
    loadChannels,
    resetChannelUnreadCount
  };
}; 