import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { X, Reply } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
  };
  created_at: string;
}

interface ReplySelectorProps {
  messages: Message[];
  onSelectReply: (messageId: string) => void;
  onCancel: () => void;
  isVisible: boolean;
}

export const ReplySelector: React.FC<ReplySelectorProps> = ({
  messages,
  onSelectReply,
  onCancel,
  isVisible
}) => {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Répondre à un message
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Liste des messages récents */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages.slice(-20).reverse().map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                selectedMessageId === message.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedMessageId(message.id)}
            >
              {/* En-tête du message */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {message.user.name}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              {/* Contenu du message */}
              <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {message.content}
              </div>
            </div>
          ))}
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Annuler
          </Button>
          <Button
            onClick={() => {
              if (selectedMessageId) {
                onSelectReply(selectedMessageId);
                onCancel();
              }
            }}
            disabled={!selectedMessageId}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Reply className="h-4 w-4 mr-2" />
            Répondre
          </Button>
        </div>
      </div>
    </div>
  );
};
