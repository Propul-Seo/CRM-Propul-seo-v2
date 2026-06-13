# Propul'Space — QA End-to-End (parcours Précieuse)

Procédure de validation complète pré-livraison client. À exécuter avant le go-live du premier client réel (Précieuse, juillet 2026).

---

## Prérequis avant de lancer la QA

Tous les runbooks suivants doivent être complétés et marqués ✅ :

- [ ] [BREVO_RUNBOOK.md](./BREVO_RUNBOOK.md) — Custom SMTP activé, domaine authentifié, templates personnalisés
- [ ] [STRIPE_RUNBOOK.md](./STRIPE_RUNBOOK.md) — compte + clés test posées + 2 edge functions déployées + webhook configuré
- [ ] [DOCUSEAL_RUNBOOK.md](./DOCUSEAL_RUNBOOK.md) — compte + templates + clés + 2 edge functions déployées + webhook configuré

---

## Setup du projet de test

1. Créer dans le CRM un projet test : `QA Précieuse — <date>`.
2. Renseigner les infos client (nom, email perso de test).
3. Ne PAS activer le portail tout de suite — on suit le parcours nominal.
4. Préparer 1 facture test (ex. 1 200 € TTC) avec 3 acomptes 30/30/40.

---

## Scénarios E2E (12 tests)

Cocher au fur et à mesure. En cas d'échec, noter le test + le bug, et **arrêter** — résoudre avant de continuer.

### Auth & onboarding

- [ ] **T1 — Activation du portail** : admin clique "Activer le portail" sur fiche projet V3 → renseigne email de test → email reçu (branding Propul'Seo) → clic → arrive sur `/setup-password` → définit mdp 8 chars → arrive sur `/espace-client`.
- [ ] **T2 — Login email/mdp** : se déconnecter → `/espace-client/login` → mdp → arrive dashboard.
- [ ] **T3 — Toggle magic link** : sur la page login, cliquer "Recevoir un lien à la place" → email reçu → clic → connecté.
- [ ] **T4 — Mot de passe oublié** : page login → "Mot de passe oublié" → email reçu → page reset → nouveau mdp → toast sur login → reconnexion.

### Onboarding wizard

- [ ] **T5 — Bannière onboarding** : dashboard affiche bannière "Complétez votre onboarding — 0%" → clic "Commencer" → modal s'ouvre sur étape 1.
- [ ] **T6 — Wizard skippable** : remplir étape 2 (voix de marque) → cliquer "Passer" sur étape 3 → terminer étape 4 → étape 5 → cliquer "Terminer l'onboarding" → bannière disparaît du dashboard.
- [ ] **T7 — Autosave** : remplir un champ → fermer le modal sans bouton "Terminer" → rouvrir → champ pré-rempli.

### Factures & paiement Stripe

- [ ] **T8 — Liste factures** : `/espace-client/invoices` affiche la facture test avec ses 3 acomptes.
- [ ] **T9 — Payer un acompte** : ouvrir facture → cliquer "Payer" sur acompte 1 (carte test `4242 4242 4242 4242`) → redirection Stripe → CB → retour `?paiement=reussi` → bannière "Paiement reçu" → après 4-8s, statut acompte = `paid`, facture = `partially_paid`.
- [ ] **T10 — Payer facture entière (sans partially_paid)** : sur une autre facture sans acompte partiellement payé → "Payer la facture entière" → carte test → vérifier facture = `paid`.
- [ ] **T11 — Paiement annulé** : démarrer un nouveau checkout → fermer la fenêtre Stripe → retour `?paiement=annule` → bannière "Paiement annulé".
- [ ] **T12 — Carte refusée** : carte test `4000 0000 0000 0002` → écran d'erreur Stripe → retour portail, facture inchangée.

### Documents & signatures

- [ ] **T13 — Documents** : admin upload un PDF sur fiche projet V3 (DocumentsTabV3) → client le voit dans `/espace-client/documents` → télécharger via lien signé OK.
- [ ] **T14 — Signature DocuSeal** : admin envoie un contrat test via curl `admin-docuseal-create-submission` → client reçoit email → vérifier dans `/espace-client/signatures` que le doc apparaît en `pending` → "Signer maintenant" → page DocuSeal → signer → après webhook (~5s), statut = `signed`, bouton "Télécharger le PDF signé" disponible.

### Sécurité (R-008/R-011/R-012/R-013 verrouillés Sprint A.3)

- [ ] **T15 — Isolation cross-tenant** : créer un 2e projet test avec un autre email → se connecter avec le compte du projet 1 → ouvrir DevTools → tenter `supabase.from('propulspace_invoices_v2').select()` → vérifier qu'aucune ligne du projet 2 n'apparaît.
- [ ] **T16 — Tests d'isolation A.3** : rejouer `.planning/A3_TESTS.sql` via Supabase Dashboard SQL Editor → tous les ASSERT passent.

### Robustesse

- [ ] **T17 — Idempotence webhook Stripe** : depuis Stripe Dashboard → Webhooks → resend un event `checkout.session.completed` déjà reçu → vérifier que la facture n'est pas marquée payée 2 fois (colonne `idempotent` true dans la réponse, aucun double UPDATE).
- [ ] **T18 — Idempotence webhook DocuSeal** : idem côté DocuSeal Dashboard → Webhooks → Resend.

---

## Validation finale avant go-live

- [ ] Les 18 tests passent en mode test (Stripe sk_test_ + DocuSeal compte dev + Brevo SMTP actif).
- [ ] Au moins 2 personnes ont fait la QA indépendamment (Lyes + 1 testeur).
- [ ] Aucun bug "critical" ou "high" non résolu côté code.
- [ ] Les emails reçus ont tous le branding Propul'Seo (pas LOCAGAME).
- [ ] Les runbooks Stripe et DocuSeal ont leur étape "passage en live" documentée et claire.
- [ ] Le client Précieuse a été briefé sur le parcours (1 email de présentation envoyé).

Une fois OK : appliquer le passage en live Stripe (cf STRIPE_RUNBOOK §4) puis envoyer l'invitation au client réel.

---

## Bugs connus / accepted (V1)

- ⚠️ `partially_paid` ne permet pas "Payer le reliquat en 1 clic" — le client doit cliquer sur chaque acompte impayé. UI dédiée Sprint C+.
- ⚠️ Pas d'email automatique "Paiement reçu" envoyé au client — V2 via Brevo API.
- ⚠️ Pas d'UI admin "Envoyer document à signer" — déclenchement curl pour V1, UI Sprint C.
- ⚠️ Pas de force-meter password — `min 8 chars` seul.
- ⚠️ DocuSeal n'a pas de "mode test" propre — utiliser un compte DocuSeal dev séparé.
- ⚠️ Le wizard onboarding n'a pas d'upload de fichiers intégré (checkboxes "Fourni / À fournir" seulement) — V2.
- ⚠️ Cal.com pas intégré — sélection de créneau via datepicker simple. V2.

---

## Contacts en cas d'incident pendant la QA

- Stripe : support@stripe.com (vérifier compte live actif)
- DocuSeal : support@docuseal.com
- Brevo : support FR @ www.brevo.com
- Supabase : support@supabase.com (urgences seulement)
