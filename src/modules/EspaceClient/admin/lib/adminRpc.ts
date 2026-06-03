import { supabase } from '@/lib/supabase';

// Les RPC admin_* sont ajoutées par les migrations 270+ et peuvent ne pas encore
// figurer dans les types générés (src/types/database.ts). Ce module isole l'unique
// cast nécessaire, au lieu d'un `as any` dispersé. Étendre AdminRpcMap au fil des phases.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AdminRpcMap {
  // Phase 1 (migrations 270/271) — à activer une fois les types régénérés :
  // admin_create_invoice: { args: { p_project_id: string; p_amount_subtotal: number; /* … */ }; returns: string };
  // admin_update_invoice: { args: { p_invoice_id: string; /* … */ }; returns: null };
  // admin_send_invoice:   { args: { p_invoice_id: string }; returns: null };
}

export async function adminRpc<K extends keyof AdminRpcMap & string>(
  fn: K,
  args: AdminRpcMap[K] extends { args: infer A } ? A : never,
): Promise<{ data: unknown; error: { message: string } | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)(fn, args as Record<string, unknown>);
  return { data, error };
}
