# Plan — V3 UX Overhaul

**Branche de travail** : `preview/v3-ux-overhaul`
**Branchée depuis** : `main` (commit avec Sprint 3 V3 Preview terminé)
**Objectif** : transformer la preview V3 fonctionnelle en preview **production-ready** côté UX/produit, avant validation finale et bascule.

## Règles de la session

1. **Branche dédiée** : tout ce travail vit sur `preview/v3-ux-overhaul`, jamais sur main. Merge dans main uniquement après validation finale par l'utilisateur.
2. **Isolation V3 maintenue** : aucun fichier V1/V2 modifié. Toutes les corrections vivent dans `src/modules/ProjectDetailsV3Preview/` ou nouveaux fichiers.
3. **Code review** entre chaque sprint via `feature-dev:code-reviewer`.
4. **Build TS clean** après chaque sprint (`npx tsc --noEmit`).

---

## Sprint 3A — Bugs bloquants (~1h)

### 3A.1 — Fix bug "Ajout de tâche" silencieux
- Reproduire : ouvrir onglet Production, cliquer "Ajouter une tâche", remplir, valider → rien ne se passe.
- Hypothèse forte : mismatch `position` (envoyé par `useChecklistV3.addItem`) vs `sort_order` (attendu par Supabase). Voir lignes 84-101 de `useChecklistV3.ts`.
- Aussi vérifier les autres champs : la table `checklist_items_v2` accepte-t-elle `parent_task_id` `null` ? `priority` lowercase ?
- Ajouter logs `console.error` et `throw` sur erreur Supabase (comme déjà fait pour `useProjectActivitiesV3`).
- Toast d'erreur visible côté UI si insert échoue.

### 3A.2 — Sidebar app collapse auto sur page V3
- Aujourd'hui, la sidebar app de navigation reste ouverte sur la page V3 → trop d'éléments verticaux.
- Soit : ajouter une logique `useEffect` dans `ProjectDetailsV3Preview/index.tsx` qui ferme la sidebar app au mount et la rouvre au unmount.
- Soit : passer une prop au Layout `hideAppSidebar` pour les pages V3.
- Inspection : voir comment `Sidebar.tsx` et `Layout.tsx` gèrent l'état collapsed.

### 3A.3 — Pipeline adapté au type de projet
- Aujourd'hui `PROJECT_STATUS_ORDER` est unique (9 étapes génériques). Mais un projet "Site Web" utilise `sw_status` (6 étapes), ERP `erp_status` (8 étapes), Comm `comm_status` (8 étapes).
- Refactor `statusConfig.ts` :
  - Détecter le type via `project.presta_type[0]` (ou `sw_status`/`erp_status`/`comm_status` non null).
  - Créer 3 pipelines : `SITE_WEB_PIPELINE`, `ERP_PIPELINE`, `COMM_PIPELINE`, `GENERIC_PIPELINE`.
  - Fonction `getPipelineForProject(project)` qui retourne le bon pipeline + statut actuel.
- Adapter `ProjectV3LeftSidebar` et `ProjectV3RightSidebar` pour utiliser le helper.

### 3A.4 — Breadcrumb cliquable
- Aujourd'hui breadcrumb = `← Retour / Lolett` (le "← Retour" fait `navigate(-1)` aveugle).
- Améliorer : `← [Type de projet] / Lolett`, où le type est cliquable et amène à la bonne liste :
  - Si `presta_type` inclut `site_web` → `/site-web`
  - Si `erp` ou `erp_v2` → `/erp`
  - Si `communication` → `/communication`
  - Sinon → `/projets`

---

## Sprint 3B — Cohérence et lisibilité (~1h)

### 3B.1 — Supprimer redondance des statuts (3 endroits → 1)
- Aujourd'hui le statut s'affiche 3 fois : chip sous le titre + barre pipeline (sidebar gauche) + section "Statut" (sidebar droite).
- Garder uniquement la **barre pipeline** dans la sidebar gauche (le plus informatif).
- Supprimer la chip sous le titre et la ligne Statut des Statistiques.

### 3B.2 — Repenser ou supprimer "Statistiques" (sidebar droite)
- Aujourd'hui Type/Budget/Progression/Score/Statut → tous déjà présents ailleurs.
- Option A : supprimer la section entière.
- Option B : la remplacer par des **stats dérivées utiles** : nb tâches restantes, nb docs, prochain jalon de paiement, prochaine échéance...
- À décider avec l'utilisateur en début de sprint.

### 3B.3 — Empty states actionnables
- KPI Échéance vide : afficher bouton "Définir une échéance" cliquable au lieu de "—".
- KPI Budget vide : "Ajouter un budget".
- Pareil pour Notes (sidebar gauche), Contact client (sidebar droite si pas renseigné).
- Chaque empty state = un CTA, pas un tiret muet.

