---
name: Propul'Space
description: Portail client premium de l'agence Propul'SEO — DA « Aurora Raffiné » clair (portail) et thème CRM sombre (admin), un seul accent violet.
colors:
  primary: "#7C3AED"
  primary-hover: "#6D28D9"
  primary-deep: "#5B21B6"
  primary-text: "#5B21B6"
  primary-subtle: "#EDE9FE"
  aurora-bg: "#FAFAFA"
  surface: "#FFFFFF"
  surface-subtle: "#F4F4F5"
  ink: "#18181B"
  ink-secondary: "#52525B"
  ink-muted: "#A1A1AA"
  border: "#E4E4E7"
  border-soft: "#F0F0F2"
  border-strong: "#D4D4D8"
  success: "#16A34A"
  success-subtle: "#DCFCE7"
  success-text: "#15803D"
  warning: "#EA580C"
  warning-subtle: "#FFEDD5"
  warning-text: "#B45309"
  danger: "#DC2626"
  danger-subtle: "#FEE2E2"
  danger-text: "#B91C1C"
  info: "#2563EB"
  info-subtle: "#DBEAFE"
  info-text: "#1D4ED8"
  night-bg: "#0A0A0B"
  night-surface: "#161618"
  night-surface-subtle: "#202023"
  night-ink: "#FAFAFA"
  night-ink-secondary: "#A1A1AA"
  night-border: "#27272A"
  night-primary: "#8B5CF6"
  night-primary-hover: "#A78BFA"
  night-primary-text: "#C4B5FD"
typography:
  display:
    fontFamily: "Space Grotesk, Inter, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: "40px"
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Space Grotesk, Inter, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Space Grotesk, Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "28px"
    letterSpacing: "-0.015em"
  metric:
    fontFamily: "Space Grotesk, Inter, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  body:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "-0.005em"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 600
    letterSpacing: "0.14em"
rounded:
  input: "8px"
  card: "14px"
  modal: "16px"
  pill: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
  "16": "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.input}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "#FFFFFF"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.input}"
    padding: "8px 14px"
  badge:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    height: "36px"
---

# Design System : Propul'Space

> Source de vérité du code : `src/modules/EspaceClient/shared/layouts/portal-theme.css` (tokens `--ps-*`, scope `.propulspace-portal`). Document en français — la langue de l'UI et des libellés est exclusivement le français.

## 1. Overview

**Creative North Star : « Aurora Raffiné »**

Propul'Space est le portail client d'une agence haut de gamme : il doit être **premium, rassurant, limpide**. La confiance passe par la clarté, jamais par la décoration. Le système vit en deux registres sur un même vocabulaire de composants : le **portail client** (clair, aéré, usage ponctuel mobile/desktop) et le **back-office admin** (modificateur `.ps-theme-dark`, dense, usage quotidien desktop, aligné sur le thème CRM sombre). Le fond du portail n'est pas un blanc plat : deux radiaux violet/indigo très discrets (`rgba(124,58,237,0.07)` et `rgba(99,102,241,0.05)`) posés sur `#FAFAFA` créent l'« aurore » — c'est la seule licence décorative du fond de page.

Chaque écran répond d'abord à « où en suis-je, que doit-on faire ensuite ? » : hero avec phrase d'état (« Votre projet est à 64 % »), action prioritaire en bandeau violet plein, KPI latéraux, activité récente. La hiérarchie sert cette réponse. Le système rejette explicitement (cf. PRODUCT.md) : le « SaaS template » générique, les tells IA (rainbow gradients, gradient-text sur les titres, glassmorphism décoratif, emojis-icônes, side-stripes colorées) et les portails « usine à gaz » type opérateur télécom.

