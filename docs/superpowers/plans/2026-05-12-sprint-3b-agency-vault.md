# Sprint 3B — Coffre-fort agence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer un coffre-fort chiffré dédié aux accès internes Propul'seo (Workspace, Dev, Infra, Finance, Marketing, SaaS), accessible uniquement aux admins via `/coffre-fort`, en réutilisant l'infrastructure pgcrypto + Vault du Sprint 3A et en factorisant les composants V3 dans un dossier partagé.

**Architecture:** Table BDD dédiée `public.agency_accesses` chiffrée via pgcrypto (même passphrase `propulseo_access_key` que coffre projet), 4 RPC `SECURITY DEFINER` admin-only. Refactorisation préalable des composants V3 (`AccessItemV3`, `AccessEditModalV3`) vers `src/components/v3/access-shared/` pour double consommation (projet + agence). Module `AgencyVault` autonome avec page dédiée, search debounced, groupement par catégorie. Tests E2E Playwright pour valider l'ensemble.

**Tech Stack:** PostgreSQL 15 (Supabase), pgcrypto, supabase_vault, React 18, TypeScript 5, Vite 5, Tailwind CSS, react-router-dom, sonner (toasts), Lucide icons, Playwright (nouveau).

---

## File Structure

### Création
- `supabase/migrations/20260513_010_agency_vault.sql` — migration BDD complète
- `src/components/v3/access-shared/AccessItemView.tsx` — composant item réutilisable
- `src/components/v3/access-shared/AccessEditModal.tsx` — modal add/edit réutilisable
- `src/components/v3/access-shared/CategoryGroup.tsx` — groupement pliable
- `src/components/v3/access-shared/types.ts` — types partagés (AccessFormValues, CategoryConfig)
- `src/components/v3/access-shared/index.ts` — barrel export
- `src/modules/AgencyVault/index.tsx` — entry point + export AgencyVaultPage
- `src/modules/AgencyVault/AgencyVaultPage.tsx` — layout page + composition
- `src/modules/AgencyVault/hooks/useAgencyAccesses.ts` — hook RPC (fetch/upsert/delete + optimistic)
- `src/modules/AgencyVault/components/AgencyVaultHeader.tsx` — header sticky (titre, count, search, bouton)
- `src/modules/AgencyVault/components/AgencyVaultCategories.tsx` — rendu groupé par catégorie
- `src/modules/AgencyVault/components/AgencyVaultEmptyState.tsx` — états vides
- `src/modules/AgencyVault/constants.ts` — catégories agence (labels, icônes, ordre)
- `playwright.config.ts` — config Playwright minimal
- `tests/e2e/agency-vault.spec.ts` — scénario E2E
- `tests/e2e/fixtures/auth.ts` — login admin fixture
- `tests/e2e/README.md` — doc setup credentials
- `.env.test.example` — template vide pour credentials E2E

### Modification
- `src/lib/routes.ts` — ajouter `agencyVault: '/coffre-fort'` + permission
- `src/components/layout/Sidebar.tsx:90-92` — ajouter entrée Coffre-fort dans persoSection
- `src/components/layout/Layout.tsx` — ajouter lazy import + route `/coffre-fort`
- `src/modules/ProjectDetailsV3Preview/tabs/AccessTabV3.tsx` — adapter imports vers components/v3/access-shared
- `.gitignore` — ajouter `.env.test`
- `package.json` — ajouter `@playwright/test`, `dotenv`, scripts `test:e2e` + `test:e2e:ui`

### Suppression (après migration vers shared)
- `src/modules/ProjectDetailsV3Preview/tabs/access/AccessItemV3.tsx` — devient un re-export du shared
- `src/modules/ProjectDetailsV3Preview/tabs/access/AccessEditModalV3.tsx` — devient un re-export du shared

