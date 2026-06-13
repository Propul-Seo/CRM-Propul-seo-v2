# Propul'Space V0 — Fondations (design system) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser le contrat de design system theme-aware (clair portail + sombre admin), câbler Space Grotesk, compléter les tokens sémantiques, et créer la couche de composants partagés — sans changer le comportement fonctionnel.

**Architecture:** Les utilitaires `.ps-*` et les tokens vivent déjà sous `.propulspace-portal` dans `portal-theme.css`. On garde ce scope comme **scope de composants** (light par défaut) et on ajoute un **modificateur de thème `.ps-theme-dark`** qui ne ré-override QUE les valeurs des variables `--ps-*` → tous les utilitaires existants fonctionnent en sombre sans duplication. L'admin reçoit `propulspace-portal ps-theme-dark`. Nouveaux composants partagés (`Skeleton`, `Alert`, `Metric`, `KpiBlock`) ne consomment que `var(--ps-*)` → automatiquement clairs ou sombres selon le scope parent.

**Tech Stack:** React 18 + TypeScript, Tailwind (classes arbitraires `bg-[var(--ps-*)]`), CSS scoped (`portal-theme.css`), Lucide, Google Fonts.

**Vérification (ce repo n'a pas de test runner — R-007) :** chaque tâche se vérifie par `npx tsc --noEmit` (exit 0), `npm run lint` (0 nouvelle erreur), et un contrôle visuel navigateur (serveur dev déjà lancé sur `:5173`, bouton « Connexion démo » pour le portail, login `team@propulseo-site.com` pour l'admin). Les nouveaux composants (Skeleton/Alert/Metric/KpiBlock) n'ont pas encore de consommateur en V0 : leur gate est `tsc` + résolution des exports ; leur vérif visuelle réelle arrive en V1 quand ils remplacent l'ad-hoc.

**Note commits :** chaque commit doit finir par le trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` (exigence d'environnement). Omis des exemples ci-dessous pour la lisibilité.

**Reconciliation spec ↔ code existant :**
- Le token de surface s'appelle `--ps-bg-elevated` (pas `--ps-surface`). On garde `--ps-bg-elevated`.
- `--ps-warning` vaut `#EA580C` (on conserve), on ajoute juste le palier `-text`.
- L'infra de traduction FR des statuts (`STATUS_MAP`, `StatusBadge`) existe déjà dans `Badge.tsx` — V0 ne fait que tokeniser les couleurs.

---

## File Structure

| Fichier | Responsabilité | Action |
|---|---|---|
| `index.html` | Chargement des polices Google Fonts | Modify (ajouter Space Grotesk) |
| `src/modules/EspaceClient/shared/layouts/portal-theme.css` | Tokens + utilitaires + thème sombre | Modify (font display, `-text`, `ps-metric`, `.ps-theme-dark`, `ps-dark-surface`) |
| `src/modules/EspaceClient/shared/hooks/useForcePortalSurface.ts` | Forçage du fond html (clair/sombre) | Create (généralise `useForceLightTheme`) |
| `src/modules/EspaceClient/shared/hooks/useForceLightTheme.ts` | Compat existante | Modify (déléguer au nouveau hook) |
| `src/modules/EspaceClient/admin/PropulspaceAdminGuard.tsx` | Scope + surface de l'admin | Modify (passer en sombre) |
| `src/modules/EspaceClient/shared/components/Badge.tsx` | Pastilles statut | Modify (tons → tokens) |
| `src/modules/EspaceClient/shared/components/Skeleton.tsx` | État de chargement shimmer | Create |
| `src/modules/EspaceClient/shared/components/Alert.tsx` | Bandeau danger/warning/success/info | Create |
| `src/modules/EspaceClient/shared/components/Metric.tsx` | Chiffre Space Grotesk tabular-nums | Create |
| `src/modules/EspaceClient/shared/components/KpiBlock.tsx` | Bloc KPI unifié à filets | Create |
| `src/modules/EspaceClient/shared/components/index.ts` | Barrel d'exports | Modify (4 nouveaux exports) |

