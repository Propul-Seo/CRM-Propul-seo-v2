import { describe, it, expect } from 'vitest';
import { validateInvoiceForm, type InvoiceFormValues } from './invoiceFormValidation';

const base = (over: Partial<InvoiceFormValues> = {}): InvoiceFormValues => ({
  lines: [{ label: 'Prestation', amount: 1000 }],
  vatRate: 0,
  issueDate: '2026-06-08',
  dueDate: '',
  installments: [],
  ...over,
});

describe('validateInvoiceForm', () => {
  it('accepte un formulaire valide', () => {
    expect(validateInvoiceForm(base())).toBeNull();
  });

  it('refuse une facture sans ligne avec montant positif', () => {
    expect(validateInvoiceForm(base({ lines: [{ label: '', amount: 0 }] })))
      .toBe('Ajoutez au moins une ligne avec un montant positif.');
  });

  it('refuse un montant négatif', () => {
    expect(validateInvoiceForm(base({ lines: [{ label: 'X', amount: -10 }] })))
      .toBe('Les montants ne peuvent pas être négatifs.');
  });

  it("refuse une échéance antérieure à l'émission", () => {
    expect(validateInvoiceForm(base({ issueDate: '2026-06-08', dueDate: '2026-06-01' })))
      .toBe("L'échéance ne peut pas précéder la date d'émission.");
  });

  it("refuse une somme d'acomptes supérieure au total", () => {
    expect(validateInvoiceForm(base({
      lines: [{ label: 'X', amount: 100 }],
      installments: [{ amount: 80, due_date: '2026-07-01' }, { amount: 50, due_date: '2026-08-01' }],
    }))).toBe('La somme des acomptes dépasse le total.');
  });
});
