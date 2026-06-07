# F1 — Shell unifié : greffer Propul'Space (portail) dans le CRM

> Première tranche de la fusion « **Propul'Space = CRM unifié** ». Brainstormée et cadrée le 2026-06-07.
> **Principe : RÉUTILISER l'existant.** Le shell CRM devient le home unique ; on y monte le suivi portail et on le re-skinne au thème CRM. **Zéro migration DB.**

## 0. En clair (sans jargon)
Aujourd'hui l'équipe **jongle entre deux sites** : le **CRM** (l'outil interne, fond sombre violet) et le **back-office Propul'Space** (le suivi des espaces clients, fond clair). Deux adresses, deux ambiances visuelles, un aller-retour permanent.

**F1 = arrêter de jongler.** On fait entrer le suivi des espaces clients **dans le CRM**, comme un onglet de plus, **repeint aux couleurs du CRM**. On ne reconstruit rien : ces pages existent déjà, on les **déménage sous le toit du CRM**. **Aucune base de données touchée** — que de l'assemblage et de la peinture.

## 1. Contexte & objectif
Aujourd'hui = **2 apps React séparées** : le CRM (`Layout`, ~12 modules, thème « Dark Violet Neon ») et l'admin Propul'Space (`/admin/propulspace`, suivi des portails clients, thème clair premium). Objectif : **UNE seule interface**.

Décidé : le **CRM devient le home** (il a déjà tous les onglets), on y **greffe le suivi portail** comme module de plus, **au thème CRM** (pas de Dark-Tech pour l'instant). Tout le reste (modules CRM : Dashboard, Projets, Leads, Contacts, Comptabilité, Communication…) est **déjà là** → rien à reconstruire.

## 2. Décisions (rappel du brainstorming)
- **Réutiliser** le shell CRM (`Layout`) — ne PAS reconstruire la nav dans `/admin/propulspace`.
- **Garder le thème CRM actuel** (« Dark Violet Neon »). Le « Dark-Tech Precision » premium est **différé** (comparé visuellement le 2026-06-07, choix = rester CRM, moins de boulot).
- Le suivi portail **existe déjà** (`AdminClientsPage` + panel 6 onglets + leads qualifiés) → on le **MONTE**, on ne le réécrit pas.
- On le **re-skinne en CRM-dark** pour homogénéité (pas d'îlot clair).
- Session/permissions déjà alignées : session CRM (`supabase`), rôle `admin`/`manager`.

## 3. Périmètre

### Dans F1
- **Entrée nav** « Portails clients » dans la sidebar CRM (visible `admin`/`manager`).
- **Monter** les pages admin portail comme **module du `Layout`** (+ sous-routes : clients, clients/:id/* avec 6 onglets, leads qualifiés).
- **Re-skin CRM-dark** des pages admin : scope `--ps-*` → tokens CRM + correction des **~73 occurrences Tailwind brut** (24 fichiers).
- **Rebrand léger** : « Propul'Space » dans la chrome (titre/sidebar).
- Garder l'accès direct `/admin/propulspace` **fonctionnel pendant la transition**.

### Hors F1 (différé / non-goal)
- Adoption du **Dark-Tech premium** (tokens neufs) — différé.
- Re-skin des **modules CRM** (déjà en CRM-dark → OK, on n'y touche pas).
- **Portail CLIENT** (reste clair, intouché).
- Toute **migration DB**, cleanup code mort, SP1b (pont identité).
- **Retrait** de l'ancienne app `/admin/propulspace` (= fin de transition, plus tard).

## 4. Architecture / approche

### 4.1 Montage dans le `Layout` — comment on « branche » le portail

**Le format de navigation a changé** (à savoir avant de coder) : le CRM ne se pilote plus par un état interne (`activeModule`), mais par de **vraies adresses URL** via react-router. La liste des pages est centralisée dans `src/lib/routes.ts`, et le `Layout` les déclare dans un bloc `<Routes>`. Bonne nouvelle : les pages admin du portail sont **déjà** écrites dans ce format (adresses relatives `clients`, `clients/:id/*`, `leads`) → on peut les **rebrancher ailleurs sans les réécrire**.

**Décision : on ouvre une 2ᵉ porte d'entrée `/portails`, on ne touche pas à la 1ʳᵉ.**

Image : `/admin/propulspace` est une porte qui marche déjà (des e-mails d'invitation et des favoris pointent dessus). On ne la condamne pas. On **perce une nouvelle porte `/portails`** qui ouvre sur les **mêmes pièces**, mais cette fois **à l'intérieur du CRM** et **repeintes en sombre**.

```
App (routeur principal)
├── /admin/propulspace/*  →  ANCIENNE app, laissée INTACTE   (liens e-mails / favoris : OK)
└── *                     →  CRM (Layout)
                                └── /portails/*  →  MÊMES pages, intégrées + thème CRM-dark
```

Concrètement :
- `routes.ts` : ajouter `portails: '/portails'` (+ un helper pour la fiche client).
- `Layout` : ajouter une ligne `<Route path="/portails/*" …>` qui affiche le module portail.
- **Qui a le droit d'entrer** : on **réutilise la garde déjà existante** `PropulspaceAdminGuard` (elle laisse passer `admin` **et** `manager`) **à l'intérieur** du module. On ne touche donc pas au tableau de permissions du CRM et on n'ajoute **aucune colonne en base**. (Le système de permissions du CRM, lui, ne sait filtrer que `admin` *tout seul* ; passer par la garde est ce qui nous permet d'inclure aussi les `manager` sans rien migrer.)
- **Plus tard** (fin de transition) : `/admin/propulspace/*` devient une simple **redirection** vers `/portails/*`, puis on supprime l'ancienne app.

> Pourquoi PAS « garder `/admin/propulspace` mais l'afficher dans le CRM » ? Parce que cette adresse est **interceptée par le routeur principal AVANT** d'arriver au CRM (`App.tsx`). Pour l'afficher dans le CRM il faudrait la **retirer** du routeur principal — ce qui **supprime de fait l'ancienne app** et casse les liens d'invitation. La 2ᵉ porte évite complètement ce nœud.

### 4.2 Thème — re-skin CRM-dark (architecture theme-aware)
- Définir un **scope** (ex. `.propulspace-admin`) où les `--ps-*` **pointent vers les tokens CRM** : `--ps-bg → var(--surface-0)`, `--ps-surface → var(--surface-2)`, `--ps-primary → var(--neon)` (#8B5CF6), `--ps-fg → #ede9fe`, etc. → les parties **déjà tokenisées** passent en CRM-dark automatiquement.
- Le **portail CLIENT garde `.propulspace-portal`** (clair) ; le scope admin est **distinct** → zéro fuite de thème.
- **Corriger les ~73 occurrences Tailwind brut** (gray-*/violet-*/bg-white…) des 24 fichiers admin → tokens / valeurs CRM-dark. Inclut **`PortalStateCard`** (12 occ. = corrige au passage son bug de lisibilité « codé dark sur fond clair »).
- **Neutraliser** le `useForcePortalSurface('light')` du guard pour la version montée (le shell CRM est déjà sombre).

### 4.3 Session / permissions
- Inchangé : session CRM (`supabase`), rôle `admin`/`manager`. (Unification fine avec les `can_view_*` du CRM = hors F1.)

## 5. Unités touchées
- **Nav** : `Sidebar` CRM (+1 entrée), `Layout`/`App.tsx` (routing du module).
- **Nouveau wrapper** « module Portails clients » montant l'existant (`PropulspaceAdminApp` réusiné en module sans son shell racine).
- **CSS** : nouveau scope `.propulspace-admin` (CRM-dark) dans `portal-theme.css`.
- **24 fichiers admin** : correction Tailwind brut → tokens.

## 6. Risques / points de vigilance
- **Fuite de thème** : bien **isoler** le scope admin (CRM-dark) du portail client (clair) ET du `:root` CRM. Tester les deux surfaces.
- **Routing** : la 2ᵉ porte `/portails` **préserve** les **liens profonds** `/admin/propulspace/*` (mails d'invitation, favoris) puisqu'on garde l'ancienne app en parallèle. Vérifier malgré tout qu'aucune adresse codée en dur ne pointe par erreur vers l'ancien chemin depuis le module monté.
- **Garde** : ne pas exposer le module aux rôles non autorisés → réutiliser le check `admin`/`manager`.
- **`PortalStateCard`** : profiter du re-skin pour **corriger** son bug de lisibilité.
- **Proxy `v2` / session** : les pages admin lisent via `supabase`/vues `*_admin_v2` (session CRM) — inchangé, à ne pas mélanger avec `portalSupabase`.

## 7. Definition of Done
- [ ] Onglet « Portails clients » dans le CRM → ouvre clients + panel 6 onglets + leads qualifiés **dans le shell CRM**, en **CRM-dark cohérent** (zéro half-dark).
- [ ] **Tous les onglets CRM intacts** (aucune régression de nav).
- [ ] **Portail CLIENT inchangé** (toujours clair).
- [ ] `/admin/propulspace` direct **toujours fonctionnel** (transition).
- [ ] `tsc --noEmit` + `npm run lint` + `npm run build` **verts**.
- [ ] Rendu navigateur validé par Lyes (smoke test : onglet portails, un panel client, portail client clair).

## 8. Tranches suivantes
- **Modules CRM** : rien à faire (déjà dans le shell, déjà CRM-dark).
- **Rebrand poussé** (visuel/logo) si voulu.
- **Différé** : portail client V2 premium · cleanup code mort (`SupabaseService`…) · SP1b (pont identité) · convergence DB.
