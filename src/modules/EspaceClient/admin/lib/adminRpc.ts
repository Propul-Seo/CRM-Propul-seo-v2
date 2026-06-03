import { supabase } from '@/lib/supabase';

// Les RPC admin_* sont ajoutées par les migrations 270+ et peuvent ne pas encore
// figurer dans les types générés (src/types/database.ts). Ce module isole l'unique
// cast nécessaire, au lieu d'un `as any` dispersé. Étendre AdminRpcMap au fil des phases.
export interface AdminRpcMap {
  admin_create_invoice: {
    args: {
      p_project_id: string;
      p_amount_subtotal: number;
      p_is_deposit?: boolean;
      p_vat_rate?: number;
      p_line_items?: Array<{ label: string; amount: number }>;
      p_issue_date?: string;        // 'YYYY-MM-DD'
      p_due_date?: string | null;
      p_client_visible_notes?: string | null;
      p_internal_notes?: string | null;
      p_installments?: Array<{ label: string; amount: number; due_date: string }>;
    };
    returns: string;                // invoice id (uuid)
  };
  admin_update_invoice: {
    args: {
      p_invoice_id: string;
      p_amount_subtotal?: number | null;
      p_vat_rate?: number | null;
      p_line_items?: Array<{ label: string; amount: number }> | null;
      p_due_date?: string | null;
      p_client_visible_notes?: string | null;
      p_internal_notes?: string | null;
    };
    returns: null;
  };
  admin_send_invoice: {
    args: { p_invoice_id: string };
    returns: null;
  };
  admin_create_project_step: {
    args: {
      p_project_id: string;
      p_label: string;
      p_step_order?: number | null;
      p_status?: string;
      p_description?: string | null;
      p_date_start?: string | null;
      p_date_planned_end?: string | null;
      p_visible_to_client?: boolean;
    };
    returns: string;            // step id (uuid)
  };
  admin_update_project_step: {
    args: {
      p_step_id: string;
      p_label?: string | null;
      p_status?: string | null;
      p_description?: string | null;
      p_date_start?: string | null;
      p_date_planned_end?: string | null;
      p_date_actual_end?: string | null;
      p_visible_to_client?: boolean | null;
    };
    returns: null;
  };
  admin_delete_project_step: {
    args: { p_step_id: string };
    returns: null;
  };
  admin_reorder_project_steps: {
    args: { p_project_id: string; p_ordered_ids: string[] };
    returns: null;
  };
  admin_create_document: {
    args: {
      p_project_id: string;
      p_document_type: string;
      p_name: string;
      p_file_url: string;
      p_file_size_bytes?: number | null;
      p_file_mime_type?: string | null;
      p_category?: string | null;
      p_description?: string | null;
      p_visible_to_client?: boolean;
    };
    returns: string;            // document id (uuid)
  };
  admin_update_document: {
    args: {
      p_document_id: string;
      p_name?: string | null;
      p_category?: string | null;
      p_description?: string | null;
      p_visible_to_client?: boolean | null;
    };
    returns: null;
  };
  admin_delete_document: {
    args: { p_document_id: string };
    returns: null;
  };
}

export async function adminRpc<K extends keyof AdminRpcMap & string>(
  fn: K,
  args: AdminRpcMap[K] extends { args: infer A } ? A : never,
): Promise<{ data: unknown; error: { message: string } | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)(fn, args as Record<string, unknown>);
  return { data, error };
}
