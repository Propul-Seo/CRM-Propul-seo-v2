# Propul'Space — Planche d'inspiration (refonte UI premium)

> Consolidé de 2 recherches multi-agents (2026-06-05) : inspiration web premium par surface + minage de la vibe-library interne (patterns anonymisés de la stack Next/Tailwind-v4 → notre React/Vite/Tailwind-3).
> Nourrit la spec `2026-06-05-propulspace-ui-premium-design.md`. **Référence pour V1 (socle transverse) et V2 (refonte par surface).**

## 0. Les deux sources, en un mot
- **Web** (Mercury, Stripe, Linear, Vercel, Dropbox, Yousign…) → la *direction premium* et la *killer idea* de chaque écran.
- **vibe-library** (PRDs Dashboard/Data-Table/Admin/Mobile/CRM) → les *composants réutilisables* concrets + les contraintes métier/archi propres au repo (schéma `propulspace` via RPC `admin_*`, FR-only, Tailwind 3).

---

## 1. Principes transverses (à imposer PARTOUT — V1)

1. **Densité « relevé bancaire »** : objets comparables (factures, docs, clients) en **lignes/tables denses** (48px portail / 44px admin), pas en grosses vignettes. Canon : Vercel Geist Table, Pencil&Paper, Supabase Studio.
2. **Statut = `dot + label FR`, jamais couleur seule** (convention Carbon). Sémantique désaturée (vert encaissé / ambre attente / rouge impayé) qui **cohabite** avec l'accent violet.
3. **Mono-accent violet strict** : `#7C3AED` (clair) / `#8B5CF6` (admin). Réservé à : anneaux de progression, état actif/sélection, CTA primaire, focus ring, pill « En cours ». Le reste en gris 40-60 %.
4. **Profondeur plate-premium** : clair = surfaces **blanches opaques** + ombres **neutres** (`0 1px 2px + 0 8px 24px rgba(0,0,0,.06)`), bordures `#ECECEC`, radius 12-16px. Admin = profondeur **par luminance** (4 tons `#0B0B0F→#131318→#1A1A21→#22222B`), pas par ombres. **Glassmorphism interdit partout.**
5. **Typo bicéphale** : titres + **tous les chiffres** (%, montants, dates, SIRET) en **Space Grotesk + `tabular-nums`** alignés à droite ; corps/aide en **Inter** gris.
6. **Wash radial violet confiné** : UN seul wash discret (`#7C3AED` ~6-8 %) **derrière le hero/header**, jamais sur toute la page ni dans chaque card.
7. **Curation, pas exhaustivité** (côté client) : on n'expose QUE statut / actions / docs / factures / activité. Jamais la mécanique CRM interne (pipeline, tâches, budget vs réalisé).
8. **Action hissée en tête + état vide riche** : items actionnables (facture à payer, doc à signer) remontent en **boutons** en haut (logique overview Stripe). Aucun état vide pauvre : message rassurant + illustration line + CTA (« Tout est à jour ✓ », `—` em-dash pour cellule vide, jamais « Aucune donnée »).

---

## 2. Le socle V1 — composants partagés à construire d'abord
*(de la vibe-library — ce sont eux qui débloquent toutes les surfaces V2 ; sinon chaque surface réinvente la roue)*

| # | Composant / chantier | Détail | Surface(s) |
|---|---|---|---|
| 1 | **Tokens sémantiques** | CSS vars `:root` (portail clair) + `.ps-theme-dark` (admin) — `--primary = --accent =` violet unique ; `--destructive` rouge seul à diverger. *(déjà amorcé en V0)* | toutes |
| 2 | **`<KpiCard>`** | props `title/value/badge/icon/href`, cliquable, hover élévation neutre, valeur Space Grotesk tabular-nums. Côté client : badge **statut** (« À jour »/« En retard ») au lieu d'un delta %. | accueil, admin |
| 3 | **Trio d'états** | `<EmptyState>` (icône Lucide + phrase + CTA) · `<SkeletonRows>` (≈10, calqué sur l'anatomie réelle, zéro CLS) · `<NoResults>` (query affichée + « Effacer les filtres »). **Bannir tous les spinners centrés.** | toutes |
| 4 | **Socle adaptatif** | `useBreakpoint(min)` typé `matchMedia` (pas `window.innerWidth`) + `<ResponsiveTable>` (Table→Cards) + `<AdaptiveDialog>` (Dialog↔Sheet bottom). Logique métier écrite **une fois**. | toutes |
| 5 | **Base layer ergonomie** | `@layer base` : touch-targets 44px (`min-h/w 2.75rem`), `pb-safe`/`pt-safe` sticky, `max-w-screen-2xl mx-auto`, `prefers-reduced-motion`, print sheet Factures/Devis. | toutes |

