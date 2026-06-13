import React from 'react';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';

interface ReplyMessage {
  id: string;
  content: string;
  sender_name: string;
  created_at: string;
}

interface MessageReplyProps {
  replyToMessageId: string;
  className?: string;
}

export const MessageReply: React.FC<MessageReplyProps> = ({ 
  replyToMessageId, 
  className = '' 
}) => {
  const [replyMessage, setReplyMessage] = useState<ReplyMessage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReplyMessage = async () => {
      if (!replyToMessageId) return;

      try {
        setLoading(true);
        
        // Utiliser la fonction SQL pour récupérer les infos du message de réponse
        const { data, error } = await supabase
          .rpc('get_reply_message_info', { reply_message_id: replyToMessageId });

        if (error) {
          console.error('Erreur chargement message de réponse:', error);
          return;
        }

        if (data && data.length > 0) {
          setReplyMessage(data[0]);
        }
      } catch (error) {
        console.error('Erreur chargement message de réponse:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReplyMessage();
  }, [replyToMessageId]);

  if (loading) {
    return (
      <div className={`text-xs text-gray-500 italic ${className}`}>
        Chargement de la réponse...
      </div>
    );
  }

  if (!replyMessage) {
    return null;
  }

  return (
    <div className={`mb-2 ${className}`}>
      {/* Message cité intégré dans la bulle de réponse */}
      <div className="flex items-start gap-2">
        {/* Ligne verticale violette à gauche */}
        <div className="w-1 bg-purple-500 rounded-full flex-shrink-0 mt-1"></div>
        
        {/* Contenu de la réponse */}
        <div className="flex-1 min-w-0">
          {/* Nom de l'expéditeur en violet */}
          <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
            {replyMessage.sender_name}
          </div>
          
          {/* Contenu du message cité */}
          <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {replyMessage.content}
          </div>
        </div>
      </div>
    </div>
  );
};
