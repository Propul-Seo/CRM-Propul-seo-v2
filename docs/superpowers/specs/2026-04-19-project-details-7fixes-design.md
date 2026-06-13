# Spec : 7 corrections & améliorations vue projet (ProjectDetailsV2)

**Date** : 2026-04-19
**Scope** : `src/modules/ProjectDetailsV2/`, `src/modules/ProjectsManagerV2/`

---

## Contexte

La vue détail projet V2 présente plusieurs bugs fonctionnels et manques UX identifiés lors des tests navigateur. Ce sprint corrige 7 points concrets signalés par l'utilisateur.

---

## 1. Sélecteur de phase projet (clic sur badge status)

**Problème** : `ProjectStatusBadge` dans `ProjectV2LeftSidebar.tsx:69` est en lecture seule.

**Solution** : Nouveau composant `ProjectStatusSelector.tsx` qui remplace le badge statique.

- Clic sur le badge → Popover avec liste des phases du module concerné
- Détermination du module depuis `project.presta_type[0]` :
  - `site_web` / `web` → champ `sw_status`, valeurs : `StatusSiteWeb`
  - `erp` / `erp_v2` → champ `erp_status`, valeurs : `StatusERP`
  - `communication` → champ `comm_status`, valeurs : `StatusComm`
  - `seo` / `saas` / autre → champ `status`, valeurs : `ProjectStatusV2`
- Appel `updateProject(project.id, { [statusField]: newValue })` au changement
- Réutiliser `STATUS_CONFIG` de `ProjectStatusBadge.tsx` pour les labels/couleurs

**Fichiers modifiés** :
- `src/types/project-v2.ts` — ajouter `sw_status?`, `erp_status?`, `comm_status?` à `ProjectV2`
- `src/modules/ProjectDetailsV2/components/ProjectV2LeftSidebar.tsx` — remplacer `ProjectStatusBadge` par `ProjectStatusSelector`
- Nouveau : `src/modules/ProjectDetailsV2/components/ProjectStatusSelector.tsx`
- Utiliser `useProjectsV2Context()` dans le sélecteur pour accéder à `updateProject`

---

## 2. Coffre-fort : affichage clair + sauvegarde des notes

**Problème** :
- Le hook `useProjectAccessesV2.ts:38` ne récupère PAS `login`, `password`, `notes` (select explicite sans ces champs)
- Les colonnes DB sont chiffrées (`BYTEA` via pgcrypto) → l'écriture directe ne fonctionne pas
- L'affichage dans la liste n'est pas assez lisible

**Solution** :

### 2a. Fix hook lecture/écriture
- **Lecture** : remplacer le select direct par un appel RPC `v2.get_decrypted_accesses(p_project_id)` (fonction SQL existante) ou, si la table publique `project_accesses_v2` stocke en clair (vérifier), inclure `login, password, notes` dans le select
- **Écriture** : utiliser l'appel RPC `v2.upsert_access()` pour le chiffrement automatique, ou si stockage en clair, ajouter les champs au insert/update

### 2b. Amélioration affichage (SyntheseTab.tsx)
- Chaque entrée d'accès affiche : **label** + badge catégorie + **URL** (avec icône lien externe) + **login** (avec bouton copier) + toggle mot de passe + **notes** en italique
- Rendre les infos visibles sans devoir cliquer sur "Modifier"

**Fichiers modifiés** :
- `src/modules/ProjectsManagerV2/hooks/useProjectAccessesV2.ts` — refonte select + insert/update
- `src/modules/ProjectDetailsV2/components/SyntheseTab.tsx` — section accès (lignes 462-549)
- Possiblement une migration SQL si RPC à créer

---

## 3. Lien "Partager avec le client" : afficher l'URL

**Problème** : `SharePortalButton.tsx` génère le lien et affiche un toast mais l'URL n'est jamais visible.

**Solution** : Après génération, afficher l'URL dans un bloc copiable au-dessus des boutons.

```
┌───────────────────────────────────┐
│ Lien portail client               │
│ https://brief-propul…/portal/abc  │  ← texte sélectionnable, break-all
├───────────────────────────────────┤
│ [Copier le lien]  [🔗 Désactiver] │
└───────────────────────────────────┘
```

**Fichier modifié** : `src/modules/ProjectDetailsV2/components/SharePortalButton.tsx` (branch `portalUrl`, lignes 73-96)

---

## 4. Template appliqué mais checklist absente

**Problème** : `applyTemplate()` dans `ProjectChecklist.tsx:228-248` appelle `addItem()` en boucle `forEach` sans `await`. Les 12 inserts Supabase partent en parallèle, et `setIsApplyingTemplate(false)` se déclenche immédiatement via `Promise.resolve().then()`.

