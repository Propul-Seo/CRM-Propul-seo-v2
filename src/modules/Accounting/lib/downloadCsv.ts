// Déclenche le téléchargement d'un CSV côté navigateur.
// Préfixe BOM UTF-8 pour qu'Excel FR lise correctement les accents.
const BOM = '﻿';

export function triggerCsvDownload(filename: string, csvContent: string): void {
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
