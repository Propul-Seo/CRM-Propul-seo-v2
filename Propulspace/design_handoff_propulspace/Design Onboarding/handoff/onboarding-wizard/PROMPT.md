# OnboardingWizard v2 — Brief pour intégration

> **À l'attention de Claude Code.** Ce document explique pourquoi on refait l'onboarding du portail client Propul'Space, comment il doit fonctionner, et ce qu'il faut produire concrètement. Lis-le en entier avant de toucher au code — les sections « pourquoi » conditionnent les choix techniques.

---

## Sommaire

1. [Pourquoi on refait](#1-pourquoi-on-refait)
2. [Les deux briques distinctes](#2-les-deux-briques-distinctes)
3. [Format & comportement de la modale](#3-format--comportement-de-la-modale)
4. [Schéma de base de données](#4-schéma-de-base-de-données)
5. [Arborescence des fichiers](#5-arborescence-des-fichiers)
6. [Détail des 5 étapes](#6-détail-des-5-étapes)
7. [Comportements transverses](#7-comportements-transverses)
8. [Mobile](#8-mobile)
9. [Accessibilité](#9-accessibilité)
10. [Critères d'acceptation](#10-critères-dacceptation)
11. [Hors-périmètre](#11-hors-périmètre)
12. [Où trouver les références](#12-où-trouver-les-références)

---

## 1. Pourquoi on refait

La V1 de l'OnboardingWizard (`src/modules/EspaceClient/client/onboarding/OnboardingWizard.tsx`) avait deux problèmes structurels qu'on ne peut pas patcher en surface :

**Problème 1 — Elle confond deux moments du parcours client.** Aujourd'hui, les 5 étapes alternent entre :
- de l'accueil (récap qualification, validation des coordonnées) — un moment qui dure 2-3 minutes max, qu'on fait *une fois* au premier login,
- et de la collecte opérationnelle lourde (logo, charte graphique, accès Google Analytics, créneau kickoff) — un travail qui peut prendre une heure, qu'on fait *progressivement* sur plusieurs sessions.

Les forcer dans le même wizard linéaire pénalise les deux : l'accueil paraît interminable parce qu'il faut traverser 5 étapes administratives avant de voir le portail, et la collecte opérationnelle est mal accompagnée parce qu'on ne peut pas revenir étape par étape, ni skipper celles qui ne s'appliquent pas, ni y arriver depuis un point d'entrée clair.

**Problème 2 — Le récap est vide et la première impression est ratée.** L'étape 1 actuelle est un placeholder. Or c'est *littéralement* la première chose qu'un client voit après avoir payé un acompte de 5 000 € à 20 000 €. Si cette page n'inspire pas confiance, on a perdu une partie du capital relationnel construit pendant la vente. Il faut une vraie page d'accueil avec un récap chaleureux de ce qu'on sait déjà du projet, le nom de l'AE, le contexte du devis. Pas un formulaire en plus.

**Solution.** On sépare proprement les deux briques (voir section suivante), on refait OnboardingWizard pour qu'il fasse *uniquement* le travail d'accueil — court, chaleureux, premium — et on bascule le reste sur une page dédiée du portail qu'on construit dans un ticket séparé.

---

## 2. Les deux briques distinctes

| | **OnboardingWizard v2** (ce ticket) | **Page Configuration du projet** (ticket suivant) |
|---|---|---|
| **Quand** | Au premier login, après création du compte client | Quand le client veut (depuis carte d'appel "Configurez votre projet" du dashboard) |
| **Format** | Modale full-screen au-dessus du dashboard | Page complète du portail, navigation par sections |
| **Durée** | 2-3 minutes, linéaire 5 étapes | Variable, autant de visites que nécessaire |
| **Contenu** | Bienvenue · Coordonnées · Préférences contact · Tour du portail · Confirmation | Identité visuelle · Marque & contenu · Accès techniques · Kickoff call |
| **Tonalité** | Chaleureuse, premium, "ces gens sont sérieux" | Pratique, organisée, transparente |
| **Skippable** | Oui ("Terminer plus tard") | Sans objet — pas linéaire |
| **Table DB** | `propulspace_onboarding` (nouvelle) | `propulspace_project_config` (= ancienne `propulspace_onboarding_v2` renommée) |

**Ce ticket ne couvre QUE la première colonne.** Le contenu actuel des étapes 2-5 de la V1 (Marque, Visuel, Accès, Kickoff) ne disparaît pas — il déménage vers la page Configuration du projet dans le ticket suivant. On les garde temporairement dans le repo (commit dédié) avant suppression.

---

## 3. Format & comportement de la modale

### Visuel

- **Composant** : `Dialog` de shadcn/ui (pas `Sheet` comme la V1 — c'est l'erreur principale à corriger).
- **Taille** : ~940 px de large desktop, plein écran mobile (`max-sm:max-w-full max-sm:h-[100dvh] max-sm:rounded-none`).
- **Backdrop** : on garde l'ambiance light du design system. Le dashboard du portail est visible *en arrière-plan*, légèrement flouté (~3 px de blur, opacité 0.7), avec un voile blanc à 55 % pour donner du contraste sans assombrir. **Pas de voile sombre** — c'est ce qui ferait paraître l'onboarding comme un modal corporate. On reste "à la maison".

### Structure de la modale (de haut en bas)

1. **Header** — pill brandée "Propul'SEO" à gauche, séparateur, label "Onboarding · X/5", bouton "Terminer plus tard" à droite (pill outline avec ×).
2. **Progress dots** — 5 segments fins (4 px) en dégradé violet. Le segment actif est en gradient `primary → primary-deep`, les passés en violet plein, les futurs en `bg-subtle`.
3. **Content area** — scrollable, padding 28 px desktop / 20 px mobile.
4. **Footer** — bouton "Précédent" en ghost (à partir de l'étape 2), à droite : mention `~ X min` (avec icône `Clock`) + bouton primary.

### Animation

On utilise `framer-motion` (déjà dans le projet) :

- **Entrée de la modale** : `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}`, transition 320 ms `cubic-bezier(0.16, 1, 0.3, 1)` (= `--ps-ease-out` du DS).
- **Transition entre étapes** : `AnimatePresence mode="wait"` + slide horizontal de ±16 px + fade, 200 ms `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Pas de spring, pas de bounce.** Le portail est calme.

### Ouverture / fermeture

- **Ouverture automatique** au login si `clients.onboarding_completed_at IS NULL` ET `dismissed_count < 3`.
- **Fermeture par "Terminer plus tard"** : incrémente `dismissed_count`, marque `last_dismissed_at`, ferme. Réapparaîtra au prochain login si seuil pas atteint.
- **Fermeture par `Esc`** : équivalent à "Terminer plus tard".
- **Fermeture par "Accéder à mon espace"** (étape 5) : marque `completed_at = now()`, sync `users.onboarding_completed = true`, ferme, redirige vers `/espace-client`, toast discret "Bienvenue, {prénom}. Votre espace est prêt."

---

## 4. Schéma de base de données

À créer dans `supabase/migrations/YYYYMMDD_onboarding_v2_split.sql` :

```sql
-- 1. Renommage : l'ancienne table devient celle de la page Configuration du projet.
ALTER TABLE propulspace_onboarding_v2 RENAME TO propulspace_project_config;

-- 2. Nouvelle table dédiée au wizard d'accueil court.
CREATE TABLE propulspace_onboarding (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          uuid NOT NULL REFERENCES public.projects_v2(id) ON DELETE CASCADE,
  client_user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Étape 2 — miroir éditable des champs users (autosave répliquée).
  first_name          text,
  last_name           text,
  phone               text,
  company             text,

  -- Étape 3 — préférences de communication.
  preferred_channel   text CHECK (preferred_channel IN ('email','phone','whatsapp')),
  availability_slots  text[] DEFAULT '{}'::text[],   -- sous-ensemble de {'morning','afternoon','evening'}
  email_notifications boolean DEFAULT true,

  -- Cycle de vie.
  current_step        int DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5),
  completed_at        timestamptz,
  dismissed_count     int DEFAULT 0,
  last_dismissed_at   timestamptz,

  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  UNIQUE (project_id)
);

-- 3. RLS — le client ne voit que sa row, admin/AE voient tout.
ALTER TABLE propulspace_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY onboarding_client_select ON propulspace_onboarding FOR SELECT USING (
  project_id = (SELECT portal_linked_project_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY onboarding_client_upsert ON propulspace_onboarding FOR ALL USING (
  project_id = (SELECT portal_linked_project_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY onboarding_admin_all ON propulspace_onboarding FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','ae'))
);

-- 4. Index pour le SELECT au login (project_id est UNIQUE mais on garde un index explicite).
CREATE INDEX idx_onboarding_project ON propulspace_onboarding(project_id);

-- 5. Commentaire de cohérence pour la colonne mirroir.
COMMENT ON COLUMN public.users.onboarding_completed IS
  'Mirror de propulspace_onboarding.completed_at IS NOT NULL — gardé pour les requêtes rapides au login.';
```

**Pourquoi dupliquer first_name/last_name/phone/company entre `users` et `propulspace_onboarding` ?** Parce que l'utilisateur peut modifier ses coordonnées pendant l'onboarding *sans valider* la modale jusqu'à la fin. On veut autosave ces modifs sans toucher tout de suite à la source de vérité (`users`) — on sync seulement quand l'utilisateur clique "Suivant" et que la valeur est différente du miroir.

---

## 5. Arborescence des fichiers

### À créer

```
src/modules/EspaceClient/client/onboarding/
├── OnboardingWizard.tsx              ← À RÉÉCRIRE de zéro (le squelette existant ne sert plus)
├── useOnboarding.ts                  ← À RÉÉCRIRE (cible propulspace_onboarding, plus propulspace_onboarding_v2)
├── OnboardingBanner.tsx              ← À AJUSTER (apparaît après 3 dismissals, lit la nouvelle table)
└── steps/
    ├── OnboardingStep1Welcome.tsx        ← NEW · split chaleureux + récap qualification
    ├── OnboardingStep2Contact.tsx        ← NEW · carte d'identité éditable inline
    ├── OnboardingStep3Preferences.tsx    ← NEW · canal + plages + notif (dense 2-col)
    ├── OnboardingStep4Tour.tsx           ← NEW · carrousel spotlight 7 sections
    ├── OnboardingStep5Done.tsx           ← NEW · halo lumineux + typo display
    └── previews/                         ← NEW · 7 mini-mocks pour le carrousel Step 4
        ├── DashboardPreview.tsx
        ├── ProjectPreview.tsx
        ├── DocumentsPreview.tsx
        ├── InvoicesPreview.tsx
        ├── SignaturesPreview.tsx
        ├── ProfilePreview.tsx
        └── HelpPreview.tsx
```

### À supprimer (après avoir migré le contenu vers la page Configuration du projet)

```
src/modules/EspaceClient/client/onboarding/steps/
├── OnboardingStep1Recap.tsx     ← le récap garde sa logique mais déménage dans Step1Welcome (format différent)
├── OnboardingStep2Brand.tsx     ← déménage en section "Marque & contenu" de la page config
├── OnboardingStep3Visual.tsx    ← déménage en section "Identité visuelle"
├── OnboardingStep4Access.tsx    ← déménage en section "Accès techniques"
└── OnboardingStep5Kickoff.tsx   ← déménage en section "Kickoff call"
```

Fais un commit dédié `chore: archive old onboarding steps before config page migration` qui les garde *avant* la suppression — ils servent de base au ticket suivant.

---

## 6. Détail des 5 étapes

> Toutes les copies sont à utiliser **verbatim**. Les espacements, tailles, couleurs sont visibles sur les mockups (`mockups/index.html` du bundle).

### Étape 1 — Bienvenue (`OnboardingStep1Welcome`)

**Objectif** — Accueillir chaleureusement, démontrer qu'on a bien lu le questionnaire de qualification, donner le ton premium.

**Layout** — split 2 colonnes desktop, stack vertical sur mobile.

**Colonne gauche (salutation chaleureuse)** :
- Tile 56 × 56 px violet gradient avec `Sparkles` (Lucide), `boxShadow` violet diffus.
- H1 gradient text avec line break : `"Bienvenue,\n{firstName}."` — taille 30 px, weight 600, letter-spacing −0.03em, line-height 1.1.
- Paragraphe 1 (15 px) : *"On est ravis de démarrer **{company}** avec vous."*
- Paragraphe 2 (13.5 px) : *"Votre espace est prêt. Quelques minutes ensemble pour vérifier nos infos, caler vos préférences, et vous présenter votre nouveau Propul'Space."*
- **Carte AE sobre** en bas (background `bg-subtle`) : avatar 34 px avec initiales sur gradient orange-brun, nom "Lyes Triki · votre AE", sous-titre factuel "Suit votre dossier depuis le devis · répond sous 1 h ouvrée". **Pas de citation entre guillemets** — c'est de la copy fake et le client le sent.

**Colonne droite (récap visuel)** :
- Header de section : eyebrow violet `"Récap de votre demande"` à gauche, pill verte "✓ Pré-rempli" à droite.
- **Carte hero** (en haut) : logo placeholder = monogram de la première lettre du nom de société dans un carré dégradé doré (`#fef9c3 → #fde68a`) en serif italic, eyebrow `"Votre projet"`, nom de société (17 px, weight 700), secteur avec icône `Gem`.
- **Grille 2×2 de mini-cards** : Objectif (`Target`, bleu), Budget (`Wallet`, vert), Délai (`Calendar`, orange), Modules (`Shapes`, violet — affiche "N à construire").
- **Carte Modules à construire** : eyebrow + chips violet-subtle avec les noms exacts des fonctionnalités issues de la qualification (`E-shop`, `Blog SEO`, `Prise de RDV`, etc.).

**Source des données** — jointure sur `propulspace_qualifications` du même `project_id`. Le récap est *read-only ici*. La modification de ces champs (changement de scope projet) passe par l'AE, pas par l'onboarding.

**CTA** — "Commencer" (pas "Suivant" — c'est l'amorce du parcours).

### Étape 2 — Vos coordonnées (`OnboardingStep2Contact`)

**Objectif** — Permettre au client de valider en 10 secondes que ce qu'on a sur lui est juste, sans frottement.

**Format** — Carte d'identité visuelle, *une seule carte* qui contient tout. Header puis lignes éditables.

**Header** — Background gradient violet-subtle → blanc, avatar circulaire 48 px avec initiales sur gradient violet, nom complet, sous-titre `"{company} · client depuis le {created_at:DD MMM YYYY}"`, pill "✓ Pré-rempli" à droite.

**Lignes (5)** — Chacune en grid `26px 110px 1fr 24px` :
- Icône (gauche, muted)
- Label (110 px, muted, 12.5 px)
- Valeur (tabular nums, weight 600)
- Icône d'action (droite — `Pencil` si editable, `Lock` si pas)

| Champ | Icône | Éditable | Comportement |
|---|---|---|---|
| Prénom | `User` | Oui | Clic → input inline, blur → autosave |
| Nom | `User` | Oui | Idem |
| Email | `Mail` | **Non** | Affiché avec hint `"· Login"` à droite |
| Téléphone | `Phone` | Oui | Idem prénom |
| Société | `Building` | Oui | Idem prénom |

**Note en bas** (12 px muted) : *"Email non modifiable — c'est votre identifiant de connexion. Pour le changer, contactez votre AE."*

**Persistance** — Sur blur de chaque input, deux UPDATE en parallèle : (1) `propulspace_onboarding.{field}`, (2) `public.users.{field}` si la valeur a changé. Pas de bouton "Sauvegarder" — tout est auto.

### Étape 3 — Préférences de communication (`OnboardingStep3Preferences`)

**Objectif** — Recueillir 3 préférences utiles à la suite (canal préféré, plages horaires, opt-in notifications) sans alourdir.

**Layout** — Grid `180px 1fr` (label gauche + control droite), 3 lignes séparées par divider léger.

**Ligne 1 — Canal préféré** (mutex)
- Label : "Canal préféré" (H2 13.5 px) + sub-label `"Comment vous prévenir en priorité."` (11.5 px muted)
- 3 pills cliquables, mutuellement exclusives :

| Option | Icône | Active = |
|---|---|---|
| Email | `Mail` | fond violet plein, texte blanc |
| Téléphone | `Phone` | idem |
| WhatsApp | `MessageSquare` | idem |

**Ligne 2 — Plages où vous joindre** (multi)
- Label : "Plages" + sub-label `"Quand vous joindre."`
- 3 pills cochables :

| Option | Sous-texte |
|---|---|
| Matin | 8 h – 12 h |
| Après-midi | 14 h – 18 h |
| Soir | 18 h – 20 h |

Active = fond violet-subtle, texte violet-deep, checkmark à gauche. Multi-sélection.

**Ligne 3 — Notifications** (toggle)
- Label : "Notifications" + sub-label `"Par email, événements clés uniquement."`
- Toggle shadcn `Switch` + texte dynamique :
  - ON → *"Activé · vous recevrez livrables, factures, signatures à effectuer"*
  - OFF → *"Désactivé · uniquement notifications dans l'app"*

**Defaults** — `preferred_channel = 'email'`, `availability_slots = ['afternoon']`, `email_notifications = true`. Le client peut traverser cette étape sans rien toucher.

### Étape 4 — Petit tour du propriétaire (`OnboardingStep4Tour`)

**Objectif** — Réduire le syndrome de la page blanche. Le client doit *voir* à quoi ressemblent les 7 sections avant d'y atterrir, sans devoir cliquer aveuglément.

**Format** — Carrousel spotlight :
- Carte centrale large (200 % de l'unité), détaillée.
- Carte précédente *peeking* à gauche (92 % scale, 55 % opacity).
- Carte suivante *peeking* à droite (idem).
- Sous le carrousel : indicator dots — segment actif large (18 px), autres petits (6 px).
- Navigation : clic sur peeking ou dot, et swipe horizontal sur mobile (`useSwipeable` ou équivalent).

**Anatomie de la carte featured** :
1. Tile icon 44 × 44 px violet-subtle, en haut à gauche
2. Compteur eyebrow "01 / 07" tabular en haut à droite, muted
3. Title H4 (17 px, weight 700)
4. Description 1 ligne (13 px secondary)
5. **`<TabPreview />` mini-mock** — la pièce critique de cette étape

**Les 7 sections** :

| key | icône Lucide | title | desc | preview |
|---|---|---|---|---|
| `dashboard`  | `LayoutDashboard` | Tableau de bord | Vue d'ensemble · KPI, actions, dernière activité. | `<DashboardPreview/>` |
| `project`    | `FolderKanban`    | Mon projet      | Timeline des 8 phases et avancement détaillé. | `<ProjectPreview/>` |
| `documents`  | `FileText`        | Documents       | Livrables, briefs, ressources partagées. | `<DocumentsPreview/>` |
| `invoices`   | `Receipt`         | Factures        | Suivi des paiements et acomptes. | `<InvoicesPreview/>` |
| `signatures` | `PenLine`         | Signatures      | Documents à signer électroniquement. | `<SignaturesPreview/>` |
| `profile`    | `UserCircle`      | Profil          | Vos infos, préférences et accès. | `<ProfilePreview/>` |
| `help`       | `HelpCircle`      | Aide            | Questions fréquentes et contact direct. | `<HelpPreview/>` |

**Les `<TabPreview />` sont la clé.** Ce ne sont **pas des screenshots** (statiques, vieillissent mal), **pas des iframes** (lourdes, casse l'animation). Ce sont de **mini-compositions JSX statiques** qui reproduisent l'ossature visuelle de chaque section, à environ 96 px de hauteur, fond `bg-subtle`, bord soft. Le mockup contient le rendu cible — par exemple :

- **DashboardPreview** : une bande "hero" miniature avec eyebrow + titre + radial violet, puis 3 tuiles KPI avec valeurs factices (42 h, 8, 8 000 €).
- **ProjectPreview** : 4 points connectés horizontalement représentant les phases (Devis ✓, Onboarding ●, Production ○, Livraison ○), avec barre de progression violette à 30 %.
- **DocumentsPreview** : 3 rows compactes (icône doc + nom + date + flèche download).
- **InvoicesPreview** : 2 cartes facture avec ID monospaced + montant tabular + pill statut (À payer / Payée).
- **SignaturesPreview** : 1 carte à signer warning + 1 row signée muted.
- **ProfilePreview** : avatar + nom + 2 setting rows.
- **HelpPreview** : 3 rows FAQ + petit pill "Contact" en haut.

**Hint en bas** (bandeau violet-subtle pleine largeur) : *"Bouton bleu en bas à droite de chaque page : votre raccourci pour nous contacter, n'importe quand."*

**CTA** — "J'ai compris" (pas "Suivant" — c'est une étape de découverte, pas de saisie).

### Étape 5 — Tout est prêt (`OnboardingStep5Done`)

**Objectif** — Marquer le coup, donner envie d'explorer, sans tomber dans le Disney.

**Layout** — Centré verticalement, no récap, no formulaire.

**Décor animé** :
- **Halo radial violet pulsant** derrière le texte, 360 px de diamètre, gradient `rgba(124,58,237,.28) 0% → rgba(124,58,237,.04) 50% → transparent 70%`. Animation CSS `@keyframes ps-halo-pulse` : scale 1 ↔ 1.18, opacité 0.65 ↔ 1, durée 3 s, ease-in-out, infinite.
- **5 sparks** : petits dots violet (3-5 px) montant et fade-out en boucle. Animation `ps-spark-rise` 2.6 s avec delays décalés (0 / 0.3 / 0.6 / 1.0 / 1.4 s).

**Typographie** :
- Eyebrow violet uppercase letter-spaced : `"C'est parti"`
- **H1 grand format** 44 px weight 800, gradient `fg → primary-deep` : `"Bienvenue à bord,"`
- **H1 italic 2e ligne**, gradient `primary → primary-deep` : `"{firstName}."`
- Paragraphe 14 px max-width 380 px : *"Votre espace vous attend. Une dernière étape avant de démarrer la production : remplir la configuration projet — depuis le tableau de bord."*

**Au clic sur "Accéder à mon espace"** :
1. `UPDATE propulspace_onboarding SET completed_at = now(), current_step = 5 WHERE project_id = $1`
2. `UPDATE public.users SET onboarding_completed = true WHERE id = $1`
3. `onOpenChange(false)` — ferme la modale (avec son animation de sortie)
4. Navigation vers `/espace-client` (le dashboard)
5. Toast discret en bas : *"Bienvenue, {prénom}. Votre espace est prêt."* (auto-dismiss 4 s)

---

## 7. Comportements transverses

### Autosave

Réutilise le pattern du `useOnboarding` existant (debounce 500 ms via `setTimeout`), mais cible la nouvelle table. À chaque modification :
1. Update local state immédiatement (UI optimiste)
2. Debounce 500 ms
3. UPDATE Supabase avec uniquement le champ modifié
4. Si erreur, expose-la dans `saveError` pour que le composant l'affiche

Si tu vois apparaître plusieurs autosaves très rapprochés (cas du toggle qui change vite), regroupe-les avant de fire — un seul UPDATE avec un patch object.

### Resume

À l'ouverture de la modale, lis `current_step` de la row Supabase et `setStep(row.current_step ?? 1)`. À chaque navigation, debounce 500 ms puis `UPDATE current_step`.

### Skip-step

**Aucune validation bloquante.** Les Steps 2 et 3 ont tous des defaults sensibles, le client peut traverser sans rien modifier. Le bouton "Suivant" est *toujours* actif. L'idée : si le client est pressé, il valide en 30 secondes ; si il a le temps, il peaufine.

### "Terminer plus tard"

Comportement progressif anti-frustration :
- **1er à 2e dismissal** : la modale réapparaît au prochain login (avec resume à `current_step`).
- **3e dismissal et au-delà** : on n'ouvre plus automatiquement. À la place, on affiche `<OnboardingBanner />` dans le dashboard — une bande non-bloquante avec progression + lien "Reprendre l'onboarding".

Cette logique est dans `useOnboarding.ts` : la fonction `shouldOpenAutomatically()` retourne `false` si `dismissed_count >= 3`. Le composant racine du portail (`PortalShell.tsx`) consomme ce hook et décide d'ouvrir ou non.

---

## 8. Mobile

Le mockup `mockups/index.html` contient une colonne dédiée iPhone (376 × 780) pour chaque étape. À reproduire :

- **Modale plein écran** sur `< 640px` : override Tailwind `max-sm:max-w-full max-sm:h-[100dvh] max-sm:rounded-none`.
- **Footer sticky** avec `padding-bottom: max(env(safe-area-inset-bottom), 1rem)`.
- **Step 1** : split 2-col devient stack vertical (left bloc puis right bloc).
- **Step 3** : grid 2-col devient stack vertical, pills passent en colonne pleine largeur avec icône + label + sub-label sur la même ligne.
- **Step 4 carrousel** : on **cache les peeking cards** sur mobile (`hidden sm:block`), on garde seulement la featured pleine largeur. Swipe horizontal pour naviguer. Indicator dots restent visibles.
- **Step 5** : taille du H1 réduite (28-30 px au lieu de 44 px), halo plus petit.

---

## 9. Accessibilité

- `Dialog` shadcn fournit déjà le focus trap et `Esc` to dismiss. **Ne pas** désactiver ces comportements.
- Tous les boutons interactifs : `:focus-visible` doit afficher un ring violet 2 px à 2 px d'offset (utilise la classe utility `ps-focus` du DS).
- Eyebrow "Étape X/5" : enveloppe dans un `<div role="status" aria-live="polite">` pour que les lecteurs d'écran l'annoncent à chaque transition.
- Step 2 — Email read-only : `aria-readonly="true"` + `aria-describedby` pointant vers la note "non modifiable".
- Step 3 — pills : `role="radio"` pour le canal (mutex), `role="checkbox"` pour les plages. Toggle notifications : `role="switch"` + `aria-checked`.
- Step 4 — carrousel : `role="region"` + `aria-roledescription="carrousel"`, chaque carte `aria-current="true"` quand featured, boutons précédent/suivant `aria-label` explicites.
- Step 5 — animations : `prefers-reduced-motion: reduce` désactive halo pulsant et sparks (mais garde le fade-in initial).

Cible : Lighthouse a11y ≥ 95 sur la modale ouverte.

---

## 10. Critères d'acceptation

- [ ] Migration SQL passe à blanc et avec données existantes. `propulspace_onboarding_v2` est renommée, la nouvelle table existe avec ses RLS testées (un user client ne voit que sa row, un admin voit tout).
- [ ] Au premier login d'un compte fraîchement créé, la modale s'ouvre automatiquement.
- [ ] Les 5 étapes sont navigables ← →, l'autosave est visible dans devtools (un UPDATE par champ modifié, debounce 500 ms).
- [ ] "Terminer plus tard" ferme la modale et incrémente `dismissed_count`. Vérifiable côté Supabase.
- [ ] Au 3e dismissal, plus d'ouverture automatique au login. À la place, `<OnboardingBanner />` apparaît dans le dashboard.
- [ ] "Accéder à mon espace" marque comme complète (`completed_at` non null) et la modale ne réapparaît plus jamais.
- [ ] Step 4 carrousel : les 7 sections naviguent par clic sur peeking, par clic sur dots, et par swipe horizontal mobile. Chaque featured affiche sa mini-preview JSX.
- [ ] Sur viewport 375 × 812 (iPhone SE), tout est utilisable : pas de scroll horizontal, footer sticky visible, peeking cards cachées en Step 4.
- [ ] Aucun import des anciens `OnboardingStepXBrand/Visual/Access/Kickoff` ne subsiste dans le nouveau wizard.
- [ ] Aucune référence à `propulspace_onboarding_v2` ailleurs que dans la migration de renommage.
- [ ] Lighthouse a11y ≥ 95 modale ouverte. Aucune erreur axe-core en dev.

---

## 11. Hors-périmètre

À **ne pas faire** dans ce ticket — ce sont des tickets séparés ou pas du tout dans ce sprint :

- ❌ La page **Configuration du projet** (ticket suivant — contiendra le contenu actuel des steps 2-5 de la V1).
- ❌ Le **cron de relance par email** pour les onboardings non complétés (ticket marketing / Brevo).
- ❌ Le **tracking analytics** (Plausible / Mixpanel) des transitions d'étape. Sera ajouté en P+1 quand la baseline sera stable.
- ❌ Un **framework A/B test** — les variantes ont été tranchées au design (Var B partout), on ne réintroduit pas la dimension de choix.
- ❌ La **personnalisation du contenu d'accueil par segment** (e-commerce vs B2B vs vitrine). À discuter quand on aura plus de data.
- ❌ Le **stockage du parcours utilisateur** (durée par étape, temps cumulé). Pas nécessaire pour la V2 minimale.

---

## 12. Où trouver les références

| Ressource | Chemin |
|---|---|
| **Mockups haute-fi des 5 étapes + iPhone** | `mockups/index.html` du bundle (ouvre-le dans un navigateur) |
| **Design tokens** (couleurs, type, espacements, motion) | `tokens/colors_and_type.css` du bundle, ou `src/modules/EspaceClient/shared/layouts/portal-theme.css` du repo CRM |
| **Composants shadcn déjà en place** | `src/components/ui/{dialog,button,input,label,radio-group,checkbox,switch}.tsx` |
| **Patterns existants à réutiliser** | `useOnboarding.ts` (autosave debounce), `OnboardingBanner.tsx` (à ajuster, pas à recréer) |
| **Icônes** | Exclusivement Lucide. Stroke 1.9 par défaut, 2.4 en active. Pas de SVG custom, pas d'emoji. |
| **Données de test** | Le mockup utilise "Eméline Rousseau / Précieuse Joaillerie" — purement illustratif, remplace par les vraies données du `propulspace_qualifications` joint au project_id courant. |

Pour ouvrir les mockups :
```bash
cd handoff/onboarding-wizard/mockups
python3 -m http.server 8000
# Puis ouvre http://localhost:8000
```

Double-clic sur un artboard pour le voir en plein écran. Les flèches `←` `→` naviguent entre les artboards, `Esc` referme le focus.

---

**Quand tu es bloqué** : si une décision design n'est pas explicite dans les mockups ou ce document, choisis l'option la plus calme et la plus DS-fidèle, et flag-la dans la PR pour qu'on tranche.
