# Session State — 2026-05-18 fin (isolation auth CRM ↔ portail livrée)

## Branch
`feature/propulspace-phase-2-front` — exception multi-phases assumée (merge dans `main` fin Phase 2 après QA E2E validée).

## Completed This Session
- ✅ **QA E2E démarrée** sur portail Propul'Space (3 bugs critiques détectés et fixés).
- ✅ **Fix A — dialog activation portail** : masque champs création contact si primary existe déjà (évite 409 doublon).
- ✅ **Fix lecture erreur edge function** : `usePortalActivation` extrait le vrai message depuis `error.context.json()` au lieu du générique.
- ✅ **Fix redirection post-login portail** : `ClientLoginPage` useEffect → `navigate('/espace-client')` si `state.status === 'ready'`.
- ✅ **Isolation sessions auth CRM ↔ portail (refonte ciblée)** : 2 clients supabase-js avec storageKey distincts (`sb-crm-propulseo-auth` + `sb-propulspace-auth`). Spec : `docs/superpowers/specs/2026-05-18-auth-isolation-portail-design.md`. 7 fichiers basculés sur `portalSupabase` + nouveau proxy `v2Portal`.
- ✅ **Code review** : 3 issues remontées, 2 vraies fixées (getSession fallback Safari ITP + spec migration), 1 différée (stylistique).
- ✅ Tests runtime : `signInWithPassword` portail répond en 112ms après signin admin (plus de hang). `tsc --noEmit` clean.

## Next Task — Session QA E2E (reprise)
Reprendre les **18 tests de `docs/propulspace/QA_E2E_RUNBOOK.md`** (les bugs auth bloquants sont fixés, on peut maintenant tester end-to-end).

Décisions toujours en attente :
1. **Wizard onboarding (B.2)** — verdict α ou β.
2. **Multi-projets (ADR-004)** — code ou limite V1 assumée.
3. **Comptes Stripe / DocuSeal / Brevo** — créés côté Lyes pour tests payants live ?

## Blockers
- Aucun blocker auth — flow portail (activation + invitation + magic link + setup mdp + login mdp + dashboard) fonctionnel après cette session.
- Décisions α/β B.2 + ADR-004 multi-projets toujours en suspens.

## Key Context
- **Migration auth** : après déploiement de ce commit, tous les utilisateurs devront se reconnecter une fois (ancienne clé `sb-tbuqctfg-auth-token` orpheline). Acceptable en QA.
- **Warning `Multiple GoTrueClient instances`** persiste mais cosmétique (déclenché sur le count d'instances, pas la collision de storage keys). Voir auth-js#762.
- **Cohabitation admin + client validée** : admin CRM sur un onglet + client portail sur un autre = OK, les deux sessions indépendantes.
- Dernier commit : `9208e62` pushé sur `feature/propulspace-phase-2-front`.
- 6 migrations Stripe + sécurité en prod (170, 180, 190, 195, 200, 201, 210, 211, 220, 221).
- 6 edge functions codées (4 pas encore déployées : portal-create-checkout-session, stripe-webhook, admin-docuseal-create-submission, docuseal-webhook).