(NB : on conserve un re-export pour éviter de casser d'autres imports éventuels, et on supprimera proprement plus tard.)

---

## Phase 1 — BDD : table + RPC + RLS

### Task 1.1 : Écrire la migration SQL

**Files:**
- Create: `supabase/migrations/20260513_010_agency_vault.sql`

- [ ] **Step 1: Créer le fichier de migration**

Le fichier complet à créer :

```sql
-- ============================================================
-- Sprint 3B — Coffre-fort agence Propul'seo
-- Table dédiée agency_accesses + 4 RPC SECURITY DEFINER admin-only.
-- Réutilise la passphrase propulseo_access_key créée au Sprint 3A.
--
-- Migration idempotente : peut être rejouée sans casser.
-- ============================================================

-- ----- 1. Pré-requis : extensions et passphrase ----------------
-- pgcrypto + vault déjà créés au Sprint 3A, on garde IF NOT EXISTS par sécurité
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- Vérifier que la passphrase existe (créée au Sprint 3A). Sinon la créer.
DO $$
DECLARE
  v_existing uuid;
BEGIN
  SELECT id INTO v_existing FROM vault.secrets WHERE name = 'propulseo_access_key';
  IF v_existing IS NULL THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'propulseo_access_key',
      'Passphrase PGP pour coffres projet + agence'
    );
  END IF;
END $$;

-- ----- 2. Table agency_accesses ---------------------------------
CREATE TABLE IF NOT EXISTS public.agency_accesses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category      text NOT NULL CHECK (category IN ('workspace','dev','infra','finance','marketing','saas')),
  label         text NOT NULL,
  url           text,
  login_enc     bytea,
  password_enc  bytea,
  notes_enc     bytea,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending_validation','missing','broken','expired')),
  provided_by   text,
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agency_accesses_category ON public.agency_accesses(category);
CREATE INDEX IF NOT EXISTS idx_agency_accesses_status ON public.agency_accesses(status);

-- ----- 3. Trigger updated_at ------------------------------------
-- public.set_updated_at() existe déjà (Sprint 3A). On le réutilise.
DROP TRIGGER IF EXISTS trg_agency_accesses_updated_at ON public.agency_accesses;
CREATE TRIGGER trg_agency_accesses_updated_at
  BEFORE UPDATE ON public.agency_accesses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----- 4. RLS admin-only ----------------------------------------
ALTER TABLE public.agency_accesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agency_accesses_select_admin ON public.agency_accesses;
CREATE POLICY agency_accesses_select_admin ON public.agency_accesses
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS agency_accesses_insert_admin ON public.agency_accesses;
CREATE POLICY agency_accesses_insert_admin ON public.agency_accesses
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS agency_accesses_update_admin ON public.agency_accesses;
CREATE POLICY agency_accesses_update_admin ON public.agency_accesses
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS agency_accesses_delete_admin ON public.agency_accesses;
CREATE POLICY agency_accesses_delete_admin ON public.agency_accesses
  FOR DELETE TO authenticated USING (public.is_admin());

-- ----- 5. RPC SECURITY DEFINER ---------------------------------

-- 5.1 Lecture déchiffrée (admin only)
CREATE OR REPLACE FUNCTION public.get_decrypted_agency_accesses()
RETURNS TABLE (
  id uuid,
  category text,
  label text,
  url text,
  login text,
  password text,
  notes text,
  status text,
  provided_by text,
  expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_passphrase text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  v_passphrase := public._access_passphrase();
  RETURN QUERY
    SELECT
      a.id, a.category, a.label, a.url,
      CASE WHEN a.login_enc IS NULL THEN NULL ELSE extensions.pgp_sym_decrypt(a.login_enc, v_passphrase) END AS login,
      CASE WHEN a.password_enc IS NULL THEN NULL ELSE extensions.pgp_sym_decrypt(a.password_enc, v_passphrase) END AS password,
      CASE WHEN a.notes_enc IS NULL THEN NULL ELSE extensions.pgp_sym_decrypt(a.notes_enc, v_passphrase) END AS notes,
      a.status, a.provided_by, a.expires_at, a.created_at, a.updated_at
    FROM public.agency_accesses a
    ORDER BY a.category, a.label;
END;
$$;

-- 5.2 Métadonnées (admin only — par défense en profondeur)
CREATE OR REPLACE FUNCTION public.get_agency_access_metadata()
RETURNS TABLE (
  id uuid,
  category text,
  label text,
  url text,
  login text,
  password text,
  notes text,
  status text,
  provided_by text,
  expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT
      a.id, a.category, a.label, a.url,
      NULL::text AS login, NULL::text AS password, NULL::text AS notes,
      a.status, a.provided_by, a.expires_at, a.created_at, a.updated_at
    FROM public.agency_accesses a
    ORDER BY a.category, a.label;
END;
$$;

-- 5.3 Upsert (admin only)
-- Convention secrets : NULL = préserve, '' = efface, valeur = chiffre
CREATE OR REPLACE FUNCTION public.upsert_agency_access(
  p_id          uuid,
  p_category    text,
  p_label       text,
  p_url         text,
  p_login       text,
  p_password    text,
  p_notes       text,
  p_status      text,
  p_provided_by text,
  p_expires_at  timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_passphrase text;
  v_id uuid;
  v_login_enc bytea;
  v_password_enc bytea;
  v_notes_enc bytea;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  v_passphrase := public._access_passphrase();

  IF p_id IS NULL THEN
    -- INSERT
    v_login_enc := CASE
      WHEN p_login IS NULL OR p_login = '' THEN NULL
      ELSE extensions.pgp_sym_encrypt(p_login, v_passphrase)
    END;
    v_password_enc := CASE
      WHEN p_password IS NULL OR p_password = '' THEN NULL
      ELSE extensions.pgp_sym_encrypt(p_password, v_passphrase)
    END;
    v_notes_enc := CASE
      WHEN p_notes IS NULL OR p_notes = '' THEN NULL
      ELSE extensions.pgp_sym_encrypt(p_notes, v_passphrase)
    END;
    INSERT INTO public.agency_accesses (
      category, label, url, login_enc, password_enc, notes_enc,
      status, provided_by, expires_at
    ) VALUES (
      p_category, p_label, p_url, v_login_enc, v_password_enc, v_notes_enc,
      p_status, p_provided_by, p_expires_at
    )
    RETURNING id INTO v_id;
  ELSE
    -- UPDATE avec convention NULL/''/valeur
    UPDATE public.agency_accesses
    SET
      category = p_category,
      label = p_label,
      url = p_url,
      login_enc = CASE
        WHEN p_login IS NULL THEN login_enc                        -- préserve
        WHEN p_login = ''   THEN NULL                              -- efface
        ELSE extensions.pgp_sym_encrypt(p_login, v_passphrase)     -- chiffre
      END,
      password_enc = CASE
        WHEN p_password IS NULL THEN password_enc
        WHEN p_password = ''   THEN NULL
        ELSE extensions.pgp_sym_encrypt(p_password, v_passphrase)
      END,
      notes_enc = CASE
        WHEN p_notes IS NULL THEN notes_enc
        WHEN p_notes = ''   THEN NULL
        ELSE extensions.pgp_sym_encrypt(p_notes, v_passphrase)
      END,
      status = p_status,
      provided_by = p_provided_by,
      expires_at = p_expires_at
    WHERE id = p_id
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN
      RAISE EXCEPTION 'agency_access not found' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  RETURN v_id;
END;
$$;

-- 5.4 Delete (admin only)
CREATE OR REPLACE FUNCTION public.delete_agency_access(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.agency_accesses WHERE id = p_id;
END;
$$;

-- ----- 6. Permissions ------------------------------------------
REVOKE ALL ON FUNCTION public.get_decrypted_agency_accesses() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_agency_access_metadata() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_agency_access(uuid, text, text, text, text, text, text, text, text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_agency_access(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_decrypted_agency_accesses() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agency_access_metadata() TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_agency_access(uuid, text, text, text, text, text, text, text, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_agency_access(uuid) TO authenticated;
```

- [ ] **Step 2: Appliquer la migration via Supabase MCP**

Outil : `mcp__claude_ai_Supabase__apply_migration`

Paramètres :
- `name`: `agency_vault`
- `query`: contenu du fichier `20260513_010_agency_vault.sql`

Attendu : succès, pas d'erreur SQL.

- [ ] **Step 3: Vérifier que la table et les RPC existent**

Outil : `mcp__claude_ai_Supabase__execute_sql`

```sql
SELECT
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND tablename='agency_accesses') AS table_exists,
  (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('get_decrypted_agency_accesses','get_agency_access_metadata','upsert_agency_access','delete_agency_access')) AS rpc_count,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname='public' AND tablename='agency_accesses') AS rls_count;
```

Attendu : `table_exists=1`, `rpc_count=4`, `rls_count=4`.

- [ ] **Step 4: Test smoke INSERT + SELECT déchiffré**

Outil : `mcp__claude_ai_Supabase__execute_sql`

```sql
-- Test : insertion d'un access bidon en bypass RLS via service role
SELECT public.upsert_agency_access(
  NULL, 'dev', 'Test Smoke', 'https://example.com',
  'test@example.com', 'pwd123', 'note test',
  'active', NULL, NULL
);
SELECT id, label, login, password, notes FROM public.get_decrypted_agency_accesses() WHERE label = 'Test Smoke';
-- Cleanup
DELETE FROM public.agency_accesses WHERE label = 'Test Smoke';
```

NB : ce test va échouer car `auth.uid()` est NULL en MCP → `is_admin()` retourne false → `RAISE EXCEPTION 'forbidden'`. **C'est attendu et ça valide la garde.** Le test fonctionnel réel se fait dans Phase 5 via Playwright authentifié.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260513_010_agency_vault.sql
git commit -m "$(cat <<'EOF'
feat(v3): Sprint 3B BDD coffre agence — table + 4 RPC + RLS

- Table public.agency_accesses (6 catégories : workspace/dev/infra/finance/marketing/saas)
- 4 RPC SECURITY DEFINER admin-only (get_decrypted, metadata, upsert, delete)
- RLS strict admin-only (4 policies via public.is_admin())
- Réutilise passphrase propulseo_access_key du Sprint 3A
- Convention secrets identique au coffre projet : NULL=préserve, ''=efface, valeur=chiffre

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — Refacto V3 : extraction des composants partagés

### Task 2.1 : Créer le dossier shared + types

**Files:**
- Create: `src/components/v3/access-shared/types.ts`
- Create: `src/components/v3/access-shared/index.ts`

- [ ] **Step 1: Créer `src/components/v3/access-shared/types.ts`**

```typescript
import type { LucideIcon } from 'lucide-react'

/**
 * Modèle générique d'un accès chiffré (projet OU agence).
 * Le `category` est un string libre — les consommateurs (projet, agence)
 * fournissent leur propre union typée + la config de catégories.
 */
export interface AccessRecord {
  id: string
  category: string
  label: string
  url: string | null
  login: string | null
  password: string | null
  notes: string | null
  status: AccessStatusShared
  provided_by: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export type AccessStatusShared =
  | 'active'
  | 'pending_validation'
  | 'missing'
  | 'broken'
  | 'expired'

/**
 * Convention secrets pour upsert (identique projet/agence) :
 *  - `undefined` ou `null` → préserve la valeur en BDD
 *  - `''` (string vide)    → efface la valeur en BDD
 *  - valeur                → chiffre et remplace
 */
export interface AccessFormValues {
  id?: string | null
  category: string
  label: string
  url?: string | null
  login?: string | null
  password?: string | null
  notes?: string | null
  status: AccessStatusShared
  provided_by?: string | null
  expires_at?: string | null
}

/**
 * Configuration d'une catégorie côté UI (label + icon).
 * Chaque consommateur fournit son propre set.
 */
export interface CategoryConfig {
  value: string
  label: string
  icon: LucideIcon
}

export const STATUS_LABELS: Record<AccessStatusShared, string> = {
  active: 'Actif',
  missing: 'Manquant',
  broken: 'Cassé',
  expired: 'Expiré',
  pending_validation: 'À valider',
}

export const STATUS_COLORS: Record<AccessStatusShared, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  missing: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  broken: 'bg-red-500/15 text-red-300 border-red-500/30',
  expired: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  pending_validation: 'bg-[rgba(139,92,246,0.18)] text-[#A78BFA] border-[rgba(139,92,246,0.4)]',
}

export const STATUS_ORDER: AccessStatusShared[] = [
  'active', 'pending_validation', 'missing', 'broken', 'expired',
]
```

- [ ] **Step 2: Créer `src/components/v3/access-shared/index.ts` (barrel)**

```typescript
export { AccessItemView } from './AccessItemView'
export { AccessEditModal } from './AccessEditModal'
export { CategoryGroup } from './CategoryGroup'
export type {
  AccessRecord,
  AccessFormValues,
  AccessStatusShared,
  CategoryConfig,
} from './types'
export {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_ORDER,
} from './types'
```

- [ ] **Step 3: Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Attendu : pas d'erreur (les exports `AccessItemView`, `AccessEditModal`, `CategoryGroup` n'existent pas encore → erreurs attendues sur ces noms, on les crée à la prochaine task. **NE PAS commiter avant d'avoir tout en place.**)

### Task 2.2 : Extraire AccessItemView

**Files:**
- Create: `src/components/v3/access-shared/AccessItemView.tsx`

- [ ] **Step 1: Créer `src/components/v3/access-shared/AccessItemView.tsx`**

```tsx
import { useState } from 'react'
import { Eye, EyeOff, Copy, Check, Pencil, Trash2, ExternalLink, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { AccessRecord } from './types'
import { STATUS_LABELS, STATUS_COLORS } from './types'

interface Props {
  access: AccessRecord
  isAdmin: boolean
  categoryIcon: LucideIcon
  onEdit: () => void
  onDelete: () => void
}

type SecretKind = 'login' | 'password'

export function AccessItemView({ access, isAdmin, categoryIcon: Icon, onEdit, onDelete }: Props) {
  const [showLogin, setShowLogin] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [copied, setCopied] = useState<SecretKind | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleCopy = async (value: string | null, kind: SecretKind) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      toast.success(`${kind === 'login' ? 'Login' : 'Mot de passe'} copié`)
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      toast.error('Copie impossible')
    }
  }

  const handleConfirmDelete = () => {
    onDelete()
    setConfirmDelete(false)
  }

  return (
    <div className="rounded-lg border border-[rgba(139,92,246,0.18)] bg-[#0f0b1e] p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#A78BFA] shrink-0" />
        <span className="text-sm font-medium text-[#ede9fe] flex-1 truncate">{access.label}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[access.status]}`}>
          {STATUS_LABELS[access.status]}
        </span>
        {isAdmin && (
          <>
            <button onClick={onEdit} className="text-[#9ca3af] hover:text-[#A78BFA] transition-colors" title="Modifier">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[#9ca3af] hover:text-red-400 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {access.url && (
        <a
          href={normalizeUrl(access.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-[#A78BFA] hover:text-white truncate"
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
          <span className="truncate">{access.url}</span>
        </a>
      )}

      {isAdmin && (access.login || access.password) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {access.login !== null && (
            <SecretField
              label="Login"
              value={access.login}
              masked={!showLogin}
              onToggle={() => setShowLogin(v => !v)}
              onCopy={() => handleCopy(access.login, 'login')}
              copied={copied === 'login'}
            />
          )}
          {access.password !== null && (
            <SecretField
              label="Password"
              value={access.password}
              masked={!showPwd}
              onToggle={() => setShowPwd(v => !v)}
              onCopy={() => handleCopy(access.password, 'password')}
              copied={copied === 'password'}
            />
          )}
        </div>
      )}

      {isAdmin && access.notes && (
        <p className="text-[11px] text-[#9ca3af] pt-1 whitespace-pre-wrap">{access.notes}</p>
      )}

      {(access.provided_by || access.expires_at) && (
        <div className="flex items-center gap-3 text-[10px] text-[#6b7280] pt-1">
          {access.provided_by && <span>Fourni par {access.provided_by}</span>}
          {access.expires_at && <span>Expire le {new Date(access.expires_at).toLocaleDateString('fr-FR')}</span>}
        </div>
      )}

      {confirmDelete && (
        <div className="flex items-center justify-between gap-2 mt-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded">
          <p className="text-xs text-red-300">Supprimer cet accès ?</p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmDelete}
              className="px-2.5 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
            >
              Supprimer
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2.5 py-1 border border-[rgba(139,92,246,0.2)] rounded text-xs text-[#9ca3af] hover:bg-[#1a1430] transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

interface SecretFieldProps {
  label: string
  value: string | null
  masked: boolean
  onToggle: () => void
  onCopy: () => void
  copied: boolean
}

function SecretField({ label, value, masked, onToggle, onCopy, copied }: SecretFieldProps) {
  return (
    <div className="flex items-center gap-1 bg-[#070512] border border-[rgba(139,92,246,0.15)] rounded px-2 py-1">
      <span className="text-[10px] text-[#6b7280] w-12 shrink-0">{label}</span>
      <input
        readOnly
        type={masked ? 'password' : 'text'}
        value={value ?? ''}
        className="flex-1 min-w-0 bg-transparent text-xs text-[#ede9fe] focus:outline-none"
      />
      <button onClick={onToggle} className="text-[#9ca3af] hover:text-[#A78BFA] shrink-0" title={masked ? 'Afficher' : 'Masquer'}>
        {masked ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      </button>
      <button onClick={onCopy} className="text-[#9ca3af] hover:text-[#A78BFA] shrink-0" title="Copier">
        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  )
}
```

### Task 2.3 : Extraire AccessEditModal

**Files:**
- Create: `src/components/v3/access-shared/AccessEditModal.tsx`

- [ ] **Step 1: Créer `src/components/v3/access-shared/AccessEditModal.tsx`**

```tsx
import { useState, type FormEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import type { AccessRecord, AccessFormValues, CategoryConfig, AccessStatusShared } from './types'
import { STATUS_LABELS, STATUS_ORDER } from './types'

interface Props {
  access: AccessRecord | null
  categories: CategoryConfig[]
  title?: string
  onClose: () => void
  onSubmit: (values: AccessFormValues) => Promise<void>
}

const inputCls = 'w-full bg-[#0f0b1e] border border-[rgba(139,92,246,0.2)] rounded-md px-3 py-1.5 text-sm text-[#ede9fe] placeholder:text-[#6b7280] focus:outline-none focus:border-[#8B5CF6]'

export function AccessEditModal({ access, categories, title, onClose, onSubmit }: Props) {
  const isEdit = access !== null
  const defaultCategory = categories[0]?.value ?? ''
  const [form, setForm] = useState({
    category: access?.category ?? defaultCategory,
    label: access?.label ?? '',
    url: access?.url ?? '',
    login: access?.login ?? '',
    password: access?.password ?? '',
    notes: access?.notes ?? '',
    status: (access?.status ?? 'active') as AccessStatusShared,
    provided_by: access?.provided_by ?? '',
    expires_at: access?.expires_at ? access.expires_at.slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.label.trim()) {
      toast.error('Le label est obligatoire')
      return
    }
    setSaving(true)
    try {
      const secretValue = (current: string, original: string | null | undefined): string | null => {
        if (isEdit && original && current === '') return ''
        if (current === '') return null
        return current
      }
      await onSubmit({
        id: access?.id ?? null,
        category: form.category,
        label: form.label.trim(),
        url: form.url.trim() || null,
        login: secretValue(form.login, access?.login),
        password: secretValue(form.password, access?.password),
        notes: form.notes.trim() === '' ? (isEdit && access?.notes ? '' : null) : form.notes.trim(),
        status: form.status,
        provided_by: form.provided_by.trim() || null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      })
      toast.success(isEdit ? 'Accès mis à jour' : 'Accès créé')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#070512] border border-[rgba(139,92,246,0.25)] rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[#ede9fe]">
            {title ?? (isEdit ? 'Modifier l\'accès' : 'Nouvel accès')}
          </h3>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center text-[#9ca3af] hover:text-[#ede9fe] hover:bg-[rgba(139,92,246,0.15)] transition-colors rounded-full">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Label *">
            <input
              autoFocus
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="ex: GitHub, Notion Team, OVH..."
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Catégorie">
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className={inputCls}
              >
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Statut">
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as AccessStatusShared }))}
                className={inputCls}
              >
                {STATUS_ORDER.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="URL">
            <input
              type="url"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://..."
              className={inputCls}
            />
          </Field>

          <Field label="Login">
            <input
              type="text"
              autoComplete="off"
              value={form.login}
              onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
              className={inputCls}
            />
          </Field>

          <Field label="Mot de passe">
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className={inputCls}
            />
          </Field>

          <Field label="Notes">
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fourni par">
              <input
                type="text"
                value={form.provided_by}
                onChange={e => setForm(f => ({ ...f, provided_by: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="Expire le">
              <input
                type="date"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-md text-sm text-[#9ca3af] bg-[#0f0b1e] border border-[rgba(139,92,246,0.2)] hover:bg-[#1a1430] transition-colors disabled:opacity-40"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-white bg-[#8B5CF6] hover:bg-[#7c3aed] transition-colors disabled:opacity-50"
            >
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#9ca3af] mb-1">{label}</label>
      {children}
    </div>
  )
}
```

### Task 2.4 : Créer CategoryGroup

**Files:**
- Create: `src/components/v3/access-shared/CategoryGroup.tsx`

- [ ] **Step 1: Créer `src/components/v3/access-shared/CategoryGroup.tsx`**

```tsx
import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react'

interface Props {
  label: string
  icon: LucideIcon
  count: number
  defaultExpanded?: boolean
  children: ReactNode
}

export function CategoryGroup({ label, icon: Icon, count, defaultExpanded = true, children }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-2 w-full text-left hover:bg-[rgba(139,92,246,0.08)] rounded px-1 py-0.5 transition-colors"
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-[#9ca3af]" /> : <ChevronRight className="h-3.5 w-3.5 text-[#9ca3af]" />}
        <Icon className="h-4 w-4 text-[#A78BFA]" />
        <span className="text-sm font-medium text-[#ede9fe]">{label}</span>
        <span className="text-xs text-[#9ca3af]">{count}</span>
      </button>
      {expanded && (
        <div className="space-y-2 pl-1">
          {children}
        </div>
      )}
    </div>
  )
}
```

### Task 2.5 : Adapter AccessTabV3 vers les shared components

**Files:**
- Modify: `src/modules/ProjectDetailsV3Preview/tabs/AccessTabV3.tsx`

- [ ] **Step 1: Réécrire `AccessTabV3.tsx` pour utiliser les composants partagés**

Le fichier complet à remplacer :

```tsx
import { useState, useMemo } from 'react'
import { Plus, Lock, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { useIsProjectV3Admin } from '../hooks/useIsProjectV3Admin'
import { useProjectAccessesV3, type ProjectAccessV3 } from '../hooks/useProjectAccessesV3'
import {
  AccessItemView,
  AccessEditModal,
  CategoryGroup,
  type AccessRecord,
  type CategoryConfig,
} from '@/components/v3/access-shared'
import { CATEGORY_ORDER, CATEGORY_LABELS, CATEGORY_ICONS } from './access/constants'
import type { ProjectV2, AccessCategory } from '@/types/project-v2'

interface Props {
  project: ProjectV2
}

type EditingState = ProjectAccessV3 | 'new' | null

const PROJECT_CATEGORIES: CategoryConfig[] = CATEGORY_ORDER.map(c => ({
  value: c,
  label: CATEGORY_LABELS[c],
  icon: CATEGORY_ICONS[c],
}))

export function AccessTabV3({ project }: Props) {
  const { isAdmin } = useIsProjectV3Admin()
  const { accesses, loading, error, upsertAccess, deleteAccess } = useProjectAccessesV3(project.id, isAdmin)
  const [editing, setEditing] = useState<EditingState>(null)

  const handleDelete = async (id: string) => {
    try {
      await deleteAccess(id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Suppression échouée')
    }
  }

  const byCategory = useMemo(() => {
    return accesses.reduce<Partial<Record<AccessCategory, ProjectAccessV3[]>>>((acc, a) => {
      if (!acc[a.category]) acc[a.category] = []
      acc[a.category]!.push(a)
      return acc
    }, {})
  }, [accesses])

  const activeCategories = CATEGORY_ORDER.filter(c => (byCategory[c]?.length ?? 0) > 0)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#ede9fe]">
            {isAdmin ? 'Coffre-fort' : 'Accès du projet'}
          </p>
          <p className="text-xs text-[#9ca3af] mt-0.5">
            {isAdmin
              ? `${accesses.length} accès stockés (chiffrés)`
              : `${accesses.length} accès — secrets masqués`}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-1.5 text-sm text-[#A78BFA] hover:text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter un accès
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="flex items-start gap-2 rounded-lg border border-[rgba(139,92,246,0.18)] bg-[rgba(139,92,246,0.08)] p-3">
          <Lock className="h-4 w-4 text-[#A78BFA] shrink-0 mt-0.5" />
          <p className="text-xs text-[#ede9fe]">
            Vue limitée — les identifiants ne sont visibles qu'aux administrateurs.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-xs text-red-300">Erreur de chargement : {error}</p>
        </div>
      )}

      {activeCategories.length === 0 && !error && (
        <div className="text-center py-12 text-[#9ca3af]">
          <KeyRound className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun accès enregistré</p>
          {isAdmin && (
            <p className="text-xs mt-1">Cliquez sur « Ajouter un accès » pour commencer</p>
          )}
        </div>
      )}

      {activeCategories.map(category => {
        const Icon = CATEGORY_ICONS[category]
        const items = byCategory[category]!
        return (
          <CategoryGroup key={category} label={CATEGORY_LABELS[category]} icon={Icon} count={items.length} defaultExpanded>
            {items.map(a => (
              <AccessItemView
                key={a.id}
                access={a as AccessRecord}
                isAdmin={isAdmin}
                categoryIcon={Icon}
                onEdit={() => setEditing(a)}
                onDelete={() => handleDelete(a.id)}
              />
            ))}
          </CategoryGroup>
        )
      })}

      {editing !== null && (
        <AccessEditModal
          access={editing === 'new' ? null : (editing as AccessRecord)}
          categories={PROJECT_CATEGORIES}
          onClose={() => setEditing(null)}
          onSubmit={async (values) => {
            await upsertAccess({
              id: values.id,
              category: values.category as AccessCategory,
              label: values.label,
              url: values.url,
              login: values.login,
              password: values.password,
              notes: values.notes,
              status: values.status,
              provided_by: values.provided_by,
              expires_at: values.expires_at,
            })
          }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Supprimer les anciens fichiers (devenus inutiles)**

```bash
rm src/modules/ProjectDetailsV3Preview/tabs/access/AccessItemV3.tsx
rm src/modules/ProjectDetailsV3Preview/tabs/access/AccessEditModalV3.tsx
```

NB : ces fichiers sont remplacés intégralement par les versions shared. Le fichier `constants.ts` reste, il contient la config spécifique aux catégories projet (hosting/cms/analytics/...).

- [ ] **Step 3: Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Attendu : pas d'erreur.

- [ ] **Step 4: Test manuel non-régression V3 projet**

Démarrer le dev server si pas déjà actif :
```bash
npm run dev
```

Naviguer vers `http://localhost:5174/projets-v3-preview/74968202-5f6a-4981-8d30-f68a8ec7661f`, onglet « Accès ». Vérifier :
- Les accès existants s'affichent identique à avant
- Cliquer un access, copier login/password fonctionne
- Cliquer + Ajouter, le modal s'ouvre, la sélection des catégories projet (hosting/cms/...) fonctionne
- Edit + Delete fonctionnent

- [ ] **Step 5: Commit**

```bash
git add src/components/v3/access-shared/ src/modules/ProjectDetailsV3Preview/tabs/AccessTabV3.tsx
git add -u src/modules/ProjectDetailsV3Preview/tabs/access/
git commit -m "$(cat <<'EOF'
refactor(v3): extract access components to components/v3/access-shared

- Move AccessItemV3 → AccessItemView (shared)
- Move AccessEditModalV3 → AccessEditModal (shared)
- Add CategoryGroup component (factor out collapsible category)
- Add shared types (AccessRecord, AccessFormValues, CategoryConfig)
- Adapt AccessTabV3 to consume from shared folder with project-specific categories config

Préparation au Sprint 3B : ces composants seront réutilisés par le coffre agence.
Aucun changement fonctionnel sur le coffre projet V3.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Module AgencyVault

### Task 3.1 : Constants du module

**Files:**
- Create: `src/modules/AgencyVault/constants.ts`

- [ ] **Step 1: Créer `src/modules/AgencyVault/constants.ts`**

```typescript
import { Briefcase, Code2, Server, Banknote, Megaphone, Package, type LucideIcon } from 'lucide-react'
import type { CategoryConfig } from '@/components/v3/access-shared'

export type AgencyCategory = 'workspace' | 'dev' | 'infra' | 'finance' | 'marketing' | 'saas'

export const AGENCY_CATEGORY_ORDER: AgencyCategory[] = [
  'workspace', 'dev', 'infra', 'finance', 'marketing', 'saas',
]

export const AGENCY_CATEGORY_LABELS: Record<AgencyCategory, string> = {
  workspace: 'Workspace',
  dev: 'Développement',
  infra: 'Infrastructure',
  finance: 'Finance',
  marketing: 'Marketing',
  saas: 'SaaS divers',
}

export const AGENCY_CATEGORY_ICONS: Record<AgencyCategory, LucideIcon> = {
  workspace: Briefcase,
  dev: Code2,
  infra: Server,
  finance: Banknote,
  marketing: Megaphone,
  saas: Package,
}

export const AGENCY_CATEGORIES_CONFIG: CategoryConfig[] = AGENCY_CATEGORY_ORDER.map(c => ({
  value: c,
  label: AGENCY_CATEGORY_LABELS[c],
  icon: AGENCY_CATEGORY_ICONS[c],
}))
```

### Task 3.2 : Hook useAgencyAccesses

**Files:**
- Create: `src/modules/AgencyVault/hooks/useAgencyAccesses.ts`

- [ ] **Step 1: Créer `src/modules/AgencyVault/hooks/useAgencyAccesses.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { AccessStatusShared } from '@/components/v3/access-shared'
import type { AgencyCategory } from '../constants'

export interface AgencyAccess {
  id: string
  category: AgencyCategory
  label: string
  url: string | null
  login: string | null
  password: string | null
  notes: string | null
  status: AccessStatusShared
  provided_by: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface AgencyAccessUpsertInput {
  id?: string | null
  category: AgencyCategory
  label: string
  url?: string | null
  login?: string | null
  password?: string | null
  notes?: string | null
  status: AccessStatusShared
  provided_by?: string | null
  expires_at?: string | null
}

interface UseReturn {
  accesses: AgencyAccess[]
  loading: boolean
  error: string | null
  upsertAccess: (input: AgencyAccessUpsertInput) => Promise<void>
  deleteAccess: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useAgencyAccesses(isAdmin: boolean): UseReturn {
  const [accesses, setAccesses] = useState<AgencyAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccesses = useCallback(async () => {
    setLoading(true)
    setError(null)
    const rpc = isAdmin ? 'get_decrypted_agency_accesses' : 'get_agency_access_metadata'
    const { data, error: rpcError } = await supabase.rpc(rpc)
    if (rpcError) {
      console.error(`[useAgencyAccesses] ${rpc} error:`, rpcError.message)
      setError(rpcError.message)
      setAccesses([])
    } else {
      const rows = (data ?? []) as AgencyAccess[]
      setAccesses(rows.map(a => ({
        ...a,
        login: isAdmin ? a.login ?? null : null,
        password: isAdmin ? a.password ?? null : null,
        notes: isAdmin ? a.notes ?? null : null,
      })))
    }
    setLoading(false)
  }, [isAdmin])

  useEffect(() => { void fetchAccesses() }, [fetchAccesses])

  const upsertAccess = useCallback(async (input: AgencyAccessUpsertInput) => {
    const { error: rpcError } = await supabase.rpc('upsert_agency_access', {
      p_id: input.id ?? null,
      p_category: input.category,
      p_label: input.label,
      p_url: input.url ?? null,
      p_login: input.login ?? null,
      p_password: input.password ?? null,
      p_notes: input.notes ?? null,
      p_status: input.status,
      p_provided_by: input.provided_by ?? null,
      p_expires_at: input.expires_at ?? null,
    })
    if (rpcError) {
      console.error('[useAgencyAccesses] upsert error:', rpcError.message)
      throw new Error(rpcError.message)
    }
    await fetchAccesses()
  }, [fetchAccesses])

  const deleteAccess = useCallback(async (id: string) => {
    let snapshot: AgencyAccess[] = []
    setAccesses(prev => {
      snapshot = prev
      return prev.filter(a => a.id !== id)
    })
    const { error: rpcError } = await supabase.rpc('delete_agency_access', { p_id: id })
    if (rpcError) {
      console.error('[useAgencyAccesses] delete error:', rpcError.message)
      setAccesses(snapshot)
      throw new Error(rpcError.message)
    }
  }, [])

  return { accesses, loading, error, upsertAccess, deleteAccess, refresh: fetchAccesses }
}
```

### Task 3.3 : Empty state component

**Files:**
- Create: `src/modules/AgencyVault/components/AgencyVaultEmptyState.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
import { Vault, Search } from 'lucide-react'

interface Props {
  mode: 'no-entries' | 'no-search-results'
  searchQuery?: string
}

export function AgencyVaultEmptyState({ mode, searchQuery }: Props) {
  if (mode === 'no-search-results') {
    return (
      <div className="text-center py-16 text-[#9ca3af]">
        <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Aucun résultat pour « {searchQuery} »</p>
        <p className="text-xs mt-1 opacity-70">Essaie un autre mot-clé ou efface la recherche.</p>
      </div>
    )
  }

  return (
    <div className="text-center py-20 text-[#9ca3af]">
      <Vault className="h-14 w-14 mx-auto mb-4 opacity-30" />
      <p className="text-base text-[#ede9fe] font-medium">Coffre-fort vide</p>
      <p className="text-sm mt-2 opacity-80">Ajoute ton premier accès interne pour commencer.</p>
      <p className="text-xs mt-1 opacity-60">Workspace, Dev, Infra, Finance, Marketing, SaaS…</p>
    </div>
  )
}
```

### Task 3.4 : Header component

**Files:**
- Create: `src/modules/AgencyVault/components/AgencyVaultHeader.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
import { Plus, Search, Vault } from 'lucide-react'

interface Props {
  count: number
  searchQuery: string
  onSearchChange: (value: string) => void
  onAddClick: () => void
  isAdmin: boolean
}

export function AgencyVaultHeader({ count, searchQuery, onSearchChange, onAddClick, isAdmin }: Props) {
  return (
    <div className="sticky top-0 z-10 bg-[#0a0814]/80 backdrop-blur-md border-b border-[rgba(139,92,246,0.18)] px-6 py-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[rgba(139,92,246,0.15)] flex items-center justify-center">
            <Vault className="h-5 w-5 text-[#A78BFA]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#ede9fe]">Coffre-fort agence</h1>
            <p className="text-xs text-[#9ca3af] mt-0.5">
              {count} accès interne{count > 1 ? 's' : ''} • chiffrement PGP
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={onAddClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7280] pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Rechercher un accès (label, login, notes)..."
          className="w-full bg-[#0f0b1e] border border-[rgba(139,92,246,0.2)] rounded-md pl-9 pr-3 py-2 text-sm text-[#ede9fe] placeholder:text-[#6b7280] focus:outline-none focus:border-[#8B5CF6]"
        />
      </div>
    </div>
  )
}
```

### Task 3.5 : Categories rendering component

**Files:**
- Create: `src/modules/AgencyVault/components/AgencyVaultCategories.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
import { AccessItemView, CategoryGroup, type AccessRecord } from '@/components/v3/access-shared'
import {
  AGENCY_CATEGORY_ORDER,
  AGENCY_CATEGORY_LABELS,
  AGENCY_CATEGORY_ICONS,
  type AgencyCategory,
} from '../constants'
import type { AgencyAccess } from '../hooks/useAgencyAccesses'

interface Props {
  accesses: AgencyAccess[]
  isAdmin: boolean
  onEdit: (access: AgencyAccess) => void
  onDelete: (id: string) => void
  /** Si non-null, affiche tout à plat (résultat de recherche) au lieu du groupement */
  flatMode?: boolean
}

export function AgencyVaultCategories({ accesses, isAdmin, onEdit, onDelete, flatMode = false }: Props) {
  if (flatMode) {
    return (
      <div className="space-y-2">
        {accesses.map(a => {
          const Icon = AGENCY_CATEGORY_ICONS[a.category]
          return (
            <AccessItemView
              key={a.id}
              access={a as unknown as AccessRecord}
              isAdmin={isAdmin}
              categoryIcon={Icon}
              onEdit={() => onEdit(a)}
              onDelete={() => onDelete(a.id)}
            />
          )
        })}
      </div>
    )
  }

  const byCategory = accesses.reduce<Partial<Record<AgencyCategory, AgencyAccess[]>>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category]!.push(a)
    return acc
  }, {})

  const activeCategories = AGENCY_CATEGORY_ORDER.filter(c => (byCategory[c]?.length ?? 0) > 0)

  return (
    <div className="space-y-4">
      {activeCategories.map(category => {
        const Icon = AGENCY_CATEGORY_ICONS[category]
        const items = byCategory[category]!
        return (
          <CategoryGroup
            key={category}
            label={AGENCY_CATEGORY_LABELS[category]}
            icon={Icon}
            count={items.length}
            defaultExpanded
          >
            {items.map(a => (
              <AccessItemView
                key={a.id}
                access={a as unknown as AccessRecord}
                isAdmin={isAdmin}
                categoryIcon={Icon}
                onEdit={() => onEdit(a)}
                onDelete={() => onDelete(a.id)}
              />
            ))}
          </CategoryGroup>
        )
      })}
    </div>
  )
}
```

### Task 3.6 : Page principale

**Files:**
- Create: `src/modules/AgencyVault/AgencyVaultPage.tsx`

- [ ] **Step 1: Créer la page principale**

```tsx
import { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUsers } from '@/hooks/useUsers'
import { AccessEditModal, type AccessRecord } from '@/components/v3/access-shared'
import { useAgencyAccesses, type AgencyAccess } from './hooks/useAgencyAccesses'
import { AgencyVaultHeader } from './components/AgencyVaultHeader'
import { AgencyVaultCategories } from './components/AgencyVaultCategories'
import { AgencyVaultEmptyState } from './components/AgencyVaultEmptyState'
import { AGENCY_CATEGORIES_CONFIG, type AgencyCategory } from './constants'

type EditingState = AgencyAccess | 'new' | null

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function AgencyVaultPage() {
  const { user } = useAuth()
  const { getUserByAuthId } = useUsers()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search, 300)
  const [editing, setEditing] = useState<EditingState>(null)

  useEffect(() => {
    const run = async () => {
      if (!user) { setIsAdmin(false); return }
      try {
        const data = await getUserByAuthId(user.id)
        setIsAdmin(data?.role === 'admin')
      } catch {
        setIsAdmin(false)
      }
    }
    void run()
  }, [user, getUserByAuthId])

  const { accesses, loading, error, upsertAccess, deleteAccess } = useAgencyAccesses(isAdmin === true)

  const filteredAccesses = useMemo(() => {
    if (!debouncedSearch.trim()) return accesses
    const q = debouncedSearch.toLowerCase()
    return accesses.filter(a =>
      a.label.toLowerCase().includes(q) ||
      (a.login ?? '').toLowerCase().includes(q) ||
      (a.notes ?? '').toLowerCase().includes(q),
    )
  }, [accesses, debouncedSearch])

  const handleDelete = async (id: string) => {
    try {
      await deleteAccess(id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Suppression échouée')
    }
  }

  if (isAdmin === null || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-[#A78BFA]" />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#0a0814] text-[#ede9fe]">
      <AgencyVaultHeader
        count={accesses.length}
        searchQuery={search}
        onSearchChange={setSearch}
        onAddClick={() => setEditing('new')}
        isAdmin={isAdmin}
      />

      <div className="px-6 py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-xs text-red-300">Erreur de chargement : {error}</p>
          </div>
        )}

        {accesses.length === 0 && !error && (
          <AgencyVaultEmptyState mode="no-entries" />
        )}

        {accesses.length > 0 && filteredAccesses.length === 0 && (
          <AgencyVaultEmptyState mode="no-search-results" searchQuery={debouncedSearch} />
        )}

        {filteredAccesses.length > 0 && (
          <AgencyVaultCategories
            accesses={filteredAccesses}
            isAdmin={isAdmin}
            onEdit={(a) => setEditing(a)}
            onDelete={handleDelete}
            flatMode={Boolean(debouncedSearch.trim())}
          />
        )}
      </div>

      {editing !== null && (
        <AccessEditModal
          access={editing === 'new' ? null : (editing as unknown as AccessRecord)}
          categories={AGENCY_CATEGORIES_CONFIG}
          title={editing === 'new' ? 'Nouvel accès agence' : 'Modifier l\'accès agence'}
          onClose={() => setEditing(null)}
          onSubmit={async (values) => {
            await upsertAccess({
              id: values.id,
              category: values.category as AgencyCategory,
              label: values.label,
              url: values.url,
              login: values.login,
              password: values.password,
              notes: values.notes,
              status: values.status,
              provided_by: values.provided_by,
              expires_at: values.expires_at,
            })
          }}
        />
      )}
    </div>
  )
}
```

### Task 3.7 : Entry point

**Files:**
- Create: `src/modules/AgencyVault/index.tsx`

- [ ] **Step 1: Créer l'entry point**

```typescript
export { AgencyVaultPage } from './AgencyVaultPage'
```

### Task 3.8 : Vérification + commit

- [ ] **Step 1: Vérifier la compilation**

```bash
npx tsc --noEmit
```

Attendu : pas d'erreur.

- [ ] **Step 2: Commit**

```bash
git add src/modules/AgencyVault/
git commit -m "$(cat <<'EOF'
feat(v3): Sprint 3B module AgencyVault — page coffre-fort agence

- Hook useAgencyAccesses (fetch/upsert/delete + optimistic delete)
- Page AgencyVaultPage avec header sticky, search debounced (300ms), groupement par catégorie
- 6 catégories agence : workspace, dev, infra, finance, marketing, saas
- Réutilise components/v3/access-shared (AccessItemView, AccessEditModal, CategoryGroup)
- États : loading, no-entries empty, no-search-results empty, error
- Recherche flat-list par label/login/notes (admin only)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Sidebar + route

### Task 4.1 : Ajouter la route

**Files:**
- Modify: `src/lib/routes.ts`

- [ ] **Step 1: Modifier `src/lib/routes.ts`**

Dans la section "Personnel" (ligne 47), remplacer :

```typescript
  // Personnel
  personalTasks: '/mes-taches',
```

par :

```typescript
  // Personnel
  personalTasks: '/mes-taches',
  agencyVault: '/coffre-fort',
```

Puis dans `routePermissions` (ligne 96-114), ajouter après `personalTasks` :

```typescript
  { path: routes.agencyVault, permission: 'can_view_dashboard' },
```

NB : `can_view_dashboard` est utilisé comme garde formelle ; la vraie protection (admin-only) est imposée par les RPC SECURITY DEFINER côté BDD. La sidebar masque déjà l'entrée pour non-admin via `persoSection`.

### Task 4.2 : Ajouter l'entrée Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Ajouter l'import `Vault` dans les icônes**

À la ligne 23 (`BookOpen,`), juste après :

```typescript
  BookOpen,
  Vault,
  ListTodo,
```

- [ ] **Step 2: Étendre `persoSection`**

Remplacer le bloc lignes 86-92 :

```typescript
  const persoSection: NavSection[] = isAdmin ? [{
    section: 'perso',
    title: 'Personnel',
    items: [
      { to: routes.personalTasks, label: 'Mes Tâches', icon: ListTodo, permission: 'can_view_dashboard' }
    ]
  }] : [];
```

par :

```typescript
  const persoSection: NavSection[] = isAdmin ? [{
    section: 'perso',
    title: 'Personnel',
    items: [
      { to: routes.personalTasks, label: 'Mes Tâches',  icon: ListTodo, permission: 'can_view_dashboard' },
      { to: routes.agencyVault,   label: 'Coffre-fort', icon: Vault,    permission: 'can_view_dashboard' },
    ]
  }] : [];
```

### Task 4.3 : Brancher la route dans Layout.tsx

**Files:**
- Modify: `src/components/layout/Layout.tsx`

- [ ] **Step 1: Ajouter le lazy import**

Après la ligne 38 (`const ProjectDetailsV3Preview = lazy(...)`), ajouter :

```typescript
const AgencyVaultPage = lazy(() => import('../../modules/AgencyVault').then(m => ({ default: m.AgencyVaultPage })))
```

- [ ] **Step 2: Ajouter la route**

Trouver le bloc V3 Preview (ligne 216-217) :

```tsx
              {/* V3 Preview — chantier de refonte en cours, accessible pour validation */}
              <Route path="/projets-v3-preview/:id" element={wrap(ProjectDetailsV3Preview)} />
```

Ajouter juste après :

```tsx
              {/* Coffre-fort agence (admin only — garde côté RPC) */}
              <Route path={routes.agencyVault} element={wrap(AgencyVaultPage)} />
```

### Task 4.4 : Vérification + test manuel + commit

- [ ] **Step 1: Vérifier la compilation**

```bash
npx tsc --noEmit
```

Attendu : pas d'erreur.

- [ ] **Step 2: Test manuel UI**

Démarrer le dev server (s'il n'est pas déjà actif) :
```bash
npm run dev
```

Naviguer vers `http://localhost:5174` connecté en admin (`lyestriki@yahoo.fr`).
- L'entrée « Coffre-fort » apparaît dans la section « Personnel » de la sidebar
- Cliquer dessus → arrive sur `/coffre-fort`
- La page affiche l'état vide « Coffre-fort vide »
- Cliquer « Ajouter » → modal s'ouvre avec les 6 catégories agence (Workspace/Dev/Infra/Finance/Marketing/SaaS)
- Créer un accès test → apparaît dans le bon groupe de catégorie
- Modifier puis supprimer fonctionnent
- Tester la recherche : taper le label de l'accès → bascule en mode flat-list filtrée

- [ ] **Step 3: Commit**

```bash
git add src/lib/routes.ts src/components/layout/Sidebar.tsx src/components/layout/Layout.tsx
git commit -m "$(cat <<'EOF'
feat(v3): Sprint 3B route /coffre-fort + entrée sidebar Personnel

- routes.agencyVault = '/coffre-fort' + permission can_view_dashboard
- Sidebar : entrée Coffre-fort (icône Vault) dans persoSection (admin-only)
- Layout : lazy route /coffre-fort → AgencyVaultPage

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — Tests E2E Playwright

### Task 5.1 : Installer Playwright

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`
- Create: `.env.test.example`
- Modify: `.gitignore`

- [ ] **Step 1: Installer la dépendance**

```bash
npm install --save-dev @playwright/test dotenv
npx playwright install chromium
```

Attendu : installation OK, browser chromium téléchargé.

- [ ] **Step 2: Créer `playwright.config.ts`** à la racine

```typescript
import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env.test') })

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5174',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
```

- [ ] **Step 3: Créer `.env.test.example` à la racine**

```
# Credentials Playwright pour les tests E2E.
# Copier ce fichier en .env.test (non commité) et remplir les valeurs.
E2E_ADMIN_EMAIL=
E2E_ADMIN_PASSWORD=
```

- [ ] **Step 4: Ajouter `.env.test` à `.gitignore`**

Lire `.gitignore` actuel, puis ajouter à la fin (s'il n'y est pas déjà via un pattern .env*) :

```
# E2E
.env.test
playwright-report/
test-results/
```

- [ ] **Step 5: Ajouter scripts à `package.json`**

Dans la section `"scripts"`, ajouter :

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

### Task 5.2 : Fixture login admin

**Files:**
- Create: `tests/e2e/fixtures/auth.ts`

- [ ] **Step 1: Créer la fixture**

```typescript
import { test as base, expect, type Page } from '@playwright/test'

export const test = base.extend<{ adminPage: Page }>({
  adminPage: async ({ page }, use) => {
    const email = process.env.E2E_ADMIN_EMAIL
    const password = process.env.E2E_ADMIN_PASSWORD
    if (!email || !password) {
      throw new Error('E2E_ADMIN_EMAIL et E2E_ADMIN_PASSWORD doivent être définis dans .env.test')
    }

    await page.goto('/')
    // LoginPage attend des champs email + password, et un bouton submit
    await page.getByLabel(/e-?mail/i).fill(email)
    await page.getByLabel(/mot de passe|password/i).fill(password)
    await page.getByRole('button', { name: /se connecter|connexion|sign in/i }).click()

    // Attendre que la sidebar admin soit visible (preuve que l'auth a marché)
    await expect(page.getByText('Personnel')).toBeVisible({ timeout: 10_000 })

    await use(page)
  },
})

export { expect }
```

### Task 5.3 : Test scénario coffre agence

**Files:**
- Create: `tests/e2e/agency-vault.spec.ts`

- [ ] **Step 1: Créer le test**

```typescript
import { test, expect } from './fixtures/auth'

const TEST_LABEL = `E2E Test ${Date.now()}`

test.describe('Coffre-fort agence', () => {
  test('admin peut naviguer, ajouter, voir déchiffré, et supprimer un accès', async ({ adminPage: page }) => {
    // 1. Naviguer via sidebar
    await page.getByRole('link', { name: /coffre-fort/i }).click()
    await expect(page).toHaveURL(/\/coffre-fort$/)
    await expect(page.getByRole('heading', { name: /coffre-fort agence/i })).toBeVisible()

    // 2. Ouvrir modal ajout
    await page.getByRole('button', { name: /^ajouter$/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // 3. Remplir le formulaire
    await page.getByLabel(/label/i).fill(TEST_LABEL)
    // catégorie dev
    await page.locator('select').first().selectOption('dev')
    await page.getByLabel(/^login$/i).fill('test@example.com')
    await page.getByLabel(/mot de passe/i).fill('secret-e2e-123')
    await page.getByLabel(/^notes$/i).fill('Note de test E2E')
    await page.getByRole('button', { name: /^créer$/i }).click()

    // 4. Modal fermée + item visible
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByText(TEST_LABEL)).toBeVisible({ timeout: 5_000 })

    // 5. Le password est masqué par défaut, mais l'item est dans la catégorie "Développement"
    await expect(page.getByText('Développement')).toBeVisible()

    // 6. Tester la recherche
    await page.getByPlaceholder(/rechercher/i).fill('E2E Test')
    await expect(page.getByText(TEST_LABEL)).toBeVisible()
    await page.getByPlaceholder(/rechercher/i).fill('')

    // 7. Supprimer l'item
    const itemContainer = page.locator('div', { hasText: TEST_LABEL }).first()
    await itemContainer.getByTitle('Supprimer').click()
    await page.getByRole('button', { name: /^supprimer$/i }).click()
    await expect(page.getByText(TEST_LABEL)).not.toBeVisible({ timeout: 5_000 })
  })
})
```

### Task 5.4 : Documentation E2E

**Files:**
- Create: `tests/e2e/README.md`

- [ ] **Step 1: Créer la doc**

```markdown
# Tests E2E

Tests end-to-end via Playwright, ciblant le dev server local sur `http://localhost:5174`.

## Setup

1. Copier le template de credentials :
   ```bash
   cp .env.test.example .env.test
   ```

2. Renseigner dans `.env.test` :
   ```
   E2E_ADMIN_EMAIL=lyestriki@yahoo.fr
   E2E_ADMIN_PASSWORD=<ton mot de passe admin>
   ```

   ⚠️ **Ne jamais commiter `.env.test`** — il est dans `.gitignore`.

3. Installer Playwright si pas déjà fait :
   ```bash
   npx playwright install chromium
   ```

## Lancer les tests

```bash
# Run headless (CI mode)
npm run test:e2e

# Run en mode UI interactif (debug)
npm run test:e2e:ui
```

Le dev server démarre automatiquement si pas déjà actif (config `webServer.reuseExistingServer: true`).

## Couverture actuelle

- `agency-vault.spec.ts` — Coffre-fort agence : login → navigation → CRUD → recherche → suppression.
```

### Task 5.5 : Lancer les tests + commit

- [ ] **Step 1: Configurer `.env.test` localement**

L'agent ne peut pas créer ce fichier sans les vrais credentials. **STOP ici si `.env.test` n'existe pas** et documenter dans SESSION.md que l'utilisateur doit le créer manuellement avec ses credentials admin.

Si l'agent dispose des credentials (via une variable d'env ou prompt), il peut créer `.env.test`. Sinon, il continue avec le commit du setup sans run effectif des tests.

- [ ] **Step 2: Lancer Playwright**

```bash
npm run test:e2e
```

Attendu : 1 passed, 0 failed. Si le test échoue, lire la sortie + screenshot dans `test-results/` et corriger.

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts .env.test.example .gitignore package.json package-lock.json tests/e2e/
git commit -m "$(cat <<'EOF'
test(v3): Sprint 3B E2E Playwright coffre-fort agence

- Setup Playwright minimal (chromium uniquement, retries 1, dev server auto)
- Fixture adminPage (login via .env.test)
- Scénario complet : nav → ajout → search → delete
- Doc tests/e2e/README.md avec procédure credentials
- .env.test gitignored, .env.test.example committed

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6 — Code review + hardening

### Task 6.1 : Spawn code-reviewer agent

- [ ] **Step 1: Invoquer feature-dev:code-reviewer**

Utiliser le Agent tool avec `subagent_type: feature-dev:code-reviewer`.

Brief le prompt :

```
Review du Sprint 3B coffre-fort agence Propul'seo.

CONTEXTE :
- Nouvelle table BDD public.agency_accesses (chiffrement pgcrypto + RLS admin-only)
- 4 RPC SECURITY DEFINER : get_decrypted_agency_accesses, get_agency_access_metadata, upsert_agency_access, delete_agency_access
- Réutilise la passphrase propulseo_access_key du Sprint 3A (vault.secrets)
- Module React src/modules/AgencyVault/ avec page /coffre-fort, hook, components
- Refacto V3 : composants partagés dans src/components/v3/access-shared/
- Tests E2E Playwright (setup + 1 scénario)

FICHIERS À REVIEWER :
- supabase/migrations/20260513_010_agency_vault.sql
- src/components/v3/access-shared/*.tsx + types.ts + index.ts
- src/modules/AgencyVault/**
- src/modules/ProjectDetailsV3Preview/tabs/AccessTabV3.tsx (adapté)
- src/lib/routes.ts, src/components/layout/Sidebar.tsx, src/components/layout/Layout.tsx
- playwright.config.ts, tests/e2e/**

POINTS CRITIQUES À AUDITER :
1. Sécurité : les RPC valident bien is_admin() avant tout ? SET search_path = '' présent ? REVOKE/GRANT corrects ?
2. Convention secrets NULL/''/valeur correctement implémentée dans upsert_agency_access ?
3. RLS : 4 policies (SELECT/INSERT/UPDATE/DELETE) bien admin-only ?
4. Hook useAgencyAccesses : optimistic delete avec rollback OK ? Fuite mémoire useEffect ?
5. AccessEditModal partagée : la convention secretValue() préserve bien les valeurs non modifiées ?
6. Stale closure dans handleDelete ?
7. TypeScript : cast `as unknown as AccessRecord` justifié ou code smell ?
8. Test E2E : sélecteurs robustes ? Cleanup après échec ?

CAP : 800 mots, high+critical confidence uniquement, exemples concrets.
```

- [ ] **Step 2: Triage des findings**

Pour chaque issue retournée par l'agent :
- **Vrai positif** : vérifier en lisant le code / grep
- **Faux positif** : ignorer avec justification (l'agent n'a peut-être pas vu un détail)
- **Différé** : noter dans SESSION.md pour un sprint futur

Présenter le tableau de triage avant de fixer.

### Task 6.2 : Fix des vrais bugs

- [ ] **Step 1: Pour chaque vrai bug, le fix dans l'ordre critical → high → medium**

(Le contenu exact dépend des findings — pas de placeholder, mais le pattern est :)

```bash
# Pour chaque fix
# 1. Modifier le(s) fichier(s)
# 2. npx tsc --noEmit (clean)
# 3. Si touche BDD, ré-appliquer la migration via Supabase MCP
# 4. Commit
git add <fichiers modifiés>
git commit -m "fix(v3): code review hardening — <description>"
```

- [ ] **Step 2: TypeScript clean final**

```bash
npx tsc --noEmit
```

Attendu : zéro erreur.

- [ ] **Step 3: Re-run E2E pour s'assurer que les fixes ne cassent rien**

```bash
npm run test:e2e
```

Attendu : passed.

---

## Phase 7 — Save session

### Task 7.1 : Mettre à jour SESSION.md

**Files:**
- Modify: `.planning/SESSION.md`

- [ ] **Step 1: Réécrire SESSION.md**

```markdown
# Session State — 2026-05-12 fin Sprint 3B

## Branch
**preview/v3-ux-overhaul** (exception assumée — chantier V3 isolé)

## Completed This Session
- **Sprint 3B — Coffre-fort agence** livré :
  - Migration `20260513_010_agency_vault.sql` (table + 4 RPC + RLS admin-only)
  - Réutilise passphrase `propulseo_access_key` du Sprint 3A
  - Refacto V3 : composants partagés `src/components/v3/access-shared/` (AccessItemView, AccessEditModal, CategoryGroup)
  - Module `src/modules/AgencyVault/` (page `/coffre-fort` + hook + components)
  - 6 catégories agence : workspace, dev, infra, finance, marketing, saas
  - Recherche debounced (300ms), groupement par catégorie / flat-list en recherche
  - Sidebar : entrée "Coffre-fort" dans persoSection (admin-only)
  - Tests E2E Playwright : setup + scénario complet (nav → CRUD → search → delete)
  - Code review + N fixes (voir commits `fix(v3): code review hardening`)

## Next Task — À faire à la reprise
- À toi de définir : seeder les vrais accès agence ?
- OU : Sprint 3C — audit log lecture/écriture secrets ?
- OU : autre direction V3 ?

## Blockers
Aucun.

## Key Context
- **Dev server** : http://localhost:5174
- **Page coffre agence** : /coffre-fort (admin only)
- **E2E** : `npm run test:e2e` — nécessite `.env.test` (gitignored) avec E2E_ADMIN_EMAIL/PASSWORD
- **V2 non-régression** : à vérifier manuellement (refacto V3 n'a pas touché V2, mais smoke test recommandé)
```

### Task 7.2 : Commit + push final

- [ ] **Step 1: Commit + push**

```bash
git add .planning/SESSION.md
git commit -m "$(cat <<'EOF'
chore(session): save state — Sprint 3B coffre-fort agence livré

Sprint 3B complet : BDD + RPC + RLS + refacto V3 partagé + module AgencyVault
+ sidebar + route + E2E Playwright + code review hardening.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin preview/v3-ux-overhaul
```

- [ ] **Step 2: Vérifier le push**

```bash
git log --oneline -10
git status
```

Attendu : branche à jour avec origin, working tree clean.

---

## Self-Review du plan (effectué)

**Spec coverage :**
- ✅ Table `agency_accesses` + 6 catégories (Phase 1)
- ✅ 4 RPC SECURITY DEFINER admin-only (Phase 1)
- ✅ RLS admin-only (Phase 1)
- ✅ Réutilise passphrase Sprint 3A (Phase 1, Step 1)
- ✅ Refacto V3 shared (Phase 2)
- ✅ Module AgencyVault (Phase 3)
- ✅ Route + sidebar (Phase 4)
- ✅ Tests E2E Playwright (Phase 5)
- ✅ Code review + fixes (Phase 6)
- ✅ Save session (Phase 7)

**Placeholders :** aucun "TBD" ; les fixes de Phase 6 dépendent par nature des findings du reviewer, c'est explicité.

**Type consistency :** noms de RPC, types `AccessRecord`/`AccessFormValues`/`AgencyAccess` cohérents entre tasks.

**Gestion blocage :** chaque commande Supabase MCP, npm install, test E2E peut échouer ; l'agent s'arrête, commit le partiel, documente dans SESSION.md (cf. règle Section 9 du spec).
