# Refonte UI/UX Propul'Space — 6 sections × 5 variantes

> Document de travail produit en automode (session 2026-05-22).
> Aucun code modifié. Pure phase concept/design.
> Audit source : voir SESSION.md + audit subagent du 2026-05-22.

---

## Contraintes communes à toutes les variantes

- **DA Sky Aurora** déjà en place : glassmorphism, gradients violets `--ps-primary` (#7C3AED), glow diffus, animations `ps-fade-in`/`ps-halo`.
- **Stack** : React + Tailwind + shadcn/ui (Sheet, Badge, Button).
- **Données** : tables `projects_v2`, `propulspace_*` (steps/invoices/signatures/documents).
- **Pas de retour serveur** côté variantes : on travaille uniquement ce qui se voit.
- **Mobile-first imposé** : 90% des clients consultent depuis téléphone selon ton hypothèse.

---

## Comment lire ce document

Chaque section a **5 variantes** numérotées (V1 à V5) avec :
- 🎯 **Intention** — l'angle UX (ce qu'on veut faire ressentir)
- 🖼 **Mockup ASCII** — aperçu visuel
- ✅ **Forces** / ⚠️ **Faiblesses**
- 🧩 **Composants à créer/modifier**

À la fin : tableau récapitulatif + recommandation.

---

# 1. ACCUEIL (Dashboard)

État actuel : Hero + WelcomeBanner + 3 KpiTiles + Activité récente (5 derniers items).

## V1 — Cockpit personnel

🎯 **Intention** : le client voit immédiatement *ce qu'il doit faire*. Les actions urgentes prennent le centre, les KPI passent en bandeau condensé.

```
┌─────────────────────────────────────────────────────────┐
│  ▒░▒  Aurora gradient background (3 couches blurées)    │
│                                                         │
│  Bonjour, Marc                                          │
│  Projet Refonte SEO · Phase 2/5                         │
│                                                         │
│  ┌─ AVANCEMENT 42% ──────────────────────────────────┐  │
│  │ ▓▓▓▓▓▓░░░░░░░░░ Prochaine étape : 02 juin        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ⚡ 2 actions urgentes                                  │
│  ┌─────────────────────────┬───────────────────────────┐│
│  │ 🖊  Devis à signer      │ 💳 Facture #2024-08      ││
│  │ « Phase 2 — 4 200 € »   │ « Acompte 30% — 1260€ » ││
│  │ [Signer →]              │ [Payer →]                ││
│  └─────────────────────────┴───────────────────────────┘│
│                                                         │
│  📋 Activité récente              Voir tout →           │
│  ● 12:30  Lyes a déposé "Audit technique v2.pdf"        │
│  ● 09:15  Facture #2024-07 marquée payée                │
│  ● Hier   Signature reçue — Contrat-cadre               │
│                                                         │
│  👥 Votre équipe Propul'SEO                             │
│  [LT] Lyes · Chef de projet     [AM] Anne · Designer    │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : focus 100% sur le "à faire maintenant", réduit le nombre de clics. Affiche les contacts agence (humanise).
⚠️ **Faiblesses** : si aucune action urgente, la zone CTA tombe à vide → faut un état "tout est à jour" sympa.
🧩 **Composants** : `UrgentActionCard` (nouveau, large CTA), `TeamMemberPill` (nouveau), refonte mineure du `Hero`.

---

## V2 — Storytelling immersif

🎯 **Intention** : transformer le suivi de projet en *voyage narratif*. Le client "vit" son projet, pas une checklist.

```
┌─────────────────────────────────────────────────────────┐
│ ▒▒░░ Aurora vibrante haut + glow violet bas-droit       │
│                                                         │
│        Refonte SEO de votre boutique                    │
│        Marc · Démarré le 14 mars · J+72                 │
│                                                         │
│  ┌─ TIMELINE INTERACTIVE ─────────────────────────────┐ │
│  │                                                   │ │
│  │  ✓──────●──────○──────○──────○                    │ │
│  │ Brief   Audit   Plan   Build  Livraison           │ │
│  │ ✓ fait  EN COURS                                  │ │
│  │                                                   │ │
│  │  → On finalise l'audit cette semaine.             │ │
│  │    Lyes vous présente les résultats vendredi.     │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────┬───────────────┬───────────────────┐ │
│  │ Budget        │ Documents     │ Signatures        │ │
│  │ 4200€ / 14000€│ 12 livrables  │ 1 en attente      │ │
│  │ ──30%──       │ +2 cette sem. │ 🔴 Signez le      │ │
│  │               │               │   contrat         │ │
│  └───────────────┴───────────────┴───────────────────┘ │
│                                                         │
│  ✨ Aurora signature flottante (animation douce)        │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : très différenciant, humanise le projet, rassure le client. DA Sky Aurora prend tout son sens. "J+72" crée un sentiment d'avancée.
⚠️ **Faiblesses** : timeline horizontale = casse-tête responsive mobile. Storytelling lourd à maintenir (qui rédige les phrases narratives ?).
🧩 **Composants** : `JourneyTimeline` (timeline horizontale + auto-scroll), `NarrativeBlock` (texte généré depuis steps), `MetricCard` (avec aurora glow).

---

## V3 — Hub structuré (bento)

🎯 **Intention** : équilibre entre action et vision. Grille bento moderne (Linear/Vercel/Raycast), dense mais respirante.

