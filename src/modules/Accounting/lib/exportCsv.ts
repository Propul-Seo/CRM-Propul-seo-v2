// Génération CSV pure (sans DOM, testable) pour l'export comptable.
// Format ciblé Excel FR : séparateur ';' et virgule décimale.

export interface AccountingExportRow {
  date: string; // ISO 'YYYY-MM-DD'
  type: string; // libellé déjà localisé ('Revenu' | 'Dépense')
  category: string; // libellé FR
  sousCategorie: string; // libellé FR ou ''
  description: string;
  amount: number | string; // Supabase renvoie les DECIMAL en string → coercé à l'écriture
}

const HEADER = ['Date', 'Type', 'Catégorie', 'Sous-catégorie', 'Description', 'Montant'];

function escapeCsv(value: string): string {
  if (/[;"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDateFr(iso: string): string {
  // Parse manuel YYYY-MM-DD (new Date(iso) interpréterait en UTC → décalage d'un jour selon le fuseau)
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return iso;
}

function formatAmountFr(amount: number | string): string {
  // Number() car Supabase sérialise les colonnes DECIMAL en string
  return Number(amount).toFixed(2).replace('.', ',');
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
