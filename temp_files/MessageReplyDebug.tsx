import React from 'react';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';

interface ReplyMessage {
  id: string;
  content: string;
  sender_name: string;
  created_at: string;
}

interface MessageReplyDebugProps {
  replyToMessageId: string;
  className?: string;
}

export const MessageReplyDebug: React.FC<MessageReplyDebugProps> = ({ 
  replyToMessageId, 
  className = '' 
}) => {
  const [replyMessage, setReplyMessage] = useState<ReplyMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const loadReplyMessage = async () => {
      if (!replyToMessageId) return;

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 MessageReplyDebug: Chargement message de réponse pour:', replyToMessageId);
        
        // Test 1: Appel direct à la fonction SQL
        const { data, error: rpcError } = await supabase
          .rpc('get_reply_message_info', { reply_message_id: replyToMessageId });

        console.log('🔍 RPC Result:', { data, error: rpcError });

        if (rpcError) {
          console.error('❌ Erreur RPC:', rpcError);
          setError(`Erreur RPC: ${rpcError.message}`);
          
          // Test 2: Requête directe en cas d'échec RPC
          console.log('🔍 Tentative requête directe...');
          const { data: directData, error: directError } = await supabase
            .from('messages')
            .select(`
              id,
              content,
              created_at,
              user_id
            `)
            .eq('id', replyToMessageId)
            .single();

          console.log('🔍 Requête directe:', { directData, error: directError });

          if (directError) {
            setError(`Erreur requête directe: ${directError.message}`);
            return;
          }

          // Test 3: Récupérer le nom de l'utilisateur
          if (directData) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('name')
              .eq('id', directData.user_id)
              .single();

            console.log('🔍 Données utilisateur:', { userData, error: userError });

            if (userData) {
              setReplyMessage({
                id: directData.id,
                content: directData.content,
                sender_name: userData.name || 'Utilisateur',
                created_at: directData.created_at
              });
            } else {
              setReplyMessage({
                id: directData.id,
                content: directData.content,
                sender_name: 'Utilisateur',
                created_at: directData.created_at
              });
            }
          }
        } else {
          if (data && data.length > 0) {
            console.log('✅ Message de réponse chargé:', data[0]);
            setReplyMessage(data[0]);
          } else {
            console.log('⚠️ Aucune donnée retournée par RPC');
            setError('Aucune donnée retournée par la fonction SQL');
          }
        }
      } catch (error) {
        console.error('❌ Erreur générale:', error);
        setError(`Erreur: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    loadReplyMessage();
  }, [replyToMessageId]);

  if (loading) {
    return (
      <div className={`text-xs text-gray-500 italic ${className}`}>
        🔍 Chargement de la réponse...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`mb-2 p-2 bg-red-100 border border-red-300 rounded ${className}`}>
        <div className="text-xs text-red-700 font-medium mb-1">❌ Erreur de chargement:</div>
        <div className="text-xs text-red-600">{error}</div>
        <div className="text-xs text-gray-500 mt-1">ID: {replyToMessageId}</div>
      </div>
    );
  }

  if (!replyMessage) {
    return (
      <div className={`mb-2 p-2 bg-yellow-100 border border-yellow-300 rounded ${className}`}>
        <div className="text-xs text-yellow-700">⚠️ Aucun message de réponse trouvé</div>
        <div className="text-xs text-gray-500">ID: {replyToMessageId}</div>
      </div>
    );
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
      
      {/* Debug info */}
      <div className="text-xs text-gray-400 mt-1">
        Debug: ID={replyMessage.id} | Time={new Date(replyMessage.created_at).toLocaleTimeString()}
      </div>
    </div>
  );
};
