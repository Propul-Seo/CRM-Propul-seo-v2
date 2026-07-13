-- =============================================================================
-- 307 — Tables internes de la passerelle CRM des agents (Paperclip)
-- Date : 2026-07-13   —   backend de l'Edge Function `crm-agent-gateway`
-- -----------------------------------------------------------------------------
-- Principe : l'agent n'a AUCUNE clé Supabase. Il présente une clé d'appel opaque
-- (par company), que la passerelle (service_role) vérifie ici. Ces deux tables
-- sont STRICTEMENT internes : seul service_role (donc la seule Edge Function) y
-- touche. RLS activé + zéro policy => anon, authenticated et prospection ne
-- voient rien. On ne stocke JAMAIS la clé en clair, seulement son SHA-256.
-- =============================================================================

-- --- Clés d'appel (une ou plusieurs par company) -----------------------------
CREATE TABLE IF NOT EXISTS public.agent_api_keys (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_code text        NOT NULL CHECK (company_code IN ('AGE','PRO','BON')),
  label        text        NOT NULL,
  key_hash     text        NOT NULL UNIQUE,          -- SHA-256 hex de la clé en clair
  created_at   timestamptz NOT NULL DEFAULT now(),
  revoked_at   timestamptz                            -- NULL = active
);

COMMENT ON TABLE public.agent_api_keys IS
  'Clés d''appel de la passerelle agents. key_hash = SHA-256 de la clé en clair (jamais la clé). revoked_at IS NULL => active. Révoquer = poser revoked_at (ne casse pas les autres companies).';

-- Recherche des clés actives (la passerelle ne lit que les non-révoquées).
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_active
  ON public.agent_api_keys (key_hash) WHERE revoked_at IS NULL;

-- --- Journal d'appels (qui, quoi, combien de lignes) -------------------------
CREATE TABLE IF NOT EXISTS public.agent_call_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id   uuid REFERENCES public.agent_api_keys(id) ON DELETE SET NULL,
  company_code text,                                  -- NULL si auth échouée
  action       text        NOT NULL,                  -- 'list_prospectables', ... ou 'auth_failed'
  ok           boolean     NOT NULL,
  row_count    integer,                               -- nb de lignes lues/écrites
  target_id    uuid,                                  -- lead/contact visé, si pertinent
  error        text,                                  -- message d'erreur, si ok=false
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.agent_call_log IS
  'Journal de chaque appel de la passerelle agents : traçabilité RGPD (qui/quoi/combien). Ne contient JAMAIS de PII (pas d''email/nom), seulement action + compteurs + id cible.';

CREATE INDEX IF NOT EXISTS idx_agent_call_log_created ON public.agent_call_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_call_log_company ON public.agent_call_log (company_code, created_at DESC);

-- --- Verrouillage : tables internes, service_role uniquement ------------------
ALTER TABLE public.agent_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_call_log ENABLE ROW LEVEL SECURITY;
-- Aucune policy créée => aucun rôle soumis au RLS (anon/authenticated/prospection)
-- ne peut lire/écrire. service_role bypasse le RLS : la passerelle fonctionne.

-- Ceinture explicite : on retire tout privilège aux rôles publics/prospection,
-- y compris ceux hérités du default ACL sur les tables futures (cf. 306 §3).
REVOKE ALL ON public.agent_api_keys FROM anon, authenticated, prospection;
REVOKE ALL ON public.agent_call_log FROM anon, authenticated, prospection;
