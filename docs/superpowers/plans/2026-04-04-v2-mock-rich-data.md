# CRM V2 — Mock Data Riche + Fonctionnalités manquantes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compléter la V2 sans Supabase — mock data riche sur tous les projets, modal édition, billing interactif, filtre responsable, briefs pré-remplis.

**Architecture:** Tout en mémoire. Les mocks centralisés dans `src/modules/ProjectsManagerV2/mocks/`. Les composants `ProjectDetails` lisent ces mocks via leur `projectId`. Aucune API, aucun Supabase.

**Tech Stack:** React 18, TypeScript 5, Tailwind CSS, Zustand context, Sonner toasts, lucide-react icons.

---

## Fichiers modifiés / créés

| Action | Fichier | Rôle |
|--------|---------|------|
| Modify | `src/modules/ProjectsManagerV2/mocks/mockChecklists.ts` | Checklists pour les 8 projets sans données |
| Modify | `src/modules/ProjectsManagerV2/mocks/mockActivities.ts` | Activités pour tous les projets |
| Modify | `src/modules/ProjectDetailsV2/components/ProjectAccesses.tsx` | Accès pour proj-002 à proj-010 |
| Modify | `src/modules/ProjectDetailsV2/components/ProjectDocuments.tsx` | Documents pour proj-003 à proj-010 |
| Create | `src/modules/ProjectsManagerV2/mocks/mockBriefs.ts` | Briefs pré-remplis par projet |
| Modify | `src/modules/ProjectDetailsV2/components/ProjectBrief.tsx` | Lire mockBriefs au lieu de champs vides |
| Create | `src/modules/ProjectsManagerV2/mocks/mockBillings.ts` | Factures par projet |
| Modify | `src/modules/ProjectDetailsV2/components/ProjectBilling.tsx` | Billing interactif (CRUD factures) |
| Create | `src/modules/ProjectsManagerV2/components/EditProjectModal.tsx` | Modal d'édition de projet |
| Modify | `src/modules/ProjectsManagerV2/index.tsx` | Brancher EditProjectModal + filtre responsable |

---

## Task 1 — Mock checklists enrichies (tous les projets)

**Files:**
- Modify: `src/modules/ProjectsManagerV2/mocks/mockChecklists.ts`

- [ ] **Remplacer le contenu complet de mockChecklists.ts**

```typescript
import type { ChecklistItemV2 } from '../../../types/project-v2'

const now = new Date().toISOString()
const d = (daysOffset: number) => {
  const dt = new Date()
  dt.setDate(dt.getDate() + daysOffset)
  return dt.toISOString().split('T')[0]
}

export const MOCK_CHECKLISTS: Record<string, ChecklistItemV2[]> = {
  'proj-001': [
    { id: 'ck-001a', project_id: 'proj-001', parent_task_id: null, title: 'Prise de contact initiale', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: d(-1), sort_order: 1, created_at: now, updated_at: now },
    { id: 'ck-001b', project_id: 'proj-001', parent_task_id: null, title: 'Brief client à remplir', phase: 'onboarding', status: 'in_progress', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: d(3), sort_order: 2, created_at: now, updated_at: now },
    { id: 'ck-001c', project_id: 'proj-001', parent_task_id: null, title: 'Devis à envoyer', phase: 'onboarding', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: d(7), sort_order: 3, created_at: now, updated_at: now },
  ],
  'proj-002': [
    { id: 'ck-002a', project_id: 'proj-002', parent_task_id: null, title: 'Audit SEO initial (mots-clés, concurrents)', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: d(-4), sort_order: 1, created_at: now, updated_at: now },
    { id: 'ck-002b', project_id: 'proj-002', parent_task_id: null, title: 'Validation stratégie mots-clés', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: d(-2), sort_order: 2, created_at: now, updated_at: now },
    { id: 'ck-002c', project_id: 'proj-002', parent_task_id: null, title: 'Optimisation on-page (title, meta, H1)', phase: 'developpement', status: 'in_progress', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: d(5), sort_order: 3, created_at: now, updated_at: now },
    { id: 'ck-002d', project_id: 'proj-002', parent_task_id: null, title: 'Création de 4 articles SEO', phase: 'developpement', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: d(15), sort_order: 4, created_at: now, updated_at: now },
    { id: 'ck-002e', project_id: 'proj-002', parent_task_id: null, title: 'Netlinking — 10 backlinks de qualité', phase: 'post_livraison', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: d(25), sort_order: 5, created_at: now, updated_at: now },
  ],
  'proj-003': [
    { id: 'ck-003a', project_id: 'proj-003', parent_task_id: null, title: 'Cahier des charges fonctionnel', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: d(-5), sort_order: 1, created_at: now, updated_at: now },
    { id: 'ck-003b', project_id: 'proj-003', parent_task_id: null, title: 'Validation devis & signature contrat', phase: 'onboarding', status: 'in_progress', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: d(2), sort_order: 2, created_at: now, updated_at: now },
    { id: 'ck-003c', project_id: 'proj-003', parent_task_id: null, title: 'Choix stack technique', phase: 'conception', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: d(12), sort_order: 3, created_at: now, updated_at: now },
  ],
  'proj-004': [
    { id: 'ck-001', project_id: 'proj-004', parent_task_id: null, title: 'Brief initial validé', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-carol', assigned_name: 'Carol Petit', due_date: d(-18), sort_order: 1, created_at: now, updated_at: now },
    { id: 'ck-002', project_id: 'proj-004', parent_task_id: null, title: 'Accès récupérés (hébergement, domaine, analytics)', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-carol', assigned_name: 'Carol Petit', due_date: d(-17), sort_order: 2, created_at: now, updated_at: now },
    { id: 'ck-003', project_id: 'proj-004', parent_task_id: null, title: 'Contenu reçu du client', phase: 'onboarding', status: 'done', priority: 'medium', assigned_to: 'user-carol', assigned_name: 'Carol Petit', due_date: d(-16), sort_order: 3, created_at: now, updated_at: now },
    { id: 'ck-004', project_id: 'proj-004', parent_task_id: null, title: 'Maquettes desktop livrées', phase: 'conception', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: d(-12), sort_order: 4, created_at: now, updated_at: now },
    { id: 'ck-005', project_id: 'proj-004', parent_task_id: null, title: 'Maquettes mobile livrées', phase: 'conception', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: d(-10), sort_order: 5, created_at: now, updated_at: now },
    { id: 'ck-006', project_id: 'proj-004', parent_task_id: null, title: 'Validation client des maquettes', phase: 'conception', status: 'done', priority: 'high', assigned_to: 'user-carol', assigned_name: 'Carol Petit', due_date: d(-8), sort_order: 6, created_at: now, updated_at: now },
    { id: 'ck-007', project_id: 'proj-004', parent_task_id: null, title: 'Intégration des pages principales', phase: 'developpement', status: 'in_progress', priority: 'high', assigned_to: 'user-carol', assigned_name: 'Carol Petit', due_date: d(2), sort_order: 7, created_at: now, updated_at: now },
    { id: 'ck-008', project_id: 'proj-004', parent_task_id: null, title: 'Optimisation SEO on-page', phase: 'developpement', status: 'in_progress', priority: 'medium', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: d(5), sort_order: 8, created_at: now, updated_at: now },
    { id: 'ck-009', project_id: 'proj-004', parent_task_id: null, title: 'Tests cross-browser et responsive', phase: 'developpement', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: d(8), sort_order: 9, created_at: now, updated_at: now },
    { id: 'ck-010', project_id: 'proj-004', parent_task_id: null, title: 'Recette interne effectuée', phase: 'recette', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: d(10), sort_order: 10, created_at: now, updated_at: now },
    { id: 'ck-011', project_id: 'proj-004', parent_task_id: null, title: 'Recette client effectuée', phase: 'recette', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: d(12), sort_order: 11, created_at: now, updated_at: now },
  ],
  'proj-005': [
    { id: 'ck-101', project_id: 'proj-005', parent_task_id: null, title: 'Brief fonctionnel validé', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: d(-28), sort_order: 1, created_at: now, updated_at: now },
    { id: 'ck-102', project_id: 'proj-005', parent_task_id: null, title: 'Cahier des charges rédigé et validé', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: d(-25), sort_order: 2, created_at: now, updated_at: now },
    { id: 'ck-103', project_id: 'proj-005', parent_task_id: null, title: 'Architecture technique définie', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: d(-22), sort_order: 3, created_at: now, updated_at: now },
    { id: 'ck-104', project_id: 'proj-005', parent_task_id: null, title: 'Sprint 1 : MVP livré', phase: 'developpement', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: d(-15), sort_order: 4, created_at: now, updated_at: now },
    { id: 'ck-105', project_id: 'proj-005', parent_task_id: null, title: 'Sprint 2 : features avancées', phase: 'developpement', status: 'in_progress', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: d(3), sort_order: 5, created_at: now, updated_at: now },
    { id: 'ck-106', project_id: 'proj-005', parent_task_id: null, title: 'Tests unitaires et d\'intégration', phase: 'developpement', status: 'in_progress', priority: 'medium', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: d(5), sort_order: 6, created_at: now, updated_at: now },
    { id: 'ck-107', project_id: 'proj-005', parent_task_id: null, title: 'Recette fonctionnelle complète', phase: 'recette', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: d(7), sort_order: 7, created_at: now, updated_at: now },
  ],
  'proj-006': [
    { id: 'ck-006a', project_id: 'proj-006', parent_task_id: null, title: 'Onboarding complet', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-carol', assigned_name: 'Carol Petit', due_date: d(-38), sort_order: 1, created_at: now, updated_at: now },
    { id: 'ck-006b', project_id: 'proj-006', parent_task_id: null, title: 'Maquettes validées', phase: 'conception', status: 'done', priority: 'high', assigned_to: 'user-carol', assigned_name: 'Carol Petit', due_date: d(-28), sort_order: 2, created_at: now, updated_at: now },
    { id: 'ck-006c', project_id: 'proj-006', parent_task_id: null, title: 'Intégration complète', phase: 'developpement', status: 'done', priority: 'high', assigned_to: 'user-carol', assigned_name: 'Carol Petit', due_date: d(-10), sort_order: 3, created_at: now, updated_at: now },
    { id: 'ck-006d', project_id: 'proj-006', parent_task_id: null, title: 'Module réservation en ligne', phase: 'developpement', status: 'done', priority: 'high', assigned_to: 'user-carol', assigned_name: 'Carol Petit', due_date: d(-7), sort_order: 4, created_at: now, updated_at: now },
    { id: 'ck-006e', project_id: 'proj-006', parent_task_id: null, title: 'Recette interne OK', phase: 'recette', status: 'done', priority: 'high', assigned_to: 'user-carol', assigned_name: 'Carol Petit', due_date: d(-4), sort_order: 5, created_at: now, updated_at: now },
    { id: 'ck-006f', project_id: 'proj-006', parent_task_id: null, title: 'Recette client en cours', phase: 'recette', status: 'in_progress', priority: 'high', assigned_to: 'user-carol', assigned_name: 'Carol Petit', due_date: d(2), sort_order: 6, created_at: now, updated_at: now },
    { id: 'ck-006g', project_id: 'proj-006', parent_task_id: null, title: 'Mise en ligne', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: d(5), sort_order: 7, created_at: now, updated_at: now },
  ],
  'proj-007': [
    { id: 'ck-007a', project_id: 'proj-007', parent_task_id: null, title: 'Onboarding & brief', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: d(-58), sort_order: 1, created_at: now, updated_at: now },
    { id: 'ck-007b', project_id: 'proj-007', parent_task_id: null, title: 'Maquettes validées', phase: 'conception', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: d(-48), sort_order: 2, created_at: now, updated_at: now },
    { id: 'ck-007c', project_id: 'proj-007', parent_task_id: null, title: 'Développement', phase: 'developpement', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: d(-25), sort_order: 3, created_at: now, updated_at: now },
    { id: 'ck-007d', project_id: 'proj-007', parent_task_id: null, title: 'Recette client validée', phase: 'recette', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: d(-18), sort_order: 4, created_at: now, updated_at: now },
    { id: 'ck-007e', project_id: 'proj-007', parent_task_id: null, title: 'Mise en ligne & formation client', phase: 'post_livraison', status: 'done', priority: 'medium', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: d(-15), sort_order: 5, created_at: now, updated_at: now },
    { id: 'ck-007f', project_id: 'proj-007', parent_task_id: null, title: 'Rapport de livraison envoyé', phase: 'post_livraison', status: 'done', priority: 'low', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: d(-14), sort_order: 6, created_at: now, updated_at: now },
  ],
  'proj-008': [
    { id: 'ck-008a', project_id: 'proj-008', parent_task_id: null, title: 'Audit SEO de départ', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: d(-88), sort_order: 1, created_at: now, updated_at: now },
    { id: 'ck-008b', project_id: 'proj-008', parent_task_id: null, title: 'Optimisations on-page', phase: 'developpement', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: d(-70), sort_order: 2, created_at: now, updated_at: now },
    { id: 'ck-008c', project_id: 'proj-008', parent_task_id: null, title: '12 articles SEO rédigés', phase: 'developpement', status: 'done', priority: 'medium', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: d(-50), sort_order: 3, created_at: now, updated_at: now },
    { id: 'ck-008d', project_id: 'proj-008', parent_task_id: null, title: 'Rapport mensuel envoyé', phase: 'post_livraison', status: 'done', priority: 'low', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: d(-5), sort_order: 4, created_at: now, updated_at: now },
  ],
  'proj-009': [
    { id: 'ck-009a', project_id: 'proj-009', parent_task_id: null, title: 'Brief & onboarding', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-carol', assigned_name: 'Carol Petit', due_date: d(-18), sort_order: 1, created_at: now, updated_at: now },
    { id: 'ck-009b', project_id: 'proj-009', parent_task_id: null, title: 'Maquettes homepage livrées', phase: 'conception', status: 'done', priority: 'high', assigned_to: 'user-carol', assigned_name: 'Carol Petit', due_date: d(-12), sort_order: 2, created_at: now, updated_at: now },
    { id: 'ck-009c', project_id: 'proj-009', parent_task_id: null, title: 'Intégration homepage', phase: 'developpement', status: 'in_progress', priority: 'high', assigned_to: 'user-carol', assigned_name: 'Carol Petit', due_date: d(8), sort_order: 3, created_at: now, updated_at: now },
    { id: 'ck-009d', project_id: 'proj-009', parent_task_id: null, title: 'Module commande plateaux repas', phase: 'developpement', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: d(20), sort_order: 4, created_at: now, updated_at: now },
  ],
  'proj-010': [
    { id: 'ck-010a', project_id: 'proj-010', parent_task_id: null, title: 'Cahier des charges', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: d(-118), sort_order: 1, created_at: now, updated_at: now },
    { id: 'ck-010b', project_id: 'proj-010', parent_task_id: null, title: 'Maquettes validées', phase: 'conception', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: d(-100), sort_order: 2, created_at: now, updated_at: now },
    { id: 'ck-010c', project_id: 'proj-010', parent_task_id: null, title: 'Développement complet', phase: 'developpement', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: d(-75), sort_order: 3, created_at: now, updated_at: now },
    { id: 'ck-010d', project_id: 'proj-010', parent_task_id: null, title: 'SEO technique & contenu', phase: 'developpement', status: 'done', priority: 'medium', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: d(-70), sort_order: 4, created_at: now, updated_at: now },
    { id: 'ck-010e', project_id: 'proj-010', parent_task_id: null, title: 'Recette & mise en ligne', phase: 'recette', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: d(-62), sort_order: 5, created_at: now, updated_at: now },
    { id: 'ck-010f', project_id: 'proj-010', parent_task_id: null, title: 'Bilan & clôture projet', phase: 'post_livraison', status: 'done', priority: 'low', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: d(-60), sort_order: 6, created_at: now, updated_at: now },
  ],
}
```

