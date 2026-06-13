import React from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../utils/clipboard';

interface CopyButtonProps {
  text: string;
  type: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSuccess?: boolean;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  type,
  className = '',
  size = 'md',
  showSuccess = true
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text, type);
    
    if (success && showSuccess) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset après 2 secondes
    }
  };

  const sizeClasses = {
    sm: 'h-3 w-3 p-1',
    md: 'h-4 w-4 p-1.5',
    lg: 'h-5 w-5 p-2'
  };

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        text-gray-400 hover:text-blue-600 hover:bg-blue-50 
        rounded-md transition-all duration-200 
        ${sizeClasses[size]} 
        ${className}
        ${copied ? 'text-green-600 bg-green-50' : ''}
      `}
      title={copied ? `${type} copié !` : `Copier le ${type.toLowerCase()}`}
    >
      {copied ? (
        <Check className={iconSize[size]} />
      ) : (
        <Copy className={iconSize[size]} />
      )}
    </button>
  );
};

export default CopyButton;
