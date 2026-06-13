# Bundle de handoff — OnboardingWizard v2

Tout ce qu'il faut pour qu'un dev (humain ou Claude Code) implémente la refonte de l'OnboardingWizard du portail client Propul'Space.

## Contenu

```
handoff/onboarding-wizard/
├── README.md                        ← ce fichier
├── PROMPT.md                        ← ★ brief complet à donner à Claude Code
├── tokens/
│   └── colors_and_type.css          ← design tokens (couleurs, type, motion, radii)
└── mockups/
    ├── index.html                   ← ★ point d'entrée des mockups (5 étapes × desktop + iPhone)
    ├── portal.css                   ← UI kit CSS (cards, buttons, badges, FAB…)
    ├── primitives.jsx               ← Icon · Badge · Button · KpiTile · Hero · …
    ├── shell.jsx                    ← PortalHeader · MobileBottomNav · ContactFab
    ├── desktop-shell.jsx            ← faux DesktopWindow (macOS chrome)
    ├── ios-frame.jsx                ← faux iPhone 26 (status bar + home indicator)
    ├── design-canvas.jsx            ← canvas pan/zoom multi-artboards
    └── screens/
        ├── onboarding.jsx                  ← OnbDialog (modale) + Step 1
        ├── onboarding-steps.jsx            ← Steps 2 à 5 (les variantes validées)
        ├── onboarding-mobile.jsx           ← OnbMobileShell + 5 étapes mobile
        └── onboarding-tab-previews.jsx     ← 7 mini-mocks pour le carrousel Step 4
```

## Comment ouvrir les mockups

```bash
cd handoff/onboarding-wizard/mockups
python3 -m http.server 8000
```

Puis ouvre `http://localhost:8000` dans Chrome ou Safari.

- **Pan/zoom** : drag avec la souris pour panner, scroll pour zoomer.
- **Focus plein écran** : double-clic sur un artboard. Flèches ← → pour naviguer entre artboards, `Esc` pour sortir.
- **Reset** : le canvas mémorise la position dans `localStorage` (clé `propulspace-onboarding-handoff-v1`). Pour repartir de zéro, vide le localStorage du site.

## Variantes validées (au design)

| Étape | Choix | Pourquoi |
|---|---|---|
| **Format global** | Full-screen Dialog (pas Sheet) + backdrop light | Plus immersif que la V1 sheet droite, et reste cohérent avec le ton calme du DS |
| **Étape 1** — Bienvenue | Split chaleureux 2-cols (Var B) | Plus émotionnel et premium qu'un récap dense, donne le ton |
| **Étape 2** — Coordonnées | Carte d'identité cliquable (Var B) | Validation visuelle "à la pièce d'identité" plus rapide qu'un formulaire classique |
| **Étape 3** — Préférences | Dense 2-cols, tout sur une vue (Var B) | Faire vite — 3 réglages utiles, pas 3 pages |
| **Étape 4** — Tour propriétaire | Carrousel spotlight + previews JSX (Var B) | Le client *voit* chaque section, pas juste un placeholder |
| **Étape 5** — Tout est prêt | Halo pulsant + typo display 44px (Var B) | Marquer le coup sans tomber dans Disney |

## Pour le dev — par où commencer

1. **Ouvre `PROMPT.md`** — c'est le brief complet (pourquoi · format · schéma DB · arborescence · détail des 5 étapes · transverses · a11y · CDA · hors-périmètre).
2. **Lance les mockups** (commande ci-dessus) et garde-les ouverts en parallèle pendant l'intégration.
3. **Migration SQL en premier** — c'est dans le PROMPT §4. Le renommage de l'ancienne table est *non destructif* mais bloquant : tout le reste en dépend.
4. **Step par step** dans l'ordre — pas besoin d'avoir tout fini pour merger : un PR par step est OK, le wizard masque les steps non-implémentées via un feature flag temporaire.

## Pour le PM — checklist de validation

Avant de merger en main, vérifie :

- [ ] Premier login d'un compte fraîchement créé → modale s'ouvre
- [ ] Step 1 affiche les vraies données du `propulspace_qualifications` (pas "Précieuse Joaillerie" en dur)
- [ ] Step 2 — éditer un champ et fermer la modale → la valeur est bien dans Supabase au reload
- [ ] Step 3 — toggle notifications, fermer, rouvrir → l'état est restauré
- [ ] Step 4 — chaque preview JSX ressemble bien à la section cible (KPI tiles pour Dashboard, timeline pour Projet, etc.)
- [ ] Step 5 — clic "Accéder" → redirection dashboard + toast + modale ne revient plus
- [ ] "Terminer plus tard" 3 fois → 3e fois, plus de modale auto, mais bannière dans dashboard
- [ ] iPhone réel : Step 4 montre la featured pleine largeur, swipe horizontal fonctionne
- [ ] Esc ferme la modale (= terminer plus tard)

## Notes

- **Le client de référence dans les mockups est fictif** : "Eméline Rousseau, Précieuse Joaillerie, joaillerie/bijouterie". À remplacer dynamiquement par les vraies données.
- **Stack de référence** : React 18 + Vite + TypeScript + Tailwind + shadcn/ui + Supabase. Aligné avec le repo CRM existant.
- **Pas de framer-motion en dépendance ?** Tout le projet l'utilise déjà (`package.json` du repo CRM). Réutilise-la.
- **Question hors brief ?** Si une décision design n'est pas explicite, choisis l'option la plus calme et la plus DS-fidèle, et flag-la dans la PR.
