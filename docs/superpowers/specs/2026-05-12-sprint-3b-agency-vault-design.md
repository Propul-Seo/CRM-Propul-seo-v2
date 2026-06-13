# Sprint 3B — Coffre-fort agence Propul'seo

**Date :** 2026-05-12
**Status :** Spec validé, en attente plan d'implémentation
**Branche :** `preview/v3-ux-overhaul`
**Dépend de :** Sprint 3A (coffre-fort projet) livré dans `20260512_010_vault_encrypt_accesses.sql`

## 1. Contexte & objectif

Le Sprint 3A a livré le coffre-fort **projet** (chiffrement pgcrypto + Vault + UI onglet Accès V3). Le Sprint 3B livre un **coffre-fort agence** distinct : stockage chiffré des accès aux outils internes Propul'seo (Workspace, dev, infra, finance, marketing, SaaS), accessible uniquement aux admins, depuis une page dédiée `/coffre-fort`.

**Pourquoi séparé du coffre projet :** un compte Google Workspace agence n'est pas un "accès client" — il appartient à l'agence elle-même. Mélanger dans `project_accesses_v2` polluerait les listes et la sémantique.

## 2. Périmètre

### Inclus
- Table BDD dédiée `v2.agency_accesses` avec chiffrement pgcrypto (login/password/notes BYTEA)
- 4 RPC `SECURITY DEFINER` admin-only (lecture déchiffrée, métadonnées, upsert, delete)
- RLS admin-only (4 policies basées sur `public.is_admin()`)
- Module React `AgencyVault` avec page dédiée `/coffre-fort`
- Recherche debounced (300ms) + groupement par catégorie pliable
- Refactorisation : extraction `AccessItemV3` + `AccessEditModalV3` vers `components/v3/access-shared/` pour partage avec coffre projet
- Entrée sidebar dans `persoSection` (admin-only)
- Tests E2E Playwright (setup minimal + scénario login → /coffre-fort → CRUD)
- Code review systématique en fin de sprint via `feature-dev:code-reviewer`

### Exclus (YAGNI / sprints futurs)
- MFA / 2FA notes (champ `mfa_method`, recovery codes)
- Owner / responsable (multi-admin)
- Audit log lecture/écriture secrets
- Rotation de passphrase
- Partage sélectif par rôle (`can_view_agency_vault`)
- Synchronisation avec gestionnaires de mots de passe externes (1Password, Bitwarden)

## 3. Architecture

### 3.1 Couche BDD

**Migration :** `supabase/migrations/20260513_010_agency_vault.sql`

**Table `public.agency_accesses`** (schéma `public`, pas `v2` car les migrations V2 actuelles sont déjà dans `public` — convention projet) :

```sql
CREATE TABLE IF NOT EXISTS public.agency_accesses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category      text NOT NULL CHECK (category IN ('workspace','dev','infra','finance','marketing','saas')),
  label         text NOT NULL,
  url           text,
  login_enc     bytea,
  password_enc  bytea,
  notes_enc     bytea,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','revoked')),
  provided_by   text,
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
```

**Catégories agence :**
- `workspace` — Google Workspace, Notion, Slack, Linear
- `dev` — GitHub, Vercel, Supabase, Cloudflare
- `infra` — OVH, Coolify, VPS, DNS
- `finance` — banque, Stripe, Qonto, comptabilité
- `marketing` — Meta Ads, Google Ads, GA4, Search Console
- `saas` — autres outils SaaS divers

**RPC SECURITY DEFINER** (4 fonctions, `SET search_path = ''`) :

1. `get_decrypted_agency_accesses()` → retourne SETOF rows déchiffrés. Garde interne `IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'`.
2. `get_agency_access_metadata()` → retourne SETOF rows SANS les secrets (login/password/notes à NULL). Mêmes garde admin (par défense en profondeur, même si UI gate déjà filtré).
3. `upsert_agency_access(p_id, p_category, p_label, p_url, p_login, p_password, p_notes, p_status, p_provided_by, p_expires_at)` → INSERT ou UPDATE. Convention secrets identique au Sprint 3A : `NULL` = ne touche pas, `''` = efface, valeur = chiffre via `pgp_sym_encrypt`. Garde admin.
4. `delete_agency_access(p_id)` → DELETE. Garde admin.

**Réutilisation passphrase :** les RPC appellent le helper `public._access_passphrase()` existant (créé en Sprint 3A) qui lit `vault.secrets.propulseo_access_key`. Pas de nouveau secret à créer.

**RLS :**
```sql
ALTER TABLE public.agency_accesses ENABLE ROW LEVEL SECURITY;
-- 4 policies : SELECT, INSERT, UPDATE, DELETE — toutes USING (public.is_admin()) WITH CHECK (public.is_admin())
```

