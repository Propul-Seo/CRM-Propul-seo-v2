import React from 'react';
import { removeAccents } from '../../utils/searchUtils';

interface HighlightTextProps {
  text: string;
  searchTerm: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({ text, searchTerm }) => {
  if (!searchTerm || !text) {
    return <span>{text}</span>;
  }
  
  const normalizedText = removeAccents(text);
  const normalizedSearch = removeAccents(searchTerm);
  
  // Si pas de correspondance, retourner le texte normal
  if (!normalizedText.includes(normalizedSearch)) {
    return <span>{text}</span>;
  }
  
  // Trouver la position de la correspondance dans le texte original
  const index = normalizedText.indexOf(normalizedSearch);
  if (index === -1) {
    return <span>{text}</span>;
  }
  
  const beforeMatch = text.substring(0, index);
  const match = text.substring(index, index + searchTerm.length);
  const afterMatch = text.substring(index + searchTerm.length);
  
  return (
    <span>
      {beforeMatch}
      <mark className="bg-yellow-200 dark:bg-yellow-300 px-1 rounded text-gray-900">{match}</mark>
      {afterMatch}
    </span>
  );
};

export default HighlightText;
