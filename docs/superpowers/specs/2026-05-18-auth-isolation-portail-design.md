# Isolation des sessions auth — CRM admin ↔ Portail client Propul'Space

**Date** : 2026-05-18
**Status** : Spec validée par Lyes, en attente du plan d'implémentation
**Auteur** : session Claude Code + Lyes

---

## 1. Contexte et problème

### Symptôme observé

Pendant la QA E2E du portail client, impossible de se connecter sur `/espace-client/login` quand on est déjà connecté au CRM admin dans le même navigateur :
- bouton "Se connecter" reste bloqué sur `Connexion en cours…` indéfiniment
- ou redirection vers `/espace-client/expired` au chargement de la page de login
- warning console : `Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.`

### Cause racine

Une seule instance du client Supabase (`src/lib/supabase.ts`) est utilisée par tout le code front-end — CRM admin **et** portail client. Le client Supabase persiste la session dans `localStorage` sous une clé unique (`sb-tbuqctfg-auth-token`).

Conséquence : le navigateur ne peut héberger qu'**une seule session** à la fois. Si l'admin est connecté au CRM (`lyestriki@yahoo.fr`), `usePortalAuth` voit cette session, n'y trouve pas de `projects_v2.portal_client_email` correspondant, et passe en état `no-project` — qui redirige vers `/expired`.

Si l'admin tente quand même `signInWithPassword` avec un email client, l'opération tente d'écraser la session existante. Combinée à la présence d'une **deuxième** instance `GoTrueClient` (`supabaseAnon` dans le même fichier), elle provoque une contention de lock sur le storage → hang.

---

## 2. Objectif

Permettre la cohabitation, dans le **même navigateur**, d'une session CRM admin et d'une session client portail. Deux sessions actives en parallèle, indépendantes. Aucun impact sur la production data, aucune migration DB.

**Critères de succès** :
- Un admin connecté au CRM peut ouvrir `/espace-client/login` et voir la page de login portail comme un visiteur lambda.
- Un admin peut se connecter en parallèle comme client (email distinct) et avoir les deux onglets fonctionnels en même temps.
- Le warning `Multiple GoTrueClient instances` disparaît.
- Aucun "hang" de `signInWithPassword`.
- Aucun changement comportemental côté CRM admin.

---

## 3. Architecture cible

### Principe

**Une seule base Supabase, deux clients front-end isolés par `storageKey`.**

Dans `src/lib/supabase.ts`, on garde le client `supabase` existant (CRM admin) et on en ajoute un nouveau, `portalSupabase`, utilisé exclusivement par tout le code sous `/espace-client/*` côté client portail.

| Client | Usage | localStorage key |
|---|---|---|
| `supabase` | CRM (admin) — toutes routes hors `/espace-client/*` client | `sb-tbuqctfg-auth-token` (défaut) |
| `portalSupabase` | Portail Propul'Space (client) — routes sous `/espace-client/*` non-admin | `sb-propulspace-auth` (explicite) |

Les deux clients pointent vers la **même URL Supabase + même anon key**. Ils partagent la table `auth.users` et toutes les tables DB. L'isolation est strictement au niveau **stockage navigateur**.

### Schéma de flux

```
Navigateur Lyes
├── localStorage
│   ├── sb-tbuqctfg-auth-token        ← session admin (yahoo.fr)
│   └── sb-propulspace-auth           ← session client portail (gmail.com)
│
├── Onglet 1 : /  (CRM)
│   └── import { supabase } ........ lit/écrit dans sb-tbuqctfg-auth-token
│
└── Onglet 2 : /espace-client/...
    └── import { portalSupabase } ... lit/écrit dans sb-propulspace-auth
```

Les deux GoTrueClient internes ne sont jamais en compétition : ils ont des storage keys différents, donc des locks différents.

### Élimination du warning `Multiple GoTrueClient`

Le warning actuel vient du fait que `supabaseAnon` (déjà présent dans `src/lib/supabase.ts`) instancie un second GoTrueClient sur la même storage key par défaut, même si `persistSession: false`.

Fix : passer `storageKey: 'sb-anon-noop'` (ou équivalent) à `supabaseAnon` pour qu'il n'entre pas en conflit. Alternativement, examiner si `supabaseAnon` est encore utilisé et le retirer s'il ne sert plus (audit pendant l'impl).

---

## 4. Périmètre des modifications

### A. Fichier central

