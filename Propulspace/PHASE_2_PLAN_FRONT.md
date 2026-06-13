# Phase 2 — Plan d'action front Propul'Space

> Document de référence à ouvrir au début de la prochaine session.
> Tout l'état préparatoire est figé ici. Aucune décision majeure n'est à
> reprendre — il suffit d'enchaîner les tâches dans l'ordre.

## 1. Point de départ

**Branche :** `feature/propulspace-phase-2-front` (vit hors-main, mergera quand tout Phase 2 sera fini).

**Préparatoire fait pendant la session de design :**
- ✅ Migration `propulspace_090_phase2_prep` appliquée (3 colonnes : `projects_v2.portal_client_email`, `users.onboarding_completed`, `qualification_leads.notes`)
- ✅ Types Supabase régénérés ([src/types/database.ts](../src/types/database.ts) — public + v2)
- ✅ [src/types/propulspace.types.ts](../src/types/propulspace.types.ts) créé manuellement (12 interfaces Row)
- ✅ Shell PortalLayout + PortalTabBar + PortalContactFab + portal-theme.css enrichi
- ✅ 5 placeholders intégrations (`shared/integrations/*.ts`) — email, stripe, docuseal, calcom, pappers
- ✅ Tokens design system v2 mergés dans `portal-theme.css`

**Livrables design figés :**
- 12 vues v1 dans `public/handoff-preview/mockups/` (dashboard, qualif, factures, projet, documents, signatures, aide, login, 3 admin, onboarding)
- 17 vues v2 dans `public/handoff-preview-v2/mockups/` (erreurs, retours Stripe/DocuSeal, profil, suspended, maintenance, sheets, alerts, notif panel)
- 10 emails dans `public/handoff-preview-v2/emails/` (×2 versions : preview + .brevo.html)

## 2. Chantiers préparatoires NON faits (à attaquer en début de prochaine session)

Ces 3 chantiers étaient prévus en suite de session mais reportés :

### Chantier #4 — Pre-flight DB approfondi (30 min)
Vérifier la structure exacte des 5 tables qu'on va toucher en priorité :
- `propulspace.invoices` (27 cols, dont `client_snapshot JSONB`, `line_items JSONB`)
- `propulspace.documents` (19 cols)
- `propulspace.signatures` (20 cols)
- `propulspace.project_steps` (12 cols)
- `propulspace.invoice_installments` (11 cols)

Pour chaque : vérifier les CHECK constraints, index, FK, RLS active.
Récupérer aussi la liste des `document_type` (12 valeurs), `signature_type` (4 valeurs), `signature.status` (5 valeurs) déjà confirmés en début de session.

**Pourquoi maintenant :** éviter de coder un hook qui plante au runtime parce que la table a une contrainte oubliée.

### Chantier #5 — Code review shell actuel (20 min)
Lancer l'agent `feature-dev:code-reviewer` sur les 5 fichiers du shell + 5 placeholders integrations :
```
src/modules/EspaceClient/shared/layouts/PortalLayout.tsx
src/modules/EspaceClient/shared/layouts/PortalTabBar.tsx
src/modules/EspaceClient/shared/layouts/PortalContactFab.tsx
src/modules/EspaceClient/shared/layouts/PortalLayout.preview.tsx
src/modules/EspaceClient/shared/layouts/portal-theme.css
src/modules/EspaceClient/shared/integrations/{email,stripe,docuseal,calcom,pappers}.ts
src/modules/EspaceClient/shared/constants.ts
src/modules/EspaceClient/shared/types/portal.types.ts
```

Trier les retours (vrai/faux positif/différé), corriger les vrais bugs avant d'aller plus loin.

### Chantier #2 — Primitives TSX partagées (2-3h)
Le gros morceau préparatoire. Extraire dans `src/modules/EspaceClient/shared/components/` les composants utilisés par toutes les pages :

