import React from 'react';
import { Phone } from 'lucide-react';
import { CallButton } from './CallButton';

export interface PhoneNumberDisplayProps {
  phoneNumber: string;
  sdrUserId: string;
  label?: string;
  type?: 'mobile' | 'fixed' | 'work';
  showCallButton?: boolean;
  callButtonVariant?: 'primary' | 'secondary';
  callButtonSize?: 'sm' | 'md' | 'lg';
  className?: string;
  onCallInitiated?: (response: any) => void;
  onCallError?: (error: string) => void;
}

export const PhoneNumberDisplay: React.FC<PhoneNumberDisplayProps> = ({
  phoneNumber,
  sdrUserId,
  label,
  type = 'mobile',
  showCallButton = true,
  callButtonVariant = 'secondary',
  callButtonSize = 'sm',
  className = '',
  onCallInitiated,
  onCallError
}) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'mobile':
        return '📱';
      case 'fixed':
        return '☎️';
      case 'work':
        return '🏢';
      default:
        return '📞';
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'mobile':
        return 'Mobile';
      case 'fixed':
        return 'Fixe';
      case 'work':
        return 'Travail';
      default:
        return 'Téléphone';
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Formatage français : 06 12 34 56 78
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('33')) {
      // Numéro international français
      const national = cleaned.substring(2);
      if (national.startsWith('6') || national.startsWith('7')) {
        // Mobile
        return national.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
      } else {
        // Fixe
        return national.replace(/(\d{1})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
      }
    } else if (cleaned.startsWith('0')) {
      // Numéro national français
      if (cleaned.startsWith('06') || cleaned.startsWith('07')) {
        // Mobile
        return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
      } else {
        // Fixe
        return cleaned.replace(/(\d{1})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
      }
    }
    
    // Formatage par défaut
    return phone;
  };

  return (
    <div className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getTypeIcon()}</span>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {label || getTypeLabel()}
            </span>
            <span className="text-sm font-mono text-gray-900 dark:text-white">
              {formatPhoneNumber(phoneNumber)}
            </span>
          </div>
        </div>
      </div>
      
      {showCallButton && (
        <div className="flex items-center gap-2">
          <CallButton
            phoneNumber={phoneNumber}
            sdrUserId={sdrUserId}
            variant={callButtonVariant}
            size={callButtonSize}
            onCallInitiated={onCallInitiated}
            onCallError={onCallError}
          />
        </div>
      )}
    </div>
  );
};
