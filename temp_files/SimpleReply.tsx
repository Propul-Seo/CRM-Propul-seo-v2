import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface SimpleReplyProps {
  replyToMessageId: string;
  className?: string;
}

export const SimpleReply: React.FC<SimpleReplyProps> = ({ 
  replyToMessageId, 
  className = '' 
}) => {
  const [replyMessage, setReplyMessage] = useState<{content: string, senderName: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReplyMessage = async () => {
      try {
        // Récupérer le message original
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .select('content, user_id')
          .eq('id', replyToMessageId)
          .single();

        if (messageError) throw messageError;

        // Récupérer le nom de l'expéditeur
        const { data: userData, error: userError } = await supabase
          .from('user_profiles')
          .select('name')
          .eq('id', messageData.user_id)
          .single();

        if (userError) throw userError;

        setReplyMessage({
          content: messageData.content,
          senderName: userData.name || 'Utilisateur'
        });
      } catch (error) {
        console.error('Erreur récupération message original:', error);
      } finally {
        setLoading(false);
      }
    };

    if (replyToMessageId) {
      fetchReplyMessage();
    }
  }, [replyToMessageId]);

  if (loading) {
    return (
      <div className={`mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded border ${className}`}>
        <div className="text-xs text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!replyMessage) {
    return null;
  }

  return (
    <div className={`mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded border ${className}`}>
      <div className="flex items-start gap-2">
        {/* Ligne violette */}
        <div className="w-1 bg-purple-500 rounded-full flex-shrink-0 mt-1"></div>
        
        {/* Message cité */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-purple-600 mb-1">
            {replyMessage.senderName}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {replyMessage.content}
          </div>
        </div>
      </div>
    </div>
  );
};