- `src/lib/supabase.ts` :
  - Ajout export `portalSupabase` (nouvel `createClient` avec `storageKey: 'sb-propulspace-auth'`, `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`).
  - Correction `supabaseAnon` pour éliminer le warning Multiple GoTrueClient (storageKey distinct).

### B. Code portail client — bascule sur `portalSupabase`

Tous les fichiers sous `src/modules/EspaceClient/client/**` **et** `src/modules/EspaceClient/shared/**` qui :
- appellent `supabase.auth.*` (signIn, signOut, getSession, onAuthStateChange, updateUser, resetPasswordForEmail, signInWithOtp)
- ou lisent des données scope-utilisateur (`from('projects_v2')` filtré par email portail, `from('propulspace.documents')`, etc.)

Fichiers identifiés à l'inspection :
1. `src/modules/EspaceClient/shared/hooks/usePortalAuth.ts`
2. `src/modules/EspaceClient/client/pages/SetupPasswordPage.tsx`
3. `src/modules/EspaceClient/client/pages/ResetPasswordPage.tsx`
4. `src/modules/EspaceClient/shared/components/PasswordSetForm.tsx` (vérifier usage `auth.updateUser`)
5. `src/modules/EspaceClient/client/ClientLoginPage.tsx` (si appel direct à `supabase` — vérifier)
6. `src/modules/EspaceClient/client/hooks/usePortalData.ts`
7. Toute page sous `src/modules/EspaceClient/client/pages/**` qui fait des requêtes data scope-client (DocumentsPage, InvoicesPage, SignaturesPage, ProfilePage, etc.)

Liste exacte à dresser pendant le plan d'implémentation par `grep` ciblé.

### C. Code admin — **inchangé**

- `src/modules/EspaceClient/admin/**` reste sur `supabase` (le contexte admin vit dans le CRM).
- Les hooks `usePropulspaceAdmin`, `usePortalActivation`, `useProjectContactsV3`, etc. — pas touchés.

### D. Edge functions — **inchangées**

Les edge functions (`admin-portal-invite`, `admin-portal-resend-invite`, `admin-portal-deactivate`, `portal-create-checkout-session`, `stripe-webhook`, `admin-docuseal-create-submission`, `docuseal-webhook`) utilisent `SERVICE_ROLE_KEY` côté serveur. Aucun impact.

### E. Cleanup

- Retirer les debug logs `[portal-login]` ajoutés pendant le diagnostic dans `ClientLoginPage.tsx`.

---

