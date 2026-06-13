# Propul'Space — Refonte UI/UX premium (Design / DA)

> Spec de direction artistique + roadmap. Issue d'un audit multi-agents (5 surfaces, ~50 findings) et d'un brainstorming validé le 2026-06-05.
> Cette spec définit **le contrat** (tokens + lois DS + composants) et **la roadmap en 4 vagues**. Le détail d'implémentation de chaque vague vivra dans un plan dédié (`docs/superpowers/plans/`).

## 1. Contexte & objectif

Propul'Space (portail client + back-office admin + qualification publique + welcome wizard) possède déjà ~70 % d'un excellent design system (tokens `--ps-*`, échelle typo sémantique, ombres calibrées, motion accessible, isolation de thème). Ce qui le fait paraître « moyen » : **adoption inégale** du DS (≈50 % du produit code en Tailwind brut) + **4 tells AI récurrents** (rainbow gradient, gradient-text sur tous les titres, emojis-icônes, états vides cassés/pauvres).

**Objectif** : rendu **premium** (références Linear / Stripe / Vercel), cohérent, sans casser l'existant fonctionnel (qui est mature : loading/error/empty distincts, polling Stripe, persistance de brouillon, a11y de base).

## 2. Décisions validées (brainstorming)

| Décision | Choix |
|---|---|
| **Direction — Portail client** (+ qualif + wizard, surfaces client) | **B « Aurora Raffiné »** : thème **clair**, mono-violet discipliné, atmosphère Aurora confinée au fond + UN moment hero. |
| **Direction — Back-office admin** | **C « Dark-Tech Precision »** : thème **sombre**, aligné sur le CRM dark, accent violet neon, densité data. |
| **Typographie** | Titres + chiffres en **Space Grotesk** ; corps en **Inter**. Valable en clair (portail) et sombre (admin). |
| **Séquencement** | **Fondations d'abord** (tokens + composants), puis tells transverses, puis surface par surface, puis interactions. |
| **Périmètre** | **Visuel + contenu + interactions** (le plus large) : apparence, corrections de contenu non-fini, et micro-interactions fonctionnelles. |

## 3. Architecture « theme-aware » (la clé)

Aujourd'hui l'admin **force** le thème clair par-dessus le CRM dark (`ps-light-surface`). On remplace ce modèle par **deux scopes, mêmes noms de tokens, valeurs différentes** :

```
.propulspace-portal   →  jeu de tokens --ps-*  CLAIR  (B Aurora)      [existant, à raffiner]
.propulspace-admin    →  jeu de tokens --ps-*  SOMBRE (C Dark-Tech)   [nouveau]
```

- Les **composants partagés** (`Hero`, `KpiTile`, `Badge`, `EmptyState`, `Skeleton`, `Alert`, `StatusBadge`, `ActivityRow`, `TimelineStep`…) ne référencent **que** `var(--ps-*)` (aucune couleur Tailwind brute, aucune valeur en dur). Ils héritent donc automatiquement du thème du scope parent → **clairs dans le portail, sombres dans l'admin, zéro duplication**.
- Le scope `.propulspace-admin` remplace le forçage `ps-light-surface` : il pose un fond sombre opaque (le CRM dark reste en dessous, mais l'admin a son propre fond). Restauration propre au démontage (même mécanisme que l'actuel).
- Conséquence migration : tout le panneau admin (AdminClientsPage, ClientHealthRow, tabs, scaffolds, `PortalStateCard`/`PortalStatusSection`) doit **abandonner les classes Tailwind brutes** (`gray-*`, `violet-*`, `emerald-50`, hex en dur du thème dark) au profit des `--ps-*`. C'est cette migration qui répare aussi le **bug de lisibilité** actuel (`PortalStateCard` codé dark, rendu sur blanc).

## 4. Le contrat de tokens (cible)

Toutes scoped. Les valeurs « clair » raffinent `portal-theme.css` existant ; les valeurs « sombre » sont nouvelles. À ajuster finement contre le CSS réel pendant V0.

### 4.1 Accent (mono-violet, verrouillé)

| Token | Portail (clair) | Admin (sombre) |
|---|---|---|
| `--ps-primary` | `#7C3AED` | `#8B5CF6` (neon, aligné CRM) |
| `--ps-primary-hover` | `#6D28D9` | `#A78BFA` |
| `--ps-primary-active` | `#5B21B6` | `#7C3AED` |
| `--ps-primary-subtle` | `#EDE9FE` | `rgba(139,92,246,.14)` |
| `--ps-primary-text` | `#5B21B6` | `#C4B5FD` |
| `--ps-primary-border` | `#DDD6FE` | `rgba(139,92,246,.30)` |
| `--ps-brand-gradient` | **mono** `linear-gradient(135deg,#7C3AED→#5B21B6)` | `linear-gradient(135deg,#8B5CF6→#6D28D9)` |

