# F1 — Shell unifié : greffer le portail Propul'Space dans le CRM — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre le back-office admin Propul'Space accessible *à l'intérieur* du shell CRM, sous `/portails`, repeint au thème CRM-dark, sans casser l'ancienne app `/admin/propulspace` ni toucher la base de données.

**Architecture:** On ouvre une **2ᵉ porte** `/portails/*` montée dans le `<Routes>` du `Layout` CRM, qui réutilise les pages admin existantes. Un contexte `basePath` rend les liens internes agnostiques au préfixe (l'ancienne app et la nouvelle cohabitent). La garde `PropulspaceAdminGuard` filtre `admin`/`manager` (zéro colonne DB). Le thème bascule en CRM-dark par re-skin des classes Tailwind brutes + activation des tokens sombres pour les parties déjà tokenisées.

**Tech Stack:** React 18 + react-router-dom v7 + Tailwind (tokens sémantiques CSS) + Vitest (logique pure uniquement).

---

## Note de vérification (lire avant de commencer)

Ce repo **ne teste que la logique pure** (mapping, schémas, adapters — 11 specs Vitest). Il n'existe **aucun test de routing ni de rendu/CSS**. Conformément à l'instruction utilisateur « TDD pragmatique : si une suite de tests existe pour ce type de code, écrire les tests d'abord ; sinon non obligatoire », **F1 (câblage de routes + re-skin CSS) se vérifie par** :

- **Type check réel** : `npx tsc -b --noEmit` — ⚠️ ne PAS se fier à `npm run build` seul : son script est `tsc -b --noEmit || true && vite build`, le `|| true` **masque les erreurs de type**.
- **Lint** : `npm run lint`
- **Build** : `npm run build`
- **Non-régression des tests existants** : `npm test`
- **Smoke visuel** : effectué **par Lyes** (l'utilisateur fait ses vérifs navigateur lui-même — ne pas lancer Playwright). Le plan fournit la checklist de smoke test à la fin.

Aucune tâche n'écrit de test unitaire : il n'y a pas de précédent testable pour du montage de `<Routes>` ou des couleurs Tailwind dans ce repo.

---

## File Structure

**Créés :**
- `src/modules/EspaceClient/admin/AdminBasePathContext.tsx` — contexte `{ basePath, mountedInShell }` + provider + hook `useAdminBasePath()`. Responsabilité : dire aux composants admin « sous quel préfixe d'URL je suis monté » et « suis-je dans le shell CRM ».
- `src/modules/EspaceClient/admin/AdminRoutesShell.tsx` — coquille paramétrée (provider + garde + `<Routes>` clients/leads). Source unique des sous-routes admin, réutilisée par les deux points d'entrée.
- `src/modules/EspaceClient/admin/PortailsModule.tsx` — module lazy monté par le `Layout` : `<AdminRoutesShell basePath="/portails" mountedInShell />`.

**Modifiés (montage) :**
- `src/modules/EspaceClient/shared/hooks/useForcePortalSurface.ts` — accepter la valeur `'none'` (ne pas toucher au `<html>`).
- `src/modules/EspaceClient/admin/PropulspaceAdminGuard.tsx` — lire `mountedInShell` du contexte ; surface `'none'` + conteneur CRM-dark quand monté.
- `src/modules/EspaceClient/admin/PropulspaceAdminApp.tsx` — devient `<AdminRoutesShell basePath="/admin/propulspace" mountedInShell={false} />`.
- `src/modules/EspaceClient/admin/components/AdminTopNav.tsx` — masqué quand `mountedInShell` ; liens via `basePath`.
- `src/modules/EspaceClient/admin/components/AdminClientTabs.tsx` — `base` via `basePath`.
- `src/modules/EspaceClient/admin/components/ClientHealthRow.tsx` — `navigate` via `basePath`.
- `src/modules/EspaceClient/admin/components/LeadDetailSheet.tsx` — `navigate` via `basePath`.
- `src/modules/EspaceClient/admin/pages/AdminClientPanel.tsx` — lien « ← Tous les clients » via `basePath`.
- `src/lib/routes.ts` — ajouter `portails: '/portails'`.
- `src/components/layout/Layout.tsx` — lazy `PortailsModule` + `<Route path="/portails/*" …>`.
- `src/components/layout/Sidebar.tsx` — entrée « Portails clients » (accès `admin`/`manager`).

**Modifiés (re-skin, Phase 3) :** 25 fichiers de `src/modules/EspaceClient/admin/` (314 occurrences Tailwind brutes), regroupés en 3 lots.

---

## Table de correspondance du re-skin (référence centrale Phase 3)

Appliquer fichier par fichier. Deux familles : **neutres** (passent aux surfaces sombres) et **sémantiques** (gardent la teinte, version dark-friendly).

### Neutres (gris / blanc) → tokens CRM
| Classe brute | Remplacement |
|---|---|
| `bg-white`, `bg-gray-50`, `bg-gray-100`, `bg-zinc-100` | `bg-surface-2` (carte/surface élevée) — pour un **fond de page**, préférer `bg-transparent` (laisse passer le fond CRM) |
| `bg-gray-800/900` (déjà sombre) | `bg-surface-3` |
| `text-gray-900`, `text-gray-800` | `text-foreground` |
| `text-gray-700`, `text-gray-600` | `text-foreground/80` |
| `text-gray-500`, `text-gray-400`, `text-zinc-500` | `text-muted-foreground` |
| `border-gray-200`, `divide-gray-100` | `border-border`, `divide-border` |

### Marque (violet) → primary / neon
| Classe brute | Remplacement |
|---|---|
| `bg-violet-600`, `bg-violet-700` | `bg-primary` (survol : `hover:bg-primary/90`) |
| `text-violet-700` | `text-primary` |
| `bg-violet-50`, `bg-violet-100` | `bg-primary/10` |
| `border-violet-300/400/600` | `border-primary/30` |

### Sémantiques (garder la teinte, adapter au sombre)
Patron général : fond pâle `-50` → `-500/10` · texte foncé `-600/700/800` → `-300` · bordure `-200` → `-500/30`. Les classes **déjà** en `-300/-400` (ex. `text-red-300`) sont **correctes sur fond sombre** : les garder.
| Famille | Fond pâle | Texte foncé | Bordure | Plein (garder) |
|---|---|---|---|---|
| success / emerald | `bg-emerald-50`→`bg-emerald-500/10` | `text-emerald-700`→`text-emerald-300` | `border-emerald-200`→`border-emerald-500/30` | `bg-emerald-500` |
| warning / amber | `bg-amber-50`→`bg-amber-500/10` | `text-amber-700`→`text-amber-300` | `border-amber-500` (garder) | `bg-amber-500` |
| danger / red | `bg-red-50`→`bg-red-500/10` | `text-red-600/700/800`→`text-red-300` | `border-red-200`→`border-red-500/30` | `bg-red-500` |
| info / sky | (pâle)→`bg-sky-500/10` | `text-sky-300/400` (garder) | — | `bg-sky-500` |

> **Cas `PortalStateCard.tsx`** : son « bug de lisibilité » (texte `-300` clair posé sur fond resté clair) **se corrige automatiquement** une fois le conteneur passé en sombre. Vérifier juste que ses 4 états (success/invited/orphan/broken) restent contrastés.

---

## Phase 1 — Base path : faire cohabiter les deux portes sans casser l'ancienne

Objectif : refactor non destructif. À la fin, l'ancienne app `/admin/propulspace` fonctionne **exactement comme avant** (le `basePath` par défaut vaut `/admin/propulspace`).

### Task 1 : Contexte `basePath`

**Files:**
- Create: `src/modules/EspaceClient/admin/AdminBasePathContext.tsx`

- [ ] **Step 1 : Écrire le contexte + le hook**

```tsx
import { createContext, useContext, type ReactNode } from 'react';

interface AdminBasePathValue {
  /** Préfixe d'URL sous lequel l'app admin est montée (ex. '/admin/propulspace' ou '/portails'). */
  basePath: string;
  /** true quand l'app admin est rendue à l'intérieur du shell CRM (thème sombre, pas de top-nav propre). */
  mountedInShell: boolean;
}

const DEFAULT: AdminBasePathValue = {
  basePath: '/admin/propulspace',
  mountedInShell: false,
};

const AdminBasePathContext = createContext<AdminBasePathValue>(DEFAULT);

export function AdminBasePathProvider({
  basePath,
  mountedInShell,
  children,
}: AdminBasePathValue & { children: ReactNode }) {
  return (
    <AdminBasePathContext.Provider value={{ basePath, mountedInShell }}>
      {children}
    </AdminBasePathContext.Provider>
  );
}

export function useAdminBasePath(): AdminBasePathValue {
  return useContext(AdminBasePathContext);
}
```

- [ ] **Step 2 : Vérifier le type check**

Run: `npx tsc -b --noEmit`
Expected: PASS (aucune erreur ; le fichier n'est pas encore importé).

- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/AdminBasePathContext.tsx
git commit -m "feat(f1): contexte basePath pour monter l'admin sous plusieurs préfixes"
```

### Task 2 : Brancher les 5 liens internes sur `basePath`

**Files:**
- Modify: `src/modules/EspaceClient/admin/components/AdminClientTabs.tsx:14`
- Modify: `src/modules/EspaceClient/admin/components/ClientHealthRow.tsx:18`
- Modify: `src/modules/EspaceClient/admin/components/LeadDetailSheet.tsx:96`
- Modify: `src/modules/EspaceClient/admin/pages/AdminClientPanel.tsx:77`

- [ ] **Step 1 : `AdminClientTabs.tsx` — base dynamique**

Ajouter l'import en haut du fichier :
```tsx
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';
```
Dans le composant, remplacer la ligne 14 :
```tsx
const base = `/admin/propulspace/clients/${projectId}`;
```
par :
```tsx
const { basePath } = useAdminBasePath();
const base = `${basePath}/clients/${projectId}`;
```

- [ ] **Step 2 : `ClientHealthRow.tsx` — navigate dynamique**

Ajouter l'import :
```tsx
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';
```
Récupérer le basePath près du `const navigate = useNavigate();` (ligne 14) :
```tsx
const { basePath } = useAdminBasePath();
```
Remplacer la cible ligne 18 :
```tsx
onClick={() => navigate(`/admin/propulspace/clients/${client.project_id}`)}
```
par :
```tsx
onClick={() => navigate(`${basePath}/clients/${client.project_id}`)}
```

- [ ] **Step 3 : `LeadDetailSheet.tsx` — navigate dynamique**

Ajouter l'import :
```tsx
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';
```
Près du `const navigate = useNavigate();` (ligne 24) :
```tsx
const { basePath } = useAdminBasePath();
```
Remplacer la cible ligne 96 :
```tsx
onClick={() => navigate(`/admin/propulspace/clients/${lead.converted_to_project_id}`)}
```
par :
```tsx
onClick={() => navigate(`${basePath}/clients/${lead.converted_to_project_id}`)}
```

- [ ] **Step 4 : `AdminClientPanel.tsx` — lien retour dynamique**

Ajouter l'import :
```tsx
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';
```
Dans le composant, récupérer le basePath :
```tsx
const { basePath } = useAdminBasePath();
```
Remplacer le lien ligne 77 :
```tsx
<Link to="/admin/propulspace/clients" className="text-sm text-violet-700 hover:underline">← Tous les clients</Link>
```
par (la classe `text-violet-700` sera re-skinnée en Phase 3) :
```tsx
<Link to={`${basePath}/clients`} className="text-sm text-violet-700 hover:underline">← Tous les clients</Link>
```

- [ ] **Step 5 : Vérifier type check + lint**

Run: `npx tsc -b --noEmit && npm run lint`
Expected: PASS. (Ces composants sont rendus sous le provider par défaut `/admin/propulspace`, comportement identique à l'actuel.)

- [ ] **Step 6 : Commit**

```bash
git add src/modules/EspaceClient/admin/components/AdminClientTabs.tsx src/modules/EspaceClient/admin/components/ClientHealthRow.tsx src/modules/EspaceClient/admin/components/LeadDetailSheet.tsx src/modules/EspaceClient/admin/pages/AdminClientPanel.tsx
git commit -m "refactor(f1): liens internes admin agnostiques au préfixe (basePath)"
```

### Task 3 : Extraire `AdminRoutesShell` + brancher l'ancienne app dessus

**Files:**
- Create: `src/modules/EspaceClient/admin/AdminRoutesShell.tsx`
- Modify: `src/modules/EspaceClient/admin/PropulspaceAdminApp.tsx`

- [ ] **Step 1 : Créer la coquille paramétrée**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminBasePathProvider } from './AdminBasePathContext';
import { PropulspaceAdminGuard } from './PropulspaceAdminGuard';
import { LeadsQualifiesPage } from './LeadsQualifiesPage';
import { AdminClientsPage } from './pages/AdminClientsPage';
import { AdminClientPanel } from './pages/AdminClientPanel';

interface AdminRoutesShellProps {
  basePath: string;
  mountedInShell: boolean;
}

// Sous-routes back-office Propul'Space (relatives) :
//  - clients              : dashboard des portails (défaut)
//  - clients/:projectId/* : panneau client à onglets
//  - leads                : leads qualifiés
// Réutilisé par PropulspaceAdminApp (/admin/propulspace) ET PortailsModule (/portails).
export function AdminRoutesShell({ basePath, mountedInShell }: AdminRoutesShellProps) {
  return (
    <AdminBasePathProvider basePath={basePath} mountedInShell={mountedInShell}>
      <PropulspaceAdminGuard>
        <Routes>
          <Route index element={<Navigate to="clients" replace />} />
          <Route path="clients" element={<AdminClientsPage />} />
          <Route path="clients/:projectId/*" element={<AdminClientPanel />} />
          <Route path="leads" element={<LeadsQualifiesPage />} />
        </Routes>
      </PropulspaceAdminGuard>
    </AdminBasePathProvider>
  );
}
```

- [ ] **Step 2 : Réécrire `PropulspaceAdminApp` pour déléguer à la coquille**

Remplacer **tout** le contenu de `src/modules/EspaceClient/admin/PropulspaceAdminApp.tsx` par :
```tsx
import { AdminRoutesShell } from './AdminRoutesShell';

// Point d'entrée historique : /admin/propulspace/* (App.tsx). Conservé intact
// pendant la transition (liens d'invitation, favoris). Thème clair, hors shell.
export function PropulspaceAdminApp() {
  return <AdminRoutesShell basePath="/admin/propulspace" mountedInShell={false} />;
}
```

- [ ] **Step 3 : Vérifier type check**

Run: `npx tsc -b --noEmit`
Expected: PASS.

- [ ] **Step 4 : Commit**

```bash
git add src/modules/EspaceClient/admin/AdminRoutesShell.tsx src/modules/EspaceClient/admin/PropulspaceAdminApp.tsx
git commit -m "refactor(f1): extraire AdminRoutesShell (coquille de routes réutilisable)"
```

**🔍 Checkpoint Phase 1** — Lyes vérifie que `/admin/propulspace/clients`, un panneau client (les 6 onglets) et `/admin/propulspace/leads` fonctionnent **comme avant** (thème clair, navigation OK). Aucune régression attendue.

---

## Phase 2 — Monter la 2ᵉ porte `/portails` dans le CRM

À la fin, `/portails` est accessible dans le shell CRM pour `admin`/`manager`. Le contenu est **encore en thème clair** (re-skin en Phase 3) → visuellement « moitié sombre », **normal et temporaire** : on est sur une branche dédiée, non mergée.

### Task 4 : Étendre `useForcePortalSurface` avec `'none'`

**Files:**
- Modify: `src/modules/EspaceClient/shared/hooks/useForcePortalSurface.ts`

- [ ] **Step 1 : Ajouter la valeur `'none'`**

Le type actuel est `type Surface = 'light' | 'dark'`. Le modifier en :
```ts
type Surface = 'light' | 'dark' | 'none';
```
Et au tout début du corps du `useEffect` (ligne ~10), ajouter un court-circuit AVANT toute manipulation de `document.documentElement` :
```ts
useEffect(() => {
  if (surface === 'none') return; // monté dans un shell qui gère déjà son thème : ne pas toucher au <html>
  const html = document.documentElement;
  // … (reste inchangé)
```

- [ ] **Step 2 : Vérifier type check**

Run: `npx tsc -b --noEmit`
Expected: PASS. (Non-breaking : `'light'`/`'dark'` inchangés, les appelants existants — portail client, qualif — ne sont pas affectés.)

- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/shared/hooks/useForcePortalSurface.ts
git commit -m "feat(f1): surface 'none' pour useForcePortalSurface (montage en shell)"
```

### Task 5 : Garde adaptée au montage (thème sombre, html intact)

**Files:**
- Modify: `src/modules/EspaceClient/admin/PropulspaceAdminGuard.tsx`

- [ ] **Step 1 : Lire `mountedInShell` et adapter surface + conteneur**

Ajouter l'import :
```tsx
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';
```
Dans le composant, remplacer l'appel inconditionnel `useForcePortalSurface('light');` (ligne 20) par :
```tsx
const { mountedInShell } = useAdminBasePath();
// Monté dans le CRM (déjà sombre) : ne pas toucher au <html>. Hors shell : thème clair historique.
useForcePortalSurface(mountedInShell ? 'none' : 'light');
```
Puis remplacer le conteneur de succès (ligne 50) :
```tsx
return <div className="propulspace-portal min-h-screen bg-[var(--ps-bg)] text-[var(--ps-fg)]">{children}</div>;
```
par :
```tsx
const surfaceClass = mountedInShell
  ? 'propulspace-portal ps-theme-dark min-h-full' // tokens --ps-* en version sombre, fond hérité du CRM
  : 'propulspace-portal min-h-screen bg-[var(--ps-bg)] text-[var(--ps-fg)]';
return <div className={surfaceClass}>{children}</div>;
```

- [ ] **Step 2 : Vérifier type check**

Run: `npx tsc -b --noEmit`
Expected: PASS.

- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/PropulspaceAdminGuard.tsx
git commit -m "feat(f1): garde admin compatible montage en shell (ps-theme-dark, html intact)"
```

### Task 6 : Masquer `AdminTopNav` dans le shell + lier au basePath

**Files:**
- Modify: `src/modules/EspaceClient/admin/components/AdminTopNav.tsx`

- [ ] **Step 1 : Early-return quand monté + liens via basePath**

Lire le fichier en entier d'abord. La liste de liens (lignes 4-5) cible `/admin/propulspace/clients` et `/admin/propulspace/leads` en dur, et le composant fait doublon avec la Sidebar CRM. Ajouter l'import :
```tsx
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';
```
Au début du composant, ajouter :
```tsx
const { basePath, mountedInShell } = useAdminBasePath();
if (mountedInShell) return null; // la Sidebar CRM remplace cette barre
```
Et construire les liens à partir de `basePath` au lieu des chaînes en dur, par exemple :
```tsx
const links = [
  { to: `${basePath}/clients`, label: 'Clients' },
  { to: `${basePath}/leads`, label: 'Leads' },
];
```
(adapter la boucle de rendu existante pour utiliser `links`).

- [ ] **Step 2 : Vérifier type check + lint**

Run: `npx tsc -b --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/components/AdminTopNav.tsx
git commit -m "feat(f1): masquer AdminTopNav dans le shell CRM + liens via basePath"
```

### Task 7 : Le module `/portails` + route dans le `Layout` + entrée Sidebar

**Files:**
- Create: `src/modules/EspaceClient/admin/PortailsModule.tsx`
- Modify: `src/lib/routes.ts`
- Modify: `src/components/layout/Layout.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1 : Le module monté**

`src/modules/EspaceClient/admin/PortailsModule.tsx` :
```tsx
import { AdminRoutesShell } from './AdminRoutesShell';

// Module monté dans le shell CRM sous /portails/* (cf. Layout). Réutilise les
// pages admin Propul'Space, en thème CRM-dark, sans toucher au <html>.
export function PortailsModule() {
  return <AdminRoutesShell basePath="/portails" mountedInShell />;
}
```

- [ ] **Step 2 : Déclarer la route dans `routes.ts`**

Dans `src/lib/routes.ts`, ajouter dans l'objet `routes` (après le bloc `// CRM Propul'SEO`) :
```ts
  // Portails clients (back-office Propul'Space monté dans le shell)
  portails: '/portails',
```
**Ne PAS** ajouter d'entrée dans `routePermissions` ni dans `ADMIN_ONLY_PATHS` : `getPermissionForPath('/portails')` renverra `null` → le `Layout` laisse rendre, puis `PropulspaceAdminGuard` filtre `admin`/`manager`. (Mettre `/portails` dans `ADMIN_ONLY_PATHS` exclurait à tort les managers ; ajouter une permission booléenne imposerait une colonne DB → hors F1.)

- [ ] **Step 3 : Monter le module dans le `Layout`**

Dans `src/components/layout/Layout.tsx`, ajouter un lazy import près des autres (vers la ligne 28) :
```tsx
const PortailsModule = lazy(() => import('../../modules/EspaceClient/admin/PortailsModule').then(m => ({ default: m.PortailsModule })))
```
Puis, dans le bloc `<Routes>` (après la route `/procedures/*`, vers la ligne 202), ajouter :
```tsx
{/* Portails clients (back-office Propul'Space monté dans le shell) */}
<Route path="/portails/*" element={wrap(PortailsModule)} />
```

- [ ] **Step 4 : Entrée Sidebar avec accès `admin`/`manager`**

Dans `src/components/layout/Sidebar.tsx` :

(a) Importer l'icône — ajouter `Building2` à l'import `lucide-react` (lignes 3-16).

(b) Étendre le type `NavItem` (lignes 32-37) pour autoriser un accès par rôle :
```tsx
interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
  roles?: Array<User['role']>;
}
```

(c) Adapter `canAccessPage` (lignes 72-76) pour gérer `roles` et `permission` optionnels :
```tsx
const canAccessPage = (item: NavItem) => {
  if (!currentUserData) return true;
  if (isAdmin) return true;
  if (item.roles) return item.roles.includes(currentUserData.role);
  if (item.permission) return currentUserData[item.permission] === true;
  return true;
};
```
⚠️ Les appelants passent désormais **l'item entier**, pas `item.permission`. Mettre à jour les deux usages : ligne 172 `section.items.some(item => canAccessPage(item))` et ligne 198 `if (!canAccessPage(item)) return null;`.

(d) Ajouter l'entrée dans `v3Section.items` (après la ligne `CRM`, ligne 102) :
```tsx
      { to: routes.portails,              label: 'Portails clients',    icon: Building2,       roles: ['admin', 'manager'] },
```

- [ ] **Step 5 : Vérifier type check + lint + build**

Run: `npx tsc -b --noEmit && npm run lint && npm run build`
Expected: PASS (build vert).

- [ ] **Step 6 : Commit**

```bash
git add src/modules/EspaceClient/admin/PortailsModule.tsx src/lib/routes.ts src/components/layout/Layout.tsx src/components/layout/Sidebar.tsx
git commit -m "feat(f1): monter le portail sous /portails dans le shell CRM (+ entrée sidebar admin/manager)"
```

**🔍 Checkpoint Phase 2** — Lyes vérifie : (1) l'entrée « Portails clients » apparaît dans la sidebar pour un compte admin/manager, pas pour un sales ; (2) cliquer dessus ouvre `/portails/clients` **dans le shell CRM** (sidebar visible, pas de top-nav admin en double) ; (3) navigation client → panneau → retour fonctionne et **reste sous `/portails`** ; (4) le reste du CRM n'a pas changé de thème ; (5) `/admin/propulspace` direct marche toujours. Le contenu portail est **encore clair/illisible** = attendu, corrigé en Phase 3.

---

## Phase 3 — Re-skin CRM-dark des pages admin (314 occurrences / 25 fichiers)

Appliquer la **table de correspondance** ci-dessus. Travailler par lots, **commit par lot**, et faire valider visuellement chaque lot par Lyes avant le suivant. Pour chaque fichier : lire le fichier, remplacer les classes brutes selon la table, garder la logique intacte.

> **Repérage** : pour lister les classes restantes dans un fichier, utiliser un grep ciblé, ex. `rg "(bg|text|border|divide|ring)-(white|black|gray|zinc|slate|neutral|violet|purple|red|emerald|amber|sky)-?" <fichier>`.

### Task 8 : Lot A — pages & chrome (≈10 fichiers)

**Files (Modify):**
- `src/modules/EspaceClient/admin/pages/AdminClientsPage.tsx`
- `src/modules/EspaceClient/admin/pages/AdminClientPanel.tsx`
- `src/modules/EspaceClient/admin/LeadsQualifiesPage.tsx`
- `src/modules/EspaceClient/admin/components/AdminTopNav.tsx`
- `src/modules/EspaceClient/admin/components/AdminClientTabs.tsx`
- `src/modules/EspaceClient/admin/components/AdminTabScaffold.tsx`
- `src/modules/EspaceClient/admin/components/ClientHealthRow.tsx`
- `src/modules/EspaceClient/admin/components/LeadCard.tsx`
- `src/modules/EspaceClient/admin/components/PortalStateCard.tsx`
- `src/modules/EspaceClient/admin/components/PortalStatusSection.tsx`

- [ ] **Step 1 : Appliquer la table à chaque fichier du lot**

Exemple représentatif (lien retour de `AdminClientPanel`) :
```tsx
// avant
<Link to={`${basePath}/clients`} className="text-sm text-violet-700 hover:underline">← Tous les clients</Link>
// après
<Link to={`${basePath}/clients`} className="text-sm text-primary hover:underline">← Tous les clients</Link>
```
Exemple onglet actif (`AdminClientTabs`, `text-violet-700`/`border-violet-600` → `text-primary`/`border-primary` ; onglet inactif `text-gray-500` → `text-muted-foreground` ; bordure `border-gray-200` → `border-border`).
Exemple carte (`PortalStateCard`, `LeadCard`, surfaces `bg-white`/`bg-gray-50` → `bg-surface-2`, titres `text-gray-900` → `text-foreground`, méta `text-gray-500` → `text-muted-foreground`, contours `border-gray-200` → `border-border`).
Vérifier le cas `PortalStateCard` : les 4 états sémantiques restent lisibles (cf. note de la table).

- [ ] **Step 2 : Vérifier type check + lint + build**

Run: `npx tsc -b --noEmit && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/pages src/modules/EspaceClient/admin/LeadsQualifiesPage.tsx src/modules/EspaceClient/admin/components/AdminTopNav.tsx src/modules/EspaceClient/admin/components/AdminClientTabs.tsx src/modules/EspaceClient/admin/components/AdminTabScaffold.tsx src/modules/EspaceClient/admin/components/ClientHealthRow.tsx src/modules/EspaceClient/admin/components/LeadCard.tsx src/modules/EspaceClient/admin/components/PortalStateCard.tsx src/modules/EspaceClient/admin/components/PortalStatusSection.tsx
git commit -m "style(f1): re-skin CRM-dark — lot A (pages & chrome admin)"
```

**🔍 Checkpoint** — Lyes valide le rendu de `/portails/clients` et `/portails/leads` (listes, cartes, onglets) en CRM-dark.

### Task 9 : Lot B — onglets du panneau client (5 fichiers)

**Files (Modify):**
- `src/modules/EspaceClient/admin/components/InvoicesTab.tsx`
- `src/modules/EspaceClient/admin/components/ActivityTab.tsx`
- `src/modules/EspaceClient/admin/components/DocumentsTab.tsx`
- `src/modules/EspaceClient/admin/components/SignaturesTab.tsx`
- `src/modules/EspaceClient/admin/components/ProjectStepsTab.tsx`

- [ ] **Step 1 : Appliquer la table** (mêmes règles ; ces onglets ont beaucoup de badges de statut sémantiques — appliquer la section « Sémantiques » de la table).

- [ ] **Step 2 : Vérifier**

Run: `npx tsc -b --noEmit && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/components/InvoicesTab.tsx src/modules/EspaceClient/admin/components/ActivityTab.tsx src/modules/EspaceClient/admin/components/DocumentsTab.tsx src/modules/EspaceClient/admin/components/SignaturesTab.tsx src/modules/EspaceClient/admin/components/ProjectStepsTab.tsx
git commit -m "style(f1): re-skin CRM-dark — lot B (onglets panneau client)"
```

**🔍 Checkpoint** — Lyes ouvre un panneau client et parcourt les 6 onglets en CRM-dark.

### Task 10 : Lot C — dialogs, sheets & formulaires (9 fichiers + garde)

**Files (Modify):**
- `src/modules/EspaceClient/admin/components/ActivatePortalDialog.tsx`
- `src/modules/EspaceClient/admin/components/DeactivatePortalDialog.tsx`
- `src/modules/EspaceClient/admin/components/DisqualifyLeadDialog.tsx`
- `src/modules/EspaceClient/admin/components/LeadDetailSheet.tsx`
- `src/modules/EspaceClient/admin/components/AdminProjectStepForm.tsx`
- `src/modules/EspaceClient/admin/components/AdminDocumentUpload.tsx`
- `src/modules/EspaceClient/admin/components/AdminSignatureForm.tsx`
- `src/modules/EspaceClient/admin/components/AdminInvoiceForm.tsx`
- `src/modules/EspaceClient/admin/components/AdminDocumentEditDialog.tsx`
- `src/modules/EspaceClient/admin/PropulspaceAdminGuard.tsx` (3 occ. résiduelles : loader/forbidden)

- [ ] **Step 1 : Appliquer la table.**

⚠️ **Vigilance dialogs Radix** : ces dialogs/sheets se montent dans un **portail au niveau `<body>`**, hors du conteneur `.propulspace-portal.ps-theme-dark`. Vérifier que chaque `DialogContent`/`SheetContent` porte bien la classe `propulspace-portal ps-theme-dark` (ou les classes de surface CRM en dur) **sur sa propre racine**, sinon il s'affichera en clair par-dessus le CRM sombre. Si une de ces racines ne porte que `propulspace-portal`, lui ajouter `ps-theme-dark`.

- [ ] **Step 2 : Vérifier**

Run: `npx tsc -b --noEmit && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 3 : Commit**

```bash
git add src/modules/EspaceClient/admin/components/ActivatePortalDialog.tsx src/modules/EspaceClient/admin/components/DeactivatePortalDialog.tsx src/modules/EspaceClient/admin/components/DisqualifyLeadDialog.tsx src/modules/EspaceClient/admin/components/LeadDetailSheet.tsx src/modules/EspaceClient/admin/components/AdminProjectStepForm.tsx src/modules/EspaceClient/admin/components/AdminDocumentUpload.tsx src/modules/EspaceClient/admin/components/AdminSignatureForm.tsx src/modules/EspaceClient/admin/components/AdminInvoiceForm.tsx src/modules/EspaceClient/admin/components/AdminDocumentEditDialog.tsx src/modules/EspaceClient/admin/PropulspaceAdminGuard.tsx
git commit -m "style(f1): re-skin CRM-dark — lot C (dialogs, sheets & formulaires)"
```

**🔍 Checkpoint** — Lyes ouvre une modale d'activation de portail + le sheet de détail lead : pas d'îlot clair.

---

## Phase 4 — Finitions & Definition of Done

### Task 11 : Chasse aux résidus clairs + double-thème

**Files:** transverse (tout `src/modules/EspaceClient/admin/`)

- [ ] **Step 1 : Grep de contrôle « zéro brut résiduel »**

Run: `rg -n "(bg|text|border|divide|ring|from|to|via)-(white|black|gray|zinc|slate|neutral|violet|purple)-?[0-9]*" src/modules/EspaceClient/admin`
Expected: aucune occurrence neutre/violette résiduelle (les sémantiques `red/emerald/amber/sky` adaptées restent normales). Corriger ce qui dépasse selon la table.

- [ ] **Step 2 : Vérifier l'isolation des thèmes**

Run: `npx tsc -b --noEmit && npm run lint && npm run build && npm test`
Expected: tout PASS (les 11 specs Vitest restent vertes).

- [ ] **Step 3 : Commit (si correctifs)**

```bash
git add -A
git commit -m "style(f1): nettoyage des résidus de thème clair dans l'admin"
```

### Task 12 : Smoke test Definition of Done (validation Lyes)

- [ ] **Step 1 : Checklist navigateur** (par Lyes — `npm run dev`, http://localhost:5173) :
  - [ ] Onglet « Portails clients » dans le CRM → `/portails/clients` + panneau 6 onglets + `/portails/leads`, **dans le shell CRM, en CRM-dark cohérent** (zéro îlot clair).
  - [ ] **Tous les onglets CRM intacts** (Dashboard, Projets, CRM, Procédures, Compta, Paramètres) — aucune régression de nav ni de thème.
  - [ ] **Portail CLIENT inchangé** (`/espace-client/*` toujours clair).
  - [ ] `/admin/propulspace` direct **toujours fonctionnel** (thème clair, navigation OK).
  - [ ] Un compte **sales** ne voit PAS l'onglet Portails et est rejeté s'il force `/portails`.
  - [ ] Liens profonds : naviguer dans `/portails` reste sous `/portails` (jamais de saut vers `/admin/propulspace`).

- [ ] **Step 2 : Finalisation de branche**

Quand la checklist est verte, utiliser la skill `superpowers:finishing-a-development-branch` pour décider du merge/PR. Mémo mémoire : redeploy Coolify à déclencher à la main après merge.

---

## Self-Review (effectuée à l'écriture)

**1. Couverture spec :**
- §3 « Entrée nav Portails » → Task 7 (Sidebar). ✓
- §3 « Monter les pages admin comme module » → Tasks 3, 7. ✓
- §3 « Re-skin CRM-dark + 73 occ. Tailwind » → Phase 3 (réévalué à **314 occ.**, cf. dimensionnement). ✓
- §3 « Garder `/admin/propulspace` fonctionnel » → Task 3 (basePath par défaut) + App.tsx inchangé. ✓
- §4.1 « 2ᵉ porte `/portails`, garde réutilisée, zéro DB » → Tasks 5-7. ✓
- §4.2 « scope sombre + neutraliser `useForcePortalSurface('light')` » → Tasks 4-5 (`ps-theme-dark` + surface `'none'`). ✓
- §4.2 « corriger `PortalStateCard` » → Task 8 + note table. ✓
- §6 « ne pas exposer aux rôles non autorisés » → Task 7 (sidebar roles) + garde. ✓
- §6 « dialogs Radix / fuite de thème » → Task 10 Step 1. ✓

**2. Placeholders :** aucun « TODO/à compléter ». La Phase 3 référence une table explicite + des exemples avant/après représentatifs (les 314 remplacements sont mécaniques, pas un par un dans le doc — choix assumé pour la lisibilité).

**3. Cohérence des types/symboles :** `useAdminBasePath()` retourne `{ basePath, mountedInShell }` partout ; `AdminRoutesShell({ basePath, mountedInShell })` ; `useForcePortalSurface('none')` ; `canAccessPage(item)` (signature changée — les 2 appelants mis à jour en Task 7).

## Écart de dimensionnement vs spec
La spec annonçait « ~73 occurrences / 24 fichiers » ; l'audit réel donne **314 occurrences / 25 fichiers** (seuls ~13 % du style admin sont tokenisés). Conséquence : la **Phase 3 est le gros du travail** et peut être exécutée en **fan-out multi-agents** (un agent par lot A/B/C avec la table commune + un agent de revue de cohérence) si l'on veut accélérer. Les Phases 1-2 restent séquentielles et faites main.