- [ ] **Vérifier que le build ne casse pas**

```bash
npm run build 2>&1 | tail -5
```

---

## Task 2 — Mock activités enrichies (tous les projets)

**Files:**
- Modify: `src/modules/ProjectsManagerV2/mocks/mockActivities.ts`

- [ ] **Remplacer le contenu complet de mockActivities.ts**

```typescript
import type { ProjectActivity } from '../../../types/project-v2'

const d = (daysOffset: number) => {
  const dt = new Date()
  dt.setDate(dt.getDate() + daysOffset)
  return dt.toISOString()
}

export const MOCK_ACTIVITIES: Record<string, ProjectActivity[]> = {
  'proj-001': [
    { id: 'act-001a', project_id: 'proj-001', user_id: 'user-alice', author_name: 'Alice Martin', type: 'status', is_auto: true, content: 'Projet créé en statut "Prospect"', metadata: { to: 'prospect' }, created_at: d(-2) },
    { id: 'act-001b', project_id: 'proj-001', user_id: 'user-alice', author_name: 'Alice Martin', type: 'call', is_auto: false, content: 'Appel découverte 20min — Boulangerie Dupont. Client souhaite réservation en ligne + menu digital. Budget OK.', created_at: d(-1) },
  ],
  'proj-002': [
    { id: 'act-002a', project_id: 'proj-002', user_id: 'user-bob', author_name: 'Bob Lefèvre', type: 'status', is_auto: true, content: 'Brief reçu — projet passé en "Brief reçu"', metadata: { from: 'prospect', to: 'brief_received' }, created_at: d(-10) },
    { id: 'act-002b', project_id: 'proj-002', user_id: 'user-bob', author_name: 'Bob Lefèvre', type: 'task', is_auto: true, content: 'Tâche terminée : Audit SEO initial', created_at: d(-4) },
    { id: 'act-002c', project_id: 'proj-002', user_id: 'user-bob', author_name: 'Bob Lefèvre', type: 'email', is_auto: false, content: 'Email rapport audit envoyé au client. 47 mots-clés identifiés, 3 concurrents analysés.', created_at: d(-3) },
    { id: 'act-002d', project_id: 'proj-002', user_id: 'user-bob', author_name: 'Bob Lefèvre', type: 'task', is_auto: true, content: 'Tâche terminée : Validation stratégie mots-clés', created_at: d(-2) },
  ],
  'proj-003': [
    { id: 'act-003a', project_id: 'proj-003', user_id: 'user-alice', author_name: 'Alice Martin', type: 'status', is_auto: true, content: 'Devis envoyé — projet passé en "Devis envoyé"', metadata: { from: 'brief_received', to: 'quote_sent' }, created_at: d(-7) },
    { id: 'act-003b', project_id: 'proj-003', user_id: 'user-alice', author_name: 'Alice Martin', type: 'decision', is_auto: false, content: 'Proposition de 3 phases : MVP (3 mois), V1 (5 mois), V2 (8 mois). Budget total : 18 000 €. Devis PDF envoyé.', created_at: d(-6) },
    { id: 'act-003c', project_id: 'proj-003', user_id: 'user-alice', author_name: 'Alice Martin', type: 'call', is_auto: false, content: 'Call de suivi devis — 30min. Client intéressé, demande 2 semaines pour valider en interne.', created_at: d(-3) },
  ],
  'proj-004': [
    { id: 'act-001', project_id: 'proj-004', user_id: 'user-carol', author_name: 'Carol Petit', type: 'status', is_auto: true, content: 'Projet passé en statut "En cours"', metadata: { from: 'brief_received', to: 'in_progress' }, created_at: d(-20) },
    { id: 'act-002', project_id: 'proj-004', user_id: 'user-carol', author_name: 'Carol Petit', type: 'task', is_auto: true, content: 'Tâche terminée : Brief initial validé', metadata: { task_id: 'ck-001' }, created_at: d(-18) },
    { id: 'act-003', project_id: 'proj-004', user_id: 'user-alice', author_name: 'Alice Martin', type: 'file', is_auto: true, content: 'Document uploadé : Maquettes_Desktop_V1.fig (V1)', metadata: { document_id: 'doc-001' }, created_at: d(-12) },
    { id: 'act-004', project_id: 'proj-004', user_id: 'user-carol', author_name: 'Carol Petit', type: 'call', is_auto: false, content: 'Appel client 30min — Validation des maquettes. Client très satisfait, quelques ajustements couleurs demandés sur la homepage.', created_at: d(-8) },
    { id: 'act-005', project_id: 'proj-004', user_id: 'user-carol', author_name: 'Carol Petit', type: 'task', is_auto: true, content: 'Tâche terminée : Validation client des maquettes', metadata: { task_id: 'ck-006' }, created_at: d(-7) },
    { id: 'act-006', project_id: 'proj-004', user_id: null, author_name: null, type: 'system', is_auto: true, content: 'Score de complétude mis à jour : 58%', created_at: d(-1) },
  ],
  'proj-005': [
    { id: 'act-101', project_id: 'proj-005', user_id: 'user-bob', author_name: 'Bob Lefèvre', type: 'status', is_auto: true, content: 'Projet passé en statut "En cours"', metadata: { from: 'quote_sent', to: 'in_progress' }, created_at: d(-30) },
    { id: 'act-102', project_id: 'proj-005', user_id: 'user-bob', author_name: 'Bob Lefèvre', type: 'access', is_auto: true, content: 'Accès ajouté : Serveur OVH (hosting)', created_at: d(-28) },
    { id: 'act-103', project_id: 'proj-005', user_id: 'user-bob', author_name: 'Bob Lefèvre', type: 'decision', is_auto: false, content: 'Décision architecture : Stack Laravel + Vue.js retenue après comparaison avec Next.js. Raison : expertise interne et hébergement mutualisé client.', created_at: d(-22) },
    { id: 'act-104', project_id: 'proj-005', user_id: 'user-bob', author_name: 'Bob Lefèvre', type: 'task', is_auto: true, content: 'Tâche terminée : Sprint 1 — MVP livré', created_at: d(-15) },
    { id: 'act-105', project_id: 'proj-005', user_id: 'user-bob', author_name: 'Bob Lefèvre', type: 'call', is_auto: false, content: 'Démo Sprint 1 client — 1h. Retours positifs sur le module gestion des mandats. Demande de changement : ajouter export PDF des contrats.', created_at: d(-14) },
    { id: 'act-106', project_id: 'proj-005', user_id: 'user-bob', author_name: 'Bob Lefèvre', type: 'invoice', is_auto: true, content: 'Facture émise : Acompte 30% — 6 600 €', metadata: { amount: 6600, invoice_id: 'inv-001' }, created_at: d(-10) },
  ],
  'proj-006': [
    { id: 'act-006a', project_id: 'proj-006', user_id: 'user-carol', author_name: 'Carol Petit', type: 'status', is_auto: true, content: 'Projet passé en recette', metadata: { from: 'in_progress', to: 'review' }, created_at: d(-4) },
    { id: 'act-006b', project_id: 'proj-006', user_id: 'user-carol', author_name: 'Carol Petit', type: 'call', is_auto: false, content: 'Call recette client 45min. 3 retours mineurs : ajustement couleurs menu, photo hero, formulaire réservation. Correction en cours.', created_at: d(-2) },
    { id: 'act-006c', project_id: 'proj-006', user_id: 'user-carol', author_name: 'Carol Petit', type: 'invoice', is_auto: true, content: 'Facture émise : Situation 50% — 1 400 €', metadata: { amount: 1400 }, created_at: d(-2) },
  ],
  'proj-007': [
    { id: 'act-007a', project_id: 'proj-007', user_id: 'user-alice', author_name: 'Alice Martin', type: 'status', is_auto: true, content: 'Projet livré', metadata: { from: 'review', to: 'delivered' }, created_at: d(-15) },
    { id: 'act-007b', project_id: 'proj-007', user_id: 'user-alice', author_name: 'Alice Martin', type: 'invoice', is_auto: true, content: 'Facture solde émise : 820 € — Projet clôturé côté facturation', metadata: { amount: 820 }, created_at: d(-15) },
    { id: 'act-007c', project_id: 'proj-007', user_id: 'user-alice', author_name: 'Alice Martin', type: 'email', is_auto: false, content: 'Rapport de livraison envoyé. Accès transmis, formation 1h réalisée en visio.', created_at: d(-14) },
  ],
  'proj-008': [
    { id: 'act-008a', project_id: 'proj-008', user_id: 'user-bob', author_name: 'Bob Lefèvre', type: 'status', is_auto: true, content: 'Projet passé en maintenance', metadata: { from: 'delivered', to: 'maintenance' }, created_at: d(-30) },
    { id: 'act-008b', project_id: 'proj-008', user_id: 'user-bob', author_name: 'Bob Lefèvre', type: 'task', is_auto: true, content: 'Rapport mensuel SEO envoyé — +28% de trafic organique', created_at: d(-5) },
  ],
  'proj-009': [
    { id: 'act-009a', project_id: 'proj-009', user_id: 'user-carol', author_name: 'Carol Petit', type: 'status', is_auto: true, content: 'Projet mis en pause — client en attente de validation budget interne', metadata: { from: 'in_progress', to: 'on_hold' }, created_at: d(-8) },
    { id: 'act-009b', project_id: 'proj-009', user_id: 'user-carol', author_name: 'Carol Petit', type: 'call', is_auto: false, content: 'Appel client — Pause de 3-4 semaines. Directeur à l\'étranger, validation budget reportée.', created_at: d(-8) },
  ],
  'proj-010': [
    { id: 'act-010a', project_id: 'proj-010', user_id: 'user-alice', author_name: 'Alice Martin', type: 'status', is_auto: true, content: 'Projet clôturé', metadata: { from: 'maintenance', to: 'closed' }, created_at: d(-60) },
    { id: 'act-010b', project_id: 'proj-010', user_id: 'user-alice', author_name: 'Alice Martin', type: 'invoice', is_auto: true, content: 'Dernière facture réglée — Projet entièrement soldé', created_at: d(-60) },
    { id: 'act-010c', project_id: 'proj-010', user_id: 'user-alice', author_name: 'Alice Martin', type: 'email', is_auto: false, content: 'Email bilan final envoyé. ROI : +340% trafic organique sur 12 mois. Client très satisfait, potentiel de renouvellement SEO.', created_at: d(-59) },
  ],
}
```