**Trigger `updated_at`** : réutilise `public.set_updated_at()` existant (créé pour `project_accesses_v2`). Si absent, créer.

**Permissions :**
```sql
REVOKE ALL ON FUNCTION public.get_decrypted_agency_accesses FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_decrypted_agency_accesses TO authenticated;
-- idem pour les 3 autres RPC
```

### 3.2 Couche partagée (refacto V3)

**Avant le module agence, factoriser les composants V3 réutilisables.**

Nouveau dossier : `src/components/v3/access-shared/`

```
components/v3/access-shared/
├── AccessItemView.tsx       # ex src/modules/ProjectDetailsV3Preview/tabs/access/AccessItemV3.tsx
├── AccessEditModal.tsx      # ex src/modules/ProjectDetailsV3Preview/tabs/access/AccessEditModalV3.tsx
├── CategoryGroup.tsx        # NOUVEAU : groupement pliable réutilisable
└── types.ts                 # AccessFormValues, AccessItemConfig (catégories disponibles, labels)
```

**Contrat des composants partagés :**
- `AccessItemView` accepte `access`, `onEdit`, `onDelete`, `isAdmin`, `categoryLabel` en props. Aucune dépendance directe à un module spécifique.
- `AccessEditModal` accepte `open`, `onClose`, `onSubmit`, `initialValues`, `categories: { value, label, icon }[]`, `title`. Le parent fournit la liste de catégories autorisées (projet OU agence) et le handler d'upsert.
- `CategoryGroup` accepte `category`, `items`, `defaultExpanded`, et un slot render-prop pour le contenu.

**Migration des consommateurs V3 projet :**
- `AccessTabV3.tsx` met à jour ses imports : `from '@/components/v3/access-shared/...'`
- Aucun changement de comportement attendu. Test de non-régression visuel sur l'onglet Accès V3 projet.

**Pourquoi pas dans `src/components/ui/` :** ces composants sont V3-spécifiques (design pattern V3 du coffre), pas des primitives shadcn. Le dossier `v3/` matérialise leur appartenance au chantier V3.

### 3.3 Module AgencyVault

```
src/modules/AgencyVault/
├── index.tsx                              # export lazy + AgencyVaultPage default
├── AgencyVaultPage.tsx                    # layout page + composition
├── hooks/
│   └── useAgencyAccesses.ts               # RPC get/upsert/delete + état local + optimistic delete
└── components/
    ├── AgencyVaultHeader.tsx              # titre + search input + count + bouton "+ Ajouter"
    ├── AgencyVaultEmptyState.tsx          # état vide soigné
    └── AgencyVaultCategories.tsx          # composition CategoryGroup × catégories agence
```

**Hook `useAgencyAccesses`** — mêmes garanties que `useProjectAccessesV3` :
- Fetch initial via `get_decrypted_agency_accesses` si admin, sinon `get_agency_access_metadata`
- `upsert` → appel RPC, puis refresh
- `delete` → optimistic update + rollback sur erreur
- Convention secrets `undefined/null = préserve, '' = efface, valeur = chiffre`

**Page `AgencyVaultPage`** :
- Header sticky (top) : titre "Coffre-fort agence", count `${total} accès`, search input (debounced 300ms), bouton primary "+ Ajouter"
- Body : si search vide → groupement par catégorie pliable (toutes étendues par défaut). Si search non-vide → liste à plat filtrée par `label + login + notes` (déchiffrés côté client uniquement, donc admin only — non-admin n'a accès qu'à `label` via metadata RPC)
- Empty state global (0 accès en BDD) + empty state par recherche (0 résultat) distincts
- Modal `AccessEditModal` partagée pour add/edit
- Bannière confirmation avant delete (réutilise pattern V3 projet)

**Frontend design** : invocation explicite du skill `frontend-design` au moment de l'implémentation de `AgencyVaultPage` pour soigner le rendu visuel (pas générique, identité Propul'seo).

### 3.4 Route et sidebar

**Route :** `src/lib/routes.ts` → ajouter `agencyVault: '/coffre-fort'`

**Router :** dans le composant où sont déclarées les routes (à identifier — probablement `App.tsx` ou un fichier routes dédié), ajouter le lazy import + `<Route path={routes.agencyVault} element={<AgencyVaultPage />} />`. Garde admin (redirect si non admin).

