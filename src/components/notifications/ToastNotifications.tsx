import React, { useState, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useTeamChatSimple } from '../../hooks/useTeamChatSimple';
import { useStore } from '../../store/useStore';
import { toast } from 'sonner';

interface ToastNotification {
  id: string;
  message: string;
  channelId: string;
  channelName: string;
  userName: string;
  userAvatar?: string;
  timestamp: Date;
}

export const ToastNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const { messages, channels, users } = useTeamChatSimple();
  const { currentUser } = useStore();

  // Formater le nom d'utilisateur
  const formatUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user?.name) {
      return user.name;
    }
    return 'Utilisateur';
  };

  // Formater l'avatar
  const formatUserAvatar = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user?.avatar_url) {
      return user.avatar_url;
    }
    const name = formatUserName(userId);
    return `https://ui-avatars.com/api/?name=${name}&background=random`;
  };

  // Obtenir le nom du canal
  const getChannelName = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    return channel?.name || 'Canal inconnu';
  };

  // Extraire les mentions d'un message
  const extractMentions = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    const mentions: Array<{ userId: string; userName: string }> = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionText = match[1];
      const mentionedUser = users.find(user => 
        user.name?.toLowerCase().includes(mentionText.toLowerCase())
      );

      if (mentionedUser) {
        mentions.push({
          userId: mentionedUser.id,
          userName: formatUserName(mentionedUser.id)
        });
      }
    }

    return mentions;
  };

  // Ajouter une nouvelle notification toast
  const addToastNotification = (message: { id: string; user_id: string; content: string; channel_id: string; created_at: string }) => {
    // Vérifier si le message contient des mentions
    const mentions = extractMentions(message.content);
    const isMentioned = mentions.some(mention => mention.userId === currentUser?.id);
    
    // Ne créer une notification QUE si l'utilisateur est mentionné
    if (!isMentioned) {
      return;
    }
    
    const newNotification: ToastNotification = {
      id: message.id,
      message: message.content,
      channelId: message.channel_id,
      channelName: getChannelName(message.channel_id),
      userName: formatUserName(message.user_id),
      userAvatar: formatUserAvatar(message.user_id),
      timestamp: new Date(message.created_at)
    };

    // Ajouter la notification
    setNotifications(prev => [newNotification, ...prev]);

    // Supprimer automatiquement après 3 secondes
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 3000);
  };

  // Supprimer une notification
  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Aller au chat — module team-chat supprimé, action désactivée
  const goToChat = (notification: ToastNotification) => {
    removeNotification(notification.id);
    toast.info(`Module chat indisponible (${notification.channelName})`);
  };

  // Surveiller les nouveaux messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const lastNotification = notifications[0];
      
      if (!lastNotification || lastNotification.id !== lastMessage.id) {
        addToastNotification(lastMessage);
      }
    }
  }, [messages]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-surface-2 border border-border rounded-lg shadow-lg p-3 w-80 max-w-sm animate-in slide-in-from-right-2 duration-300"
        >
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={notification.userAvatar} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {notification.userName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">
                  {notification.userName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {notification.channelName}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {notification.message}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {notification.timestamp.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToChat(notification)}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    Voir le chat
                  </button>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
