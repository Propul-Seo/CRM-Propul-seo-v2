import React from 'react';

/**
 * Formate un texte en préservant les retours à la ligne
 * @param text - Le texte à formater
 * @param className - Classes CSS optionnelles
 * @returns Un élément React avec le texte formaté
 */
export const formatTextWithLineBreaks = (text: string, className: string = ''): React.ReactElement => {
  if (!text) return <></>;
  
  // Diviser le texte par les retours à la ligne
  const lines = text.split('\n');
  
  return (
    <div className={className}>
      {lines.map((line, index) => (
        <React.Fragment key={index}>
          {line}
          {index < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
};

/**
 * Formate un texte en préservant les retours à la ligne avec des paragraphes
 * @param text - Le texte à formater
 * @param className - Classes CSS optionnelles
 * @returns Un élément React avec le texte formaté en paragraphes
 */
export const formatTextWithParagraphs = (text: string, className: string = ''): React.ReactElement => {
  if (!text) return <></>;
  
  // Diviser le texte par les retours à la ligne doubles (paragraphes)
  const paragraphs = text.split(/\n\s*\n/);
  
  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => {
        if (!paragraph.trim()) return null;
        
        // Diviser chaque paragraphe par les retours à la ligne simples
        const lines = paragraph.split('\n');
        
        return (
          <p key={index} className="mb-2 last:mb-0">
            {lines.map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {line}
                {lineIndex < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};
