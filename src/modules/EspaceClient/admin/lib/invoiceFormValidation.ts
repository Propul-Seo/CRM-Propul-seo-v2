export interface InvoiceFormValues {
  lines: Array<{ label: string; amount: number }>;
  vatRate: number;
  issueDate: string;            // 'YYYY-MM-DD'
  dueDate: string;              // '' ou 'YYYY-MM-DD'
  installments: Array<{ amount: number; due_date: string }>;
}

// Renvoie un message d'erreur FR, ou null si le formulaire est valide.
export function validateInvoiceForm(v: InvoiceFormValues): string | null {
  if (v.lines.some((l) => l.amount < 0)) {
    return 'Les montants ne peuvent pas être négatifs.';
  }
  const valid = v.lines.filter((l) => l.label.trim() && l.amount > 0);
  if (valid.length === 0) {
    return 'Ajoutez au moins une ligne avec un montant positif.';
  }
  if (v.dueDate && v.dueDate < v.issueDate) {
    return "L'échéance ne peut pas précéder la date d'émission.";
  }
  const subtotal = valid.reduce((s, l) => s + l.amount, 0);
  const total = subtotal * (1 + (v.vatRate || 0) / 100);
  const instSum = v.installments.reduce((s, i) => s + i.amount, 0);
  if (v.installments.length > 0 && instSum > total + 0.01) {
    return 'La somme des acomptes dépasse le total.';
  }
  return null;
}
