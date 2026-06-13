# Product

## Register

product

## Users

- **Clients de l'agence Propul'SEO** (portail Propul'Space, `espace.propulseo-site.com`) : dirigeants de TPE/PME, souvent non techniques, qui suivent l'avancement de leur projet web/SEO, consultent et paient leurs factures, signent des documents et déposent des fichiers. Usage ponctuel (quelques fois par mois), mobile et desktop, dans un contexte « je vérifie où en est mon projet ».
- **Équipe Propul'SEO** (back-office admin `/admin/propulspace` dans le CRM, `crm.propulseo-site.com`) : admins qui pilotent les portails clients (jalons, factures, signatures, documents, leads). Usage intensif quotidien, desktop, thème CRM sombre.

## Product Purpose

Propul'Space est le portail client unifié de l'agence : il remplace les allers-retours email par un espace unique où le client voit l'état réel de son projet (frise de jalons), règle ses factures (Stripe), signe électroniquement (SES maison) et retrouve ses documents. Succès = le client se sent pris en charge sans avoir à appeler, et l'équipe gère tout depuis le CRM.

## Brand Personality

Premium, rassurant, limpide. Le portail doit donner l'impression d'une agence haut de gamme qui maîtrise son sujet : surfaces claires et calmes (DA « Aurora Raffiné »), un seul accent violet, chiffres nets en Space Grotesk. Jamais tape-à-l'œil : la confiance passe par la clarté, pas par la décoration.

## Anti-references

- Le « SaaS template » générique : hero-metric, grilles de cartes identiques, eyebrows uppercase sur chaque section.
- Les tells IA : rainbow gradients, gradient-text sur les titres, glassmorphism décoratif, emojis-icônes, side-stripes colorées.
- Les portails « usine à gaz » type espace client d'opérateur télécom : denses, froids, anxiogènes.

## Design Principles

1. **L'état du projet en une phrase** : chaque écran répond d'abord à « où en suis-je, que doit-on faire ensuite ? » — la hiérarchie sert cette réponse.
2. **Un seul accent, dépensé avec parcimonie** : le violet marque l'action principale et l'état actif, rien d'autre.
3. **La confiance par la matière** : surfaces opaques, ombres neutres, chiffres tabulaires — la qualité perçue vient de la précision, pas des effets.
4. **Le portail disparaît dans la tâche** : un client novice ne doit jamais se demander où cliquer ; familiarité avant originalité.
5. **Admin dense, portail aéré** : deux registres de densité pour deux usages (pilotage quotidien vs consultation ponctuelle), un même vocabulaire de composants.

## Accessibility & Inclusion

- Contraste AA minimum (4.5:1 corps de texte) sur les deux thèmes (Aurora clair / CRM sombre).
- `prefers-reduced-motion` respecté sur toute animation (classes `.ps-*` du thème).
- Cibles tactiles ≥ 44px sur le portail (usage mobile réel des clients).
- Français uniquement (UI et contenus), vocabulaire non technique côté client.
