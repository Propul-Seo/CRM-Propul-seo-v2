// Types spécifiques au module Accounting

export interface AccountingEntry {
  id: string;
  label: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
} 