import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface MentionNotification {
  id: string;
  message: {
    id: string;
    content: string;
    user_id: string;
    channel_id: string;
    created_at: string;
    user?: {
      name?: string;
      avatar_url?: string;
    };
  };
  channelName: string;
  timestamp: number;
}

export const useMentionNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<MentionNotification[]>([]);

  // Détecter les mentions dans un message
  const detectMentions = (content: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  };

  // Vérifier si l'utilisateur actuel est mentionné
  const isUserMentioned = (content: string, userName: string, userEmail: string): boolean => {
    const mentions = detectMentions(content);
    logger.debug('🔍 Vérification mentions:', { mentions, userName, userEmail, content });
    
    return mentions.some(mention => {
      const mentionLower = mention.toLowerCase();
      const userNameLower = userName.toLowerCase();
      const userEmailLower = userEmail.toLowerCase();
      
      // Vérifier si la mention correspond au nom ou à l'email
      const isMentioned = mentionLower === userNameLower || 
                         mentionLower === userEmailLower ||
                         mentionLower === userEmailLower.split('@')[0];
      
      console.log(`🔍 Mention "${mention}" vs "${userName}" (${userEmail}): ${isMentioned}`);
      return isMentioned;
    });
  };

  // Ajouter une nouvelle notification
  const addNotification = (message: MentionNotification['message'], channelName: string) => {
    logger.debug('🔔 Ajout notification pour mention:', { message, channelName });
    
    const newNotification: MentionNotification = {
      id: `${message.id}-${Date.now()}`,
      message,
      channelName,
      timestamp: Date.now()
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Garder max 5 notifications
  };

  // Supprimer une notification
  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Ouvrir le chat et naviguer vers le canal - DÉSACTIVÉ (module chat supprimé)
  const openChat = (channelId: string) => {
    logger.warn('Chat module supprimé - redirection désactivée');
    // setActiveModule('chat');
    // localStorage.setItem('redirectToChannel', channelId);
    // window.location.reload();
  };

  // Subscription Realtime pour détecter les nouvelles mentions
  useEffect(() => {
    if (!user) return;

    logger.debug('🔄 Initialisation détection mentions pour utilisateur:', user.email);

    const setupMentionDetection = async () => {
      // Utiliser le mapping direct des utilisateurs pour identifier l'utilisateur connecté
      const userMap: { [key: string]: string } = {
        '470c709c-abce-48c8-b8b3-320cd98a5ed5': 'Team',
        '590e317b-f7a5-4b02-887e-9f3b480618b8': 'Antoine',
        'a22a7b0a-1e30-461a-8264-26a0867e6a6a': 'Baptiste',
        '9405f2c9-07d4-49c9-bc2c-7c2d40b07acc': 'Paul'
      };
      
      // Récupérer le nom de l'utilisateur connecté depuis le mapping
      const userName = userMap[user.id] || user.user_metadata?.name || user.email?.split('@')[0] || '';
      const userEmail = user.email || '';
      
      logger.debug('👤 Utilisateur connecté:', { userName, userEmail, userId: user.id });
      logger.debug('🔍 Nom d\'utilisateur pour détection mentions:', userName);
      
      const subscription = supabase
        .channel('mention-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          async (payload) => {
            const newMessage = payload.new as { id: string; content: string; user_id: string; channel_id: string; created_at: string };
            logger.debug('📨 Nouveau message reçu:', newMessage);
            logger.debug('🔍 Contenu du message:', newMessage.content);
            
            // Vérifier si l'utilisateur actuel est mentionné
            if (isUserMentioned(newMessage.content, userName, userEmail)) {
              logger.debug('🎯 Utilisateur mentionné dans le message!');
              
              // Récupérer les informations du canal
              const { data: channel } = await supabase
                .from('channels')
                .select('name')
                .eq('id', newMessage.channel_id)
                .single();

              // Utiliser le mapping direct pour l'expéditeur
              const senderName = userMap[newMessage.user_id] || 'Utilisateur';
              logger.debug('👤 Expéditeur identifié:', senderName);

              const messageWithUser = {
                ...newMessage,
                user: {
                  name: senderName,
                  avatar_url: undefined
                }
              };

              // Ajouter la notification
              addNotification(messageWithUser, channel?.name || 'Canal inconnu');
              logger.debug('🔔 Notification ajoutée pour mention!');
            } else {
              logger.debug('❌ Utilisateur non mentionné dans ce message');
            }
          }
        )
        .subscribe();

      return subscription;
    };

    setupMentionDetection().then(subscription => {
      return () => {
        if (subscription) {
          logger.debug('🔌 Désabonnement des notifications de mentions');
          subscription.unsubscribe();
        }
      };
    });
  }, [user]);

  return {
    notifications,
    removeNotification,
    openChat
  };
};