**Sidebar :** `src/components/layout/Sidebar.tsx`, ajouter dans `persoSection.items` :
```ts
{ to: routes.agencyVault, label: 'Coffre-fort', icon: Vault, permission: 'can_view_dashboard' }
```
Vu que `persoSection` n'est rendu QUE si `isAdmin` est `true` (ligne 86), pas besoin de nouvelle permission DB. `can_view_dashboard` suffit comme garde formelle (toujours `true` pour admin via `isAdmin: true` court-circuit).

## 4. Data flow

```
User (admin) clique "+ Ajouter" dans /coffre-fort
  → ouvre AccessEditModal (partagé) avec categories = catégories agence
  → onSubmit appelle useAgencyAccesses.upsert(values)
  → hook appelle supabase.rpc('upsert_agency_access', { ... })
  → BDD : RPC vérifie is_admin() → pgp_sym_encrypt(login, _access_passphrase()) → INSERT/UPDATE
  → hook refresh via get_decrypted_agency_accesses
  → UI met à jour la liste avec le nouvel item
```

**Optimistic delete** : retire l'item de l'état local AVANT l'appel RPC, rollback si erreur.

**Erreurs** :
- RPC `forbidden` (non admin) : afficher toast `"Action réservée aux administrateurs"`
- RPC erreur Vault / déchiffrement : toast `"Erreur de déchiffrement, contacte un admin"`
- Network : toast générique `"Erreur réseau, réessaie"`

## 5. Tests

### 5.1 Setup E2E (Playwright)

**Pourquoi Playwright :** pas de setup E2E existant sur le projet. Playwright est standard, supporte Vite, et a un excellent debug UX. Vitest pourrait suffire pour des tests d'intégration React mais ne couvre pas le scénario "user navigue dans l'app". E2E est nécessaire pour valider RPC + RLS + UI bout-en-bout.

**Dépendances à installer :**
- `@playwright/test` (devDependency)
- Config `playwright.config.ts` minimale : baseURL `http://localhost:5174`, browser `chromium` seul (gain de temps), retries 1

**Fixture admin** : utiliser un compte de test admin dédié (ex : `lyestriki@yahoo.fr` du login admin connu).
Credentials via fichier **non commité** `.env.test` (variables `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`).
- Ajouter `.env.test` à `.gitignore` (vérifier qu'il n'y est pas déjà via un pattern plus large)
- Créer `.env.test.example` (commité) avec clés sans valeurs
- `playwright.config.ts` charge `.env.test` via `dotenv` au démarrage
- `tests/e2e/README.md` documente la procédure pour configurer ces credentials localement

**Scripts package.json :**
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

### 5.2 Scénario E2E couvert

**Fichier :** `tests/e2e/agency-vault.spec.ts`