- [ ] **Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```

---

## Task 3 — Mock accès enrichis (tous les projets)

**Files:**
- Modify: `src/modules/ProjectDetailsV2/components/ProjectAccesses.tsx` — uniquement le bloc `INITIAL_ACCESSES`

- [ ] **Remplacer le bloc `const INITIAL_ACCESSES` (ligne 38 à 83) par le bloc ci-dessous**

Repérer `const INITIAL_ACCESSES: Record<string, ProjectAccess[]> = {` et remplacer tout le bloc jusqu'à son `}` fermant par :

```typescript
const INITIAL_ACCESSES: Record<string, ProjectAccess[]> = {
  'proj-001': [
    { id: 'acc-001', project_id: 'proj-001', category: 'hosting', service_name: 'OVH Cloud', url: 'https://www.ovh.com', login: 'contact@boulangerie-dupont.fr', password: 'Ov#2025!bD', notes: null, status: 'active', detected_from_email: false, created_at: dAgo(30), updated_at: dAgo(1) },
    { id: 'acc-002', project_id: 'proj-001', category: 'cms', service_name: 'WordPress Admin', url: 'https://boulangerie-dupont.fr/wp-admin', login: 'admin_dupont', password: 'Wp@Boul#99', notes: null, status: 'active', detected_from_email: false, created_at: dAgo(30), updated_at: dAgo(1) },
    { id: 'acc-003', project_id: 'proj-001', category: 'analytics', service_name: 'Google Analytics', url: 'https://analytics.google.com', login: '', password: '', notes: 'Accès non encore transmis par le client', status: 'missing', detected_from_email: false, created_at: dAgo(30), updated_at: dAgo(1) },
  ],
  'proj-002': [
    { id: 'acc-011', project_id: 'proj-002', category: 'hosting', service_name: 'Infomaniak', url: 'https://www.infomaniak.com', login: 'cabinet.legrand@gmail.com', password: 'Inf#Leg2024', notes: null, status: 'active', detected_from_email: false, created_at: dAgo(10), updated_at: dAgo(2) },
    { id: 'acc-012', project_id: 'proj-002', category: 'analytics', service_name: 'Google Search Console', url: 'https://search.google.com/search-console', login: 'cabinet.legrand@gmail.com', password: '', notes: 'Accès OAuth — se connecter avec le compte Google', status: 'active', detected_from_email: false, created_at: dAgo(10), updated_at: dAgo(2) },
    { id: 'acc-013', project_id: 'proj-002', category: 'tools', service_name: 'SEMrush', url: 'https://www.semrush.com', login: 'bob.lefevre@propulseo.fr', password: 'Sem#Prp!42', notes: 'Compte agence partagé', status: 'active', detected_from_email: false, created_at: dAgo(10), updated_at: dAgo(2) },
  ],
  'proj-003': [
    { id: 'acc-021', project_id: 'proj-003', category: 'hosting', service_name: 'AWS (démo)', url: 'https://aws.amazon.com', login: 'dev@novelia.io', password: 'Aws#Nov!2025', notes: 'Compte sandbox', status: 'pending_validation', detected_from_email: false, created_at: dAgo(5), updated_at: dAgo(1) },
    { id: 'acc-022', project_id: 'proj-003', category: 'design', service_name: 'Figma', url: 'https://figma.com', login: 'alice.martin@propulseo.fr', password: '', notes: 'Compte agence', status: 'active', detected_from_email: false, created_at: dAgo(5), updated_at: dAgo(1) },
  ],
  'proj-004': [
    { id: 'acc-031', project_id: 'proj-004', category: 'hosting', service_name: 'OVH Shared', url: 'https://www.ovh.com', login: 'contact@clinique-morin.fr', password: 'Ov#Clin2025', notes: null, status: 'active', detected_from_email: false, created_at: dAgo(20), updated_at: dAgo(3) },
    { id: 'acc-032', project_id: 'proj-004', category: 'cms', service_name: 'WordPress Admin', url: 'https://clinique-morin.fr/wp-admin', login: 'admin_morin', password: 'Wp@Mor#88', notes: null, status: 'active', detected_from_email: false, created_at: dAgo(20), updated_at: dAgo(3) },
    { id: 'acc-033', project_id: 'proj-004', category: 'analytics', service_name: 'Google Analytics 4', url: 'https://analytics.google.com', login: 'clinique.morin@gmail.com', password: '', notes: 'Accès OAuth via compte client', status: 'active', detected_from_email: false, created_at: dAgo(18), updated_at: dAgo(3) },
    { id: 'acc-034', project_id: 'proj-004', category: 'tools', service_name: 'Google Business Profile', url: 'https://business.google.com', login: 'clinique.morin@gmail.com', password: '', notes: 'SEO local — fiche Google', status: 'active', detected_from_email: false, created_at: dAgo(18), updated_at: dAgo(3) },
  ],
  'proj-005': [
    { id: 'acc-041', project_id: 'proj-005', category: 'hosting', service_name: 'Serveur OVH VPS', url: 'https://www.ovh.com', login: 'root@vps-immocotesud.ovh', password: 'Vps#Imm!2025X', notes: 'Accès SSH port 22', status: 'active', detected_from_email: false, created_at: dAgo(28), updated_at: dAgo(5) },
    { id: 'acc-042', project_id: 'proj-005', category: 'cms', service_name: 'Laravel Admin Panel', url: 'https://admin.immobilier-cotesud.fr', login: 'admin@immobilier-cotesud.fr', password: 'Lrv#Admin!77', notes: null, status: 'active', detected_from_email: false, created_at: dAgo(20), updated_at: dAgo(2) },
    { id: 'acc-043', project_id: 'proj-005', category: 'analytics', service_name: 'Google Analytics 4', url: 'https://analytics.google.com', login: 'direction@immobilier-cotesud.fr', password: '', notes: null, status: 'pending_validation', detected_from_email: false, created_at: dAgo(15), updated_at: dAgo(2) },
    { id: 'acc-044', project_id: 'proj-005', category: 'tools', service_name: 'Postman API Workspace', url: 'https://www.postman.com', login: 'bob.lefevre@propulseo.fr', password: 'Pst#Api#23', notes: 'Workspace partagé équipe', status: 'active', detected_from_email: false, created_at: dAgo(25), updated_at: dAgo(5) },
  ],
  'proj-006': [
    { id: 'acc-051', project_id: 'proj-006', category: 'hosting', service_name: 'O2Switch', url: 'https://www.o2switch.fr', login: 'contact@laterrasse.fr', password: 'O2s#Ter!56', notes: null, status: 'active', detected_from_email: false, created_at: dAgo(38), updated_at: dAgo(5) },
    { id: 'acc-052', project_id: 'proj-006', category: 'cms', service_name: 'WordPress Admin', url: 'https://laterrasse.fr/wp-admin', login: 'admin_terrasse', password: 'Wp@Ter#21', notes: null, status: 'active', detected_from_email: false, created_at: dAgo(38), updated_at: dAgo(5) },
    { id: 'acc-053', project_id: 'proj-006', category: 'social', service_name: 'Instagram Business', url: 'https://www.instagram.com', login: 'laterrasse.restaurant', password: 'Ig#Terr!90', notes: 'Compte partagé client', status: 'active', detected_from_email: false, created_at: dAgo(30), updated_at: dAgo(5) },
  ],
  'proj-007': [
    { id: 'acc-061', project_id: 'proj-007', category: 'hosting', service_name: 'Gandi.net', url: 'https://www.gandi.net', login: 'admin@pharmacie-centrale.fr', password: 'Gnd#Phm2024', notes: null, status: 'active', detected_from_email: false, created_at: dAgo(60), updated_at: dAgo(15) },
    { id: 'acc-062', project_id: 'proj-007', category: 'cms', service_name: 'WordPress Admin', url: 'https://pharmacie-centrale.fr/wp-admin', login: 'admin_pharma', password: 'Wp@Phm#77', notes: 'Accès transmis au client', status: 'active', detected_from_email: false, created_at: dAgo(60), updated_at: dAgo(15) },
    { id: 'acc-063', project_id: 'proj-007', category: 'analytics', service_name: 'Google Analytics 4', url: 'https://analytics.google.com', login: 'pharmacie.centrale@gmail.com', password: '', notes: 'Accès configuré et transmis', status: 'active', detected_from_email: false, created_at: dAgo(55), updated_at: dAgo(15) },
  ],
  'proj-008': [
    { id: 'acc-071', project_id: 'proj-008', category: 'analytics', service_name: 'Google Search Console', url: 'https://search.google.com/search-console', login: 'ecole.armoni@gmail.com', password: '', notes: 'OAuth — compte client', status: 'active', detected_from_email: false, created_at: dAgo(90), updated_at: dAgo(5) },
    { id: 'acc-072', project_id: 'proj-008', category: 'tools', service_name: 'Ahrefs', url: 'https://ahrefs.com', login: 'bob.lefevre@propulseo.fr', password: 'Ahr#Pro!55', notes: 'Compte agence', status: 'active', detected_from_email: false, created_at: dAgo(90), updated_at: dAgo(5) },
  ],
  'proj-009': [
    { id: 'acc-081', project_id: 'proj-009', category: 'hosting', service_name: 'Ionos', url: 'https://www.ionos.fr', login: 'contact@saveurs-du-monde.fr', password: 'Ion#Sav!88', notes: null, status: 'active', detected_from_email: false, created_at: dAgo(14), updated_at: dAgo(8) },
    { id: 'acc-082', project_id: 'proj-009', category: 'cms', service_name: 'WooCommerce Admin', url: 'https://saveurs-du-monde.fr/wp-admin', login: 'admin_saveurs', password: 'Wc@Sav#12', notes: 'Module commande en cours de dev', status: 'broken', detected_from_email: false, created_at: dAgo(12), updated_at: dAgo(8) },
  ],
  'proj-010': [
    { id: 'acc-091', project_id: 'proj-010', category: 'hosting', service_name: 'Hébergeur clôturé', url: null, login: 'contact@agence-horizon.fr', password: 'Arch!2023', notes: 'Archivé — accès transférés au client', status: 'expired', detected_from_email: false, created_at: dAgo(120), updated_at: dAgo(60) },
  ],
}
```

- [ ] **Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```