```
┌─────────────────────────────────────────────────────────┐
│  Bonjour Marc          [🔔 2]  [⚙]  [LT]                │
│  ───────────────────────────────────────────────────────│
│                                                         │
│  ┌──────────────────────────────────┬──────────────────┐│
│  │ Projet Refonte SEO          ●●●○○│ ⚡ À faire (2)   ││
│  │ Phase 2/5 — Audit & stratégie    │                  ││
│  │                                  │ 🖊 Signer devis  ││
│  │ ▓▓▓▓▓▓░░░░░░░░░  42%             │ 💳 Payer #08     ││
│  │                                  │                  ││
│  │ Prochain jalon : Présentation    │ [Tout voir →]    ││
│  │ audit — vendredi 02 juin         │                  ││
│  └──────────────────────────────────┴──────────────────┘│
│                                                         │
│  ┌───────────┬────────────┬──────────┬────────────────┐ │
│  │ 📄 12     │ 🖊 3 sign. │ 💰 1260€ │ 👥 Équipe      │ │
│  │ documents │ 1 attente  │ payés    │ Lyes + Anne    │ │
│  └───────────┴────────────┴──────────┴────────────────┘ │
│                                                         │
│  📋 Activité récente                          Voir +    ││
│  ┌─────────────────────────────────────────────────────┐│
│  │ ● Aujourd'hui                                       ││
│  │   12:30  Lyes · Document déposé — Audit v2.pdf      ││
│  │ ● Hier                                              ││
│  │   16:45  Signature reçue — Contrat-cadre            ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : pattern moderne et éprouvé. Équilibre actions + vision + activité. Bento accepte d'ajouter/retirer des cartes sans casser. Très bon support mobile (chaque carte = un bloc empilable).
⚠️ **Faiblesses** : risque de "encore une dashboard SaaS" si l'exécution visuelle manque de soin.
🧩 **Composants** : `BentoCard` (variants small/medium/large), `ActivityTimeline` (refonte verticale), `MiniStat`.

---

## V4 — Journal de projet (timeline-first)

🎯 **Intention** : raconter ce qui se passe sur le projet *chronologiquement*. Le client voit le projet comme un fil d'actualités, façon réseaux sociaux pros (Linkedin/Notion).

```
┌─────────────────────────────────────────────────────────┐
│  Marc Dupont · Refonte SEO Boutique                     │
│  ●●●○○ Phase 2/5 — Audit                                │
│  ───────────────────────────────────────────────────────│
│                                                         │
│  ┌─ ÉPINGLÉ ─────────────────────────────────────────┐  │
│  │ ⚠ 2 actions vous attendent                       │  │
│  │   • Signer le devis Phase 2 (4 200 €)            │  │
│  │   • Régler l'acompte (1 260 €)         [Voir →]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ─── AUJOURD'HUI ───                                    │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [LT] Lyes · 12:30                                   ││
│  │ 📄 Nouveau document déposé                          ││
│  │    « Audit technique v2.pdf » (2.4 Mo)              ││
│  │    [Télécharger]                                    ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Système · 09:15                                     ││
│  │ ✓ Facture #2024-07 marquée payée — Merci !          ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ─── HIER ───                                           │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [AM] Anne · 16:45                                   ││
│  │ ✏ Étape "Audit technique" passée à : terminée       ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│           [ Voir plus ]                                 │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : très humain, le client "ressent" l'activité agence. Format social familier. Excellent sur mobile (cartes empilées). Met en valeur le travail invisible de l'équipe.
⚠️ **Faiblesses** : la consultation rapide des KPI nécessite de scroller (pas en un coup d'œil). Demande que l'agence génère bien des events réguliers (sinon le feed paraît mort).
🧩 **Composants** : `FeedCard` (variants : doc / step / payment / signature / message), `FeedGroup` (par jour), `PinnedActions` (en haut, sticky).

---

## V5 — Tableau de bord radial (pilote)

🎯 **Intention** : un visuel central fort (gauge radiale) qui synthétise *en 1 image* l'état du projet. Esthétique premium "espace de pilotage".

```
┌─────────────────────────────────────────────────────────┐
│  ▒░  Aurora layer + halo violet centré                  │
│                                                         │
│      Bonjour, Marc — Refonte SEO                        │
│      Phase 2/5 · Audit & stratégie                      │
│                                                         │
│                  ╭─────────────╮                        │
│                ╱  ●  ●  ○  ○  ○  ╲                      │
│              ╱                     ╲                    │
│             │       42 %            │                   │
│             │   avancement          │                   │
│             │                       │                   │
│              ╲   Prochaine étape   ╱                    │
│                ╲ 02 juin (J-11)  ╱                      │
│                  ╰─────────────╯                        │
│                                                         │
│  ┌──────────────┬──────────────┬─────────────────────┐ │
│  │ ⚡ 2 actions │ 📄 12 docs   │ 💳 1260 € payés     │ │
│  │   urgentes   │              │                     │ │
│  │ [Voir →]     │ [Voir →]     │ [Voir →]            │ │
│  └──────────────┴──────────────┴─────────────────────┘ │
│                                                         │
│  Dernière activité : Lyes a déposé un document · 12:30  │
│  [Voir le journal complet →]                            │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : impact visuel fort, premium, mémorable. La jauge radiale est un focal point qui rassure le client. Très bon pour la communication agence ("Vous avez vu votre nouveau dashboard ?").
⚠️ **Faiblesses** : un visuel central fort = peu de place pour le reste. Si le projet est complexe (multi-jalons), la jauge simplifie trop. Demande un SVG/canvas custom (effort de dev plus élevé).
🧩 **Composants** : `RadialProgressGauge` (SVG animé, ring multi-segments par phase), `QuickAccessCard`, `LastActivityFooter`.

---

# 2. PROJET (suivi & avancement)

État actuel : Hero + Infos projet (grid 2x2) + Référent agence + Timeline verticale (TimelineStep).

## V1 — Timeline verticale enrichie

🎯 **Intention** : garder la timeline existante mais l'enrichir visuellement. Chaque étape devient une "carte d'étape" avec son contexte, ses livrables, son responsable.

```
┌─────────────────────────────────────────────────────────┐
│  Refonte SEO Boutique                                   │
│  ●●●○○ Phase 2/5 — En cours                             │
│                                                         │
│  ┌─ INFOS PROJET ────────────────────────────────────┐  │
│  │ Démarrage    Livraison prévue   Type              │  │
│  │ 14 mars      30 août             [SEO][Site]      │  │
│  │                                                   │  │
│  │ Référent : [LT] Lyes Triki — Chef de projet       │  │
│  │ ✉ lyes@propulseo-site.com   📱 WhatsApp           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ETAPES DU PROJET                                       │
│                                                         │
│  ┌─ ✓ Brief et cadrage ──────────────────────────────┐  │
│  │   Du 14 mars au 22 mars · 8 jours                 │  │
│  │   ✅ Terminé · Livrable : Cahier des charges      │  │
│  └───────────────────────────────────────────────────┘  │
│       │                                                 │
│  ┌─ ● Audit technique ───────────────────────────────┐  │
│  │   Démarré le 22 mars · J+62                       │  │
│  │   🔵 EN COURS — Lyes finalise le rapport          │  │
│  │   Livrables attendus : Audit SEO + plan d'action  │  │
│  │   [Voir les docs liés →]                          │  │
│  └───────────────────────────────────────────────────┘  │
│       │                                                 │
│  ┌─ ○ Stratégie & priorisation ──────────────────────┐  │
│  │   Prévu : 02 juin → 15 juin                       │  │
│  │   À venir                                         │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : familier, lisible, progressif. Le client voit clairement où on en est et ce qui suit. Compatible 100% avec les données existantes (`propulspace_project_steps`).
⚠️ **Faiblesses** : peut paraître long si le projet a 10+ étapes. Pas très "wow".
🧩 **Composants** : refonte `TimelineStep` → `StepCard` avec slot livrables + responsable + contexte.

---

## V2 — Gantt horizontal compact

🎯 **Intention** : vue calendaire macro. Le client voit l'ensemble du projet *dans le temps*, avec les chevauchements et dépendances.

```
┌─────────────────────────────────────────────────────────┐
│  Refonte SEO · Vue calendaire                           │
│  Démarrage 14 mars · Livraison 30 août · J+72           │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │       Mars   Avril   Mai    Juin   Juil   Août      ││
│  │       │     │      │      │      │      │           ││
│  │ Brief ▓▓▓                                           ││
│  │ Audit    ▓▓▓▓▓▓▓▓▓●                                 ││
│  │ Strat              ░░░░░░░                          ││
│  │ Build                       ░░░░░░░░░░              ││
│  │ Livr.                                  ░░░░         ││
│  │                                                     ││
│  │       ──── aujourd'hui (22 mai) ────                ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  CLIQUEZ UNE ÉTAPE                                      │
│  ┌─────────────────────────────────────────────────────┐│
│  │ ● Audit technique                                   ││
│  │ Du 22 mars au 02 juin · 72 jours                    ││
│  │ Responsable : Lyes Triki                            │ │
│  │ Statut : En cours (82%)                             │ │
│  │ [Voir les livrables (3)]                            │ │
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : vue d'ensemble inégalée. Très "pro", communique le sérieux de l'agence. Le client voit la charge sur le temps.
⚠️ **Faiblesses** : casse-tête responsive mobile (un Gantt sur smartphone = horreur). Demande un composant Gantt custom ou une lib (ex : `gantt-task-react`) → poids bundle + accessibilité.
🧩 **Composants** : `GanttView` (custom SVG ou lib), `StepDetailDrawer`.

---

## V3 — Kanban par phase

🎯 **Intention** : présenter le projet comme un *flux de travail* à la Trello/Linear. Les étapes sont regroupées par état (à venir / en cours / terminé) plutôt que par ordre.

```
┌─────────────────────────────────────────────────────────┐
│  Refonte SEO · Avancement                               │
│  42% terminé · Prochaine étape : Stratégie (02 juin)    │
│                                                         │
│  ┌─────────────┬─────────────┬─────────────────────────┐│
│  │ ✓ TERMINÉ   │ ● EN COURS  │ ○ À VENIR               ││
│  │   (1)       │   (1)       │   (3)                   ││
│  │             │             │                         ││
│  │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐             ││
│  │ │ Brief & │ │ │ Audit   │ │ │ Stratégie│            ││
│  │ │ cadrage │ │ │ tech    │ │ │ & prio  │             ││
│  │ │ 14→22mar│ │ │ J+62 ▓▓▓│ │ │ 02→15jun│             ││
│  │ │ ✅ done │ │ │ 82%     │ │ └─────────┘             ││
│  │ └─────────┘ │ └─────────┘ │ ┌─────────┐             ││
│  │             │             │ │ Build & │             ││
│  │             │             │ │ dev     │             ││
│  │             │             │ │ 15jun-  │             ││
│  │             │             │ │ 30jul   │             ││
│  │             │             │ └─────────┘             ││
│  └─────────────┴─────────────┴─────────────────────────┘│
│                                                         │
│  Click une carte → drawer détail                        │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : moderne, lisible, le client voit instantanément "ce qui bloque vs ce qui avance". Familier pour les clients qui utilisent Trello/Asana.
⚠️ **Faiblesses** : perd la **séquence temporelle** (un kanban ne dit pas quoi vient d'abord). Compromet l'aspect "voyage" du projet.
🧩 **Composants** : `KanbanColumn`, `StepKanbanCard`, `StepDrawer`.

---

## V4 — Carte de chantier (visuel métaphorique)

🎯 **Intention** : sortir du formel. Le projet devient une "carte de chantier" — un voyage de A à B avec des étapes-villes. Très différenciant, ancrage émotionnel fort.

```
┌─────────────────────────────────────────────────────────┐
│  Votre voyage Propul'SEO                                │
│  Marc · Refonte SEO Boutique                            │
│                                                         │
│       Aurora background avec lignes de courbe douces    │
│                                                         │
│   🏁 ─── ● ─── ● ─── ◉ ─── ○ ─── ○ ─── 🎯              │
│   Départ Brief Audit  STRAT Build Livr.  Arrivée        │
│   14 mar  ✓    ✓    EN COURS                            │
│                                                         │
│   ┌───────────────────────────────────────────────────┐ │
│   │ 🚩 Vous êtes ici : "Stratégie & priorisation"     │ │
│   │                                                   │ │
│   │ Cette semaine, on définit les priorités SEO      │ │
│   │ avec Lyes. Vendredi, présentation de l'audit.    │ │
│   │                                                   │ │
│   │ ⏱ Étape suivante : "Build & dev" — dans ~11 jours│ │
│   └───────────────────────────────────────────────────┘ │
│                                                         │
│   ┌─ ÉTAPES PASSÉES ────────────────────────────────┐   │
│   │ ✓ Brief (8 jours)  ·  ✓ Audit (62 jours)        │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│   ┌─ ÉTAPES À VENIR ────────────────────────────────┐   │
│   │ ○ Build & dev  ·  ○ Livraison                   │   │
│   └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : émotionnel, mémorable, différenciant. Crée un sentiment d'aventure partagée. Excellent pour la com agence.
⚠️ **Faiblesses** : moins fonctionnel pour un projet à 15+ étapes. Demande une exécution graphique soignée (SVG path animé) sinon ça paraît cheap.
🧩 **Composants** : `JourneyMap` (SVG path + markers), `CurrentLocationCard`, `PastFutureSteps`.

---

## V5 — Liste détaillée avec sous-tâches

🎯 **Intention** : maximum d'info, pour un client exigeant. Chaque étape se déplie en sous-tâches, livrables, communications.

```
┌─────────────────────────────────────────────────────────┐
│  Refonte SEO · Détail des étapes                        │
│  Filtrer : [Tout] [En cours] [À venir] [Terminé]        │
│                                                         │
│  ┌─ ▼ Audit technique ───────────────── EN COURS (82%) ─┐│
│  │   22 mars → 02 juin · Lyes Triki                    ││
│  │                                                     ││
│  │   Sous-tâches :                                     ││
│  │   ✓ Crawl du site (auto)                            ││
│  │   ✓ Analyse Core Web Vitals                         ││
│  │   ✓ Audit on-page (titles, h1, meta)                ││
│  │   ● Audit backlinks · en cours                      ││
│  │   ○ Synthèse et plan d'action                       ││
│  │                                                     ││
│  │   Livrables (3) :                                   ││
│  │   📄 Audit_v1.pdf · 14 mai                          ││
│  │   📄 Audit_v2.pdf · 20 mai                          ││
│  │   📄 Plan d'action (à venir)                        ││
│  │                                                     ││
│  │   [Voir tous les détails →]                         ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─ ▶ Stratégie & priorisation ──────── À venir ───────┐│
│  │   02 juin → 15 juin                                 ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─ ▶ Brief & cadrage ─────────────────── ✓ Terminé ───┐│
│  │   14 mars → 22 mars                                 ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : information complète. Très bien pour un client manager qui veut tout savoir. Compact (replié par défaut).
⚠️ **Faiblesses** : demande de nouvelles données (sous-tâches par étape) → schema DB à étendre. Risque "trop d'info" pour un client moins technique.
🧩 **Composants** : `StepAccordion`, `SubTaskList` (nouvelle table SQL `propulspace_project_substeps`), `StepFilter`.

---

# 3. DOCUMENTS (GED)

État actuel : Hero + filtres (search + 5 pills catégories) + liste plate (divide-y) avec FileIcon + nom/type/taille/version + bouton Download.

## V1 — Grille de cartes par catégorie

🎯 **Intention** : remplacer la liste plate par une grille visuelle. Chaque document devient une carte avec preview (icône taille XL), métadonnées et action principale.

```
┌─────────────────────────────────────────────────────────┐
│  Documents                                              │
│  Tous vos livrables et fichiers contractuels            │
│                                                         │
│  🔍 [Rechercher un document…]                           │
│                                                         │
│  Filtres : [● Tous (12)] [Contrats (2)] [Factures (3)]  │
│             [Livrables (5)] [Assets (2)]                │
│                                                         │
│  ─── CONTRATS (2) ───────────────────────────────────── │
│  ┌──────────────┬──────────────────────────────────┐    │
│  │  📜          │  📜                              │    │
│  │              │                                  │    │
│  │  Contrat     │  Avenant n°1                     │    │
│  │  cadre 2024  │  Phase 2                         │    │
│  │  v2 · 1.2 Mo │  v1 · 350 Ko                     │    │
│  │  12 avr      │  18 mai                          │    │
│  │  [⬇ Voir]    │  [⬇ Voir]                        │    │
│  └──────────────┴──────────────────────────────────┘    │
│                                                         │
│  ─── LIVRABLES (5) ───────────────────────────────────  │
│  ┌──────────────┬──────────────┬───────────────────┐   │
│  │  📄          │  🖼          │  📊               │   │
│  │  Audit v2    │  Maquettes   │  Plan d'action    │   │
│  │  PDF · 2.4Mo │  Figma · ext │  XLSX · 180 Ko    │   │
│  │  20 mai 🆕   │  15 mai      │  10 mai           │   │
│  │  [⬇]         │  [↗]         │  [⬇]              │   │
│  └──────────────┴──────────────┴───────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : visuel, hiérarchique, le client voit les catégories d'un coup d'œil. Badge "🆕" pour les ajouts récents = délicieux.
⚠️ **Faiblesses** : prend plus de place verticale. Si beaucoup de docs (50+), la page s'allonge.
🧩 **Composants** : `DocumentCard` (variants par type), `CategorySection`, `NewBadge` (auto si < 7 jours).

---

## V2 — Liste enrichie avec preview hover

🎯 **Intention** : garder la densité d'une liste mais permettre un preview au survol (desktop) ou au tap (mobile). Compact + riche.

```
┌─────────────────────────────────────────────────────────┐
│  Documents                                              │
│  🔍 [Rechercher…]   Tri : [📅 Date ▼] [Type] [Nom]      │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📄 Audit_technique_v2.pdf                          │ │
│  │    Livrable · 2.4 Mo · v2 · 20 mai · Par Lyes      │ │
│  │    👁 Aperçu rapide   ⬇ Télécharger   🔗 Lien      │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ 📜 Contrat_cadre_2024.pdf                          │ │
│  │    Contrat · 1.2 Mo · v2 · 12 avr · Signé          │ │
│  │    👁 Aperçu rapide   ⬇ Télécharger                 │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ 🖼 Maquettes_home_v3.fig                           │ │
│  │    Asset · lien externe · 15 mai · Par Anne        │ │
│  │    ↗ Ouvrir Figma                                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  Sur hover (desktop) → mini-thumbnail PDF + actions     │
│  Sur tap (mobile) → expand row inline avec preview      │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : très dense, idéal pour un client qui veut scanner rapidement. Le preview évite des téléchargements inutiles.
⚠️ **Faiblesses** : preview PDF côté web demande une lib (pdf.js ou iframe Supabase storage). Coût technique non négligeable.
🧩 **Composants** : `DocumentRow` (refonte), `DocumentPreviewPopover` (lazy-load PDF.js), `SortControl`.

---

## V3 — Vue dossiers (arborescence par projet)

🎯 **Intention** : organiser par dossiers métier — façon Google Drive. Le client navigue dans une arborescence familière.

```
┌─────────────────────────────────────────────────────────┐
│  Documents                                              │
│  📁 Refonte SEO > Contrats                              │
│                                                         │
│  🔍 [Rechercher dans ce dossier…]                       │
│                                                         │
│  ┌─ DOSSIERS ────────────────────────────────────────┐  │
│  │ 📁 Contrats (2)                                   │  │
│  │ 📁 Livrables (5)            ←  vous êtes ici      │  │
│  │ 📁 Factures (3)                                   │  │
│  │ 📁 Assets (2)                                     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ FICHIERS DU DOSSIER "Livrables" ─────────────────┐  │
│  │ Nom                    Taille    Modifié          │  │
│  │ ─────────────────────────────────────────────     │  │
│  │ 📄 Audit_v2.pdf        2.4 Mo    20 mai           │  │
│  │ 📄 Audit_v1.pdf        2.1 Mo    14 mai           │  │
│  │ 🖼 Maquettes_v3.fig    ext       15 mai           │  │
│  │ 📊 Plan_action.xlsx    180 Ko    10 mai           │  │
│  │ 📄 Brief.pdf           450 Ko    14 mar           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Breadcrumb cliquable · respect du modèle Drive         │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : familier pour 100% des utilisateurs (paradigme Drive/Dropbox). Scale très bien (1000+ docs sans souci).
⚠️ **Faiblesses** : ajoute un niveau de navigation (un clic de plus pour atteindre un doc). Sur mobile, l'expérience dossier est moins agréable que liste plate filtrée.
🧩 **Composants** : `FolderBreadcrumb`, `FolderCard`, `FileListTable`, mapping `document_type` → catégorie de dossier.

---

## V4 — Liste chronologique (feed type chat)

🎯 **Intention** : pas de filtres ni de dossiers. Tout est dans l'ordre chronologique, façon flux de discussion. Pour les clients qui consultent les docs au fil des dépôts.

```
┌─────────────────────────────────────────────────────────┐
│  Documents                                              │
│  Tous les fichiers échangés, du plus récent au plus     │
│  ancien.    🔍 [Rechercher…]                            │
│                                                         │
│  ─── CETTE SEMAINE ────────────────────────────────────│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [LT] Lyes · Mardi 20 mai · 14:30                   ││
│  │ A déposé un livrable :                             ││
│  │ ┌─────────────────────────────────────────┐        ││
│  │ │ 📄 Audit_technique_v2.pdf                │        ││
│  │ │    2.4 Mo · v2                          │        ││
│  │ │    [⬇ Télécharger]  [👁 Aperçu]         │        ││
│  │ └─────────────────────────────────────────┘        ││
│  │ « V2 avec backlinks et plan d'action inclus. »     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [AM] Anne · Lundi 19 mai · 10:00                   ││
│  │ A partagé un asset :                               ││
│  │ ┌─────────────────────────────────────────┐        ││
│  │ │ 🖼 Maquettes_home_v3.fig (Figma)         │        ││
│  │ │    [↗ Ouvrir]                            │        ││
│  │ └─────────────────────────────────────────┘        ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ─── SEMAINE DERNIÈRE ─────────────────────────────────│
│  …                                                      │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : très humain, conversationnel. Met en valeur les commentaires et le contexte des dépôts. Excellent sur mobile.
⚠️ **Faiblesses** : retrouver un vieux doc est pénible (besoin de scroller ou chercher). Demande d'ajouter un champ "note/commentaire" sur `propulspace_documents` (DB à étendre).
🧩 **Composants** : `DocumentFeedItem` (avec auteur + note), `FeedGroupByWeek`, champ `client_visible_note` à ajouter à la table.

---

## V5 — Vue table compacte type "boîte aux lettres"

🎯 **Intention** : densité maximum, façon webmail. Pour les clients power-users qui gèrent beaucoup de documents.

```
┌─────────────────────────────────────────────────────────┐
│  Documents (12)                                         │
│  🔍 [Rechercher] · Filtres : [Tous▾] [Type▾] [Période▾] │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ □ Nom                       Type    Taille   Date  ▼││
│  │ ─────────────────────────────────────────────────── ││
│  │ □ 📄 Audit_technique_v2     PDF     2.4 Mo   20mai 🆕││
│  │ □ 📜 Avenant_n1             PDF     350 Ko   18mai  ││
│  │ □ 🖼 Maquettes_home_v3.fig  Figma   —        15mai  ││
│  │ □ 📄 Audit_technique_v1     PDF     2.1 Mo   14mai  ││
│  │ □ 📊 Plan_action            XLSX    180 Ko   10mai  ││
│  │ □ 📜 Contrat_cadre_v2       PDF     1.2 Mo   12avr  ││
│  │ □ 📄 Brief_cadrage          PDF     450 Ko   14mar  ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  Actions multi-sélection : [⬇ Télécharger ZIP]          │
│                                                         │
│  En bas : pagination si > 25 docs                       │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : ultra-dense, scannable, tri par colonne. Le télécharger-ZIP en multi-select est un vrai plus. Scale à 200+ docs.
⚠️ **Faiblesses** : froid, pas DA Sky Aurora-compatible (un tableau ne fait pas glassmorphism). Mobile : tableau scrollable horizontalement = pas idéal.
🧩 **Composants** : `DocumentTable` (shadcn `Table`), `ColumnSort`, `BulkDownloadButton` (Edge Function ZIP côté serveur).

---

# 4. FACTURES (paiement Stripe)

État actuel : Hero + liste plate (clic = sheet droite avec détails + bouton Payer Stripe + échéances). Bannières feedback post-paiement.

## V1 — Cartes financières avec stats

🎯 **Intention** : transformer la liste plate en cartes. En tête : récap financier (encaissé / dû / en attente). Chaque facture devient une carte premium.

```
┌─────────────────────────────────────────────────────────┐
│  Factures                                               │
│                                                         │
│  ┌──────────────┬──────────────┬─────────────────────┐  │
│  │ ✅ ENCAISSÉ  │ ⏱ EN ATTENTE │ 💰 TOTAL CONTRAT    │  │
│  │ 1 260 €      │ 1 800 €      │ 14 000 €            │  │
│  │ sur 4200€    │ 1 facture    │ HT (TVA 20%)        │  │
│  │ acompte      │              │                     │  │
│  └──────────────┴──────────────┴─────────────────────┘  │
│                                                         │
│  ┌─ FACTURE #2024-08 ────────────────── À PAYER ──────┐│
│  │ 🔴 Échéance dans 7 jours                            ││
│  │                                                     ││
│  │ Acompte Phase 2 — 30%                               ││
│  │ Émise le 15 mai · Due le 29 mai                     ││
│  │                                                     ││
│  │ Montant TTC  : 1 800 €                              ││
│  │ HT 1500€ · TVA 300€                                 ││
│  │                                                     ││
│  │ [💳 Payer maintenant]    [⬇ PDF]    [Détails →]     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─ FACTURE #2024-07 ────────────────── ✓ PAYÉE ──────┐│
│  │ Phase 1 — Brief & audit                             ││
│  │ Payée le 12 avr · 1 260 € TTC                       ││
│  │ [⬇ PDF]                                             ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : pédagogique (le client comprend où il en est financièrement). Le CTA Payer est mis en valeur. Cohérent avec la DA.
⚠️ **Faiblesses** : prend plus de place qu'une liste. Si plus de 10 factures, scroll long.
🧩 **Composants** : `FinancialSummaryStats`, `InvoiceCard` (variants : à-payer / payée / en-retard / brouillon), `DueBanner`.

---

## V2 — Échéancier visuel (timeline financière)

🎯 **Intention** : visualiser les paiements dans le temps comme un échéancier de banque. Le client voit "ce qui tombe quand".

```
┌─────────────────────────────────────────────────────────┐
│  Échéancier de paiements                                │
│  3 factures · 1 due dans 7 jours                        │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Mars  │ Avril  │  Mai  │  Juin  │ Juil  │  Août   ││
│  │                                                     ││
│  │  ●1260€   ●1800€    ○1800€    ○4200€    ○4940€      ││
│  │  PAYÉE    À PAYER   À venir   À venir   À venir     ││
│  │  12 avr   29 mai    30 juin   30 juil   30 août     ││
│  │                                                     ││
│  │           ──── aujourd'hui (22 mai) ────            ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  🔴 PROCHAINE À PAYER — Facture #2024-08                │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Acompte Phase 2 — 1 800 € TTC                       ││
│  │ Due le 29 mai (J-7)                                 ││
│  │ [💳 Payer maintenant — 1 800 €]                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  Voir l'historique complet ↓                            │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : très clair pour la planification financière. Sentiment de contrôle pour le client. Format familier (relevé bancaire).
⚠️ **Faiblesses** : si projet < 6 mois ou peu de factures, la timeline est vide. Casse-tête responsive.
🧩 **Composants** : `PaymentTimeline` (SVG ou flex horizontal), `NextDueBanner`, `InvoiceHistoryFold`.

---

## V3 — Vue mixte : liste + sheet détail (existant amélioré)

🎯 **Intention** : garder le pattern actuel (liste + sheet) mais améliorer drastiquement le sheet droit avec tous les détails et un parcours de paiement guidé.

```
┌─────────────────────────────────────────────────────────┐
│  Factures                          [Filtre statut ▼]    │
│  ┌─────────────┬─────────────────────────────────────┐  │
│  │ #2024-08 🔴 │  SHEET (droite, plein écran mobile) │  │
│  │ Acompte P2  │  ─────────────────────────────────  │  │
│  │ 1800€ TTC   │  Facture #2024-08 · Acompte P2      │  │
│  │ Due 29 mai  │  🔴 À payer · échéance 29 mai       │  │
│  │ [Sélecté]   │                                     │  │
│  ├─────────────┤  ┌─ MONTANT ────────────────┐       │  │
│  │ #2024-07 ✓  │  │ HT       1 500,00 €      │       │  │
│  │ Phase 1     │  │ TVA 20%    300,00 €      │       │  │
│  │ 1260€ TTC   │  │ ───────────────────────  │       │  │
│  │ Payée 12 avr│  │ TTC      1 800,00 €      │       │  │
│  │             │  └──────────────────────────┘       │  │
│  │             │                                     │  │
│  │             │  📅 ÉCHÉANCES (3)                   │  │
│  │             │  ✓ Acompte 30% — 600€ — payé        │  │
│  │             │  ● Solde 70% — 1200€ — 29 mai       │  │
│  │             │                                     │  │
│  │             │  📝 NOTES AGENCE                    │  │
│  │             │  « Acompte Phase 2 — délai 14j… »   │  │
│  │             │                                     │  │
│  │             │  ┌─ PAYER ──────────────────┐       │  │
│  │             │  │ [💳 Payer 1 200€ ce solde]│      │  │
│  │             │  │ [💳 Payer la totalité]   │       │  │
│  │             │  └──────────────────────────┘       │  │
│  │             │  [⬇ PDF]                            │  │
│  └─────────────┴─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : conservatif (peu de risque), améliore l'existant sans tout casser. Le parcours paiement est guidé. Le sheet montre tout sans changer de page.
⚠️ **Faiblesses** : pas de vrai "wow effect". Continuité avec l'ancien design qui pouvait paraître daté.
🧩 **Composants** : `InvoiceRow` (refonte), `InvoiceDetailSheet` (refonte complète), `PaymentOptionGroup`.

---

## V4 — Carte unique "Mon prochain paiement" (concentration totale)

🎯 **Intention** : afficher *uniquement* la prochaine action de paiement, en grand. L'historique est replié plus bas. UX ultra-focalisée.

```
┌─────────────────────────────────────────────────────────┐
│  Vos factures                                           │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │   ▒░▒ Aurora glow violet centré                    ││
│  │                                                     ││
│  │           Prochain paiement                         ││
│  │                                                     ││
│  │              1 800 €                                ││
│  │              ────────                               ││
│  │           Acompte Phase 2                           ││
│  │                                                     ││
│  │    Échéance : jeudi 29 mai · J-7                    ││
│  │    Facture #2024-08                                 ││
│  │                                                     ││
│  │   ┌───────────────────────────────────────────┐     ││
│  │   │  💳  Payer maintenant — 1 800 €           │     ││
│  │   └───────────────────────────────────────────┘     ││
│  │                                                     ││
│  │       [⬇ Télécharger la facture]                    ││
│  │       [Voir les détails]                            ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ─── HISTORIQUE (3) ─────────────────────────────────  │
│  ✓ #2024-07 · 1260€ · payée 12 avr                      │
│  ✓ #2024-06 · 600€  · payée 15 mar                      │
│  …                                                      │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : très impactant, zéro friction pour le paiement urgent. Idéal en mobile. Le glow violet sur le montant = signature DA.
⚠️ **Faiblesses** : si aucune facture en attente, la zone hero est inutile (faut un état "Tout est à jour"). Si plusieurs factures urgentes, choix difficile (montrer laquelle en premier ?).
🧩 **Composants** : `NextPaymentHero`, `InvoiceHistoryList` (compact), `AllClearState`.

---

## V5 — Comptabilité pro (tableau + KPIs financiers)

🎯 **Intention** : pour les clients pro (entreprises) qui veulent gérer leur trésorerie. Tableau filtrable + exports + KPIs comptables.

```
┌─────────────────────────────────────────────────────────┐
│  Facturation — Refonte SEO                              │
│  Export : [⬇ CSV] [⬇ PDF récap]                         │
│                                                         │
│  ┌─ KPIs ─────────────────────────────────────────────┐ │
│  │ Total TTC : 14 000 €    Encaissé : 1 260 € (9%)   │ │
│  │ Dû :         12 740 €   En attente : 1 800 € (1) │ │
│  │ Échéance moyenne : 28 jours                       │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Filtres : [Statut ▾] [Période ▾] [Type ▾]              │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ N°       Type    Émission  Due      HT     TTC    │  │
│  │ ───────────────────────────────────────────────── │  │
│  │ #2024-08 Acompte 15 mai    29 mai 🔴 1500€ 1800€  │  │
│  │ #2024-07 Solde   05 avr    12 avr ✓ 1050€ 1260€   │  │
│  │ #2024-06 Acompte 12 mar    20 mar ✓ 500€  600€    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Click ligne → drawer détail + actions                  │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : très pro. Excellent pour comptable du client. Exports utiles. Vue d'ensemble immédiate.
⚠️ **Faiblesses** : froid, peu DA-compatible. Demande des features supplémentaires (export CSV/PDF) → effort serveur.
🧩 **Composants** : `InvoiceKPIBar`, `InvoiceFilterToolbar`, `InvoiceTable`, Edge Function `export-invoices-csv`.

---

# 5. SIGNATURES (DocuSeal)

État actuel : Hero + liste plate (pen icon + nom + type + sent_date + status) + sheet droit avec grille 2col (statut/dates) + 2 boutons (Signer maintenant / Télécharger PDF signé).

## V1 — Cartes statut avec CTA fort

🎯 **Intention** : sortir de la liste. Chaque signature devient une carte avec un CTA principal énorme. Le client ne peut pas rater l'action.

```
┌─────────────────────────────────────────────────────────┐
│  Signatures électroniques                               │
│                                                         │
│  ⚠ 1 document attend votre signature                    │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 🖊  À SIGNER                                        ││
│  │                                                     ││
│  │ Devis Phase 2 — Refonte SEO                         ││
│  │ Type : Devis · Envoyé le 18 mai                     ││
│  │ Expire le : 02 juin (J-11)                          ││
│  │                                                     ││
│  │ ┌───────────────────────────────────────────┐       ││
│  │ │  ✍ Signer maintenant  →                  │       ││
│  │ └───────────────────────────────────────────┘       ││
│  │ [👁 Voir le document] [⏱ Demander un délai]         ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ─── HISTORIQUE ────────────────────────────────────── │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ ✓ Contrat-cadre 2024                                ││
│  │   Signé le 12 avril · [⬇ Télécharger PDF signé]    ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : zéro ambiguïté, le client signe vite. CTA fort en glow violet. Le bouton "demander un délai" est délicieux (réduit la friction émotionnelle).
⚠️ **Faiblesses** : si 5+ docs à signer, la page devient lourde verticalement. Le "demander un délai" demande un workflow back (qui reçoit ? Email à l'agence ?).
🧩 **Composants** : `SignatureCallToActionCard`, `RequestDelayModal` (avec Edge Function envoi email équipe), `SignedHistoryRow`.

---

## V2 — Vue iframe embed (signer in-app)

🎯 **Intention** : ne pas sortir du portail. Le doc DocuSeal s'affiche en iframe directement. Le client signe sans changer de page.

```
┌─────────────────────────────────────────────────────────┐
│  Signatures                                             │
│                                                         │
│  ┌─────────────┬─────────────────────────────────────┐  │
│  │ EN ATTENTE  │  PREVIEW + SIGNATURE                │  │
│  │             │  ─────────────────────────────────  │  │
│  │ ● Devis P2  │                                     │  │
│  │   18 mai    │  [iframe Docuseal embed]            │  │
│  │             │                                     │  │
│  │ SIGNÉS      │   ┌─────────────────────────────┐   │  │
│  │ ✓ Contrat   │   │                             │   │  │
│  │   cadre     │   │  Document PDF complet       │   │  │
│  │   12 avr    │   │  avec champs signature       │   │  │
│  │             │   │  intégrés                    │   │  │
│  │             │   │                              │   │  │
│  │             │   │  [Signer ici ✍]              │   │  │
│  │             │   └─────────────────────────────┘   │  │
│  │             │                                     │  │
│  │             │  Statut : En attente de signature   │  │
│  │             │  Expire : 02 juin (J-11)            │  │
│  └─────────────┴─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : expérience fluide, pas de redirection externe (anxiogène). Crédibilise le portail. Sécurité psychologique pour le client (il signe "chez Propul'SEO").
⚠️ **Faiblesses** : dépend de la support iframe DocuSeal (à vérifier — CSP, X-Frame-Options). Hauteur d'iframe responsive = délicat. Performances mobile.
🧩 **Composants** : `SignaturesIframeView`, `DocuSealEmbed` (wrapper iframe avec auto-resize via postMessage).

---

## V3 — Wizard de signature étapé

🎯 **Intention** : pour des signatures longues ou multiples, guider le client par étapes. Façon checkout e-commerce.

```
┌─────────────────────────────────────────────────────────┐
│  Signer le devis Phase 2                                │
│                                                         │
│  ●─────●─────○─────○                                    │
│  Aperçu  Conditions Signer  Confirmation                │
│                                                         │
│  ┌─ ÉTAPE 2/4 : Conditions ──────────────────────────┐  │
│  │                                                   │  │
│  │ Récapitulatif du devis :                          │  │
│  │ • Montant : 1 800 € TTC                           │  │
│  │ • Durée : 14 jours                                │  │
│  │ • Acompte : 30% à la signature                    │  │
│  │                                                   │  │
│  │ □ J'ai lu et j'accepte les CGV                   │  │
│  │ □ J'autorise Propul'SEO à démarrer la prestation  │  │
│  │                                                   │  │
│  │ [← Précédent]              [Signer maintenant →]  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : pédagogique, rassurant. Diminue les abandons. Excellent pour un client qui signe pour la 1re fois.
⚠️ **Faiblesses** : trop lourd pour 90% des cas (signer 1 contrat = pas besoin de 4 étapes). Demande à structurer côté DB le contenu "conditions" du document.
🧩 **Composants** : `SignatureWizard`, `WizardStepper`, `TermsCheckboxList`.

---

## V4 — Inbox de signatures (façon emails)

🎯 **Intention** : présenter les signatures comme une boîte mail. Le client a l'habitude de cette UX.

```
┌─────────────────────────────────────────────────────────┐
│  Signatures (1 non signée)                              │
│                                                         │
│  Filtres : [⚪ Toutes (3)] [● À signer (1)] [✓ Signées]│
│                                                         │
│  ┌─ NON LUS / EN ATTENTE ───────────────────────────┐   │
│  │ ◉  Devis Phase 2 — Refonte SEO                  │   │
│  │    Envoyé le 18 mai · Expire dans 11 jours      │   │
│  │    « Merci de signer pour démarrer Phase 2 »    │   │
│  │    [Ouvrir →]                                   │   │
│  └───────────────────────────────────────────────── ┘   │
│                                                         │
│  ┌─ LU / SIGNÉS ────────────────────────────────────┐   │
│  │ ✓  Contrat-cadre 2024 · Signé 12 avr             │   │
│  │ ✓  Avenant n°1 · Signé 02 mai                    │   │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : ultra-familier (boîte mail). Le badge "non lu" crée une urgence saine. Filtres clairs.
⚠️ **Faiblesses** : peut paraître redondant (l'app envoie déjà des emails — pourquoi avoir un autre inbox ?). Risque de confusion.
🧩 **Composants** : `SignatureInboxRow` (variants lu/non-lu/signé/expiré), `InboxFilter`, `MessageNote`.

---

## V5 — Vue contractuelle (focus sur le contenu)

🎯 **Intention** : le document EST l'interface. Le client voit le contrat en plein écran, les actions (signer/refuser) sont des boutons flottants. Pour les clients soucieux du contenu juridique.

```
┌─────────────────────────────────────────────────────────┐
│  ← Signatures                                           │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Devis Phase 2 — Refonte SEO Boutique               ││
│  │  Émis le 18 mai par Propul'SEO                      ││
│  │                                                     ││
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     ││
│  │                                                     ││
│  │  PDF rendu complet en pleine page                   ││
│  │  (PDF.js ou iframe)                                 ││
│  │                                                     ││
│  │  Page 1 / 4 — défilement                            ││
│  │                                                     ││
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│   ┌─ Bouton flottant bas (sticky) ─────────────────┐    │
│   │  [✍ Signer]  [✖ Refuser]  [⏱ Demander délai]  │    │
│   └─────────────────────────────────────────────── ┘    │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : le client *lit* avant de signer. Très professionnel et juridiquement responsable. Mobile : le sticky bouton est efficace.
⚠️ **Faiblesses** : moins fluide pour les signatures "rapides". Demande un viewer PDF performant (PDF.js + lazy load pages).
🧩 **Composants** : `ContractFullScreenViewer`, `StickyActionBar`, `RefuseSignatureModal`.

---

# 6. AIDE (FAQ + contact)

État actuel : Hero + 5 quick-links sections + FAQ search + accordion + contact (WhatsApp + email).

## V1 — Centre d'aide structuré

🎯 **Intention** : hub d'aide complet avec catégories, FAQ enrichie, recherche puissante, et contact en bas. Format Notion/Linear Help.

```
┌─────────────────────────────────────────────────────────┐
│  Centre d'aide                                          │
│  Tout pour profiter au mieux de votre espace            │
│                                                         │
│  🔍 [Rechercher dans l'aide…]                           │
│                                                         │
│  ─── PAR THÈME ─────────────────────────────────────── │
│  ┌──────────────┬──────────────┬──────────────────┐    │
│  │ 🏠 Démarrer  │ 💳 Paiements │ 🖊 Signatures    │    │
│  │ Onboarding,  │ Stripe, RIB, │ Comment signer,  │    │
│  │ navigation   │ acomptes     │ délais…          │    │
│  │ 5 articles   │ 4 articles   │ 3 articles       │    │
│  └──────────────┴──────────────┴──────────────────┘    │
│  ┌──────────────┬──────────────┬──────────────────┐    │
│  │ 📁 Documents │ 📊 Suivi proj│ ❓ Compte / acc.│    │
│  │ Filtres,     │ Étapes,      │ Login, mot de    │    │
│  │ download…    │ avancement…  │ passe…           │    │
│  └──────────────┴──────────────┴──────────────────┘    │
│                                                         │
│  ─── BESOIN D'AIDE EN DIRECT ? ─────────────────────── │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [💬 Chat WhatsApp]   [📧 Email]   [📞 Réserver call]││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : structuré, professionnel. Le client trouve vite. Catégories visuelles bien claires. Le "réserver call" est délicieux.
⚠️ **Faiblesses** : "réserver call" nécessite intégration Calendly/Cal.com. Demande à structurer la FAQ par catégorie (DB ou fichier statique).
🧩 **Composants** : `HelpCategoryCard`, `SearchWithSuggestions`, `ContactQuickActions`, intégration Cal.com (ou link externe).

---

## V2 — FAQ conversationnelle (chatbot-like)

🎯 **Intention** : transformer la FAQ en conversation. Le client tape sa question, on répond directement (ou propose une FAQ approchante).

```
┌─────────────────────────────────────────────────────────┐
│  💬 Posez-nous votre question                           │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [PS] Propul'SEO Assistant                          ││
│  │ Bonjour Marc, posez-moi votre question 🙂          ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [Marc] Comment je règle l'acompte ?                ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [PS] Vous pouvez régler l'acompte directement      ││
│  │ depuis la section Factures. Cliquez sur la facture ││
│  │ #2024-08 puis sur "Payer maintenant".              ││
│  │                                                     ││
│  │ [📄 Article complet]  [💳 Aller aux factures →]    ││
│  │                                                     ││
│  │ Cela répond à votre question ?   👍   👎           ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  Suggestions :                                          │
│  [Comment signer un document ?]                         │
│  [Comment télécharger les livrables ?]                  │
│                                                         │
│  ─────────────────────────────────────────────────     │
│  [Tapez votre question…]                       [Envoyer]│
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : engageant, moderne, l'IA fait baisser la charge de support. Sentiment d'écoute personnalisée.
⚠️ **Faiblesses** : demande un backend IA (Claude/OpenAI/RAG sur FAQ). Coût récurrent. Risque hallucination. Gros effort de dev.
🧩 **Composants** : `ChatHelpInterface`, Edge Function `ask-help` (RAG sur FAQ statique + Claude/GPT), `SuggestionChips`.

---

## V3 — FAQ unique + sidebar contacts (existant amélioré)

🎯 **Intention** : conservatif — garder la FAQ accordion mais améliorer l'organisation visuelle (sidebar catégories, contacts persistants).

```
┌─────────────────────────────────────────────────────────┐
│  Aide & FAQ                                             │
│                                                         │
│  ┌─────────────┬─────────────────────────────────────┐  │
│  │ CATÉGORIES  │  🔍 [Rechercher…]                   │  │
│  │             │                                     │  │
│  │ ● Tous (9)  │  ─── DÉMARRER ───                   │  │
│  │ Démarrer (2)│  ▼ Comment me connecter ?           │  │
│  │ Paiements 3 │     Allez sur portail.propulseo…    │  │
│  │ Signat. (2) │  ▶ Comment naviguer ?               │  │
│  │ Docs (1)    │                                     │  │
│  │ Compte (1)  │  ─── PAIEMENTS ───                  │  │
│  │             │  ▶ Comment payer une facture ?      │  │
│  │ ─────────── │  ▶ Délais de paiement ?             │  │
│  │ CONTACT     │  ▶ Mode de paiement ?               │  │
│  │             │                                     │  │
│  │ [💬 WhatsApp]                                     │  │
│  │ [📧 Email]  │  ─── SIGNATURES ───                 │  │
│  │             │  ▶ Comment signer ?                 │  │
│  └─────────────┴─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : conservatif, faible risque. Améliore l'organisation sans tout réécrire. Sidebar contact persistant = rassurant.
⚠️ **Faiblesses** : peu différenciant. Mobile : sidebar doit devenir un menu collapsible (effort UX).
🧩 **Composants** : `HelpSidebar`, `FaqAccordionByCategory`, refonte FAQ statique en `[{category, q, a, tags}]`.

---

## V4 — Vidéothèque + FAQ (multimédia)

🎯 **Intention** : pour les clients qui apprennent en visuel. Tutos vidéo courts + FAQ textuelle en complément.

```
┌─────────────────────────────────────────────────────────┐
│  Centre d'apprentissage                                 │
│  Tout pour maîtriser votre espace                       │
│                                                         │
│  ─── TUTORIELS VIDÉO ─────────────────────────────────  │
│  ┌──────────────┬──────────────┬──────────────────┐    │
│  │ ▶ 1:30       │ ▶ 0:45       │ ▶ 2:15           │    │
│  │              │              │                  │    │
│  │ Découvrir    │ Payer une    │ Signer un        │    │
│  │ son espace   │ facture      │ devis            │    │
│  └──────────────┴──────────────┴──────────────────┘    │
│  ┌──────────────┬──────────────┬──────────────────┐    │
│  │ ▶ 1:00       │ ▶ 1:45       │ ▶ Voir tous (8)  │    │
│  │              │              │                  │    │
│  │ Télécharger  │ Suivre       │                  │    │
│  │ livrables    │ son projet   │                  │    │
│  └──────────────┴──────────────┴──────────────────┘    │
│                                                         │
│  ─── FAQ EN TEXTE ────────────────────────────────────  │
│  🔍 [Rechercher…]                                       │
│  ▶ Comment me connecter ?                               │
│  ▶ Comment payer une facture ?                          │
│  …                                                      │
│                                                         │
│  ─── CONTACT ─────────────────────────────────────────  │
│  [💬 WhatsApp]  [📧 Email]                              │
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : vidéo = très engageant. Le client retient mieux. Différenciant (rares sont les portails clients avec tuto vidéo).
⚠️ **Faiblesses** : il faut PRODUIRE les vidéos (effort hors-code). Hébergement (YouTube unlisted ? Mux ? Vercel Blob ?). Maintenance si UI change.
🧩 **Composants** : `VideoTileCard`, `VideoPlayerModal` (lazy-load), gestion hébergement vidéo.

---

## V5 — Aide contextuelle (in-app, pas une page)

🎯 **Intention** : pas de "page Aide". L'aide vit *dans* chaque section sous forme de tooltips, popovers, et un bouton flottant "?". Plus moderne, plus efficace.

```
┌─────────────────────────────────────────────────────────┐
│  Section actuelle : Factures                            │
│                                                         │
│  Facture #2024-08                                       │
│  Acompte Phase 2 — 1800 € TTC  [💡 c'est quoi un       │
│                                  acompte ? ←──────┐    │
│  [💳 Payer]                                       │    │
│                                                   │    │
│  Tooltip ouvert au clic du 💡 :                   │    │
│  ┌──────────────────────────────────────────┐     │    │
│  │ Un acompte est un versement avant le     │     │    │
│  │ démarrage de la prestation. Il fait      │     │    │
│  │ partie du montant total du devis.        │     │    │
│  │                                          │     │    │
│  │ [En savoir plus →]                       │     │    │
│  └──────────────────────────────────────────┘     │    │
│                                                        │
│  ┌─ Bouton flottant bas-droite (sticky toutes pages) ─┐│
│  │  ?  Besoin d'aide ?                                ││
│  │       ↓ (clic ouvre panneau aide latéral)          ││
│  │  ┌────────────────────────────┐                    ││
│  │  │ 🔍 Rechercher              │                    ││
│  │  │ FAQ contextuelle Factures: │                    ││
│  │  │ • Comment payer ?          │                    ││
│  │  │ • Délais ?                 │                    ││
│  │  │ • Contact équipe           │                    ││
│  │  └────────────────────────────┘                    ││
│  └────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

✅ **Forces** : aide là où le besoin naît. Réduit le bounce vers "Aide". Très moderne (Intercom, Crisp).
⚠️ **Faiblesses** : disperse la connaissance dans le code (chaque section doit définir ses tooltips). Plus complexe à maintenir. Demande un store global d'aide.
🧩 **Composants** : `HelpTooltip` (réutilisable), `FloatingHelpButton` + `HelpSidePanel`, store `helpEntriesBySection`. Suppression progressive de la page Aide.

---

# 📊 RÉCAPITULATIF GÉNÉRAL

## Tableau matrice par section × variante

| Section     | V1                  | V2                    | V3                  | V4                       | V5                    |
|-------------|---------------------|-----------------------|---------------------|--------------------------|-----------------------|
| **Accueil** | Cockpit personnel   | Storytelling immersif | Hub bento           | Journal de projet        | Tableau radial        |
| **Projet**  | Timeline enrichie   | Gantt horizontal      | Kanban par phase    | Carte de chantier        | Liste détaillée       |
| **Documents** | Grille catégories | Liste + preview       | Vue dossiers (Drive)| Feed chrono              | Table compacte        |
| **Factures** | Cartes + stats     | Échéancier visuel     | Liste + sheet (amél.)| Carte unique focus      | Comptabilité pro      |
| **Signatures** | Cartes CTA fort  | Iframe in-app         | Wizard étapé        | Inbox style email        | Vue contractuelle     |
| **Aide**    | Centre structuré    | Chatbot conversationnel | FAQ + sidebar     | Vidéothèque              | Aide contextuelle     |

---

## Évaluation rapide (effort de dev × impact UX)

> Légende : 🟢 facile / 🟡 moyen / 🔴 gros effort   |   ⭐ impact UX (1-5)

| Section | Variante | Effort | Impact | Risque DA Sky Aurora |
|---------|----------|--------|--------|----------------------|
| Accueil | V1 Cockpit | 🟢 | ⭐⭐⭐⭐ | ✅ compatible |
| Accueil | V2 Storytelling | 🔴 | ⭐⭐⭐⭐⭐ | ✅ très compatible |
| Accueil | V3 Bento | 🟡 | ⭐⭐⭐⭐ | ✅ très compatible |
| Accueil | V4 Journal | 🟡 | ⭐⭐⭐⭐ | ✅ compatible |
| Accueil | V5 Radial | 🔴 | ⭐⭐⭐⭐⭐ | ✅ très compatible |
| Projet | V1 Timeline enrichie | 🟢 | ⭐⭐⭐ | ✅ compatible |
| Projet | V2 Gantt | 🔴 | ⭐⭐⭐ | ⚠️ Gantt = froid |
| Projet | V3 Kanban | 🟡 | ⭐⭐⭐ | ✅ compatible |
| Projet | V4 Carte de chantier | 🔴 | ⭐⭐⭐⭐⭐ | ✅ très compatible |
| Projet | V5 Liste détaillée | 🟡 | ⭐⭐⭐ | ✅ compatible |
| Documents | V1 Grille catégories | 🟢 | ⭐⭐⭐⭐ | ✅ compatible |
| Documents | V2 Liste + preview | 🔴 | ⭐⭐⭐⭐ | ✅ compatible |
| Documents | V3 Vue dossiers | 🟡 | ⭐⭐⭐ | ✅ compatible |
| Documents | V4 Feed chrono | 🟡 | ⭐⭐⭐⭐ | ✅ très compatible |
| Documents | V5 Table compacte | 🟢 | ⭐⭐ | ⚠️ peu DA |
| Factures | V1 Cartes + stats | 🟡 | ⭐⭐⭐⭐ | ✅ très compatible |
| Factures | V2 Échéancier | 🟡 | ⭐⭐⭐⭐ | ✅ compatible |
| Factures | V3 Liste + sheet améliorée | 🟢 | ⭐⭐⭐ | ✅ compatible |
| Factures | V4 Carte unique focus | 🟢 | ⭐⭐⭐⭐⭐ | ✅ très compatible |
| Factures | V5 Comptabilité pro | 🔴 | ⭐⭐⭐ | ⚠️ peu DA |
| Signatures | V1 Cartes CTA fort | 🟢 | ⭐⭐⭐⭐⭐ | ✅ très compatible |
| Signatures | V2 Iframe in-app | 🟡 | ⭐⭐⭐⭐ | ✅ compatible (à vérifier CSP) |
| Signatures | V3 Wizard étapé | 🟡 | ⭐⭐⭐ | ✅ compatible |
| Signatures | V4 Inbox emails | 🟢 | ⭐⭐⭐ | ✅ compatible |
| Signatures | V5 Vue contractuelle | 🔴 | ⭐⭐⭐⭐ | ✅ compatible |
| Aide | V1 Centre structuré | 🟡 | ⭐⭐⭐⭐ | ✅ compatible |
| Aide | V2 Chatbot | 🔴 | ⭐⭐⭐⭐⭐ | ✅ très compatible |
| Aide | V3 FAQ + sidebar | 🟢 | ⭐⭐⭐ | ✅ compatible |
| Aide | V4 Vidéothèque | 🔴 | ⭐⭐⭐⭐ | ✅ compatible |
| Aide | V5 Aide contextuelle | 🔴 | ⭐⭐⭐⭐⭐ | ✅ très compatible |

---

## 🎯 Recommandation Claude Code

### Option A — "Combo cohérent rapide" (1-2 sprints)

Si l'objectif est de **livrer vite** une refonte propre et impactante :

| Section | Variante | Pourquoi |
|---------|----------|----------|
| Accueil | **V3 Hub bento** | Pattern moderne, bien compatible DA, scope maîtrisé |
| Projet | **V1 Timeline enrichie** | Conservatif mais bien upgrade. Données déjà dispos |
| Documents | **V1 Grille catégories** | Plus visuel, scope court |
| Factures | **V4 Carte unique focus** | Maximise la conversion paiement, simple à coder |
| Signatures | **V1 Cartes CTA fort** | Zero ambiguïté pour signer, scope court |
| Aide | **V3 FAQ + sidebar** | Améliore l'existant sans réécrire |

**Effort total estimé : ~3 semaines**. Risque faible. Très bon ROI.

---

### Option B — "Combo signature DA Sky Aurora" (3-4 sprints)

Si l'objectif est de **marquer les esprits** et faire de Propul'Space un argument commercial :

| Section | Variante | Pourquoi |
|---------|----------|----------|
| Accueil | **V2 Storytelling immersif** ou **V5 Radial** | Signature visuelle forte. Tableau radial = mémorable |
| Projet | **V4 Carte de chantier** | Métaphore voyage = très différenciant, émotionnel |
| Documents | **V4 Feed chronologique** | Humanise les échanges, met en valeur l'équipe |
| Factures | **V4 Carte unique focus** + glow aurora | Cohérence avec hero du dashboard |
| Signatures | **V1 Cartes CTA fort** + V2 Iframe (futur) | Démarre avec V1, ajoute iframe quand stable |
| Aide | **V5 Aide contextuelle** | Moderne, dispersée mais puissante |

**Effort total estimé : ~6-8 semaines** (composants SVG/canvas customs). Risque modéré. Impact très fort.

---

### Option C — "Combo équilibré" (recommandé par défaut)

Le mix qui équilibre rapidité, impact et cohérence :

| Section | Variante | Pourquoi |
|---------|----------|----------|
| Accueil | **V3 Hub bento** | Moderne, scope maîtrisé, bonne base mobile |
| Projet | **V4 Carte de chantier** | LE signature visuel du portail (à ne pas rater) |
| Documents | **V1 Grille catégories** | Lisible, scalable, scope court |
| Factures | **V4 Carte unique focus** | Conversion paiement maximisée |
| Signatures | **V1 Cartes CTA fort** | Zero friction, scope court |
| Aide | **V1 Centre structuré** | Hub clair, scalable, intégration Cal.com en bonus |

**Effort total estimé : ~4-5 semaines**. Risque faible-modéré. Impact fort.

**C'est cette option que je recommanderais** comme point de départ. On démarre par l'Accueil (V3 bento) + Projet (V4 carte de chantier) parce que ce sont les 2 sections qui définissent la perception globale du portail. Le reste peut suivre sprint par sprint.

---

## 🚀 Plan d'attaque proposé (Option C)

### Sprint UX-1 — Foundation (1 semaine)
- Background aurora layers (3 gradients radiaux blur) global au portail
- Composant `BentoCard` (variants small/medium/large) — utilisé dans Accueil + Documents
- Composant `JourneyMap` (SVG) — utilisé dans Projet
- Refonte tokens `--ps-*` si nécessaire pour densité

### Sprint UX-2 — Accueil + Projet (1.5 semaine)
- Dashboard refondu : hero compact + bento grid (projet + à-faire + stats + activité + équipe)
- Page Projet refondue : carte de chantier (JourneyMap) + cartes étapes contextuelles
- Données : nouvel hook `usePortalSummary` qui agrège progress/dueActions/team

### Sprint UX-3 — Documents + Factures (1 semaine)
- Documents : grille par catégorie + badge "🆕" auto
- Factures : carte unique focus + historique replié
- Pas de nouvelles données DB requises

### Sprint UX-4 — Signatures + Aide (0.5 semaine)
- Signatures : cartes CTA fort + bouton "demander délai"
- Aide : refonte avec catégories visuelles + intégration Cal.com (link externe)

### Sprint UX-5 — Polissage + responsive + a11y (0.5 semaine)
- Audit mobile complet
- Audit a11y (focus, contraste, screen reader)
- Tests E2E (QA_E2E_RUNBOOK existant)

**Total : ~4.5 semaines avec un dev solo.**

---

## ⚠️ Points de vigilance

1. **DA Sky Aurora coût performance** : 3 gradients radiaux blur + glassmorphism = budget GPU. Tester sur mobile bas de gamme avant de propager partout.
2. **Carte de chantier (V4 Projet)** : demande un SVG soigné. Si exécution moyenne → effet inverse (cheap). Prévoir du temps designer.
3. **Aurora layers globales** : risque de fatigue visuelle si présentes partout. Garder les sections "travail" (Documents, Factures) plus sobres.
4. **Mobile** : 90% des consultations selon hypothèse → toutes les variantes doivent être pensées mobile-first. Le Gantt (V2 Projet) ne passe pas mobile, par exemple.
5. **Données manquantes** : V1 Accueil (équipe agence), V5 Projet (sous-tâches), V4 Documents (notes auteur) demandent des extensions schema. Bien arbitrer avant de coder.

---

## 📝 Prochaines étapes (à valider avec Lyes)

1. **Choisir l'option** (A / B / C / mix custom)
2. **Pour chaque section, valider la variante préférée**
3. **Définir le sprint de démarrage** (recommandé : Accueil V3 + Projet V4)
4. **Brainstormer la carte de chantier (V4 Projet)** si retenue : style, animation, métaphore exacte
5. **Cal.com / réservation call** : décider si on l'intègre dans Aide ou plus tard

---

*Document généré en automode le 2026-05-22 — Sans aucune modification de code. Toutes les variantes restent à valider/coder.*







