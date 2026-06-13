import { supabase } from '@/lib/supabase';

const SIGNED_URL_TTL_S = 3600; // 1 h

// URL signée pour un fichier Storage privé, via la session admin CRM
// (les policies bucket propulspace-* exigent is_admin() sur le JWT appelant).
export async function getAdminSignedUrl(bucket: string, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL_S);
  if (error || !data) return null;
  return data.signedUrl;
}
