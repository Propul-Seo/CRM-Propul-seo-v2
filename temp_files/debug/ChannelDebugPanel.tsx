import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface Channel {
  id: string;
  name: string;
  description?: string;
  unreadCount?: number;
}

interface ChannelDebugPanelProps {
  channels: Channel[];
  selectedChannel?: string;
  onChannelSelect: (channelId: string) => void;
}

export const ChannelDebugPanel: React.FC<ChannelDebugPanelProps> = ({
  channels,
  selectedChannel,
  onChannelSelect
}) => {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Debug - Canaux et Compteurs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <strong>Total canaux:</strong> {channels.length} | 
            <strong> Canal sélectionné:</strong> {selectedChannel || 'Aucun'}
          </div>
          
          <div className="space-y-2">
            {channels.map((channel) => (
              <div 
                key={channel.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedChannel === channel.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onChannelSelect(channel.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{channel.name}</h4>
                    <p className="text-xs text-gray-500">{channel.id}</p>
                    {channel.description && (
                      <p className="text-sm text-gray-600">{channel.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={channel.unreadCount && channel.unreadCount > 0 ? "destructive" : "secondary"}
                      className="min-w-[24px] h-6 flex items-center justify-center"
                    >
                      {channel.unreadCount || 0}
                    </Badge>
                    
                    {selectedChannel === channel.id && (
                      <Badge variant="outline" className="text-xs">
                        ACTIF
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  <span>Compteur: </span>
                  <code className="bg-gray-100 px-1 rounded">
                    {channel.unreadCount || 0}
                  </code>
                </div>
              </div>
            ))}
          </div>
          
          {channels.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              Aucun canal chargé
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
