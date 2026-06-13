import { logger } from '@/lib/logger';
import { supabase } from '../../lib/supabase';

export async function resolveAccountingTable(): Promise<string> {
  const tablesToTry = ['accounting_entries', 'invoices'];

  for (const tableName of tablesToTry) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1);

      if (!error) {
        logger.debug(`Table ${tableName} disponible`);
        return tableName;
      }
    } catch {
      logger.debug(`Table ${tableName} non disponible`);
    }
  }

  logger.debug('Aucune table trouvée, utilisation par défaut: accounting_entries');
  return 'accounting_entries';
}

export function buildAccountingInsertData(
  tableName: string,
  entryData: Record<string, unknown>,
  userId: string
): Record<string, unknown> {
  if (tableName === 'invoices') {
    return {
      title: entryData.description,
      total: entryData.amount,
      subtotal: entryData.amount,
      tax_amount: 0,
      user_id: userId,
      client_id: entryData.client_id || null,
      invoice_number: `INV-${Date.now()}`,
      issue_date: entryData.entry_date || new Date().toISOString().split('T')[0],
      due_date: entryData.entry_date || new Date().toISOString().split('T')[0],
      status: entryData.type === 'revenue' ? 'paid' : 'draft'
    };
  }

  return {
    type: entryData.type,
    description: entryData.description,
    amount: entryData.amount,
    entry_date: entryData.entry_date || new Date().toISOString().split('T')[0],
    created_by: userId,
    user_id: userId,
    category: entryData.category || 'general'
  };
}

export async function insertWithFallback(
  tableName: string,
  data: Record<string, unknown>
): Promise<{ data: unknown; isFallback: boolean }> {
  const { data: result, error } = await supabase
    .from(tableName)
    .insert([data])
    .select()
    .single();

  if (error) {
    logger.error(`Erreur Supabase (${tableName}):`, error);

    if (error.message.includes('foreign key constraint') || error.message.includes('not-null constraint')) {
      logger.debug('Tentative avec UUID par défaut...');

      const fallbackData = {
        ...data,
        created_by: '00000000-0000-0000-0000-000000000000'
      };

      const { data: fallbackResult, error: fallbackError } = await supabase
        .from(tableName)
        .insert([fallbackData])
        .select()
        .single();

      if (fallbackError) {
        logger.error('Erreur fallback:', fallbackError);
        throw fallbackError;
      }

      return { data: fallbackResult, isFallback: true };
    }

    throw error;
  }

  return { data: result, isFallback: false };
}

export function getAccountingErrorMessage(err: Error): string {
  if (err.message.includes('foreign key constraint')) {
    return 'Erreur de référence utilisateur - Mode bypass activé';
  } else if (err.message.includes('check constraint')) {
    return "Type d'entrée invalide";
  } else if (err.message.includes('not-null constraint')) {
    return 'Données manquantes';
  }
  return 'Erreur lors de la création';
}