| Fichier | Composants | Source design |
|---|---|---|
| `Hero.tsx` | `Hero` (eyebrow + gradient title + subtitle + optional pill) | Dashboard v1, profil, qualif |
| `KpiTile.tsx` | `KpiTile` (eyebrow + value + delta + icon + tint) | Dashboard, factures, admin |
| `Badge.tsx` | `Badge` + `StatusBadge` (variants violet/green/amber/red/blue/gray) | Partout |
| `Progress.tsx` | `Progress` (track + fill gradient + label) | Dashboard, projet |
| `SectionHead.tsx` | `SectionHead` (title + action link) | Toutes les listes |
| `EmptyState.tsx` | `EmptyState` (icon + title + sub + CTA optionnel) | Toutes les pages |
| `ActivityRow.tsx` | `ActivityRow` (icon tinted + title + meta + arrow) | Dashboard, audit log |
| `TimelineStep.tsx` | `TimelineStep` (node + label + dates + status) | Page projet |
| `StatusPage.tsx` | `StatusPage` (icon bubble + gradient title + subtitle + CTAs) | v2 pages d'erreur/retour |
| `FileIcon.tsx` | `FileIcon` (PDF rouge / image bleu / zip violet / etc.) | Documents |
| `BrandPill.tsx` | `BrandPill` (logo lockup gradient + Sparkles) | Header, login |

**Code source de référence :** `Propulspace/design_handoff_propulspace/mockups/_lib/primitives.jsx`. Convertir JSX → TSX en typant strict (pas de `any`), <200 lignes par fichier.

## 3. Inventaire complet — où va quoi

```
src/modules/EspaceClient/
├── shared/
│   ├── components/              ← chantier #2 (à créer)
│   │   ├── Hero.tsx
│   │   ├── KpiTile.tsx
│   │   ├── Badge.tsx + StatusBadge.tsx
│   │   ├── Progress.tsx
│   │   ├── SectionHead.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ActivityRow.tsx
│   │   ├── TimelineStep.tsx
│   │   ├── StatusPage.tsx
│   │   ├── FileIcon.tsx
│   │   └── BrandPill.tsx
│   ├── hooks/
│   │   ├── usePortalAuth.ts     ← Task A4 (auth flow)
│   │   ├── usePortalInvoices.ts ← TanStack Query
│   │   ├── usePortalDocuments.ts
│   │   ├── usePortalSignatures.ts
│   │   ├── usePortalProjectSteps.ts
│   │   └── useQualificationLead.ts
│   ├── integrations/            ✅ FAIT
│   │   ├── email.ts (Brevo placeholder)
│   │   ├── stripe.ts
│   │   ├── docuseal.ts
│   │   ├── calcom.ts
│   │   └── pappers.ts
│   ├── layouts/                 ✅ FAIT (à étendre)
│   │   ├── PortalLayout.tsx
│   │   ├── PortalTabBar.tsx
│   │   ├── PortalContactFab.tsx
│   │   ├── portal-theme.css
│   │   └── PortalLayout.preview.tsx ← À SUPPRIMER quand routes réelles existent
│   ├── types/
│   │   └── portal.types.ts      ✅ FAIT
│   └── constants.ts             ✅ FAIT (TODO: vrai numéro WhatsApp + email)
│
├── qualification/               ← Sub-phase B
│   ├── QuestionnaireFlow.tsx
│   ├── steps/{Step1Identity..Step7Decision}.tsx
│   ├── hooks/useAutoSave.ts
│   ├── hooks/useConditionalRules.ts
│   ├── schema.ts                (Zod)
│   ├── conditionalRules.ts      (13 règles)
│   ├── QualificationRecapPage.tsx ← Vue 15 v2 (read-only)
│   └── ThankYouPage.tsx
│
├── client/                      ← Sub-phase D + vues v2
│   ├── ClientLoginPage.tsx      ← Vue 1
│   ├── pages/
│   │   ├── DashboardPage.tsx    ← Vue 2 (le money shot 2-col)
│   │   ├── ProjectPage.tsx      ← Vue 5
│   │   ├── DocumentsPage.tsx    ← Vue 6
│   │   ├── InvoicesPage.tsx     ← Vue 4
│   │   ├── SignaturesPage.tsx   ← Vue 7
│   │   ├── HelpPage.tsx         ← Vue 8
│   │   ├── ProfilePage.tsx      ← Vue 21 v2
│   │   ├── MagicLinkExpiredPage.tsx ← Vue 13 v2
│   │   ├── NotFoundPortalPage.tsx   ← Vue 14 v2
│   │   ├── StripeSuccessPage.tsx    ← Vue 16 v2
│   │   ├── StripeCancelPage.tsx     ← Vue 17 v2
│   │   ├── DocuSealSuccessPage.tsx  ← Vue 18 v2
│   │   ├── DocuSealCancelPage.tsx   ← Vue 19 v2
│   │   ├── PortalSuspendedPage.tsx  ← Vue 20 v2
│   │   └── MaintenancePage.tsx      ← Vue 22 v2
│   └── components/
│       ├── DashboardSidebar.tsx (3 cartes : projet, jalon, contact)
│       ├── InvoiceDetailSheet.tsx
│       ├── SignatureDetailSheet.tsx
│       └── HeaderAvatarMenu.tsx (dropdown : profil, aide, logout)
│
├── admin/                       ← Sub-phase C + E + vues v2
│   ├── LeadsQualifiesPage.tsx   ← Vue 9
│   ├── PortalDashboardPage.tsx  ← Vue 10
│   ├── PortalClientPanel.tsx    ← Vue 11 (6 tabs)
│   ├── NotificationsPanel.tsx   ← Vue 29 v2
│   └── components/
│       ├── LeadDetailSheet.tsx
│       ├── SendSignatureSheet.tsx     ← Vue 23 v2
│       ├── UploadDocumentSheet.tsx    ← Vue 24 v2
│       ├── DeactivatePortalDialog.tsx ← Vue 25 v2
│       ├── DeleteDocumentDialog.tsx   ← Vue 26 v2
│       ├── CancelInvoiceDialog.tsx    ← Vue 27 v2
│       └── DisqualifyLeadDialog.tsx   ← Vue 28 v2
│
└── onboarding/                  ← Sub-phase F
    └── OnboardingWizard.tsx     ← Vue 12 (3 étapes modale)
```