---

## Task 4 — Mock documents enrichis

**Files:**
- Modify: `src/modules/ProjectDetailsV2/components/ProjectDocuments.tsx` — uniquement le bloc `INITIAL_DOCUMENTS`

- [ ] **Remplacer le bloc `const INITIAL_DOCUMENTS` (ligne 27-68) par le bloc ci-dessous**

```typescript
const INITIAL_DOCUMENTS: Record<string, ProjectDocument[]> = {
  'proj-001': [
    { id: 'doc-001a', project_id: 'proj-001', name: 'Brief_Boulangerie_Dupont.pdf', category: 'brief', version: 1, file_path: 'mock://proj-001/Brief_Boulangerie_Dupont.pdf', file_size: 210000, mime_type: 'application/pdf', uploader_name: 'Alice Martin', created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
  ],
  'proj-002': [
    { id: 'doc-002a', project_id: 'proj-002', name: 'Contrat_SEO_Cabinet_Legrand.pdf', category: 'contract', version: 1, file_path: 'mock://proj-002/Contrat_SEO_Cabinet_Legrand.pdf', file_size: 185000, mime_type: 'application/pdf', uploader_name: 'Bob Lefèvre', created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
    { id: 'doc-002b', project_id: 'proj-002', name: 'Audit_SEO_Legrand_V1.pdf', category: 'report', version: 1, file_path: 'mock://proj-002/Audit_SEO_Legrand_V1.pdf', file_size: 4200000, mime_type: 'application/pdf', uploader_name: 'Bob Lefèvre', created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString() },
  ],
  'proj-003': [
    { id: 'doc-003a', project_id: 'proj-003', name: 'CDC_Novelia_SaaS_RH.docx', category: 'brief', version: 2, file_path: 'mock://proj-003/CDC_Novelia_SaaS_RH.docx', file_size: 890000, mime_type: 'application/docx', uploader_name: 'Alice Martin', created_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString() },
    { id: 'doc-003b', project_id: 'proj-003', name: 'Devis_Novelia_18000.pdf', category: 'invoice', version: 1, file_path: 'mock://proj-003/Devis_Novelia_18000.pdf', file_size: 145000, mime_type: 'application/pdf', uploader_name: 'Alice Martin', created_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString() },
  ],
  'proj-004': [
    { id: 'doc-004a', project_id: 'proj-004', name: 'Brief_Clinique_Morin.pdf', category: 'brief', version: 1, file_path: 'mock://proj-004/Brief_Clinique_Morin.pdf', file_size: 245000, mime_type: 'application/pdf', uploader_name: 'Carol Petit', created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString() },
    { id: 'doc-004b', project_id: 'proj-004', name: 'Maquettes_Desktop_V1.fig', category: 'mockup', version: 1, file_path: 'mock://proj-004/Maquettes_Desktop_V1.fig', file_size: 8200000, mime_type: 'application/figma', uploader_name: 'Alice Martin', created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString() },
    { id: 'doc-004c', project_id: 'proj-004', name: 'Maquettes_Desktop_V2.fig', category: 'mockup', version: 2, file_path: 'mock://proj-004/Maquettes_Desktop_V2.fig', file_size: 9100000, mime_type: 'application/figma', uploader_name: 'Alice Martin', created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString() },
    { id: 'doc-004d', project_id: 'proj-004', name: 'Contrat_Clinique_Morin.pdf', category: 'contract', version: 1, file_path: 'mock://proj-004/Contrat_Clinique_Morin.pdf', file_size: 195000, mime_type: 'application/pdf', uploader_name: 'Carol Petit', created_at: new Date(Date.now() - 22 * 24 * 3600 * 1000).toISOString() },
  ],
  'proj-005': [
    { id: 'doc-005a', project_id: 'proj-005', name: 'CDC_ERP_Immocotesud_V2.docx', category: 'brief', version: 2, file_path: 'mock://proj-005/CDC_ERP_Immocotesud_V2.docx', file_size: 1450000, mime_type: 'application/docx', uploader_name: 'Bob Lefèvre', created_at: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString() },
    { id: 'doc-005b', project_id: 'proj-005', name: 'Contrat_Immocotesud_22000.pdf', category: 'contract', version: 1, file_path: 'mock://proj-005/Contrat_Immocotesud_22000.pdf', file_size: 220000, mime_type: 'application/pdf', uploader_name: 'Bob Lefèvre', created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() },
    { id: 'doc-005c', project_id: 'proj-005', name: 'Architecture_technique.pdf', category: 'report', version: 1, file_path: 'mock://proj-005/Architecture_technique.pdf', file_size: 3800000, mime_type: 'application/pdf', uploader_name: 'Bob Lefèvre', created_at: new Date(Date.now() - 22 * 24 * 3600 * 1000).toISOString() },
    { id: 'doc-005d', project_id: 'proj-005', name: 'Facture_Acompte_30pct.pdf', category: 'invoice', version: 1, file_path: 'mock://proj-005/Facture_Acompte_30pct.pdf', file_size: 140000, mime_type: 'application/pdf', uploader_name: 'Bob Lefèvre', created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
  ],
  'proj-006': [
    { id: 'doc-006a', project_id: 'proj-006', name: 'Maquettes_Terrasse_Final.fig', category: 'mockup', version: 3, file_path: 'mock://proj-006/Maquettes_Terrasse_Final.fig', file_size: 7600000, mime_type: 'application/figma', uploader_name: 'Carol Petit', created_at: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString() },
    { id: 'doc-006b', project_id: 'proj-006', name: 'Livrable_Site_Terrasse_V1.zip', category: 'deliverable', version: 1, file_path: 'mock://proj-006/Livrable_Site_Terrasse_V1.zip', file_size: 28000000, mime_type: 'application/zip', uploader_name: 'Carol Petit', created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
    { id: 'doc-006c', project_id: 'proj-006', name: 'Facture_Situation_50pct.pdf', category: 'invoice', version: 1, file_path: 'mock://proj-006/Facture_Situation_50pct.pdf', file_size: 138000, mime_type: 'application/pdf', uploader_name: 'Carol Petit', created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
  ],
  'proj-007': [
    { id: 'doc-007a', project_id: 'proj-007', name: 'Livrable_Pharmacie_Centrale.zip', category: 'deliverable', version: 1, file_path: 'mock://proj-007/Livrable_Pharmacie_Centrale.zip', file_size: 18500000, mime_type: 'application/zip', uploader_name: 'Alice Martin', created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() },
    { id: 'doc-007b', project_id: 'proj-007', name: 'Rapport_Livraison.pdf', category: 'report', version: 1, file_path: 'mock://proj-007/Rapport_Livraison.pdf', file_size: 560000, mime_type: 'application/pdf', uploader_name: 'Alice Martin', created_at: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString() },
    { id: 'doc-007c', project_id: 'proj-007', name: 'Facture_Solde_Final.pdf', category: 'invoice', version: 1, file_path: 'mock://proj-007/Facture_Solde_Final.pdf', file_size: 136000, mime_type: 'application/pdf', uploader_name: 'Alice Martin', created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() },
  ],
  'proj-008': [
    { id: 'doc-008a', project_id: 'proj-008', name: 'Rapport_SEO_Mensuel_Mars.pdf', category: 'report', version: 1, file_path: 'mock://proj-008/Rapport_SEO_Mensuel_Mars.pdf', file_size: 1200000, mime_type: 'application/pdf', uploader_name: 'Bob Lefèvre', created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
  ],
  'proj-009': [
    { id: 'doc-009a', project_id: 'proj-009', name: 'Brief_Traiteur_Saveurs.pdf', category: 'brief', version: 1, file_path: 'mock://proj-009/Brief_Traiteur_Saveurs.pdf', file_size: 230000, mime_type: 'application/pdf', uploader_name: 'Carol Petit', created_at: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString() },
    { id: 'doc-009b', project_id: 'proj-009', name: 'Maquettes_Homepage_V1.fig', category: 'mockup', version: 1, file_path: 'mock://proj-009/Maquettes_Homepage_V1.fig', file_size: 5900000, mime_type: 'application/figma', uploader_name: 'Carol Petit', created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString() },
  ],
  'proj-010': [
    { id: 'doc-010a', project_id: 'proj-010', name: 'Rapport_Final_Horizon.pdf', category: 'report', version: 1, file_path: 'mock://proj-010/Rapport_Final_Horizon.pdf', file_size: 2400000, mime_type: 'application/pdf', uploader_name: 'Alice Martin', created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString() },
  ],
}
```