> **Loi** : `--ps-brand-gradient` est la **seule** source de dégradé de marque. Interdits en lint/convention dans les 2 scopes : `via-pink`, `to-amber`, `from-sky`, et tout dégradé multi-teintes.

### 4.2 Neutres (zinc exclusif — supprimer le `gray-*` Tailwind)

| Token | Portail (clair) | Admin (sombre) |
|---|---|---|
| `--ps-fg` | `#18181B` | `#FAFAFA` |
| `--ps-fg-secondary` | `#52525B` | `#A1A1AA` |
| `--ps-fg-muted` | `#A1A1AA` | `#71717A` |
| `--ps-bg` | `#FAFAFA` | `#0A0A0B` |
| `--ps-surface` | `#FFFFFF` | `#161618` |
| `--ps-surface-raised` | `#FFFFFF` | `#1C1C1F` |
| `--ps-bg-subtle` | `#F4F4F5` | `#202023` |
| `--ps-border-soft` | `#F0F0F2` | `#1F1F22` |
| `--ps-border` | `#E4E4E7` | `#27272A` |

### 4.3 Sémantique (compléter le palier `-text`, valeurs adaptées par thème)

`success` / `info` / `warning` / `danger`, chacun avec `--ps-{x}`, `--ps-{x}-subtle`, **`--ps-{x}-text`** (nouveau). Clair : `success #16A34A / #DCFCE7 / #15803D`, `info #2563EB / #DBEAFE / #1D4ED8`, `warning #D97706 / #FEF3C7 / #B45309`, `danger #DC2626 / #FEE2E2 / #B91C1C`. Sombre : mêmes teintes de base, `-subtle` en `rgba(...,.16)`, `-text` éclairci (`#4ADE80`, `#60A5FA`, `#FBBF24`, `#F87171`). + `--ps-success-gradient` **unique** (remplace les 3 verts divergents StatusPage/TimelineStep/Progress).

### 4.4 Typographie (Space Grotesk + Inter, échelle verrouillée)

- `--ps-font-display: 'Space Grotesk', 'Inter', system-ui` → titres + chiffres.
- `--ps-font-sans: 'Inter', system-ui` → corps, labels, UI.
- Chargement : `@fontsource` ou `<link>` Google Fonts (poids Space Grotesk 500/600/700, Inter 400/500/600/700). Retirer la référence fantôme « Cabinet Grotesk ».
- Échelle (interdire les `text-[Npx]` en dur) : `ps-display` 34/700/-0.03em · `ps-h1` 28/700/-0.025em · `ps-h2` 18/600/-0.02em · `ps-h3` 15/600 · `ps-body` 14/400 · `ps-small` 13/400 · `ps-tiny` 12/500 · `ps-eyebrow` 11/600 uppercase tracking 0.14em. Titres en `--ps-font-display`.
- **`ps-metric`** (nouveau) : valeur KPI, `--ps-font-display`, `tabular-nums`, 26px/600, échelle fixe partagée par tous les KPI.
- `ps-num` : `font-variant-numeric: tabular-nums` — **chiffres uniquement** (retirer des champs texte type prénom/société).

### 4.5 Espacement · Radius · Ombre · Motion · Verre

