import { describe, it, expect } from 'vitest';
import { buildCsvContent, type AccountingExportRow } from './exportCsv';

const row = (over: Partial<AccountingExportRow> = {}): AccountingExportRow => ({
  date: '2026-03-15',
  type: 'Revenu',
  category: 'Site Internet',
  sousCategorie: '',
  description: 'Refonte site',
  amount: 1234.5,
  ...over,
});

describe('buildCsvContent', () => {
  it("renvoie uniquement l'en-tête pour un tableau vide", () => {
    expect(buildCsvContent([])).toBe('Date;Type;Catégorie;Sous-catégorie;Description;Montant');
  });

  it('formate la date en JJ/MM/AAAA et le montant en FR à virgule', () => {
    const line = buildCsvContent([row()]).split('\r\n')[1];
    expect(line).toBe('15/03/2026;Revenu;Site Internet;;Refonte site;1234,50');
  });

  it('échappe les champs contenant ; " ou retour à la ligne', () => {
    const line = buildCsvContent([row({ description: 'Audit; "express"\nphase 2' })]).split('\r\n')[1];
    expect(line).toContain('"Audit; ""express""\nphase 2"');
  });

  it('gère les montants négatifs (dépenses)', () => {
    const line = buildCsvContent([row({ type: 'Dépense', amount: -90 })]).split('\r\n')[1];
    expect(line).toContain('-90,00');
  });

  it('coerce un montant fourni en string (DECIMAL Supabase)', () => {
    const line = buildCsvContent([row({ amount: '1234.50' })]).split('\r\n')[1];
    expect(line).toBe('15/03/2026;Revenu;Site Internet;;Refonte site;1234,50');
  });

  it('formate la date sans décalage de fuseau horaire', () => {
    const line = buildCsvContent([row({ date: '2026-03-01' })]).split('\r\n')[1];
    expect(line.startsWith('01/03/2026;')).toBe(true);
  });
});