*(s'ajoutent aux composants V0 déjà livrés : `Skeleton`, `Alert`, `Badge` tokenisé, `Metric`, `KpiBlock`.)*

---

## 3. Par surface — killer idea + réfs + déclinaison

### A. Accueil client — « État du projet en une phrase »
Hero ouvre sur « Bonjour Camille, votre site est à 68 % — la prochaine étape vous attend » (Space Grotesk encre, **pas** de gradient-text), un anneau violet à droite, UNE carte d'action prioritaire contextuelle. Sous le pli : bande « Prochaines actions » (1-3 cartes-boutons) + bento 3-4 KPI single-number + activité récente + footer « Dernière maj il y a 2 min » (point vert realtime). Squelette 3 zones (KPI → graphes → table récente).
**Réfs** : [Mercury](https://blakecrosley.com/guides/design/mercury) · [SuperOkay](https://superokay.com/) · [Linear dashboards](https://linear.app/now/dashboards-best-practices) · [Stripe home](https://docs.stripe.com/dashboard/basics)

### B. Page projet — « La Frise vivante »
Frise **verticale** 4-6 phases, la phase active s'épanouit en grande carte (anneau violet 2px + halo) ; connecteur bi-couleur violet/gris = avancement intégré ; ligne « Aujourd'hui ». Chaque jalon-losange déplie au clic son « pont » contextuel : livrable+valider, ou mini-timeline paiement, ou « À signer ». 4 styles de puces (Terminé plein+check / En cours anneau / À venir gris / **En attente client outline violet pointillé**). Statut honnête par phase (esprit Hill Chart), pas un faux %.
**Réfs** : [Linear Milestones](https://linear.app/changelog/2024-02-29-milestones-on-the-timeline) · [Lollypop Stepper](https://lollypop.design/blog/2026/february/beyond-the-progress-bar-the-art-of-stepper-ui-design/) · [Eleken Steppers](https://www.eleken.co/blog-posts/stepper-ui-examples)

### C. Documents — « Coffre bidirectionnel preview-au-survol »
Deux familles (« Livrables de l'agence » lecture / « Vos documents » dépôt). Ligne dense 5 zones (icône type = **glyphe**, pas couleur native / nom+sous-ligne / badge type / taille tabular-nums / modifié-le / kebab), 48px, hover `#FAF9FF`, hairline `#ECECEC`. Survol pastille = miniature opaque sans clic. Dropzone violet-pointillé → violet-plein au drag.
**Réfs** : [Dropbox list](https://www.designmd.co/d/dropbox) · [Box preview-on-hover](https://support.box.com/hc/en-us/articles/37994537921939-Preview-on-hover-in-list-views-Jan-2025) · [Vercel Geist Table](https://vercel.com/geist/table)

### D. Factures — « La ligne de vie du paiement »
Table-first (N° | Émise | Échéance | TTC | Restant dû | Statut | Action), montants **right-align tabular-nums**, statut 2 niveaux Stripe (base + badge alerte « En retard de 12 j »), un seul CTA primaire/ligne. Barre de progression mono-violet inline (Payé/Restant) ; dépliée = mini-timeline des échéances (Acompte 30 % → Solde 70 %). Bandeau 3 stats (Total dû / En retard / Payé). FR : Payée/À payer/En retard/Acompte. Retard = **texte** rouge `#DC2626` (pas de fond rouge pleine ligne).
**Réfs** : [Stripe Invoicing](https://docs.stripe.com/invoicing/overview) + [Partial payments](https://docs.stripe.com/invoicing/partial-payments) · [Pencil&Paper tables](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables) · [Pennylane](https://www.pennylane.com/fr/logiciel-facturation)

### E. Signatures — « Le Pilote de signature »
Split : viewer PDF plein cadre gauche + rail d'action droit (statut, signataires, CTA). Bandeau-pilote 3 états (neutre → rouge champ manquant → vert) + auto-scroll au prochain champ. Stepper cycle de vie FR (Envoyé→Ouvert→Signé→Terminé + Refusé/Annulé/Expiré). Après signature : mode « preuve » (PDF tamponné + audit IP/horodatage téléchargeable). OTP 6 cases monospace + checkbox consentement. **Succès sobre, zéro confetti.** « Relancer » actif seulement si Ouvert/Envoyé non signé. (S'appuie sur le module DocuSeal déjà câblé côté admin.)
**Réfs** : [Dropbox Sign](https://help.dropbox.com/share/dropbox-sign-signing-experience) · [DocuSign statuts](https://developers.docusign.com/docs/esign-rest-api/esign101/concepts/envelopes/status-codes/) · [Yousign eIDAS FR](https://developers.yousign.com/docs/building-your-own-signing-flow)

### F. Profil — « La carte d'identité d'entreprise »
Sidebar de sections (Profil/Coordonnées/Sécurité/Préférences/Danger) + colonne ~680px en Cards. **Lecture par défaut → édition au clic** d'UNE ligne ; footer Save contextuel par card (désactivé tant que rien ne change), pas de Save global flottant. Section Profil = fiche premium (logo/initiales pastille violette, raison sociale gros Space Grotesk, SIRET+ville tabular-nums, badge « Compte vérifié »). Danger zone en bas, liseré + texte rouge sobre (**pas d'ombre rouge**), confirmation par re-saisie du nom.
**Réfs** : [Vercel Account](https://vercel.com/account) · [shadcn Settings blocks](https://www.shadcndesign.com/pro-blocks/settings) · [Linear Settings](https://linear.app/docs/account-preferences)

### G. Welcome wizard — « Le wizard zéro-saisie »
Stepper **vertical** sidebar persistante (~280px) + « Étape 3 sur 5 » + barre violette. L'agence connaît déjà 90 % des infos (devis signé) → chaque champ pré-rempli = **case cochée violette à valider**, pas un champ vide. Pendant ce temps le futur dashboard se construit à droite (avancement, 1re facture, doc à signer apparaissent un à un). Final : « Bienvenue {Société}, votre espace est déjà à jour ». Étapes secondaires 100 % « Passer ». Delight = cascade Framer mono-violet + check tracé, **zéro confetti multicolore**.
**Réfs** : [Mercury onboarding](https://www.productonboarding.com/mercury-new-user-onboarding) · [Linear onboarding](https://supademo.com/user-flow-examples/linear) · [Appcues screens](https://www.appcues.com/blog/saas-onboarding-screens)

### H. Qualification /diagnostic — « La progression honnête »
Une étape = un chapitre (Activité / Projet web / Budget & délais / Coordonnées), max 5 champs. **Choice cards pleine cible** (bordure violet 1.5px + fond `#F5F3FF` + check). Auto-avance sur choix unique (180ms). Barre + fil d'Ariane qui se **reconfigure en direct** quand une branche est sautée (« 2 sur 4 » → « 2 sur 3 »). Validation **non-bloquante** au blur (« guide, don't gate »). Container ~560px, wash violet derrière la carte. Thank-you en 5 blocs (reçu / ce qu'on en fait / délai « sous 48 h ouvrées » / UN CTA / support).
**Réfs** : [Typeform vs Tally](https://www.typeform.com/blog/typeform-vs-tally) · [Coyle Form Wizard](https://www.andrewcoyle.com/blog/how-to-design-a-form-wizard) · [FormLova Thank-You](https://formlova.com/en/blog/form-thank-you-page-guide-en)

### I. Back-office admin — « Le Cockpit ⌘K »
Layout **cockpit 3 colonnes** (sidebar groupée par domaine, collapsible mémorisé | table dense filtrable | panneau client à onglets persistant). Topbar breadcrumb. Data Table TanStack v8 headless 44px / header 36px sticky. Onglets STABLES par client (Aperçu/Jalons/Documents/Factures/Signatures). **Command palette ⌘K violette** = colonne vertébrale (recherche client/projet + actions : changer statut, créer jalon, relancer signature) avec aperçu live à droite. Détail ressource en tabs Details/Activity/**Audit** (timeline acteur+action+diff, via RPC `admin_*`). Élévation par tons sombres + bordures `rgba(255,255,255,.06-.10)`, optimistic UI + skeletons + transitions <100ms.
**Réfs** : [Linear UI redesign](https://linear.app/now/how-we-redesigned-the-linear-ui) · [Plain](https://www.plain.com/product) · [Supabase Studio tables](https://supabase.com/design-system/docs/ui-patterns/tables) · [Qonto dashboards](https://medium.com/qonto-way/building-dashboards-like-a-product-lessons-from-design-growth-and-product-management-17b90113a39b)

---

## 4. Moodboard — à ouvrir côte à côte
- **Dashboards** : [Mercury](https://blakecrosley.com/guides/design/mercury) (socle visuel portail) · [Linear](https://linear.app/now/dashboards-best-practices) · [SuperOkay](https://superokay.com/) · [Stripe](https://docs.stripe.com/dashboard/basics)
- **Listes/relevés** : [Vercel Geist Table](https://vercel.com/geist/table) (canon de nos tables) · [Pencil&Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables) · [Dropbox](https://www.designmd.co/d/dropbox) · [Box hover](https://support.box.com/hc/en-us/articles/37994537921939-Preview-on-hover-in-list-views-Jan-2025) · [Carbon status](https://carbondesignsystem.com/patterns/status-indicator-pattern/)
- **Formulaires/steppers/signature** : [Lollypop stepper](https://lollypop.design/blog/2026/february/beyond-the-progress-bar-the-art-of-stepper-ui-design/) · [Linear milestones](https://linear.app/changelog/2024-02-29-milestones-on-the-timeline) · [Dropbox Sign](https://help.dropbox.com/share/dropbox-sign-signing-experience) · [Yousign](https://developers.yousign.com/docs/building-your-own-signing-flow) · [Coyle wizard](https://www.andrewcoyle.com/blog/how-to-design-a-form-wizard) · [Vercel Account](https://vercel.com/account)
- **Onboarding** : [Mercury](https://www.productonboarding.com/mercury-new-user-onboarding) · [Appcues](https://www.appcues.com/blog/saas-onboarding-screens)
- **Dark admin** : [Linear redesign](https://linear.app/now/how-we-redesigned-the-linear-ui) (socle back-office) · [Plain](https://www.plain.com/product) · [Supabase tables](https://supabase.com/design-system/docs/ui-patterns/tables)

---

## 5. À générer en image avant de coder (skill `imagegen-frontend-web`, 1 image/écran)
1. **Accueil portail clair** (hero phrase+anneau + bande actions + bento KPI) — *première impression, test grandeur nature de la DA Aurora.*
2. **Page projet « Frise vivante »** — *composant le plus original, dur à décrire en mots.*
3. **Factures « ligne de vie du paiement »** — *valide densité tabular-nums + sémantique désaturée vs violet (point le plus risqué « rainbow »).*
4. **Pilote de signature** (split viewer/rail + bandeau 3 états) — *layout dense, beaucoup d'états simultanés.*
5. **Cockpit admin Dark-Tech 3 colonnes + ⌘K** — *figer les 4 tons sombres, prouver « même accent, thème nuit ».*
6. *(optionnel)* Wizard zéro-saisie — *réutilise surtout les composants des autres écrans.*

---

## 6. À NE PAS importer de la vibe-library (stack divergente)
Next.js App Router / RSC / Server Actions · `next/link`·`next/font`·`next/image`·`nuqs`·`next-intl` (→ React Router + FR-only) · TanStack **Query** (→ on garde Zustand + hooks Supabase + RealtimeProvider ; reprendre seulement l'anatomie headless de TanStack **Table** v8) · Tailwind **v4** `@theme`/OKLCH (→ on reste Tailwind 3 + CSS vars `:root`) · infra hors-UI (pg_cron, jsPDF/exceljs, triggers d'audit publics, alertes Slack…) · `next-themes` toggle (nos 2 thèmes sont **figés par surface**).

> Contrainte repo confirmée : schéma `propulspace` **non exposé à PostgREST** → audit/écritures via RPC `admin_*` SECURITY DEFINER, **pas** de triggers d'audit sur schéma public. Export CSV = UTF-8 **BOM + séparateur `;`** (Excel FR).

---

## 7. Injection roadmap (consensus des 2 sources)
- **V1 (socle transverse)** : tokens sémantiques (fait en V0, à compléter) · `<KpiCard>` · trio d'états (`EmptyState`/`SkeletonRows`/`NoResults`) · `useBreakpoint`+`ResponsiveTable`+`AdaptiveDialog` · base layer ergonomie · + les 8 garde-fous (bannir gradient-text/rainbow/glass/emojis/ombres colorées ; imposer tabular-nums/dot+label/wash confiné/em-dash).
- **V2 (refonte par surface, 1 killer idea = 1 tranche verticale)**. Ordre conseillé : **Accueil + Page projet** (cœur de la promesse) → **Factures + Signatures** (actions à valeur) → **Documents + Profil** → **Onboarding + Diagnostic** (réutilisent les composants figés). Le **back-office Dark-Tech** avance en parallèle sur sa voie sombre.
