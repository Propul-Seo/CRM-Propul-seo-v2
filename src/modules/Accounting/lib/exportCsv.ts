// Génération CSV pure (sans DOM, testable) pour l'export comptable.
// Format ciblé Excel FR : séparateur ';' et virgule décimale.

export interface AccountingExportRow {
  date: string; // ISO 'YYYY-MM-DD'
  type: string; // libellé déjà localisé ('Revenu' | 'Dépense')
  category: string; // libellé FR
  sousCategorie: string; // libellé FR ou ''
  description: string;
  amount: number; // montant brut (formaté FR à l'écriture)
}

const HEADER = ['Date', 'Type', 'Catégorie', 'Sous-catégorie', 'Description', 'Montant'];

function escapeCsv(value: string): string {
  if (/[;"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

function formatAmountFr(amount: number): string {
  return amount.toFixed(2).replace('.', ',');
}

export function buildCsvContent(rows: AccountingExportRow[]): string {
  const lines = [HEADER.join(';')];
  for (const row of rows) {
    lines.push(
      [
        formatDateFr(row.date),
        escapeCsv(row.type),
        escapeCsv(row.category),
        escapeCsv(row.sousCategorie),
        escapeCsv(row.description),
        formatAmountFr(row.amount),
      ].join(';'),
    );
  }
  return lines.join('\r\n');
}
