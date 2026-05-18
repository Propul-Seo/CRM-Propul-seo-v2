# Session State — 2026-05-18 fin (Sprint A.3 livré + recon Stripe)

## Branch
`feature/propulspace-phase-2-front` — exception multi-phases assumée (merge dans `main` fin Phase 2).

## Completed This Session
- ✅ **Sprint A.3.1** — R-011 fermé. `draft_session_token` UUID + 3 RPC `qualif_*_draft` (SECURITY DEFINER) + wrappers `public`. Refonte `useQualificationDraft` sessionStorage + RPC.
- ✅ **Sprint A.3.2** — R-013 fermé. `REVOKE ALL FROM anon` sur 13 tables/vues sensibles. `submit()` méthode ajoutée au hook (remplace UPDATE direct).
- ✅ **Sprint A.3.3** — R-012 fermé. 5 vues `propulspace_*_v2` recréées avec whitelist colonnes safe explicites (miroir des types `Portal*`).
- ✅ **Sprint A.3.4** — R-008 fermé. Policy Storage `propulspace-documents` durcie avec préfixe `{project_id}/`.
- ✅ **Sprint A.3.5** — script `.planning/A3_TESTS.sql` rejouable (3 sections : structurel + runtime anon + whitelist RPC). **A capté un bug post-A.3.3** : `CREATE VIEW` dans `public` réattribue ACL par défaut anon.
- ✅ **Hotfix 195** — re-REVOKE anon sur les 5 vues après le bug. Leçon documentée dans le fichier 190 (REVOKE explicite après chaque CREATE VIEW).
- ✅ **Code review** — 7 findings ; 3 vrais corrigés (C-1 storage policy redondant, H-3 clearToken défensif, M-1 REVOKE inline 190) ; 4 différés/faux positifs documentés.
- ✅ **Recon Stripe (B.3)** — état du compte = inexistant côté repo. Plan B.3 esquissé avant pivot sur A.3.

## Next Task
**Sprint B.3** — Paiements Stripe. Compte Stripe à créer côté Lyes + clés test à poser. Plan déjà cadré : migration `partially_paid` + 2 edge functions (`portal-create-checkout-session` + `stripe-webhook`) + UI portail (boutons Payer facture/acompte) + admin badge + runbook test→live.

## Blockers
- ❗ Compte Stripe à créer (Lyes, action côté business).
- ❗ Sprint B.1 (Brevo SMTP) **non bloquant** pour coder B.3 mais utile avant passage live.

## Key Context
- **Sprint A complet** : A.1 (dump migrations) + A.2a (bouton activer portail) + A.3 (sécurité RLS) livrés. A.2b (refonte ClientLoginPage) reporté.
- **Décisions A.3** : sessionStorage (pas localStorage), pas d'`_admin_v2` créées (YAGNI), `qualification_leads_v2` reste `SELECT *` (admin-only de fait).
- **Risque résiduel** : un `CREATE VIEW` dans `public` ré-attribue les ACL Supabase par défaut → toute future migration vue doit inclure REVOKE anon explicite. Documenté en tête de 190 + leçon dans 195.
- **PROGRESS_PROPULSPACE.md à jour** — section 3 mise à jour avec entrée A.3 cumulative.
- 6 migrations appliquées en prod : 170, 180, 190, 195, 200, 201 (toutes versionnées localement).