**Key Characteristics :**
- Un seul accent violet (`#7C3AED` clair / `#8B5CF6` sombre), dépensé avec parcimonie.
- Surfaces opaques, ombres neutres, chiffres tabulaires en Space Grotesk : la qualité perçue vient de la précision.
- Rythme d'espacement base 4 px (`--ps-space-1..16`, 4→64 px) ; `space-y-6` entre cartes, cibles tactiles ≥ 44 px (`--ps-touch`).
- Motion sobre : `ps-fade-in` 320 ms à l'arrivée de page, lift de 1-2 px au hover, `prefers-reduced-motion` respecté partout.
- Admin dense, portail aéré : deux densités, un vocabulaire.

## 2. Colors : la palette Aurora

Un violet unique sur des neutres zinc — toute la couleur restante est sémantique et fonctionnelle.

### Primary
- **Violet Propul'SEO** (`#7C3AED`, token `--ps-primary`) : l'action principale et l'état actif, rien d'autre — CTA pleins, anneau de progression, dot « en cours », item sélectionné (bordure gauche 3 px + fond `primary-subtle`). Hover `#6D28D9`, actif/profond `#5B21B6`.
- **Violet texte** (`#5B21B6`, `--ps-primary-text`) : version texte AA du violet sur fonds clairs (liens d'action, valeur sur chip violette).
- **Voile violet** (`#EDE9FE`, `--ps-primary-subtle`) : fond des badges/chips violettes, track de l'anneau et des barres de progression, fonds de sélection.
- En thème sombre admin, le violet s'éclaircit : `#8B5CF6` (accent), `#A78BFA` (hover), `#C4B5FD` (texte), subtle `rgba(139,92,246,0.14)`.

### Neutral
- **Aurora** (`#FAFAFA`, `--ps-bg`) : fond de page clair (forcé sur `html/body/#root` via `ps-light-surface`).
- **Surface** (`#FFFFFF`, `--ps-bg-elevated`) : toutes les cartes et panneaux (`.ps-surface`), inputs.
- **Surface discrète** (`#F4F4F5`, `--ps-bg-subtle`) : cellules méta, fonds de champ de recherche, chips grises.
- **Encre** (`#18181B`, `--ps-fg`) : titres et valeurs — les titres sont en encre pleine, jamais en dégradé.
- **Encre secondaire** (`#52525B`) et **encre estompée** (`#A1A1AA`) : corps de texte et métadonnées.
- **Bordures** : `#F0F0F2` (soft, défaut des cartes), `#E4E4E7` (inputs), `#D4D4D8` (strong, hover).
- Thème sombre : fond `#0A0A0B`, surface `#161618`, subtle `#202023`, encre `#FAFAFA`, bordure `#27272A`.

### Sémantiques (statuts uniquement)
Quatre familles en triplets plein / `-subtle` / `-text` : succès `#16A34A`/`#DCFCE7`/`#15803D`, alerte `#EA580C`/`#FFEDD5`/`#B45309`, danger `#DC2626`/`#FEE2E2`/`#B91C1C`, info `#2563EB`/`#DBEAFE`/`#1D4ED8`. Elles colorent exclusivement badges, alertes, tints d'icônes KPI et états de paiement — jamais la décoration.

**La règle de l'accent unique.** Un seul accent violet sur tout le produit. `--ps-brand-gradient` (mono `#7C3AED → #5B21B6`, 135°) est la **seule** source de dégradé de marque. Interdits : `via-pink`, `to-amber`, `from-sky` et tout dégradé multi-teintes.

**La règle des tokens sémantiques.** Tout statut passe par `--ps-{success|info|warning|danger}{,-subtle,-text}`. Fini `bg-emerald-50`, `bg-red-50` & co.

## 3. Typography

**Display Font :** Space Grotesk (fallback Inter, system-ui)
**Body Font :** Inter (fallback system-ui, -apple-system)
**Mono Font :** JetBrains Mono (fallback SF Mono, Menlo, Consolas)

**Caractère :** Inter posé et lisible pour le corps (15 px / 24 px, `font-feature-settings: "cv11","ss03","cv02"`), Space Grotesk pour tout ce qui doit avoir de la présence : titres ET chiffres. Chaque montant, pourcentage ou date chiffrée porte `.ps-num` (`font-variant-numeric: tabular-nums`) — les colonnes de chiffres s'alignent au pixel.

### Hierarchy
- **Display** (`.ps-display`, 700, 32 px / 40 px, -0.025em) : moments hero rares (login, StatusPage).
- **Headline** (`.ps-h1`, 600, 24 px / 32 px, -0.025em) : titre de page — une phrase d'état, pas un nom de module sec.
- **Title** (`.ps-h2`, 600, 18 px / 28 px, -0.015em) : titres de panneaux et de détails.
- **Sous-titre** (`.ps-h3`, 600, 15 px / 22 px) : têtes de sections de cartes (`SectionHead`).
- **Metric** (`.ps-metric`, Space Grotesk 600, 26 px / 1, -0.02em, tabular-nums) : la grande valeur des KPI.
- **Body** (`.ps-body`, 400, 15 px / 24 px, encre secondaire) ; **Small** 13 px / 20 px ; **Tiny** 500, 12 px / 16 px, encre estompée.
- **Label / Eyebrow** (`.ps-eyebrow`, 600, 10.5 px, uppercase, tracking 0.14em) : libellé au-dessus des valeurs. Violet `--ps-primary-text` par défaut, gris via `.ps-eyebrow-muted` (le cas le plus courant sur les KPI).

**La règle de l'échelle verrouillée.** L'échelle typo sémantique (`ps-display/h1/h2/h3/body/small/tiny/eyebrow/metric`) est obligatoire. Interdit : tailles arbitraires `text-[Npx]` hors de cette échelle.

**La règle de l'encre pleine.** Pas de `ps-gradient-text` sur les titres courants → encre pleine `--ps-fg`. Le gradient-text est réservé au hero login et à StatusPage (1 moment max par parcours).

## 4. Elevation

Système hybride à dominante plate : les surfaces reposent sur une ombre ambiante quasi imperceptible, et l'élévation est une **réponse à l'état** (hover, modal), jamais un décor. En thème sombre, les ombres noires sont doublées d'un ring blanc subtil (`0 0 0 1px rgba(255,255,255,.04)`) pour découper les panneaux. Le verre (`.ps-frosted`, `blur(20px) saturate(180%)`) est autorisé sur **une seule couche** : le header/footer sticky. Tout panneau interne est opaque.

### Shadow Vocabulary
- **Card — repos** (`box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.05)`) : toutes les `.ps-surface` au repos.
- **Raised — hover/panneaux** (`0 4px 12px -2px rgba(91,33,182,.10), 0 2px 4px -1px rgba(16,24,40,.06)`) : hover des cartes interactives (avec `translateY(-1px)`).
- **Floating — modales/FAB** (`0 10px 25px rgba(124,58,237,.08)`).
- **Brand / FAB / Success** : trois ombres teintées d'exception (`--ps-shadow-brand`, `--ps-shadow-fab`, `--ps-shadow-success`), réservées aux CTA de marque et au FAB — jamais recréées inline.

**La règle des trois ombres neutres.** Trois niveaux d'ombre neutres, point. Aucune ombre colorée inline (`box-shadow: rgba(56,189,248,…)` ou `rgba(139,92,246,…)` codée en dur = interdite) ; seuls les tokens d'ombre du thème sont permis.

**La règle du verre unique.** Surfaces opaques partout ; blur uniquement sur header/footer sticky. Jamais de verre dans du verre.

## 5. Components

Vocabulaire partagé dans `src/modules/EspaceClient/shared/components/` (portail + admin) ; kit admin dédié dans `src/modules/EspaceClient/admin/components/kit/`.

### Buttons
- **Forme :** angles doux (8 px, `--ps-radius-input`), libellés 600, 12-13 px.
- **Primary :** violet plein (`#7C3AED`), texte blanc, hover `#6D28D9` (transition couleur 200 ms `--ps-ease`). Un seul par zone — c'est l'« action prioritaire ».
- **Outline / secondaire :** surface blanche, bordure `#E4E4E7`, texte encre secondaire, hover fond `#F4F4F5`.
- **Tap state :** `.ps-tap` → `scale(0.97)` à l'appui (150 ms). Loader = icône Lucide `Loader2` en rotation, pas de spinner custom.
- **Admin :** mêmes CTA violets (`bg-primary`, `rounded-lg`, `px-3 py-2`, `hover:bg-primary/85`) via `AdminSectionHeader`.

### Badges / Chips (statuts)
- **Style :** pilule (`rounded-full`), `px-2.5 py-0.5`, 11.5 px semibold, fond `-subtle` + texte `-text` de la famille sémantique.
- **Anatomie obligatoire :** dot 6 px de la couleur pleine + libellé **français** (`StatusBadge` centralise le mapping : « Payée », « En retard », « En cours », « Signé », « À venir », « Bloqué »…). La couleur seule ne porte jamais le statut.
- **Tonalités :** violet (en cours/actif), green, amber, red, blue, gray (neutre/brouillon).

### Cards / Containers
- **Corner Style :** 14 px (`--ps-radius-card`) ; modales 16 px.
- **Background :** blanc opaque `--ps-bg-elevated` (admin sombre : `#161618` via `AdminCard` / `bg-surface-2`).
- **Bordure :** 1 px `--ps-border-soft` (`#F0F0F2`).
- **Ombre :** card au repos → raised au hover (`.ps-surface-hover`, `.ps-card-interactive` : lift -1 px + bordure strong, curseur pointer, ring violet au focus).
- **Padding interne :** cartes KPI `p-5` (20 px), panneaux `p-7`/`p-9` (28/36 px), listes `px-5 py-3` avec séparateurs `divide-[--ps-border-soft]`.

### Inputs / Fields
- **Style :** fond surface (`#FFFFFF`), bordure `#E4E4E7`, rayon 8 px, hauteur ~36 px, placeholder encre estompée.
- **Focus :** bordure violette + halo `0 0 0 3px var(--ps-primary-subtle)` ; focus clavier global = `outline: 2px solid var(--ps-primary)` décalé de 2 px.
- Le scope `.propulspace-portal` remappe les tokens shadcn (`--background`, `--ring: 262 83% 58%`…) en clair pour que les primitives héritées du CRM sombre restent cohérentes.

### Navigation
- Header portail sticky en `.ps-frosted` (seule surface vitrée). Liens en `--ps-primary`, hover `--ps-primary-hover`. Item actif de liste : bordure gauche 3 px violette + fond `primary-subtle` (pattern master-detail des factures). Mobile : safe-areas iOS (`.ps-safe-bottom`).

### Composants signature
- **Hero** : carte surface avec halo violet décoratif clippé dans le coin (`.ps-hero-glow`, radial `rgba(124,58,237,0.18)`, opacité 40 %, blur-3xl), eyebrow violet, titre-phrase d'état avec le pourcentage en `.ps-num` violet, `ProgressRing` à droite, et bandeau « Action prioritaire » violet plein en pied de carte.
- **KpiTile / SideKpi** : eyebrow muted + valeur `.ps-metric` + delta 12 px ; icône Lucide dans un carré 32 px teinté (`-subtle`/`-text`). Variante accentuée : bordure gauche 3 px violette.
- **ProgressRing** : anneau SVG pur, track `--ps-primary-subtle`, remplissage `--ps-primary` arrondi, valeur centrale Space Grotesk tabular-nums, transition `stroke-dashoffset` 600 ms `--ps-ease-out`.
- **Skeleton** (`.ps-skeleton`) : shimmer violet 4→10 % (1.5 s, blanc faible en sombre), composé pour mimer la forme du contenu. Obligatoire pendant tout chargement.
- **Alert** : bandeau `rounded-[8px]`, fond `-subtle` + texte `-text`, icône Lucide (`XCircle`/`AlertTriangle`/`CheckCircle2`/`Info`), titre semibold optionnel, action à droite.
- **EmptyState** : icône Lucide 24 px (stroke 1.6) dans une pastille grise, titre `.ps-h3`, corps 13 px max 280 px — jamais une zone vide silencieuse.
- **Motion** : entrées de page `ps-fade-in` (fade-up 6 px, 320 ms `--ps-ease-out`), durées 150/200/300 ms, eases `cubic-bezier(0.4,0,0.2,1)` et `cubic-bezier(0.16,1,0.3,1)`. `prefers-reduced-motion: reduce` coupe halo, sparks, pulse, FAB et lifts.

## 6. Do's and Don'ts

Les 8 lois du design system (spec DA 2026-06-05) sont normatives — elles existent pour tuer les « tells AI ».

### Do :
- **Do** utiliser **un seul accent violet** (`#7C3AED` clair / `#8B5CF6` sombre) ; le dégradé de marque mono `#7C3AED → #5B21B6` est la seule exception (fond de page + 1 moment hero max). *(Loi 1)*
- **Do** écrire les titres en **encre pleine** `--ps-fg`. *(Loi 2)*
- **Do** garder toutes les surfaces **opaques** ; le blur n'existe que sur le header/footer sticky via `.ps-frosted`. *(Loi 3)*
- **Do** utiliser **Lucide uniquement** pour les icônes (stroke ~2, 14-20 px dans des pastilles teintées). *(Loi 4)*
- **Do** respecter l'**échelle typo verrouillée** `ps-*` + `.ps-metric`, et poser `.ps-num` (tabular-nums) sur tout chiffre. *(Loi 5)*
- **Do** passer par les **tokens sémantiques** `--ps-{success|info|warning|danger}` pour tout état. *(Loi 6)*
- **Do** s'en tenir aux **3 niveaux d'ombre neutres** du thème (card / raised / floating). *(Loi 7)*
- **Do** afficher un **`ps-skeleton`** pendant chaque chargement, composé à la forme du contenu. *(Loi 8)*
- **Do** exprimer chaque statut en **dot + libellé français** via `StatusBadge` (« Payée », « En retard », « En cours »…), et répondre d'abord à « où en suis-je, que faire ensuite ? » sur chaque écran.
- **Do** garantir AA (4.5:1) sur les deux thèmes, cibles tactiles ≥ 44 px, et respecter `prefers-reduced-motion`.

### Don't :
- **Don't** introduire de **rainbow gradients** ni de dégradés multi-teintes (`via-pink`, `to-amber`, `from-sky` interdits) — anti-référence « tells IA » de PRODUCT.md.
- **Don't** poser de **gradient-text sur les titres** ; `ps-gradient-text` est réservé au hero login et à StatusPage.
- **Don't** faire de **glassmorphism décoratif** : pas de panneau interne flouté, jamais de verre dans du verre.
- **Don't** utiliser d'**emojis-icônes** dans la chrome, ni d'icônes hors Lucide.
- **Don't** coder de couleurs Tailwind brutes (`bg-emerald-50`, `bg-red-50`, `gray-*`) ni d'ombres colorées inline — tokens `--ps-*` exclusivement.
- **Don't** afficher un statut par la couleur seule ou en anglais : toujours dot + libellé FR.
- **Don't** écrire « Chargement… » en texte — skeleton obligatoire.
- **Don't** reproduire le « SaaS template » générique (hero-metric, grilles de cartes identiques, eyebrows uppercase sur chaque section) ni les **side-stripes colorées** décoratives — la bordure gauche 3 px violette est réservée à la sélection et à la carte KPI accentuée.
- **Don't** densifier le portail comme un espace client d'opérateur télécom : le portail reste aéré, calme, jamais anxiogène ; la densité appartient à l'admin.
