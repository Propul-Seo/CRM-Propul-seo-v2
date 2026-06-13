# Spec : Complétion ProjectDetailsV2 — Mocks, CRUD Brief/Accès, Réintégration features

**Date :** 2026-04-17  
**Contexte :** Après la refonte 7→4 onglets, plusieurs fonctionnalités ont été perdues (Documents, Journal, Gmail Rules), les sections Brief/Accès sont en lecture seule, et les projets test n'ont pas de données mock sur Production/Finances.

---

## 1. Mocks complets pour les 3 projets test

### Checklists (Production tab)
Ajouter des entrées dans `mockChecklists.ts` pour :
- `proj-test-siteweb` : ~12 tâches (template site_web) réparties sur 5 phases, certaines done/in_progress
- `proj-test-erp` : ~10 tâches (template erp_v2), sprint 1 done, sprint 2 in_progress
- `proj-test-comm` : ~7 tâches (template communication), onboarding done, production in_progress

### Factures (Finances tab)
Ajouter des entrées dans `mockBillings.ts` pour :
- `proj-test-siteweb` : 3 factures (Acompte 30% paid 594€, Situation 50% sent 990€, Solde 20% draft 396€)
- `proj-test-erp` : 3 factures (Acompte 30% paid 3600€, Sprint 1 sent 4800€, Solde draft 3600€)
- `proj-test-comm` : 2 factures (Mois 1-3 paid 450€, Mois 4-6 draft 450€)

---

## 2. Brief + Accès éditables dans Synthèse

### Brief client
- Remplacer la section lecture seule par le composant `ProjectBrief` existant (CRUD complet)
- Wrappé dans un `CollapsibleCard` style V1 Cards
- Le composant a déjà : 6 champs textarea, gestion statut (draft/submitted/validated/frozen), export PDF, partage
- **Inclut le bouton "Générer le lien du brief"** (`ShareBriefButton`) pour envoyer le formulaire au client via URL publique

### Accès coffre-fort
- Remplacer la section lecture seule par le composant `ProjectAccesses` existant (CRUD complet)
- Wrappé dans un `CollapsibleCard` style V1 Cards
- Le composant a déjà : ajout/modification/suppression d'accès, masquage mot de passe, copie clipboard, catégorisation, chiffrement pgcrypto

---

## 3. 5ème onglet Documents

- Ajouter `'documents'` comme 5ème tab dans `ProjectDetailsTabsV2`
- Icône : `FileText` de lucide-react
- Contenu : composant `ProjectDocuments` existant (GED avec catégorisation, versions, sync Gmail, upload)
- Aucune modification du composant Documents nécessaire

---

## 4. Journal + Gmail Rules dans Échanges

### Sous-onglet Journal
- Ajouter `ProjectTimeline` comme sous-onglet dans `ProjectFollowUp`
- Position : après "Suivi" → RDV | Emails | Suivi | Journal | Règles Gmail
- Icône : `Clock` de lucide-react
- Fonctionnalités : timeline complète, filtres par type/auteur, ajout manuel, expansion emails/RDV

### Sous-onglet Règles Gmail
- Ajouter `ProjectEmailRules` comme sous-onglet dans `ProjectFollowUp`
- Position : dernier sous-onglet
- Icône : `Mail` de lucide-react

---

## 5. Lien "Tout voir dans Échanges" fonctionnel

- Dans SyntheseTab, le lien "▶ Tout voir dans Échanges" doit switcher vers l'onglet Échanges
- Nécessite un callback `onTabChange` passé à SyntheseTab depuis ProjectDetailsTabsV2

---

## Fichiers impactés

| Action | Fichier |
|--------|---------|
| Modifier | `src/modules/ProjectDetailsV2/components/SyntheseTab.tsx` — Brief/Accès CRUD + lien fonctionnel |
| Modifier | `src/modules/ProjectDetailsV2/components/ProjectDetailsTabsV2.tsx` — 5ème tab + callback onTabChange |
| Modifier | `src/modules/ProjectDetailsV2/components/ProjectFollowUp.tsx` — ajouter Journal + Gmail Rules |
| Modifier | `src/modules/ProjectsManagerV2/mocks/mockChecklists.ts` — données 3 projets test |
| Modifier | `src/modules/ProjectsManagerV2/mocks/mockBillings.ts` — données 3 projets test |

## Vérification
1. Ouvrir chaque projet test → Synthèse : Brief éditable, Accès avec CRUD, activités mock
2. Production : checklist avec tâches par phase
3. Finances : factures avec montants
4. Échanges : 5 sous-onglets (RDV, Emails, Suivi, Journal, Règles Gmail)
5. Documents : GED fonctionnelle
6. `npx tsc --noEmit` → 0 erreurs