## 5. Scénarios d'usage couverts

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Visiteur sans session sur `/espace-client/login` | Page login portail s'affiche. État `unauthenticated`. |
| 2 | Admin CRM (yahoo.fr) ouvre `/espace-client/login` dans le même navigateur | Page login portail s'affiche neutralement (pas de redir, pas de hang). La session admin reste intacte. |
| 3 | Admin se connecte en parallèle comme client (gmail.com) sur onglet portail | Login portail réussit. Onglet CRM admin toujours actif. Deux sessions cohabitent. |
| 4 | Client connecté au portail ouvre `/` (CRM) | CRM affiche son écran de login (le portail n'a pas de session pour ce storage key). |
| 5 | Client se déconnecte du portail | Seule la session portail est supprimée. La session admin (si présente) reste. |
| 6 | Admin se déconnecte du CRM | Seule la session admin est supprimée. La session portail (si présente) reste. |
| 7 | Magic link reçu par email, clic | Atterrit sur `/espace-client/setup-password` qui utilise `portalSupabase` → session créée dans `sb-propulspace-auth`. Pas d'interférence avec session CRM. |
| 8 | Refresh d'un des onglets | Session restaurée depuis le storage key correspondant. |
| 9 | Reset password client | Email envoyé via `portalSupabase.auth.resetPasswordForEmail`. Lien → `/espace-client/reset-password` qui crée la session dans `sb-propulspace-auth`. |

---

## 6. Edge cases et limites

### Email partagé admin + client

`auth.users` n'autorise qu'**une seule ligne par email**. Si un humain veut être à la fois admin interne et client portail, il doit utiliser **deux emails distincts** (ce que fait déjà Lyes avec yahoo.fr / gmail.com).

La garde dans `SetupPasswordPage` (vérifie si l'`auth_user_id` matche une ligne dans `public.users` — table interne) reste fonctionnelle et bloque un admin qui tenterait d'utiliser son email interne comme client portail.

### Sessions existantes au moment du déploiement

- Les sessions admin actuellement stockées dans `sb-tbuqctfg-auth-token` restent valides après déploiement (même storage key).
- Les sessions client portail actuellement stockées dans `sb-tbuqctfg-auth-token` ne seront **pas lues** par `portalSupabase` (qui regarde `sb-propulspace-auth`). Conséquence : les clients déjà connectés devront se reconnecter une fois. Acceptable car phase QA, 1-2 clients max.

### HMR Vite (dev mode)

Avec deux clients qui ont des storage keys distincts, le warning `Multiple GoTrueClient` disparaît. Le hot module reload de Vite recharge les imports proprement, chaque client garde son lock indépendant.

### Realtime subscriptions

`portalSupabase.channel(...)` et `supabase.channel(...)` créent deux connexions WebSocket séparées (une par client). Pas d'interférence. Léger surcoût réseau négligeable.

---

## 7. Plan de test manuel (post-implémentation)

1. **Reset clean** : Clear all localStorage. Recharger la page.
2. **Login CRM admin** : aller sur `/`, se connecter avec `lyestriki@yahoo.fr` + mdp admin → dashboard CRM s'affiche.
3. **Ouvrir nouvel onglet** : `/espace-client/login`. **Vérifier** : page de login portail s'affiche immédiatement, pas de redir, pas de spinner, pas de message d'erreur.
4. **Login client** : `lyestriki@gmail.com` + mdp client → redirection automatique vers `/espace-client` → dashboard portail.
5. **Vérifier cohabitation** : alterner entre les deux onglets. Les deux sont toujours connectés à leur côté respectif.
6. **Refresh** : F5 sur l'onglet CRM → admin toujours connecté. F5 sur l'onglet portail → client toujours connecté.
7. **DevTools → Application → Local Storage** : vérifier la présence des deux clés `sb-tbuqctfg-auth-token` et `sb-propulspace-auth` avec des `user.email` distincts.
8. **Logout asymétrique** : déconnecter le client portail → l'admin CRM reste. Reconnexion client. Déconnecter l'admin CRM → le client reste.
9. **Console** : aucun warning `Multiple GoTrueClient instances` ne doit apparaître.
10. **Magic link** : depuis la fiche projet CRM, désactiver puis réactiver le portail pour un email de test → email reçu → clic du lien → arrive sur `/espace-client/setup-password` → set mdp → redirige vers dashboard portail. La session CRM admin n'est pas affectée.

---

## 8. Effort estimé

| Tâche | Effort |
|---|---|
| Modification `src/lib/supabase.ts` (ajout `portalSupabase`, fix `supabaseAnon`) | 15 min |
| Bascule `usePortalAuth.ts` | 10 min |
| Bascule SetupPasswordPage, ResetPasswordPage, PasswordSetForm | 20 min |
| Audit + bascule des pages portail (Documents, Invoices, Signatures, Profile, Dashboard, Project, Help) | 45 min |
| Cleanup debug logs `[portal-login]` | 5 min |
| `tsc --noEmit` clean + sanity browser check | 15 min |
| QA manuel selon §7 | 30 min |
| **Total** | **~2h30** |

---

## 9. Hors-périmètre (explicitement)

- Pas de séparation en deux projets Supabase distincts (`auth.users` reste partagé).
- Pas de migration de schéma DB.
- Pas de modification des RLS policies.
- Pas de refonte des edge functions.
- Pas d'implémentation du **multi-projets ADR-004** (un email = un projet aujourd'hui). C'est un sujet séparé.
- Pas de fix du wizard onboarding B.2 (sujet séparé, attente décision α/β).

---

## 10. Risques et mitigation

| Risque | Probabilité | Mitigation |
|---|---|---|
| Oubli d'un import dans un fichier portail → ce fichier lit la mauvaise session | Moyenne | Audit `grep` systématique avant impl + QA manuel sur chaque page portail |
| Cassure du flux magic link | Faible | `SetupPasswordPage` testé manuellement dans le plan QA §7.10 |
| Régression CRM (oubli inverse) | Très faible | Le code CRM ne change pas (on touche seulement les fichiers `EspaceClient/client/**` et `EspaceClient/shared/**`) |
| Le warning `Multiple GoTrueClient` persiste | Faible | Si le warning reste, audit du `supabaseAnon` et de tous les `createClient` du repo |