1. Login admin via UI
2. Naviguer vers `/coffre-fort` via sidebar (clic sur l'entrée)
3. Vérifier page chargée (titre "Coffre-fort agence" visible)
4. Cliquer "+ Ajouter" → modal s'ouvre
5. Remplir form : category=`dev`, label=`Test GitHub`, login=`test@example.com`, password=`secret123`, status=`active`
6. Submit → modal se ferme, item visible dans groupe "Dev"
7. Cliquer item → action edit / copy password → vérifier valeur déchiffrée correcte
8. Cliquer delete → confirmation → item disparait
9. Refresh page → item bien supprimé en BDD (vérifie persistance)

**Cleanup** : test crée son propre item identifiable + nettoie en fin de test (DELETE direct via Supabase admin client en `afterAll`). Évite la pollution BDD entre runs.

### 5.3 Test de non-régression V3 projet

**Manuel** (pas E2E pour cette session) : après refacto V3 (étape Phase 2), tester manuellement l'onglet Accès du projet Propul'seo (`74968202-5f6a-4981-8d30-f68a8ec7661f`) — ajout, edit, delete, copy password. Aucune régression visuelle ni fonctionnelle.

### 5.4 Validation TypeScript

À chaque fin de phase : `npx tsc --noEmit` doit passer sans erreur. Bloquant.

## 6. Sécurité

- **Passphrase** : jamais retournée client-side, jamais loggée. Reste dans `vault.secrets` (chiffrée par Supabase).
- **RPC SECURITY DEFINER** : `SET search_path = ''` obligatoire, qualifier `public.is_admin()` et `public.agency_accesses`.
- **REVOKE PUBLIC + GRANT authenticated** sur les 4 RPC.
- **RLS** : admin-only sur les 4 verbes (SELECT/INSERT/UPDATE/DELETE).
- **Pas de log des valeurs déchiffrées** côté serveur ni client. Les `console.error` ne doivent contenir que des messages d'erreur, pas les payloads.
- **HTTPS exclusif** en prod (déjà géré par Vercel/Coolify).

## 7. Plan de phases

**Phase 1 — BDD** (commit `feat(v3): Sprint 3B BDD coffre agence — table + 4 RPC + RLS`)
- Écrire migration `20260513_010_agency_vault.sql` (idempotente)
- Appliquer via Supabase MCP (`apply_migration`)
- Vérifier en SQL : 4 RPC créés, RLS actif, INSERT test admin → SELECT déchiffré OK

**Phase 2 — Refacto V3 partagé** (commit `refactor(v3): extract access components to shared folder`)
- Créer `src/components/v3/access-shared/{AccessItemView,AccessEditModal,CategoryGroup,types}.tsx`
- Déplacer le contenu depuis `src/modules/ProjectDetailsV3Preview/tabs/access/`
- Adapter `AccessTabV3.tsx` pour utiliser les nouveaux imports + props (passer `categories` projet)
- `tsc --noEmit` clean
- Test manuel onglet Accès projet : aucune régression

**Phase 3 — Module AgencyVault** (commit `feat(v3): Sprint 3B module AgencyVault page + hook`)
- Créer `src/modules/AgencyVault/` avec hook + page + sub-components
- Invoquer skill `frontend-design` pour le rendu visuel de `AgencyVaultPage`
- Lazy import + route `/coffre-fort`

**Phase 4 — Sidebar + nav** (commit `feat(v3): Sprint 3B sidebar entry Coffre-fort agence`)
- `routes.agencyVault` dans `src/lib/routes.ts`
- Entrée dans `persoSection` de `Sidebar.tsx` avec icône `Vault`
- Garde admin sur la route (redirect si non admin)

**Phase 5 — E2E Playwright** (commit `test(v3): Sprint 3B E2E coffre-fort agence`)
- Install `@playwright/test`, `playwright.config.ts`, scripts package.json
- Fixture login admin
- Scénario complet (section 5.2)
- Run local : `npx playwright test` doit passer en vert
- `tests/e2e/README.md` avec instructions credentials

**Phase 6 — Code review + fixes** (commits `fix(v3): Sprint 3B code review hardening (N issues)`)
- Spawn `feature-dev:code-reviewer` avec contexte complet
- Triage vrai/faux positif/différé
- Fix vrais bugs
- `tsc --noEmit` clean après chaque fix
- Test manuel UI rapide après fixes

**Phase 7 — Save session** (commit `chore(session): save state — Sprint 3B livré`)
- MAJ `.planning/SESSION.md`
- Push `preview/v3-ux-overhaul`

## 8. Critères d'acceptation

- [ ] Migration `20260513_010_agency_vault.sql` appliquée sans erreur
- [ ] 4 RPC fonctionnels : INSERT admin OK, INSERT non-admin RAISE, SELECT déchiffré pour admin uniquement
- [ ] RLS active sur la table (test : `SET ROLE authenticated; SELECT * FROM agency_accesses;` → 0 rows pour non-admin)
- [ ] Page `/coffre-fort` accessible à l'admin, redirect pour non-admin
- [ ] Sidebar : entrée "Coffre-fort" visible uniquement admin
- [ ] Search debounced fonctionnel (300ms), filtre par label/login/notes
- [ ] Add / Edit / Delete fonctionnent + persistent en BDD
- [ ] Refacto V3 projet : aucune régression sur onglet Accès projet Propul'seo
- [ ] `npx tsc --noEmit` clean
- [ ] `npx playwright test` passe en vert
- [ ] Code review effectué + vrais bugs corrigés
- [ ] `.planning/SESSION.md` à jour, branche pushée

## 9. Gestion des blocages

Si l'agent rencontre un blocage non couvert par le plan :
1. **STOP** immédiatement, ne devine pas
2. **Commit** ce qui est OK avec un message `wip(v3): Sprint 3B phase X partielle — blocage YZ`
3. **Documente précisément** dans `.planning/SESSION.md` :
   - À quelle étape précise du plan
   - Quelle décision était attendue
   - Pourquoi il bloque (erreur exacte, contexte technique)
   - Quels fichiers ont été touchés
   - Lien vers les commits partiels
4. **Push** la branche pour que je récupère à mon retour
5. **Termine la session** proprement (pas de tentative de débrouille hasardeuse)

L'utilisateur reprend le lead inline à son retour avec tout le contexte nécessaire.

## 10. Hors-scope explicite

- Pas de modification de V1, V2 actuels (sauf imports dans AccessTabV3.tsx)
- Pas de touche au coffre projet existant en BDD (Sprint 3A intact)
- Pas de migration data depuis ailleurs (table créée vide)
- Pas de seeding d'accès agence (à toi de les saisir manuellement après livraison)