## 4. Ordre d'exécution proposé

### Étape 0 — Préparatoires (3-4h)
1. **#4 Pre-flight DB** (30 min)
2. **#5 Code review shell** (20 min)
3. **#2 Primitives TSX** (2-3h)

### Étape 1 — Auth + routing (Task A4 + A5 originales, 1 j)
1. `usePortalAuth.ts` hook (Supabase Auth wrapper + récupération projet lié)
2. `ClientLoginPage.tsx` (Vue 1 — magic link)
3. Routes complètes dans [src/App.tsx](../src/App.tsx) (les ~18 routes portail + admin v2)
4. Guards : portal_enabled + portal_linked_project_id → fallback `MagicLinkExpiredPage` / `PortalSuspendedPage`
5. **Supprimer** la route temporaire `/espace-client/__preview` + `PortalLayout.preview.tsx`

### Étape 2 — Form qualification + lead admin (Sub-phase B + C, 2 j)
1. Schéma Zod + conditionalRules (13 règles + tests Vitest)
2. `useAutoSave` hook
3. 7 step components (Step1..Step7)
4. `QuestionnaireFlow.tsx` orchestrateur (progress + nav)
5. `ThankYouPage.tsx` + `QualificationRecapPage.tsx` (Vue 15 v2)
6. Anti-spam (honeypot + rate limit côté client)
7. `LeadsQualifiesPage.tsx` + `LeadDetailSheet.tsx` (Vue 9)
8. `DisqualifyLeadDialog.tsx` (Vue 28 v2)

### Étape 3 — Pages portail client (Sub-phase D, 2.5 j)
Ordre : Dashboard d'abord (le money shot — V2 sidebar 2-col), puis le reste.
1. Hooks TanStack Query (5 hooks)
2. `DashboardPage.tsx` (Vue 2) + `DashboardSidebar.tsx`
3. `ProjectPage.tsx` (Vue 5) avec TimelineStep
4. `DocumentsPage.tsx` (Vue 6) avec upload
5. `InvoicesPage.tsx` (Vue 4) + `InvoiceDetailSheet.tsx`
6. `SignaturesPage.tsx` (Vue 7) + `SignatureDetailSheet.tsx`
7. `HelpPage.tsx` (Vue 8)
8. `ProfilePage.tsx` (Vue 21 v2) + `HeaderAvatarMenu.tsx`
9. Pages d'erreur/retour : `MagicLinkExpiredPage`, `NotFoundPortalPage`, `Stripe[Success/Cancel]Page`, `DocuSeal[Success/Cancel]Page`, `PortalSuspendedPage`, `MaintenancePage` (toutes basées sur `StatusPage` primitive)

