import { useState, useMemo } from 'react';
import { removeAccents, getNestedValue } from '../utils/searchUtils';

// Hook pour recherche insensible aux accents
export const useAccentInsensitiveSearch = <T>(
  items: T[], 
  searchFields: string[]
) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return items;
    }
    
    const normalizedSearch = removeAccents(searchTerm.trim());
    
    return items.filter(item => {
      return searchFields.some(field => {
        const fieldValue = getNestedValue(item, field);
        if (!fieldValue) return false;
        
        const normalizedValue = removeAccents(String(fieldValue));
        return normalizedValue.includes(normalizedSearch);
      });
    });
  }, [items, searchTerm, searchFields]);
  
  const clearSearch = () => setSearchTerm('');
  
  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
    clearSearch,
    hasResults: filteredItems.length > 0,
    totalItems: items.length,
    filteredCount: filteredItems.length
  };
};

export default useAccentInsensitiveSearch;
