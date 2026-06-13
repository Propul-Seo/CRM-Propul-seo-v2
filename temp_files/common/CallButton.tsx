import React, { useState, useEffect } from 'react';
import { Phone, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { ringoverService, RingoverCallResponse } from '../../services/ringoverService';
import { toast } from 'sonner';

export type CallButtonVariant = 'primary' | 'secondary';

export interface CallButtonProps {
  phoneNumber: string;
  sdrUserId: string;
  variant?: CallButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
  onCallInitiated?: (response: RingoverCallResponse) => void;
  onCallError?: (error: string) => void;
}

export const CallButton: React.FC<CallButtonProps> = ({
  phoneNumber,
  sdrUserId,
  variant = 'primary',
  size = 'md',
  className = '',
  showTooltip = true,
  onCallInitiated,
  onCallError
}) => {
  const [callState, setCallState] = useState<'idle' | 'calling' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Vérifier la connectivité Ringover au montage
  useEffect(() => {
    const checkConnectivity = async () => {
      const connected = await ringoverService.checkConnectivity();
      setIsConnected(connected);
      
      if (!connected) {
        console.warn('⚠️ Ringover - API non accessible');
      }
    };

    checkConnectivity();
  }, []);

  // Nettoyer les messages d'erreur après 3 secondes
  useEffect(() => {
    if (callState === 'error' && errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
        setCallState('idle');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [callState, errorMessage]);

  const handleCall = async () => {
    if (!phoneNumber || !sdrUserId) {
      const errorMsg = 'Numéro de téléphone ou ID SDR manquant';
      setErrorMessage(errorMsg);
      setCallState('error');
      onCallError?.(errorMsg);
      toast.error('Paramètres manquants pour l\'appel');
      return;
    }

    try {
      setCallState('calling');
      
      console.log('📞 CallButton - Initiation appel vers:', phoneNumber);
      
      const response = await ringoverService.initiateCall(phoneNumber, sdrUserId);
      
      if (response.success) {
        setCallState('success');
        onCallInitiated?.(response);
        
        toast.success(`Appel initié vers ${phoneNumber}`);
        
        // Retour à l'état idle après 2 secondes
        setTimeout(() => {
          setCallState('idle');
        }, 2000);
        
      } else {
        setCallState('error');
        setErrorMessage(response.error || 'Erreur lors de l\'initiation de l\'appel');
        onCallError?.(response.error || 'Erreur inconnue');
        
        toast.error(`Erreur: ${response.error || 'Impossible d\'initier l\'appel'}`);
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      setCallState('error');
      setErrorMessage(errorMsg);
      onCallError?.(errorMsg);
      
      toast.error(`Erreur: ${errorMsg}`);
      
      console.error('❌ CallButton - Erreur lors de l\'appel:', error);
    }
  };

  const getButtonContent = () => {
    switch (callState) {
      case 'calling':
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Appel...</span>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>Appelé</span>
          </>
        );
      case 'error':
        return (
          <>
            <XCircle className="w-4 h-4" />
            <span>Erreur</span>
          </>
        );
      default:
        return (
          <>
            <Phone className="w-4 h-4" />
            <span>Appeler</span>
          </>
        );
    }
  };

  const getButtonStyles = () => {
    const baseStyles = 'transition-all duration-200 font-medium';
    
    switch (variant) {
      case 'primary':
        return `${baseStyles} bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg`;
      case 'secondary':
        return `${baseStyles} bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 hover:text-gray-900`;
      default:
        return baseStyles;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  // Temporairement permettre les appels même sans connectivité (en attente du déploiement de la fonction Edge)
  const isDisabled = callState === 'calling';
  
  // Afficher un avertissement si la fonction Edge n'est pas encore déployée
  const showEdgeFunctionWarning = !isConnected;



  const buttonElement = (
    <div className="space-y-2">
      <Button
        onClick={handleCall}
        disabled={isDisabled}
        className={`${getButtonStyles()} ${getSizeStyles()} ${className}`}
        title={isDisabled ? 'Appel en cours...' : `Appeler ${phoneNumber}`}
      >
        {getButtonContent()}
      </Button>
      
      {showEdgeFunctionWarning && (
        <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
          ⚠️ Fonction Edge non déployée - Déployez sur Supabase pour activer les appels
        </div>
      )}
    </div>
  );

  if (showTooltip && callState === 'error' && errorMessage) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonElement}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm">{errorMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonElement;
};
