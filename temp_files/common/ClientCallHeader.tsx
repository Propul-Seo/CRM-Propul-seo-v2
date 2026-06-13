import React from 'react';
import { Phone, User, Building } from 'lucide-react';
import { CallButton } from './CallButton';
import { Badge } from '../ui/badge';

export interface ClientCallHeaderProps {
  clientName: string;
  primaryPhoneNumber: string;
  sdrUserId: string;
  clientType?: 'prospect' | 'client' | 'lead';
  companyName?: string;
  className?: string;
  onCallInitiated?: (response: any) => void;
  onCallError?: (error: string) => void;
}

export const ClientCallHeader: React.FC<ClientCallHeaderProps> = ({
  clientName,
  primaryPhoneNumber,
  sdrUserId,
  clientType = 'prospect',
  companyName,
  className = '',
  onCallInitiated,
  onCallError
}) => {
  const getClientTypeInfo = () => {
    switch (clientType) {
      case 'prospect':
        return { label: 'Prospect', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300', icon: '🎯' };
      case 'client':
        return { label: 'Client', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: '✅' };
      case 'lead':
        return { label: 'Lead', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', icon: '🔥' };
      default:
        return { label: 'Contact', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: '👤' };
    }
  };

  const clientTypeInfo = getClientTypeInfo();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {clientName}
              </h2>
            </div>
            <Badge className={clientTypeInfo.color}>
              <span className="mr-1">{clientTypeInfo.icon}</span>
              {clientTypeInfo.label}
            </Badge>
          </div>
          
          {companyName && (
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                {companyName}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Téléphone principal :
              </span>
              <span className="font-mono text-gray-900 dark:text-white font-medium">
                {primaryPhoneNumber}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Appel rapide
            </p>
            <CallButton
              phoneNumber={primaryPhoneNumber}
              sdrUserId={sdrUserId}
              variant="primary"
              size="lg"
              className="min-w-[140px]"
              onCallInitiated={onCallInitiated}
              onCallError={onCallError}
            />
          </div>
          
          <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
            <p>Cliquez pour appeler</p>
            <p>via Ringover</p>
          </div>
        </div>
      </div>
    </div>
  );
};
