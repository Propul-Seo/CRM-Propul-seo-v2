import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EnhancedSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
}

export const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  placeholder = "Rechercher... (sans accents requis)",
  className = "",
  showClearButton = true
}) => {
  return (
    <div className={cn("relative", className)}>
      {/* Icône de recherche */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
      
      {/* Input de recherche */}
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className={cn(
          "block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md",
          "leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
          "placeholder-gray-500 dark:placeholder-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "dark:focus:ring-offset-gray-800 transition-colors duration-200"
        )}
      />
      
      {/* Bouton d'effacement */}
      {showClearButton && searchTerm && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            onClick={() => onSearchChange('')}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Effacer la recherche"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* Indicateur de recherche active */}
      {searchTerm && (
        <div className="absolute -bottom-6 left-0 text-xs text-gray-500 dark:text-gray-400">
          Recherche active
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchBar;