---

## Task 1: Polices — Space Grotesk + token display + `ps-metric`

**Files:**
- Modify: `index.html:16`
- Modify: `src/modules/EspaceClient/shared/layouts/portal-theme.css:94-96` (bloc TYPE) et `:122-131` (classes type)

- [ ] **Step 1: Ajouter Space Grotesk au `<link>` Google Fonts**

Dans `index.html`, remplacer la ligne 16 par :

```html
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Déclarer le token `--ps-font-display`**

Dans `portal-theme.css`, dans le bloc TYPE (après la ligne `--ps-font-sans: ...;`), ajouter :

```css
  --ps-font-display: 'Space Grotesk', 'Inter', system-ui, sans-serif;
```

- [ ] **Step 3: Appliquer la police display aux titres + créer `ps-metric`**

Dans `portal-theme.css`, juste après la ligne `.propulspace-portal .ps-num { ... }` (≈ ligne 131), ajouter :

```css
.propulspace-portal .ps-display,
.propulspace-portal .ps-h1,
.propulspace-portal .ps-h2,
.propulspace-portal .ps-h3 { font-family: var(--ps-font-display); }
.propulspace-portal .ps-metric {
  font-family: var(--ps-font-display);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
  font-size: 26px; line-height: 1; font-weight: 600; letter-spacing: -0.02em;
}
```

- [ ] **Step 4: Vérifier le build**

Run: `npx tsc --noEmit`
Expected: exit 0 (aucune erreur)

- [ ] **Step 5: Vérifier visuellement**

Avec le serveur dev (`:5173`), ouvrir `/espace-client/login` → bouton « Connexion démo » → le titre « Bon retour, Boulangerie » doit s'afficher en Space Grotesk (grotesk géométrique). Aucune erreur console.

- [ ] **Step 6: Commit**

```bash
git add index.html src/modules/EspaceClient/shared/layouts/portal-theme.css
git commit -m "feat(propulspace): police Space Grotesk sur les titres + classe ps-metric"
```

---

## Task 2: Tokens sémantiques — palier `-text` (thème clair)

**Files:**
- Modify: `src/modules/EspaceClient/shared/layouts/portal-theme.css:51-55` (bloc SEMANTIC)

- [ ] **Step 1: Ajouter les variables `-text` + un gradient succès unique**

Dans `portal-theme.css`, remplacer le bloc SEMANTIC (lignes 51-55) par :

```css
  /* ─── SEMANTIC ─────────────────────────────────────────── */
  --ps-success: #16A34A;  --ps-success-subtle: #DCFCE7;  --ps-success-text: #15803D;
  --ps-warning: #EA580C;  --ps-warning-subtle: #FFEDD5;  --ps-warning-text: #B45309;
  --ps-danger:  #DC2626;  --ps-danger-subtle:  #FEE2E2;  --ps-danger-text:  #B91C1C;
  --ps-info:    #2563EB;  --ps-info-subtle:    #DBEAFE;  --ps-info-text:    #1D4ED8;
  --ps-success-gradient: linear-gradient(135deg, #16A34A 0%, #15803D 100%);
```

- [ ] **Step 2: Vérifier le build**

Run: `npx tsc --noEmit`
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add src/modules/EspaceClient/shared/layouts/portal-theme.css
git commit -m "feat(propulspace): compléter les tokens sémantiques (-text) + gradient succès unique"
```

---

## Task 3: Thème sombre admin — overrides `.ps-theme-dark`

**Files:**
- Modify: `src/modules/EspaceClient/shared/layouts/portal-theme.css` (ajout après le bloc `.propulspace-portal { ... }`, ≈ ligne 114)

- [ ] **Step 1: Ajouter le bloc de valeurs sombres**

Dans `portal-theme.css`, juste après la fermeture `}` du sélecteur `.propulspace-portal { ... }` (la grande déclaration de tokens + root styles, ≈ ligne 114) et avant `.propulspace-portal * { ... }`, insérer :

```css
/* ─── DARK THEME MODIFIER (back-office admin) ──────────────
   Ne ré-override QUE les valeurs des variables --ps-*. Tous les
   utilitaires .ps-* (définis sous .propulspace-portal) héritent
   automatiquement via var(). Appliqué sur la racine admin :
   <div class="propulspace-portal ps-theme-dark">. */
.propulspace-portal.ps-theme-dark {
  --ps-bg: #0A0A0B;
  --ps-bg-elevated: #161618;
  --ps-bg-subtle: #202023;
  --ps-bg-frosted: rgba(22, 22, 24, 0.72);
  --ps-background: var(--ps-bg);
  --ps-background-elevated: var(--ps-bg-elevated);
  --ps-background-subtle: var(--ps-bg-subtle);

  --ps-fg: #FAFAFA;
  --ps-fg-secondary: #A1A1AA;
  --ps-fg-muted: #71717A;
  --ps-text-primary: var(--ps-fg);
  --ps-text-secondary: var(--ps-fg-secondary);
  --ps-text-muted: var(--ps-fg-muted);

  --ps-primary: #8B5CF6;
  --ps-primary-hover: #A78BFA;
  --ps-primary-deep: #6D28D9;
  --ps-primary-text: #C4B5FD;
  --ps-primary-subtle: rgba(139, 92, 246, 0.14);

  --ps-success-subtle: rgba(22, 163, 74, 0.16);  --ps-success-text: #4ADE80;
  --ps-warning-subtle: rgba(234, 88, 12, 0.16);  --ps-warning-text: #FB923C;
  --ps-danger-subtle:  rgba(220, 38, 38, 0.16);  --ps-danger-text:  #F87171;
  --ps-info-subtle:    rgba(37, 99, 235, 0.16);  --ps-info-text:    #60A5FA;

  --ps-border: #27272A;
  --ps-border-soft: #1F1F22;
  --ps-border-strong: #3F3F46;
  --ps-shadow-card:     0 1px 2px rgba(0,0,0,.40), 0 1px 3px rgba(0,0,0,.30);
  --ps-shadow-raised:   0 6px 16px -4px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.04);
  --ps-shadow-floating: 0 18px 44px -12px rgba(0,0,0,.65);

  color-scheme: dark;
  color: var(--ps-fg);
  background:
    radial-gradient(ellipse 90% 60% at 50% -10%, rgba(139, 92, 246, 0.10), transparent 60%),
    var(--ps-bg);
}
```

- [ ] **Step 2: Forcer le fond html sombre quand l'admin est monté**

Dans `portal-theme.css`, juste après le bloc `html.ps-light-surface ...` (lignes 17-21), ajouter :

```css
html.ps-dark-surface,
html.ps-dark-surface body,
html.ps-dark-surface #root {
  background: #0A0A0B !important;
}
```

- [ ] **Step 3: Vérifier le build**

Run: `npx tsc --noEmit`
Expected: exit 0 (CSS pur, pas de TS touché — le build doit rester vert)

- [ ] **Step 4: Commit**

```bash
git add src/modules/EspaceClient/shared/layouts/portal-theme.css
git commit -m "feat(propulspace): thème sombre admin via modificateur .ps-theme-dark + surface ps-dark-surface"
```

---

## Task 4: Câbler la surface sombre de l'admin

**Files:**
- Create: `src/modules/EspaceClient/shared/hooks/useForcePortalSurface.ts`
- Modify: `src/modules/EspaceClient/shared/hooks/useForceLightTheme.ts`
- Modify: `src/modules/EspaceClient/admin/PropulspaceAdminGuard.tsx`

- [ ] **Step 1: Créer le hook généralisé**

Create `src/modules/EspaceClient/shared/hooks/useForcePortalSurface.ts` :

```ts
import { useEffect } from 'react';

type Surface = 'light' | 'dark';

// Force le chrome de page (html/body/#root) en clair OU sombre pendant le
// montage. Mémorise l'état initial pour le restaurer fidèlement au démontage.
// Le CRM pose `dark` + un fond sombre dans :root ; les contextes Propul'Space
// (portail clair / admin sombre) ont besoin de poser leur propre surface.
export function useForcePortalSurface(surface: Surface = 'light') {
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    const surfaceClass = surface === 'dark' ? 'ps-dark-surface' : 'ps-light-surface';
    html.classList.remove('dark');
    html.classList.add(surfaceClass);
    return () => {
      html.classList.remove(surfaceClass);
      if (hadDark) html.classList.add('dark');
    };
  }, [surface]);
}
```

- [ ] **Step 2: Faire déléguer l'ancien hook (compat)**

Remplacer tout le contenu de `src/modules/EspaceClient/shared/hooks/useForceLightTheme.ts` par :

```ts
import { useForcePortalSurface } from './useForcePortalSurface';

// Conservé pour compat : tous les contextes clairs (portail, qualif) l'utilisent.
export function useForceLightTheme() {
  useForcePortalSurface('light');
}
```

- [ ] **Step 3: Basculer l'admin en sombre**

Dans `PropulspaceAdminGuard.tsx` :

Remplacer l'import du hook (ligne 5) :

```tsx
import { useForcePortalSurface } from '@/modules/EspaceClient/shared/hooks/useForcePortalSurface';
```

Remplacer l'appel (ligne 16) `useForceLightTheme();` par :

```tsx
  useForcePortalSurface('dark');
```

Remplacer le `return` final (ligne 48) par :

```tsx
  return <div className="propulspace-portal ps-theme-dark min-h-screen bg-[var(--ps-bg)] text-[var(--ps-fg)]">{children}</div>;
```

> NB : les écrans loading/forbidden (lignes 19-43) restent en `propulspace-portal` clair — c'est volontaire (états transitoires neutres). Optionnel : leur ajouter `ps-theme-dark` aussi pour cohérence ; non bloquant pour V0.

- [ ] **Step 4: Vérifier le build**

Run: `npx tsc --noEmit`
Expected: exit 0

- [ ] **Step 5: Vérifier visuellement l'admin en sombre**

Se connecter en admin (`team@propulseo-site.com`) → `/admin/propulspace/clients`. Le fond doit être **sombre** (#0A0A0B), les surfaces `ps-surface` sombres, le texte clair. Vérifier qu'aucun « flash blanc » ne persiste et que le retour vers le CRM restaure bien le thème sombre du CRM.

- [ ] **Step 6: Commit**

```bash
git add src/modules/EspaceClient/shared/hooks/useForcePortalSurface.ts src/modules/EspaceClient/shared/hooks/useForceLightTheme.ts src/modules/EspaceClient/admin/PropulspaceAdminGuard.tsx
git commit -m "feat(propulspace): back-office admin en thème sombre (useForcePortalSurface + ps-theme-dark)"
```

---

## Task 5: Centraliser les tons de Badge sur les tokens

**Files:**
- Modify: `src/modules/EspaceClient/shared/components/Badge.tsx:12-28`

- [ ] **Step 1: Remplacer les tons Tailwind bruts par les tokens**

Dans `Badge.tsx`, remplacer les deux maps `TONES` (lignes 12-19) et `DOTS` (lignes 21-28) par :

```tsx
const TONES: Record<BadgeTone, string> = {
  violet: 'bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)]',
  green:  'bg-[var(--ps-success-subtle)] text-[var(--ps-success-text)]',
  amber:  'bg-[var(--ps-warning-subtle)] text-[var(--ps-warning-text)]',
  red:    'bg-[var(--ps-danger-subtle)] text-[var(--ps-danger-text)]',
  blue:   'bg-[var(--ps-info-subtle)] text-[var(--ps-info-text)]',
  gray:   'bg-[var(--ps-bg-subtle)] text-[var(--ps-fg-secondary)]',
};

const DOTS: Record<BadgeTone, string> = {
  violet: 'bg-[var(--ps-primary)]',
  green:  'bg-[var(--ps-success)]',
  amber:  'bg-[var(--ps-warning)]',
  red:    'bg-[var(--ps-danger)]',
  blue:   'bg-[var(--ps-info)]',
  gray:   'bg-[var(--ps-fg-muted)]',
};
```

- [ ] **Step 2: Vérifier le build**

Run: `npx tsc --noEmit`
Expected: exit 0

- [ ] **Step 3: Vérifier visuellement (clair + sombre)**

Portail (démo) : les badges de statut (ex. « En retard » rouge, « Envoyée » bleu) gardent le même rendu clair. Admin (sombre) : les mêmes badges via `StatusBadge` doivent être **lisibles sur fond sombre** (teintes `-subtle` translucides + texte `-text` éclairci) — preuve que la tokenisation rend Badge theme-aware.

- [ ] **Step 4: Commit**

```bash
git add src/modules/EspaceClient/shared/components/Badge.tsx
git commit -m "refactor(propulspace): Badge — tons sur tokens sémantiques (theme-aware clair/sombre)"
```

---

## Task 6: Composant `<Skeleton>`

**Files:**
- Create: `src/modules/EspaceClient/shared/components/Skeleton.tsx`
- Modify: `src/modules/EspaceClient/shared/components/index.ts`

- [ ] **Step 1: Créer le composant**

Create `src/modules/EspaceClient/shared/components/Skeleton.tsx` :

```tsx
interface SkeletonProps {
  /** Classes Tailwind de dimensionnement/forme (ex. "h-4 w-32 rounded-md"). */
  className?: string;
}

// Bloc de chargement shimmer. S'appuie sur l'utilitaire .ps-skeleton du
// portal-theme.css (dégradé violet animé). À composer pour reproduire la forme
// du contenu en cours de chargement plutôt qu'un « Chargement… » textuel.
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden="true" className={`ps-skeleton ${className}`} />;
}
```

- [ ] **Step 2: Exporter depuis le barrel**

Dans `index.ts`, ajouter après la ligne `export { EmptyState } from './EmptyState';` :

```ts
export { Skeleton } from './Skeleton';
```

- [ ] **Step 3: Vérifier le build + résolution d'export**

Run: `npx tsc --noEmit`
Expected: exit 0 (l'export `Skeleton` se résout)

- [ ] **Step 4: Commit**

```bash
git add src/modules/EspaceClient/shared/components/Skeleton.tsx src/modules/EspaceClient/shared/components/index.ts
git commit -m "feat(propulspace): composant Skeleton partagé (ps-skeleton)"
```

---

## Task 7: Composant `<Alert>`

**Files:**
- Create: `src/modules/EspaceClient/shared/components/Alert.tsx`
- Modify: `src/modules/EspaceClient/shared/components/index.ts`

- [ ] **Step 1: Créer le composant**

Create `src/modules/EspaceClient/shared/components/Alert.tsx` :

```tsx
import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react';

export type AlertVariant = 'danger' | 'warning' | 'success' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}

const ICONS: Record<AlertVariant, LucideIcon> = {
  danger: XCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

const WRAP: Record<AlertVariant, string> = {
  danger:  'bg-[var(--ps-danger-subtle)] text-[var(--ps-danger-text)]',
  warning: 'bg-[var(--ps-warning-subtle)] text-[var(--ps-warning-text)]',
  success: 'bg-[var(--ps-success-subtle)] text-[var(--ps-success-text)]',
  info:    'bg-[var(--ps-info-subtle)] text-[var(--ps-info-text)]',
};

// Bandeau d'état unifié (tokens sémantiques + icône Lucide). Remplace les
// `bg-red-50` ad-hoc du portail et de l'admin. Theme-aware (clair/sombre).
export function Alert({ variant = 'info', title, children, action }: AlertProps) {
  const Icon = ICONS[variant];
  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-[var(--ps-radius-input)] px-3.5 py-2.5 text-[13px] ${WRAP[variant]}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} />
      <div className="min-w-0 flex-1 leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Exporter depuis le barrel**

Dans `index.ts`, ajouter après la ligne `export { Skeleton } from './Skeleton';` :

```ts
export { Alert, type AlertVariant } from './Alert';
```

- [ ] **Step 3: Vérifier le build**

Run: `npx tsc --noEmit`
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add src/modules/EspaceClient/shared/components/Alert.tsx src/modules/EspaceClient/shared/components/index.ts
git commit -m "feat(propulspace): composant Alert unifié (tokens sémantiques + icône Lucide)"
```

---

## Task 8: Composants `<Metric>` et `<KpiBlock>`

**Files:**
- Create: `src/modules/EspaceClient/shared/components/Metric.tsx`
- Create: `src/modules/EspaceClient/shared/components/KpiBlock.tsx`
- Modify: `src/modules/EspaceClient/shared/components/index.ts`

- [ ] **Step 1: Créer `Metric`**

Create `src/modules/EspaceClient/shared/components/Metric.tsx` :

```tsx
import type { ReactNode } from 'react';

interface MetricProps {
  value: ReactNode;
  /** Classes additionnelles (couleur, taille si dérogation ponctuelle). */
  className?: string;
}

// Valeur chiffrée premium : Space Grotesk + tabular-nums via la classe
// .ps-metric (échelle fixe partagée par tous les KPI).
export function Metric({ value, className = '' }: MetricProps) {
  return <span className={`ps-metric ${className}`}>{value}</span>;
}
```

- [ ] **Step 2: Créer `KpiBlock`**

Create `src/modules/EspaceClient/shared/components/KpiBlock.tsx` :

```tsx
import type { ReactNode } from 'react';

export interface KpiBlockItem {
  eyebrow: string;
  value: ReactNode;
  delta?: ReactNode;
}

interface KpiBlockProps {
  items: KpiBlockItem[];
}

// Bloc KPI unifié : une seule surface, colonnes séparées par des filets fins
// (remplace les cards KPI flottantes). Flex + divide-x → supporte 2 à 4 KPI
// sans hardcoder le nombre de colonnes.
export function KpiBlock({ items }: KpiBlockProps) {
  return (
    <div className="ps-surface flex divide-x divide-[var(--ps-border-soft)] overflow-hidden">
      {items.map((it, i) => (
        <div key={i} className="min-w-0 flex-1 px-5 py-4">
          <p className="ps-eyebrow ps-eyebrow-muted">{it.eyebrow}</p>
          <p className="mt-2 truncate text-[var(--ps-fg)]">
            <span className="ps-metric">{it.value}</span>
          </p>
          {it.delta && <p className="mt-1 text-[12px] text-[var(--ps-fg-muted)]">{it.delta}</p>}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Exporter depuis le barrel**

Dans `index.ts`, ajouter après la ligne `export { Alert, type AlertVariant } from './Alert';` :

```ts
export { Metric } from './Metric';
export { KpiBlock, type KpiBlockItem } from './KpiBlock';
```

- [ ] **Step 4: Vérifier le build**

Run: `npx tsc --noEmit`
Expected: exit 0

- [ ] **Step 5: Commit**

```bash
git add src/modules/EspaceClient/shared/components/Metric.tsx src/modules/EspaceClient/shared/components/KpiBlock.tsx src/modules/EspaceClient/shared/components/index.ts
git commit -m "feat(propulspace): composants Metric + KpiBlock (bloc KPI unifié)"
```

---

## Task 9: Migration des alias de tokens legacy

**Files:**
- Modify (mécanique, multi-fichiers sous `src/modules/EspaceClient/**`)
- Modify: `src/modules/EspaceClient/shared/layouts/portal-theme.css:30-33,40-42` (retrait des alias une fois la migration faite)

Mapping canonique (long-form legacy → short-form) :

| Legacy | Canonique |
|---|---|
| `--ps-background-subtle` | `--ps-bg-subtle` |
| `--ps-background-elevated` | `--ps-bg-elevated` |
| `--ps-background` | `--ps-bg` |
| `--ps-text-primary` | `--ps-fg` |
| `--ps-text-secondary` | `--ps-fg-secondary` |
| `--ps-text-muted` | `--ps-fg-muted` |

- [ ] **Step 1: Recenser les usages**

Run (Grep tool, ou) :
```bash
grep -rnE "ps-(background|text-(primary|secondary|muted))" src/modules/EspaceClient --include=*.tsx --include=*.ts --include=*.css
```
Expected: liste des occurrences à migrer (hors les définitions d'alias dans `portal-theme.css`).

- [ ] **Step 2: Remplacer dans chaque fichier listé**

Pour chaque occurrence trouvée à l'étape 1, appliquer le mapping ci-dessus (remplacer la variable longue par sa version courte dans les classes `bg-[var(--...)]` / `text-[var(--...)]`). Respecter l'ordre du tableau (les préfixes longs d'abord : `--ps-background-subtle` avant `--ps-background`) pour éviter les remplacements partiels.

- [ ] **Step 3: Retirer les blocs d'alias du CSS**

Dans `portal-theme.css`, supprimer les lignes des alias legacy :
- bloc `/* legacy aliases */` (lignes 30-33) : `--ps-background`, `--ps-background-elevated`, `--ps-background-subtle`.
- lignes 40-42 : `--ps-text-primary`, `--ps-text-secondary`, `--ps-text-muted`.

Et, dans le bloc `.ps-theme-dark` créé en Task 3, supprimer de même les 6 lignes d'alias legacy (`--ps-background*` / `--ps-text-*`) devenues inutiles.

- [ ] **Step 4: Vérifier qu'il ne reste aucune référence legacy**

Run:
```bash
grep -rnE "ps-(background|text-(primary|secondary|muted))" src/modules/EspaceClient --include=*.tsx --include=*.ts
```
Expected: aucun résultat (0 occurrence) hors `portal-theme.css` (qui ne doit plus en contenir non plus après Step 3).

- [ ] **Step 5: Build + lint complets**

Run: `npx tsc --noEmit && npm run lint`
Expected: exit 0, aucune nouvelle erreur de lint.

- [ ] **Step 6: Vérifier visuellement (portail clair + admin sombre)**

Aucun changement visuel attendu (même valeurs, noms différents). Vérifier le portail (démo) et l'admin (sombre) : surfaces, textes, espacements identiques à avant la migration.

- [ ] **Step 7: Commit**

```bash
git add src/modules/EspaceClient
git commit -m "refactor(propulspace): migrer les alias de tokens legacy vers le short-form canonique"
```

---

## Self-Review (couverture spec §3-§6)

- **§3 Architecture theme-aware** → Tasks 3+4 (`.ps-theme-dark` + surface sombre + Guard). ✅
- **§4.1 Accent / §4.2 Neutres (clair+sombre)** → Task 3 (sombre), valeurs claires déjà présentes. ✅
- **§4.3 Sémantique `-text` + gradient succès** → Task 2 (clair) + Task 3 (sombre). ✅
- **§4.4 Typo Space Grotesk + `ps-metric`** → Task 1. ✅
- **§4.5 Ombres sombres** → Task 3. ✅
- **§6 Composants partagés** : `Skeleton` (T6), `Alert` (T7), `Badge` centralisé (T5), `KpiBlock` + `Metric` (T8). ✅
- **§6 Migration alias legacy** → Task 9. ✅
- **Hors V0 (rappel)** : suppression de `ps-gradient-text` sur les titres, rainbow, emojis, fix `h-13`, traduction FR appliquée aux écrans, footer/WhatsApp = **V1** (transverse). EmptyState premium, KPI unifiés branchés dans les pages, wizard scope, ThankYou = **V2**. Drag/recherche/motion = **V3**.

**Type consistency :** `useForcePortalSurface(surface)` (T4) ré-utilisé par `useForceLightTheme` (T4) ; classes `ps-metric` (T1) consommées par `Metric`/`KpiBlock` (T8) ; tokens `-text` (T2) consommés par `Badge` (T5) et `Alert` (T7) ; `--ps-bg-subtle` (canonique) cohérent entre Badge.gray (T5) et KpiBlock divide (T8). Cohérent.
