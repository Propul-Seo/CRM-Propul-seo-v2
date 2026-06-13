import { createClient } from '@supabase/supabase-js'

// Le portail client est 100 % SSR : la clé service_role ne quitte jamais le serveur.
// On l'utilise pour contourner la RLS de project_documents (qui n'expose pas anon).
// La sécurité d'accès reste assurée par la validation portal_short_code + portal_enabled
// + portal_expires_at en amont de chaque query.
export function createSupabaseServer() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('[supabase-server] SUPABASE_URL manquante')
  if (!key) throw new Error('[supabase-server] SUPABASE_SERVICE_ROLE_KEY manquante')
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