- [ ] **Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```

---

## Task 5 — Mock briefs pré-remplis

**Files:**
- Create: `src/modules/ProjectsManagerV2/mocks/mockBriefs.ts`
- Modify: `src/modules/ProjectDetailsV2/components/ProjectBrief.tsx`

- [ ] **Créer `src/modules/ProjectsManagerV2/mocks/mockBriefs.ts`**

```typescript
import type { ProjectBrief } from '../../../types/project-v2'

const now = new Date().toISOString()

export const MOCK_BRIEFS: Record<string, ProjectBrief> = {
  'proj-001': {
    id: 'brief-001', project_id: 'proj-001', status: 'draft',
    objective: 'Refonte complète du site vitrine avec un système de réservation en ligne pour les commandes de pains et pâtisseries. Améliorer la présence locale sur Google.',
    target_audience: 'Habitants du quartier 25-60 ans, familles, professionnels en quête de boulangerie artisanale de qualité.',
    pages: '- Accueil avec mise en avant des spécialités\n- Menu / carte des produits (photos pro)\n- Réservation / commande en ligne\n- À propos (histoire de la famille Dupont)\n- Horaires & contact\n- Galerie photos',
    techno: 'WordPress + WooCommerce pour les commandes. Hébergement OVH existant.',
    design_references: 'Ambiance chaleureuse, tons crème/brun, typographie artisanale. Ref : maison-kayser.com, paulbakery.com',
    notes: 'Client souhaite pouvoir gérer les produits lui-même. Formation WP incluse dans le devis.',
    created_at: now, updated_at: now,
  },
  'proj-002': {
    id: 'brief-002', project_id: 'proj-002', status: 'validated',
    objective: 'Améliorer la visibilité locale du Cabinet Legrand sur Google pour les requêtes "avocat [ville]". Objectif : top 3 dans les 3 mois.',
    target_audience: 'Particuliers et entreprises locales cherchant un avocat en droit des affaires et droit du travail.',
    pages: 'Optimisation des pages existantes :\n- Page d\'accueil\n- Pages services (droit des affaires, droit du travail, droit immobilier)\n- Page contact & mentions légales\n+ 4 articles de blog SEO à créer',
    techno: 'Site existant sous WordPress. Plugins Yoast SEO + Rank Math à configurer.',
    design_references: 'N/A — pas de refonte visuelle prévue.',
    notes: 'Mots-clés cibles validés : "avocat affaires [ville]", "avocat contrat [ville]", "avocat licenciement [ville]". Volume : 200-500 recherches/mois.',
    created_at: now, updated_at: now,
  },
  'proj-003': {
    id: 'brief-003', project_id: 'proj-003', status: 'draft',
    objective: 'Développer une plateforme SaaS B2B de gestion RH pour les PME (10-200 salariés). MVP en 3 mois avec les modules : absences, congés, notes de frais, organigramme.',
    target_audience: 'DRH et managers de PME souhaitant digitaliser leur gestion RH sans investir dans un ERP lourd.',
    pages: 'Modules MVP :\n- Dashboard RH (absences en temps réel, alertes)\n- Gestion des absences & congés\n- Notes de frais (upload justificatifs)\n- Organigramme dynamique\n- Espace employé (mobile first)\n- Admin : gestion équipe, rôles, permissions',
    techno: 'Stack à définir — proposition : Next.js + Supabase + Stripe pour la facturation SaaS. Mobile : PWA.',
    design_references: 'B2B clean & professionnel. Ref : Lucca, Factorial, PayFit (UX). Palette neutre + accent vert.',
    notes: 'Modèle économique : 5€/salarié/mois. Intégrations futures : silae, PayFit API. Démo publique souhaitée pour les investisseurs en juin.',
    created_at: now, updated_at: now,
  },
  'proj-004': {
    id: 'brief-004', project_id: 'proj-004', status: 'validated',
    objective: 'Créer un site vitrine moderne pour la Clinique Vétérinaire Morin avec prise de RDV en ligne et positionnement SEO local top 3.',
    target_audience: 'Propriétaires d\'animaux de compagnie (chiens, chats, NAC) dans un rayon de 15km. Familles avec enfants.',
    pages: '- Accueil + présentation de l\'équipe vétérinaire\n- Services (consultations, urgences, chirurgie, pension)\n- Prise de RDV en ligne (Doctolib vétérinaire)\n- Blog santé animale (SEO)\n- Tarifs & mutuelle\n- Contact + accès',
    techno: 'WordPress + plugin RDV + Yoast SEO. Hébergement OVH mutualisé. Intégration Google Maps.',
    design_references: 'Tons verts/blancs apaisants. Beaucoup de photos d\'animaux. Ref : veto-reference.fr',
    notes: 'Client veut que le blog soit facile à gérer. Prévoir template d\'article pré-configuré.',
    created_at: now, updated_at: now,
  },
  'proj-005': {
    id: 'brief-005', project_id: 'proj-005', status: 'frozen',
    objective: 'Développer un ERP sur-mesure pour la gestion des mandats immobiliers, transactions, clients et suivi des commissions. Remplacement d\'un outil Excel vieillissant.',
    target_audience: 'Équipe interne : 8 agents immobiliers + 2 gestionnaires. Usage quotidien intensif.',
    pages: 'Modules :\n- CRM clients (acheteurs, vendeurs, locataires)\n- Gestion des mandats (exclusifs, simples)\n- Pipeline transactions (Kanban)\n- Suivi des visites & agendas agents\n- Calcul et suivi des commissions\n- Génération de documents (mandats, compromis)\n- Export PDF & reporting',
    techno: 'Laravel 11 + Vue.js 3 + MySQL. API REST. PWA pour mobile agents. Hébergement VPS OVH.',
    design_references: 'Interface sobre et dense en informations. Ref : Salesforce, Notion (structure). Palette bleue professionnelle.',
    notes: 'Brief figé — CDC signé. Tout changement fonctionnel = avenant. Export PDF contrats prioritaire (demandé en démo Sprint 1).',
    created_at: now, updated_at: now,
  },
  'proj-006': {
    id: 'brief-006', project_id: 'proj-006', status: 'validated',
    objective: 'Créer un site vitrine élégant pour le restaurant La Terrasse avec menu digital, réservation de tables en ligne et galerie photos.',
    target_audience: 'Touristes et habitants locaux, 30-65 ans, recherchant une expérience gastronomique en terrasse.',
    pages: '- Accueil (ambiance, hero video)\n- Menu (été / hiver, avec photos)\n- Réservation en ligne (Zenchef)\n- Galerie photos / événements\n- Notre histoire\n- Actualités (soirées thématiques)\n- Contact & accès',
    techno: 'WordPress + Elementor. Intégration Zenchef pour les réservations. O2Switch hébergement.',
    design_references: 'Sud de France, méditerranéen. Tons sable/terracotta/vert olive. Ref : lacolombe.fr, chateau-eza.com',
    notes: 'Photos professionnelles fournies par le client. Video drone en cours de tournage.',
    created_at: now, updated_at: now,
  },
  'proj-007': {
    id: 'brief-007', project_id: 'proj-007', status: 'frozen',
    objective: 'Refonte du site de la Pharmacie Centrale avec mise en avant du click & collect, des services (vaccination, test antigénique) et du conseil santé.',
    target_audience: 'Clients habituels de la pharmacie, tous âges. Fort trafic mobile (>65%).',
    pages: '- Accueil + click & collect\n- Services (vaccination, test, conseil)\n- Ordonnances en ligne\n- Équipe & valeurs\n- Contact & horaires\n- Blog santé',
    techno: 'WordPress + WooCommerce (click & collect). Hébergement Gandi. HTTPS strict.',
    design_references: 'Tons bleus/verts santé. Interface accessible (contrastes AA). Ref : pharmacie.fr',
    notes: 'Projet livré. Archive uniquement.',
    created_at: now, updated_at: now,
  },
  'proj-008': {
    id: 'brief-008', project_id: 'proj-008', status: 'validated',
    objective: 'SEO continu pour l\'École de Musique Armoni. Augmenter les inscriptions via Google. Objectif : top 5 sur "école de musique [ville]".',
    target_audience: 'Parents d\'enfants 5-18 ans et adultes souhaitant apprendre un instrument dans la région.',
    pages: 'Pages optimisées :\n- Accueil\n- Cours (piano, guitare, violon, chant, batterie)\n- Inscriptions\n- Blog pédagogie musicale (12 articles/an)',
    techno: 'Site WordPress existant. GSC + GA4 configurés.',
    design_references: 'N/A — maintenance SEO uniquement.',
    notes: 'Rapport mensuel à envoyer le 1er de chaque mois. Contrat maintenance 1 an renouvelable.',
    created_at: now, updated_at: now,
  },
  'proj-009': {
    id: 'brief-009', project_id: 'proj-009', status: 'draft',
    objective: 'Créer un site e-commerce pour commander des plateaux repas (cocktails, buffets, repas d\'entreprise) en ligne avec livraison ou click & collect.',
    target_audience: 'Entreprises (séminaires, events RH), particuliers (anniversaires, mariages), collectivités.',
    pages: '- Accueil (photos appétissantes)\n- Catalogue plateaux (filtres : budget, type, nb personnes)\n- Configurateur de commande\n- Panier + paiement en ligne (Stripe)\n- Livraison / Click & collect\n- Avis clients\n- À propos & traiteur',
    techno: 'WordPress + WooCommerce + Stripe. Ionos hébergement. Géolocalisation livraison.',
    design_references: 'Coloré, appétissant, moderne. Ref : fichesaladebar.fr, popchef.com',
    notes: 'Projet en pause — client attend validation budget. Reprendre quand vert.',
    created_at: now, updated_at: now,
  },
  'proj-010': {
    id: 'brief-010', project_id: 'proj-010', status: 'frozen',
    objective: 'Portail de réservation de voyages sur-mesure avec espace client, catalogue destinations, devis en ligne et gestion des réservations.',
    target_audience: 'Voyageurs CSP+ 35-65 ans cherchant des circuits personnalisés et du voyage de luxe.',
    pages: '- Accueil (destinations phares, carte interactive)\n- Catalogue voyages (filtres avancés)\n- Configurateur voyage sur-mesure\n- Espace client (mes voyages, documents)\n- Blog voyage (SEO)\n- Devis en ligne\n- Contact conseillers',
    techno: 'WordPress + ACF Pro + WooCommerce Bookings. CDN Cloudflare. Hébergement VPS.',
    design_references: 'Luxe & aventure. Tons or/marine/blanc. Ref : kuoni.fr, terres-oubliees.com',
    notes: 'Projet clôturé. Archive.',
    created_at: now, updated_at: now,
  },
}
```

- [ ] **Modifier `src/modules/ProjectDetailsV2/components/ProjectBrief.tsx`** — ajouter l'import et initialiser les champs depuis les mocks

Remplacer l'import de `BriefStatus` et tout le début du composant :

```typescript
import { useState } from 'react'
import { FileSpreadsheet, Save } from 'lucide-react'
import { toast } from 'sonner'
import type { BriefStatus } from '../../../types/project-v2'
import { MOCK_BRIEFS } from '../../ProjectsManagerV2/mocks/mockBriefs'
```

Remplacer la fonction `ProjectBrief` jusqu'à la fin du `useState` bloc :

```typescript
export function ProjectBrief({ projectId }: ProjectBriefProps) {
  const mockBrief = MOCK_BRIEFS[projectId]
  const [status, setStatus] = useState<BriefStatus>(mockBrief?.status ?? 'draft')
  const [fields, setFields] = useState<Record<string, string>>({
    objective:         mockBrief?.objective         ?? '',
    target_audience:   mockBrief?.target_audience   ?? '',
    pages:             mockBrief?.pages             ?? '',
    techno:            mockBrief?.techno             ?? '',
    design_references: mockBrief?.design_references ?? '',
    notes:             mockBrief?.notes             ?? '',
  })
```

Aussi, supprimer `projectId: _projectId` dans la signature et mettre `projectId` :

```typescript
export function ProjectBrief({ projectId }: ProjectBriefProps) {
```

- [ ] **Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```

---

## Task 6 — Mock billings par projet + Billing interactif

**Files:**
- Create: `src/modules/ProjectsManagerV2/mocks/mockBillings.ts`
- Modify: `src/modules/ProjectDetailsV2/components/ProjectBilling.tsx`

- [ ] **Créer `src/modules/ProjectsManagerV2/mocks/mockBillings.ts`**

```typescript
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface MockInvoice {
  id: string
  project_id: string
  label: string
  amount: number
  status: InvoiceStatus
  date: string | null
  due_date: string | null
  notes: string | null
}

const d = (daysOffset: number): string => {
  const dt = new Date()
  dt.setDate(dt.getDate() + daysOffset)
  return dt.toISOString().split('T')[0]
}

export const MOCK_BILLINGS: Record<string, MockInvoice[]> = {
  'proj-001': [],
  'proj-002': [
    { id: 'inv-002a', project_id: 'proj-002', label: 'Acompte démarrage 30%', amount: 540, status: 'paid', date: d(-9), due_date: d(-9), notes: null },
  ],
  'proj-003': [
    { id: 'inv-003a', project_id: 'proj-003', label: 'Acompte 30% à la signature', amount: 5400, status: 'draft', date: null, due_date: d(5), notes: 'À envoyer après signature contrat' },
  ],
  'proj-004': [
    { id: 'inv-004a', project_id: 'proj-004', label: 'Acompte 30%', amount: 1560, status: 'paid', date: d(-20), due_date: d(-18), notes: null },
    { id: 'inv-004b', project_id: 'proj-004', label: 'Situation 50%', amount: 2600, status: 'sent', date: d(-2), due_date: d(15), notes: null },
    { id: 'inv-004c', project_id: 'proj-004', label: 'Solde 20%', amount: 1040, status: 'draft', date: null, due_date: null, notes: 'À émettre après recette client' },
  ],
  'proj-005': [
    { id: 'inv-005a', project_id: 'proj-005', label: 'Acompte 30%', amount: 6600, status: 'paid', date: d(-28), due_date: d(-25), notes: null },
    { id: 'inv-005b', project_id: 'proj-005', label: 'Situation 50% — Sprint 1 + 2', amount: 11000, status: 'sent', date: d(-3), due_date: d(14), notes: null },
    { id: 'inv-005c', project_id: 'proj-005', label: 'Solde 20%', amount: 4400, status: 'draft', date: null, due_date: null, notes: 'À émettre après recette finale' },
  ],
  'proj-006': [
    { id: 'inv-006a', project_id: 'proj-006', label: 'Acompte 30%', amount: 840, status: 'paid', date: d(-40), due_date: d(-38), notes: null },
    { id: 'inv-006b', project_id: 'proj-006', label: 'Situation 50%', amount: 1400, status: 'sent', date: d(-2), due_date: d(10), notes: null },
    { id: 'inv-006c', project_id: 'proj-006', label: 'Solde 20%', amount: 560, status: 'draft', date: null, due_date: null, notes: null },
  ],
  'proj-007': [
    { id: 'inv-007a', project_id: 'proj-007', label: 'Acompte 30%', amount: 1230, status: 'paid', date: d(-60), due_date: d(-58), notes: null },
    { id: 'inv-007b', project_id: 'proj-007', label: 'Situation 50%', amount: 2050, status: 'paid', date: d(-30), due_date: d(-28), notes: null },
    { id: 'inv-007c', project_id: 'proj-007', label: 'Solde 20%', amount: 820, status: 'paid', date: d(-15), due_date: d(-12), notes: null },
  ],
  'proj-008': [
    { id: 'inv-008a', project_id: 'proj-008', label: 'Maintenance mensuelle — mois 1', amount: 300, status: 'paid', date: d(-90), due_date: d(-88), notes: null },
    { id: 'inv-008b', project_id: 'proj-008', label: 'Maintenance mensuelle — mois 2', amount: 300, status: 'paid', date: d(-60), due_date: d(-58), notes: null },
    { id: 'inv-008c', project_id: 'proj-008', label: 'Maintenance mensuelle — mois 3', amount: 300, status: 'paid', date: d(-30), due_date: d(-28), notes: null },
    { id: 'inv-008d', project_id: 'proj-008', label: 'Maintenance mensuelle — mois 4', amount: 300, status: 'sent', date: d(-2), due_date: d(8), notes: null },
  ],
  'proj-009': [
    { id: 'inv-009a', project_id: 'proj-009', label: 'Acompte 30%', amount: 1950, status: 'paid', date: d(-14), due_date: d(-12), notes: null },
    { id: 'inv-009b', project_id: 'proj-009', label: 'Situation 50% (en attente)', amount: 3250, status: 'draft', date: null, due_date: null, notes: 'En pause — reprendre après retour client' },
  ],
  'proj-010': [
    { id: 'inv-010a', project_id: 'proj-010', label: 'Acompte 30%', amount: 2550, status: 'paid', date: d(-120), due_date: d(-118), notes: null },
    { id: 'inv-010b', project_id: 'proj-010', label: 'Situation 50%', amount: 4250, status: 'paid', date: d(-90), due_date: d(-88), notes: null },
    { id: 'inv-010c', project_id: 'proj-010', label: 'Solde 20%', amount: 1700, status: 'paid', date: d(-60), due_date: d(-58), notes: null },
  ],
}
```

- [ ] **Remplacer complètement `src/modules/ProjectDetailsV2/components/ProjectBilling.tsx`**

```typescript
import { useState } from 'react'
import { Receipt, TrendingUp, Plus, Pencil, Trash2, Check, X, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../../../lib/utils'
import { MOCK_BILLINGS, type MockInvoice, type InvoiceStatus } from '../../ProjectsManagerV2/mocks/mockBillings'

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string }> = {
  draft:     { label: 'Brouillon',  color: 'bg-gray-500/20 text-gray-400' },
  sent:      { label: 'Envoyée',    color: 'bg-blue-500/20 text-blue-300' },
  paid:      { label: 'Payée',      color: 'bg-green-500/20 text-green-300' },
  overdue:   { label: 'En retard',  color: 'bg-red-500/20 text-red-300' },
  cancelled: { label: 'Annulée',    color: 'bg-gray-500/10 text-gray-500 line-through' },
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as InvoiceStatus[]

const EMPTY_FORM = {
  label: '',
  amount: '',
  status: 'draft' as InvoiceStatus,
  date: '',
  due_date: '',
  notes: '',
}

interface ProjectBillingProps {
  projectId: string
}

export function ProjectBilling({ projectId }: ProjectBillingProps) {
  const [invoices, setInvoices] = useState<MockInvoice[]>(
    () => MOCK_BILLINGS[projectId] ?? []
  )
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const activeInvoices = invoices.filter(i => i.status !== 'cancelled')
  const total   = activeInvoices.reduce((s, i) => s + i.amount, 0)
  const paid    = activeInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const pending = total - paid

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (inv: MockInvoice) => {
    setEditingId(inv.id)
    setForm({
      label:    inv.label,
      amount:   String(inv.amount),
      status:   inv.status,
      date:     inv.date ?? '',
      due_date: inv.due_date ?? '',
      notes:    inv.notes ?? '',
    })
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = () => {
    if (!form.label.trim()) { toast.error('Le libellé est requis'); return }
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) { toast.error('Montant invalide'); return }

    const timestamp = new Date().toISOString()
    if (editingId) {
      setInvoices(prev => prev.map(i =>
        i.id === editingId
          ? { ...i, label: form.label.trim(), amount, status: form.status, date: form.date || null, due_date: form.due_date || null, notes: form.notes.trim() || null }
          : i
      ))
      toast.success('Facture mise à jour')
    } else {
      const newInv: MockInvoice = {
        id: `inv-${Date.now()}`,
        project_id: projectId,
        label: form.label.trim(),
        amount,
        status: form.status,
        date: form.date || null,
        due_date: form.due_date || null,
        notes: form.notes.trim() || null,
      }
      setInvoices(prev => [...prev, newInv])
      toast.success('Facture créée')
    }
    cancelForm()
  }

  const markPaid = (id: string) => {
    setInvoices(prev => prev.map(i =>
      i.id === id ? { ...i, status: 'paid', date: i.date ?? new Date().toISOString().split('T')[0] } : i
    ))
    toast.success('Facture marquée payée')
  }

  const confirmDelete = (id: string) => {
    setInvoices(prev => prev.filter(i => i.id !== id))
    setDeletingId(null)
    toast.success('Facture supprimée')
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Facturation</h3>
        <button
          onClick={openAdd}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          Nouvelle facture
        </button>
      </div>

      {/* Métriques */}
      {total > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total',    value: total,   color: 'text-foreground' },
              { label: 'Encaissé', value: paid,    color: 'text-green-400' },
              { label: 'Restant',  value: pending, color: pending > 0 ? 'text-orange-400' : 'text-muted-foreground' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-surface-2 border border-border rounded-lg p-3 text-center">
                <TrendingUp className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <p className={`text-lg font-bold ${color}`}>{value.toLocaleString('fr-FR')} €</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-surface-2 border border-border rounded-lg p-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Avancement facturation</span>
              <span>{Math.round((paid / total) * 100)}%</span>
            </div>
            <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${(paid / total) * 100}%` }}
              />
            </div>
          </div>
        </>
      )}

      {/* Formulaire inline */}
      {showForm && (
        <div className="bg-surface-2 border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {editingId ? 'Modifier la facture' : 'Nouvelle facture'}
            </span>
            <button onClick={cancelForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Libellé <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="ex : Acompte 30%"
              className="w-full bg-surface-3 border border-border rounded px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Montant (€) <span className="text-red-400">*</span></label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0"
                className="w-full bg-surface-3 border border-border rounded px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Statut</label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as InvoiceStatus }))}
                  className="w-full appearance-none bg-surface-3 border border-border rounded px-3 py-1.5 text-sm text-foreground pr-8 focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Date d'émission</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-surface-3 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Échéance</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full bg-surface-3 border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Notes (optionnel)</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Conditions particulières..."
              className="w-full bg-surface-3 border border-border rounded px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={cancelForm} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              className="px-3 py-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors font-medium flex items-center gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              {editingId ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      {/* Liste des factures */}
      <div className="space-y-2">
        {invoices.map(inv => {
          const conf = STATUS_CONFIG[inv.status]
          return (
            <div key={inv.id} className="bg-surface-2 border border-border rounded-lg overflow-hidden">
              {deletingId === inv.id && (
                <div className="flex items-center justify-between bg-red-500/10 border-b border-red-500/20 px-4 py-2">
                  <span className="text-xs text-red-300">Supprimer cette facture ?</span>
                  <div className="flex gap-2">
                    <button onClick={() => setDeletingId(null)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-0.5">Non</button>
                    <button onClick={() => confirmDelete(inv.id)} className="text-xs text-red-300 hover:text-red-200 font-medium px-2 py-0.5 bg-red-500/20 rounded">Oui</button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{inv.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {inv.date && <span className="text-xs text-muted-foreground">{inv.date}</span>}
                    {inv.due_date && inv.status !== 'paid' && (
                      <span className="text-xs text-muted-foreground">échéance {inv.due_date}</span>
                    )}
                    {inv.notes && <span className="text-xs text-muted-foreground italic truncate">{inv.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-sm font-semibold text-foreground">{inv.amount.toLocaleString('fr-FR')} €</span>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded', conf.color)}>{conf.label}</span>
                  {inv.status === 'sent' && (
                    <button
                      onClick={() => markPaid(inv.id)}
                      title="Marquer payée"
                      className="text-green-400 hover:text-green-300 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => openEdit(inv)} className="text-muted-foreground hover:text-foreground transition-colors" title="Modifier">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeletingId(inv.id)} className="text-muted-foreground hover:text-red-400 transition-colors" title="Supprimer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {invoices.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Receipt className="h-10 w-10 opacity-30" />
          <p className="text-sm">Aucune facture pour ce projet.</p>
          <button onClick={openAdd} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" />
            Créer la première facture
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```

---

## Task 7 — Modal édition de projet

**Files:**
- Create: `src/modules/ProjectsManagerV2/components/EditProjectModal.tsx`

- [ ] **Créer `src/modules/ProjectsManagerV2/components/EditProjectModal.tsx`**

```typescript
import { useState } from 'react'
import { cn } from '../../../lib/utils'
import type { ProjectV2, ProjectStatusV2, PrestaType } from '../../../types/project-v2'

const MOCK_USERS = [
  { id: 'user-alice', name: 'Alice Martin' },
  { id: 'user-bob',   name: 'Bob Lefèvre' },
  { id: 'user-carol', name: 'Carol Petit' },
]

interface EditProjectModalProps {
  project: ProjectV2
  onSave: (updates: Partial<ProjectV2>) => void
  onClose: () => void
}

export function EditProjectModal({ project, onSave, onClose }: EditProjectModalProps) {
  const [form, setForm] = useState({
    name:        project.name,
    description: project.description ?? '',
    status:      project.status,
    priority:    project.priority,
    presta_type: project.presta_type,
    assigned_to: project.assigned_to,
    budget:      project.budget != null ? String(project.budget) : '',
    end_date:    project.end_date ?? '',
    client_name: project.client_name ?? '',
  })

  const togglePrestaType = (type: PrestaType) => {
    setForm(prev => ({
      ...prev,
      presta_type: prev.presta_type.includes(type)
        ? prev.presta_type.filter(t => t !== type)
        : [...prev.presta_type, type],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const user = MOCK_USERS.find(u => u.id === form.assigned_to)
    onSave({
      name:          form.name.trim(),
      description:   form.description.trim() || null,
      status:        form.status as ProjectStatusV2,
      priority:      form.priority as ProjectV2['priority'],
      presta_type:   form.presta_type,
      assigned_to:   form.assigned_to,
      assigned_name: user?.name ?? null,
      budget:        form.budget ? parseFloat(form.budget) : null,
      end_date:      form.end_date || null,
      client_name:   form.client_name.trim() || null,
      category:      form.presta_type[0] ?? project.category,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="glass-surface-static rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-5 text-foreground">Modifier le projet</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Nom *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className="w-full p-2 border border-border rounded-md bg-surface-2 text-foreground text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Client</label>
            <input
              type="text"
              value={form.client_name}
              onChange={e => setForm({ ...form, client_name: e.target.value })}
              placeholder="Nom du client"
              className="w-full p-2 border border-border rounded-md bg-surface-2 text-foreground text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full p-2 border border-border rounded-md bg-surface-2 text-foreground text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Type de prestation</label>
            <div className="flex gap-2 flex-wrap">
              {(['web', 'seo', 'erp', 'saas'] as PrestaType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => togglePrestaType(type)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium border transition-colors',
                    form.presta_type.includes(type)
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-surface-2 border-border text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Statut</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as ProjectStatusV2 })}
                className="w-full p-2 border border-border rounded-md bg-surface-2 text-foreground text-sm"
              >
                <option value="prospect">Prospect</option>
                <option value="brief_received">Brief reçu</option>
                <option value="quote_sent">Devis envoyé</option>
                <option value="in_progress">En cours</option>
                <option value="review">Recette</option>
                <option value="delivered">Livré</option>
                <option value="maintenance">Maintenance</option>
                <option value="on_hold">En pause</option>
                <option value="closed">Clôturé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Priorité</label>
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value as ProjectV2['priority'] })}
                className="w-full p-2 border border-border rounded-md bg-surface-2 text-foreground text-sm"
              >
                <option value="low">Basse</option>
                <option value="medium">Normale</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Responsable</label>
              <select
                value={form.assigned_to}
                onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                className="w-full p-2 border border-border rounded-md bg-surface-2 text-foreground text-sm"
              >
                <option value="">Non assigné</option>
                {MOCK_USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Budget (€)</label>
              <input
                type="number"
                value={form.budget}
                onChange={e => setForm({ ...form, budget: e.target.value })}
                placeholder="0"
                className="w-full p-2 border border-border rounded-md bg-surface-2 text-foreground text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Échéance</label>
            <input
              type="date"
              value={form.end_date}
              onChange={e => setForm({ ...form, end_date: e.target.value })}
              className="w-full p-2 border border-border rounded-md bg-surface-2 text-foreground text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-md text-muted-foreground bg-surface-2 hover:bg-surface-3 text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm font-medium"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```

---

## Task 8 — Brancher EditProjectModal + filtre responsable dans index.tsx

**Files:**
- Modify: `src/modules/ProjectsManagerV2/index.tsx`

- [ ] **Modifier `src/modules/ProjectsManagerV2/index.tsx`**

Ajouter l'import de `EditProjectModal` et `Users` (lucide) en haut du fichier :

```typescript
import { Plus, Briefcase, ChevronRight, Users } from 'lucide-react'
import { EditProjectModal } from './components/EditProjectModal'
```

Ajouter les états dans `ProjectsManagerV2Inner` après les états existants :

```typescript
const [editingProject, setEditingProject] = useState<ProjectV2 | null>(null)
const [filterUser, setFilterUser] = useState<string>('')
```

Remplacer `handleEditProject` :

```typescript
const handleEditProject = (project: ProjectV2) => {
  setEditingProject(project)
}
```

Ajouter le handler save :

```typescript
const handleSaveEdit = (updates: Partial<ProjectV2>) => {
  if (!editingProject) return
  updateProject(editingProject.id, updates)
  toast.success('Projet mis à jour')
  setEditingProject(null)
}
```

Ajouter le filtre juste avant `const projectsFiltered` (à ajouter) :

```typescript
const projectsFiltered = useMemo(
  () => filterUser ? projects.filter(p => p.assigned_to === filterUser) : projects,
  [projects, filterUser]
)
```

Dans le JSX, ajouter la barre filtre entre le header et le Kanban (desktop uniquement) :

```tsx
{!isMobile && (
  <div className="flex items-center gap-2">
    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
    <select
      value={filterUser}
      onChange={e => setFilterUser(e.target.value)}
      className="bg-surface-2 border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
    >
      <option value="">Tous les responsables</option>
      {MOCK_USERS.map(u => (
        <option key={u.id} value={u.id}>{u.name}</option>
      ))}
    </select>
    {filterUser && (
      <button
        onClick={() => setFilterUser('')}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Effacer
      </button>
    )}
    <span className="text-xs text-muted-foreground ml-auto">
      {projectsFiltered.length} projet{projectsFiltered.length !== 1 ? 's' : ''}
    </span>
  </div>
)}
```

Remplacer `projects={projects}` dans `<ProjectKanbanV2>` par `projects={projectsFiltered}`.

Ajouter le modal et le compteur dans la liste mobile :

```tsx
{/* Modal édition */}
{editingProject && (
  <EditProjectModal
    project={editingProject}
    onSave={handleSaveEdit}
    onClose={() => setEditingProject(null)}
  />
)}
```

Aussi mettre à jour le `p` de compteur desktop pour utiliser `projectsFiltered.length` :

```tsx
<p className="text-sm text-muted-foreground mt-0.5">
  {projectsFiltered.length} projet{projectsFiltered.length !== 1 ? 's' : ''} · Kanban 9 colonnes · Fiche 7 onglets
</p>
```

- [ ] **Vérifier le build final**

```bash
npm run build 2>&1 | tail -20
```

---

## Task 9 — Ajouter les mocks aux exports du barrel

**Files:**
- Modify: `src/modules/ProjectsManagerV2/mocks/index.ts`

- [ ] **Lire le fichier index.ts des mocks actuel**

```bash
cat src/modules/ProjectsManagerV2/mocks/index.ts
```

- [ ] **Ajouter les exports des nouveaux mocks**

Ajouter dans le fichier `src/modules/ProjectsManagerV2/mocks/index.ts` :

```typescript
export { MOCK_BRIEFS } from './mockBriefs'
export { MOCK_BILLINGS } from './mockBillings'
export type { MockInvoice, InvoiceStatus } from './mockBillings'
```

- [ ] **Build final et vérification TypeScript**

```bash
npm run build 2>&1
```

Expected : 0 erreurs TypeScript, build réussi.