### Étape 4 — Admin Propul'Space (Sub-phase E, 1.5 j)
1. `PortalDashboardPage.tsx` (Vue 10)
2. `PortalClientPanel.tsx` (Vue 11 — 6 tabs : Overview, Documents, Factures, Signatures, Activité, Analytics)
3. `SendSignatureSheet.tsx` (Vue 23 v2)
4. `UploadDocumentSheet.tsx` (Vue 24 v2)
5. AlertDialogs : `DeactivatePortalDialog`, `DeleteDocumentDialog`, `CancelInvoiceDialog` (Vues 25-27 v2)
6. `NotificationsPanel.tsx` (Vue 29 v2 — bell icon + popover dans AdminShell)

### Étape 5 — Onboarding wizard + Edge Functions + wrap-up (Sub-phase F, 1.5 j)
1. `OnboardingWizard.tsx` (Vue 12)
2. Edge Function `portal-submit-qualification`
3. Edge Function `portal-activate-client`
4. Tests E2E Playwright happy paths (qualif → portail activé → 1ère facture)
5. Polish pass : skeleton states, transitions, focus rings, accessibilité

### Étape 6 — Wrap-up + merge (0.5 j)
1. `PHASE_2_DONE.md` (récap des livrables)
2. Code review final via `feature-dev:code-reviewer`
3. Régénérer types TS si on a touché à la DB pendant l'implémentation
4. Merger `feature/propulspace-phase-2-front` dans main
5. Désactiver la route preview `/handoff-preview*` (ou les laisser pour référence interne)

**Total estimé : 11-13 jours de dev.** En accord avec l'estimation Phase 2 initiale (15-20 jours incluant les services Phase 3).

## 5. Décisions architecturales déjà figées (à ne pas re-questionner)

- **Routing :** option C — react-router pour `/diagnostic`, `/espace-client/*`, `/admin/*` (déjà en place dans App.tsx). CRM admin existant garde son `activeModule` Zustand.
- **Magic link :** Supabase Auth natif. SMTP custom Brevo à configurer en Phase 3 si rate limit pose problème en pilote.
- **Branche :** rester sur `feature/propulspace-phase-2-front`, pas de merge main avant Phase 2 finie.
- **Architecture data :** `1 espace = 1 projet`. FK `project_id` partout. `public.projects_v2` est la source.
- **Email magic link :** customiser le template Supabase Auth dans Phase 2. Bypasser pour Brevo seulement si nécessaire en Phase 3.
- **Mobile :** **OFF en Phase 2.** Desktop only. Mobile en Phase 3 ou 4.

## 6. Risques identifiés

1. **Tables propulspace.* en RLS** : les hooks TanStack Query échoueront silencieusement si la query est lancée sans session active (admin) OU si le user portail n'a pas de `portal_linked_project_id`. À tester explicitement.
2. **Realtime Supabase** : on s'abonne à 3 canaux (invoices, signatures, documents). Attention au cleanup au démontage pour pas leak.
3. **Storage RLS** : `propulspace-uploads` et `propulspace-documents` ont leurs propres policies. Tester upload + download côté client avant de coder massivement.
4. **`portal_phase` colonne** : sur `projects_v2` PAS sur `users` (erreur du prompt initial Phase 2). À utiliser correctement.
5. **Type `siret`** : colonne legacy sur `projects_v2.siret` (sans préfixe `client_`). Le mapper vers `ClientSnapshot.client_siret`.

## 7. Comment démarrer la prochaine session

```
/token-saver début

[Une fois SESSION.md lu, dire :]
"On reprend Phase 2 front. Ouvre Propulspace/PHASE_2_PLAN_FRONT.md.
On commence par les chantiers préparatoires #4 → #5 → #2 puis on enchaîne sur
l'étape 1 (auth + routing). Confirme l'ordre puis go."
```

L'agent ne devra pas avoir à reprendre les décisions architecturales — tout est figé ici.

## 8. Livrables visuels à garder sous les yeux pendant l'implémentation

Pour chaque vue à coder, ouvrir le mockup correspondant en parallèle :
- v1 : http://localhost:5173/handoff-preview/mockups/vues-index.html
- v2 : http://localhost:5173/handoff-preview-v2/mockups/vues-index.html
- emails : http://localhost:5173/handoff-preview-v2/emails/index.html

Le code source des primitives du handoff est sous :
`Propulspace/design_handoff_propulspace/mockups/_lib/` (JSX, à convertir en TSX).

---

**Bonne session.** 🚀