- **Espacement** : `--ps-space-1..16` (4→64px). Rythme canonique : `space-y-6` entre cards, `space-y-8` hero↔contenu, cards `px-6 py-4`, empty states `p-10`.
- **Radius** : `--ps-radius-sm 8` / `--ps-radius 14` (card) / `--ps-radius-modal 16` / `--ps-radius-pill 999`.
- **Ombre** (3 niveaux, **neutres** ; en sombre = ombres + ring subtil) : `--ps-shadow-card` (repos) / `--ps-shadow-raised` (panneaux/hover) / `--ps-shadow-floating` (modales/FAB). **Bannir** les `box-shadow: rgba(56,189,248/139,92,246,...)` inline.
- **Motion** : eases `--ps-ease-out cubic-bezier(0.16,1,0.3,1)` / `--ps-ease-in-out` ; durées `--ps-dur-fast 120ms` / `--ps-dur 200ms` / `--ps-dur-slow 320ms`. Primitives **rendues obligatoires** (déjà écrites) : `ps-fade-in`, `ps-fade-up`, `ps-lift`, `ps-card-interactive`, `ps-skeleton` (à enfin câbler), `ps-tap`. `prefers-reduced-motion` conservé.
- **Verre (règle d'élévation)** : blur autorisé **uniquement** sur header/footer sticky (1 couche). Tout panneau interne = surface **opaque** + ombre. Jamais de verre dans du verre.
- **Fond de page** : portail = 2 radials violet/indigo (Aurora discipliné, retirer cyan/orange de la qualif) ; admin = fond sombre quasi-uni + halo violet très subtil.

## 5. Les 8 lois du design system (= fin des tells AI)

1. **Un seul accent violet.** Dégradé uniquement sur fond de page + 1 moment hero + `ps-brand-gradient` mono. Jamais de rose/orange/cyan.
2. **Pas de `ps-gradient-text` sur les titres courants** → encre pleine `--ps-fg`. Réservé au hero login + StatusPage (1 moment max par parcours).
3. **Surfaces opaques** ; blur seulement header/footer sticky.
4. **Icônes = Lucide uniquement.** Zéro emoji dans la chrome (`RadioCard.emoji`→`icon: ReactNode`).
5. **Échelle typo verrouillée** (`ps-*` + `ps-metric`). Interdit : `text-[Npx]`.
6. **Tokens sémantiques** partout (`--ps-{success/info/warning/danger}{,-subtle,-text}`). Fini `bg-emerald-50` & co.
7. **3 niveaux d'ombre neutres** ; aucune ombre colorée inline.
8. **`ps-skeleton` obligatoire** au chargement ; aucun « Chargement… » textuel.

## 6. Couche de composants partagés (source unique)

À créer/centraliser et exporter depuis `src/modules/EspaceClient/shared/components/index.ts`. Tous **theme-aware** (consomment `--ps-*`).

| Composant | Rôle | Remplace |
|---|---|---|
| `<Skeleton>` (+ `KpiTileSkeleton`, `ActivityRowSkeleton`, `ListRowSkeleton`) | États de chargement shimmer | tous les « Chargement… » / `Loader2` ad-hoc |
| `<Alert variant>` | Bandeau danger/warning/success/info + icône Lucide | tous les `bg-red-50` bruts (portail + admin) |
| `<Badge>` / `<StatusBadge>` | Pastille, **map de tons centralisée 1×** (dot + bordure fine + teinte) | 3 tables de tints dupliquées (Badge/KpiTile/ActivityRow) + pills recodées admin |
| `<KpiBlock>` | Bloc KPI **unifié** (1 surface, colonnes à filets fins, `ps-metric`) | trio de cards KPI flottantes |
| `<Metric>` | Chiffre Space Grotesk tabular-nums, échelle `ps-metric` | `text-[26px] font-bold` épars |

+ **finir la migration des alias legacy** de tokens (`--ps-text-primary`→`--ps-fg`, `--ps-background-subtle`→`--ps-bg-subtle`), choisir le short-form canonique, migrer `PortalLayout`/`PortalTabBar`, supprimer le bloc legacy.

## 7. Roadmap — 4 vagues (tranches verticales, 1 PR = 1 lot)

### V0 — Fondations *(prérequis de tout le reste)*
Les 2 contrats de tokens (clair + sombre) · Space Grotesk câblé + retrait « Cabinet Grotesk » · couche de composants partagés (§6) · scope `.propulspace-admin` dark + suppression du forçage `ps-light-surface` · `ps-metric` + `ps-skeleton` câblés · migration alias legacy.
**Done** : build vert, portail inchangé visuellement (sauf typo titres), admin bascule en fond sombre sans régression fonctionnelle.

### V1 — Tuer les tells (transverse, ~70 % du gain perçu)
Fix `h-13 w-13`→`h-12 w-12` (EmptyState) · retrait gradient-text des titres récurrents · éradication rainbow (avatar référent, header pills, dots, checkmarks, CTA → mono-violet/`ps-brand-gradient`) · emojis→Lucide (qualif + wizard) · `<Alert>`/`<Skeleton>` substitués partout · statuts métier traduits FR via `STATUS_MAP` (`overdue`→« En retard ») · footer câblé (vraies routes ou retrait des `href="#"`) + `WHATSAPP_NUMBER` réel · tons sémantiques substitués aux `bg-emerald-50`/`red-50` bruts.

### V2 — Refonte surface par surface *(ordre = exposition décroissante)*
1. **Portail client connecté** (Dashboard + Projet/Documents/Factures/Signatures/Profil/Aide) : `<KpiBlock>` unifié · listes « relevé » (colonnes alignées, montant à droite `ps-num`, badge en colonne fixe, séparateurs de groupe) · avatar référent réel (photo / fallback initiales `ps-brand-gradient` + dot statut) · EmptyState « moment de marque » (bulle `ps-primary-subtle` + ring, CTA contextuel, `p-10`).
2. **Admin (thème sombre C)** : migration complète sur le DS (un seul gris zinc, `ps-surface`, hiérarchie `ps-h2`+`ps-eyebrow`) · fix lisibilité `PortalStateCard`/`PortalStatusSection` · header de panneau = cockpit (nom projet `ps-display`, société, badge statut, chips KPI : CA facturé / impayé / jalon) · `<pre>JSON.stringify(diff)>` → **diff lisible** avant→après tokenisé.
3. **Qualification `/diagnostic`** : `RadioCard`/`CheckboxCard` en surface **mate opaque** + état actif fort (`ps-primary-subtle` + bordure 1.5px + check plein) + hover translateY · glassmorphism réduit à 1 couche · fond mono-violet (retrait trio cyan/purple/orange) · échelle typo sémantique (retrait des demi-pixels) · **ThankYou éditoriale** : checkmark sobre, mini-timeline datée (« Reçu → Analyse sous 24h → Appel »), rappel des infos clés soumises, signature humaine.
4. **Welcome wizard** : sceller `.propulspace-portal` sur le `DialogContent` Radix (récupère les tokens, supprime ~80 % des inline hex/boxShadow) · récap qualif en bloc unifié `divide-y` · **vrai contenu de tour** (mini-mockups réels au lieu de 7 placeholders) · chrome aéré (fusion header+stepper, rythme cohérent) · `Propul'SEO`→`Propul'Space` dans le badge.

### V3 — Interactions & motion vivante
Drag `@dnd-kit` pour réordonner les jalons (poignée `GripVertical` + `TimelineStep`) au lieu de select+flèches · recherche admin enrichie (loupe absolute, raccourci `/` en `kbd`, compteur « X clients · Y impayés », tri) · barre de progression projet animée (`ps-progress-fill`) + node `in_progress` qui pulse · hover row avec chevron qui glisse (listes portail + admin) · activation de la motion dormante de l'admin (`ps-fade-in`, `ps-lift`, `ps-card-interactive`) · honnêteté du `SaveIndicator` (fourchette « 2-3 min »).

## 8. Méthode de travail

- **Skills design** : sur chaque refonte de surface (V2), invoquer les skills UI installées (`design-taste-frontend`, `high-end-visual-design`, `redesign-existing-projects`). Pour les écrans « waouh » (ThankYou, états vides, tour wizard), générer des **références visuelles** via les skills `imagegen-*` avant de coder.
- **Validation par vague** : montrer l'écran refait dans le compagnon visuel et/ou en live sur le portail (bouton démo `lyestriki@gmail.com`) **avant** de passer au lot suivant.
- **Vérification réelle** : `tsc --noEmit` + `npm run lint` + rendu navigateur (Playwright) à chaque lot — pas seulement « ça compile ».
- **Décomposition** : cette spec = le **contrat DA + roadmap**. Chaque vague aura **son plan d'implémentation** (`docs/superpowers/plans/`), PRs petites et testables (1 lot = 1 PR).
- **Ultracode (option)** : paralléliser les refontes de surfaces indépendantes + une revue design adversariale via workflow pour accélérer V2.

## 9. Hors-périmètre (non-goals)

- Aucune modification des **modules CRM principaux** (Communication, ERP, SiteWeb, Projects, Dashboard…) ni du thème `:root` du CRM. On reste dans `src/modules/EspaceClient/**` (+ tokens scoped).
- Pas de refonte fonctionnelle backend (RPC, RLS, edge functions) — sauf branchements de contenu déjà identifiés (routes footer, numéro WhatsApp).
- Pas de nouvelle police au-delà de Space Grotesk + Inter.
- Renommage `EspaceClient/`→`Propulspace/` : reste backlog, hors de cette spec.

## 10. Critères de succès (definition of done global)

1. **Zéro tell AI** : aucun rainbow gradient, aucun `ps-gradient-text` sur titre courant, aucun emoji-icône, aucun état vide cassé.
2. **100 % tokens** dans `EspaceClient/**` : aucune couleur Tailwind brute (`gray-*`, `emerald-50`…) ni `text-[Npx]` ni ombre colorée inline (vérifiable au grep).
3. **Deux thèmes cohérents** : portail clair B et admin sombre C, mêmes composants partagés, marque reconnaissable (violet) dans les deux.
4. **États premium** : skeletons au chargement, empty states de marque, `<Alert>` unifié pour les erreurs, partout.
5. **Build + lint verts**, rendu navigateur validé sur chaque surface, aucune régression fonctionnelle.