**Solution** :
1. Ajouter une méthode `addItems` (bulk) au hook `useMockChecklist.ts`
2. Remplacer le `forEach` par un bulk insert unique (`supabase.from('checklist_items_v2').insert(allItems).select()`)
3. Rendre `applyTemplate` async et attendre le résultat
4. Pour les projets mock : batch append de tous les items en une seule mise à jour state

**Fichiers modifiés** :
- `src/modules/ProjectsManagerV2/hooks/useMockChecklist.ts` — ajouter `addItems` bulk
- `src/modules/ProjectDetailsV2/components/ProjectChecklist.tsx` — refactorer `applyTemplate`

---

## 5. Finances : budget + barre de progression liée aux factures

**Problème** : `ProjectBilling.tsx` reçoit uniquement `projectId`, pas le `budget` du projet. La barre montre payé/total facturé mais pas la relation avec le budget.

**Solution** :
- Passer `project: ProjectV2` au lieu de `projectId: string`
- Afficher le budget projet comme référence dans les métriques
- Barre de progression = `total facturé / budget` (au lieu de `payé / total`)
- Alerte visuelle si dépassement budget (`total > budget`)
- Fallback au comportement actuel si `budget` est null

**Fichiers modifiés** :
- `src/modules/ProjectDetailsV2/components/ProjectBilling.tsx` — props + UI
- `src/modules/ProjectDetailsV2/components/ProjectDetailsTabsV2.tsx` — passer `project` au lieu de `projectId`

---

## 6. Gmail sync : version light (champ email)

**Problème** : Pas de moyen de configurer quelle boîte mail suivre.

**Solution** : Intégrer le composant `ProjectEmailRules.tsx` (déjà existant mais jamais rendu) dans l'onglet Échanges (`ProjectFollowUp.tsx`).

- Ajouter une section collapsible "Adresses email à suivre" en haut de l'onglet Échanges
- Le composant permet d'ajouter/supprimer des adresses email
- Vérifier que la table `project_email_rules` existe en DB (sinon créer une migration)
- Note pour l'utilisateur : "Les emails reçus depuis ces adresses seront associés à ce projet"

**Fichier modifié** : `src/modules/ProjectDetailsV2/components/ProjectFollowUp.tsx` — import et rendu de `ProjectEmailRules`

---

## 7. Notes de suivi visibles dans la Synthèse

**Problème** : Les follow-ups (onglet Échanges) ne sont pas visibles dans la Synthèse.

**Solution** : Ajouter une section "Suivi récent" dans `SyntheseTab.tsx` — extraite dans un sous-composant pour limiter la taille du fichier.

- Nouveau composant `SyntheseFollowUpPreview.tsx`
- Utilise `useFollowUpsV2(project.id)`, affiche les 3-5 derniers follow-ups
- Format compact : icône type (appel/rdv/email/autre) + résumé + date
- Actions en attente en surbrillance
- Lien "Voir tout dans Échanges" en bas
- Fallback mock via `MOCK_FOLLOW_UPS`

**Fichiers modifiés** :
- `src/modules/ProjectDetailsV2/components/SyntheseTab.tsx` — import + rendu du preview
- Nouveau : `src/modules/ProjectDetailsV2/components/SyntheseFollowUpPreview.tsx`

---

## Ordre d'implémentation recommandé

| Ordre | Feature | Risque | Dépendances |
|-------|---------|--------|-------------|
| 1 | 3 — Lien portail visible | Faible | Aucune |
| 2 | 7 — Follow-ups en Synthèse | Faible | Aucune |
| 3 | 6 — Gmail light | Faible | Table `project_email_rules` |
| 4 | 1 — Sélecteur de phase | Moyen | Mise à jour type `ProjectV2` |
| 5 | 5 — Budget + billing | Moyen | Aucune |
| 6 | 4 — Fix template/checklist | Moyen | Refactoring hook |
| 7 | 2 — Coffre-fort complet | Élevé | Vérification schéma DB / RPC |

---

## Vérification

Pour chaque feature, tester dans le navigateur sur `localhost:5173` :

1. **Phase selector** : Ouvrir un projet SiteWeb → cliquer sur badge → changer en "Signé" → vérifier que le badge se met à jour
2. **Coffre-fort** : Ajouter un accès avec login/password/notes → fermer/rouvrir → vérifier que tout est affiché
3. **Lien portail** : Cliquer "Partager avec le client" → vérifier que l'URL s'affiche en texte
4. **Template** : Ouvrir un nouveau projet → onglet Production → appliquer template → vérifier que les tâches apparaissent groupées par phase
5. **Finances** : Ajouter une facture → vérifier que la barre de progression se met à jour par rapport au budget
6. **Gmail** : Onglet Échanges → section "Adresses email" → ajouter une adresse → vérifier persistance
7. **Suivi en Synthèse** : Ajouter un follow-up dans Échanges → revenir en Synthèse → vérifier qu'il apparaît
