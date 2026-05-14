# Audit Phase 6 — Onglets restants détail projet V3

## Tab Accès (`AccessTabV3.tsx`, 150 lignes)
**État** : OK, pas de régression suite à la refacto `useChecklistV3` hissée.
N'utilise pas `useChecklistV3` (passe par `useProjectAccessV3`).
Points d'amélioration possibles (non bloquants) :
- Ajout de catégories d'accès personnalisées
- Drag-reorder des accès dans une catégorie

## Tab Brief (`BriefTabV3.tsx`, 143 lignes)
**État** : Fonctionnel, formulaire 6 champs (Objectif, Cible, Pages, Technologie, Références design, Notes).
Données stockées dans `project_briefs_v2`. Sauvegarde via debounce automatique.
Points d'amélioration possibles (non bloquants) :
- Aperçu Markdown des champs longs
- Génération de PDF du brief
- Partage public via brief_short_code (existe en BDD, pas exposé UI)

## Sidebar droite (`ProjectV3RightSidebar.tsx`, 210 lignes)
**État** : Bouton « + Ajouter » contact client présent et branché.
Création/édition de contact OK via modal interne.
- État du pipeline cliquable, dropdown statut OK
- Responsable réassignable

## Conclusion
Aucune régression introduite par les Phases 1-5. Les 3 zones auditées sont
fonctionnelles. Les améliorations listées ci-dessus sont du polish, à traiter
dans une session ultérieure.