### 3B.4 — Compteurs sur les onglets
- Modifier `ProjectV3Tabs.tsx` : afficher un compteur à droite de chaque onglet.
  - Synthèse : nb activités
  - Production : nb tâches actives (non done)
  - Brief : indicateur point (●) si rempli, rien sinon
  - Documents : nb fichiers
- Ces compteurs nécessitent de hoist les hooks au niveau parent ou faire des requêtes count() rapides.

---

## Sprint 3C — Polish typographique et interactions (~2h)

### 3C.1 — Hiérarchie typographique
- Titre projet "Lolett" actuellement `text-sm` (14px) → trop petit pour un H1 de page.
- Passer à `text-lg` ou `text-xl` (18-20px), bold.
- Supprimer ou déplacer l'heure "22:18" en haut gauche (zéro utilité dans un breadcrumb).

### 3C.2 — Sidebar gauche : sections collapsables
- Notes peut être longue → bouton collapse.
- À propos peut aussi être collapse, ouvert par défaut.
- Stocker l'état collapse en localStorage par utilisateur.

### 3C.3 — Bouton "Modifier" → contexte clair
- Renommer en "Modifier le projet" ou faire de l'édition inline (clic sur le titre = édition).
- Ouvre un modal d'édition (à créer en Sprint 5).

### 3C.4 — QuickActionBar plus engageante
- Boutons plus grands (h-10 au lieu de h-7).
- Icônes colorées au repos (pas juste au hover).
- Tooltip qui décrit l'action ("Enregistrer un appel passé").
- Optionnel : raccourci clavier indiqué (`N` pour Note).

### 3C.5 — Empty states avec illustration
- Au lieu de "Aucune activité — utilisez les boutons ci-dessus", afficher :
  - Illustration légère (icône Sparkles ou MessageSquarePlus en grand)
  - Texte explicatif
  - 2-3 boutons d'amorce ("Première décision", "Premier appel client")

### 3C.6 — Badges priorité : par défaut = invisible
- Aujourd'hui badge "Moy." jaune visible sur toutes les tâches par défaut → bruit visuel.
- Afficher le badge **seulement si priorité ≠ medium**.

### 3C.7 — Loading skeleton coordonné
- Aujourd'hui 3 loadings indépendants (sidebar gauche, droite, onglet) → flash.
- Centraliser : `useProjectV3` + `useUsers` + onglet courant → un seul `loading = a || b || c` → afficher skeleton global.

---

## Sprint 3D — Power user et robustesse (~2h)

### 3D.1 — Toast d'erreur systématique
- Wrapper toutes les mutations Supabase dans `try/catch` avec toast.
- Pas une seule erreur silencieuse.

### 3D.2 — Optimistic UI
- Cocher une tâche → UI change instantanément, rollback si erreur.
- Modifier une activité → idem.
- Pattern : update local state, await Supabase, rollback sur error.

### 3D.3 — Raccourcis clavier
- `Cmd+K` : palette de commandes (à scaffold).
- `N` : nouvelle décision rapide.
- `Esc` : fermer modal en cours.
- `Tab`/`Shift+Tab` : naviguer entre onglets.
- Bibliothèque suggérée : `cmdk` (déjà utilisée pour shadcn Command).

### 3D.4 — Mode focus / plein écran
- Bouton "⛶" en haut à droite ou raccourci `F`.
- Masque les 2 sidebars + sidebar app → contenu central pleine largeur.
- Utile pour rédiger un brief ou parcourir une grosse checklist.

### 3D.5 — Permissions selon le rôle
- Si user n'est pas admin → masquer/désactiver :
  - Bouton Supprimer projet.
  - Bouton Supprimer tâche / activité (selon politique).
  - Édition du brief en statut "frozen".
- Réutiliser la fonction `is_admin()` côté front via le hook `useAuth`.

---

## Hors-périmètre (à backlog plus tard)

- Génération PDF du brief (composant V2 `BriefPDFDocument` complexe — porter plus tard).
- Bouton de partage de brief avec token public (`ShareBriefButton`).
- Onglet Finances / Échanges (décision : fusionnés dans Synthèse / Documents respectivement).
- Modal d'édition du projet (Sprint 5).
- Assignation responsable depuis sidebar (Sprint 5).
- Ajout/édition contact client (Sprint 5).

---

## Critères de validation finale (avant merge dans main)

- [ ] Build TS clean (`npx tsc --noEmit`).
- [ ] Code review propre via `feature-dev:code-reviewer`.
- [ ] Test manuel des 4 onglets sur un projet réel.
- [ ] Test ajout/suppression activité, tâche, brief, document.
- [ ] Test sur 3 types de projet : Site Web, ERP, Communication.
- [ ] Aucun fichier V1/V2 modifié (`git diff main..preview/v3-ux-overhaul` ne touche que des fichiers V3).
- [ ] Validation visuelle finale par l'utilisateur.
