# Stripe — Runbook Propul'Space

Document opérationnel pour brancher / utiliser / faire passer en live l'intégration Stripe du portail client. À lire avant chaque action sensible.

---

## 1. État du code (Sprint B.3 livré le 2026-05-18)

| Composant | Statut |
|---|---|
| Migration 210 (colonnes Stripe + trigger `recalc_invoice_status`) | ✅ Appliquée |
| Migration 211 (vue admin `propulspace_invoices_admin_v2`) | ✅ Appliquée |
| Edge function `portal-create-checkout-session` | ✅ Codée, **pas encore déployée** |
| Edge function `stripe-webhook` | ✅ Codée, **pas encore déployée** |
| Front portail (`InvoicesPage` boutons Payer + pages confirm/cancel) | ✅ |
| Compte Stripe réel | ❌ À créer côté Propul'Seo (entreprise) |
| Secrets Supabase (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) | ❌ À poser |

Tant que les secrets ne sont pas posés et les fonctions déployées, le bouton "Payer" du portail renverra une erreur "STRIPE_SECRET_KEY manquante".

---

## 2. Mise en place initiale (mode test)

### 2.1 Créer le compte Stripe

1. https://dashboard.stripe.com/register — créer le compte au nom de **Propul'Seo SAS** (SIREN à renseigner, IBAN pro).
2. Activer le **mode test** (toggle en haut à droite du dashboard).
3. Renseigner les infos entreprise (statut juridique, secteur d'activité, RIB de remboursement). **Ne pas activer le mode live** tant que les tests ne sont pas terminés.

### 2.2 Récupérer les clés API

Dashboard Stripe → Developers → API keys (en mode test) :
- `Publishable key` : `pk_test_…` (utilisée côté client, mais ici non requis car on passe par Checkout hébergé).
- `Secret key` : `sk_test_…` — **à copier**, c'est `STRIPE_SECRET_KEY`.

### 2.3 Configurer les secrets Supabase

Supabase Dashboard → Project Settings → Edge Functions → Secrets :

```
STRIPE_SECRET_KEY = sk_test_xxxxxxxx
STRIPE_WEBHOOK_SECRET = whsec_xxxxxxxx     # généré à l'étape 2.5
```

### 2.4 Déployer les 2 edge functions

```bash
# Depuis la racine du repo, avec la CLI Supabase installée et linkée :
supabase functions deploy portal-create-checkout-session
supabase functions deploy stripe-webhook --no-verify-jwt
```

⚠️ **`stripe-webhook` DOIT être déployée avec `--no-verify-jwt`** : Stripe n'envoie pas de JWT, la sécurité repose sur la signature HMAC `stripe-signature` (vérifiée par `Stripe.webhooks.constructEventAsync`).

`portal-create-checkout-session` reste avec JWT verify activé (le client portail s'authentifie via Supabase Auth).

### 2.5 Créer l'endpoint webhook Stripe

Dashboard Stripe (mode test) → Developers → Webhooks → **Add endpoint** :

- URL : `https://<project-id>.supabase.co/functions/v1/stripe-webhook`
- Description : `Propul'Space — synchronisation paiements`
- Events à écouter (sélectionner uniquement ces 2) :
  - `checkout.session.completed`
  - `payment_intent.payment_failed`
- API version : la dernière (compatible avec `apiVersion: '2024-06-20'` dans le code)

Après création, Stripe affiche le `Signing secret` (`whsec_…`). **Le copier dans `STRIPE_WEBHOOK_SECRET`** côté Supabase.

---

## 3. Tester en mode test

### 3.1 Cartes de test Stripe utiles

| Carte | Effet |
|---|---|
| `4242 4242 4242 4242` | Paiement réussi |
| `4000 0000 0000 0002` | Carte refusée (generic decline) |
| `4000 0027 6000 3184` | 3DS requis (Strong Customer Authentication) |
| `4000 0000 0000 9995` | Fonds insuffisants |
| Expiration | n'importe quelle date future (ex. `12/30`) |
| CVC | n'importe quel 3 chiffres (ex. `123`) |
| ZIP | n'importe (ex. `75001`) |

Liste complète : https://stripe.com/docs/testing#cards

### 3.2 Scénarios à valider

Sur un projet test (avec un compte portail client) :

1. **Paiement intégral facture** : ouvrir une facture → "Payer la facture entière" → carte `4242…` → retour `?paiement=reussi` → vérifier facture passe à `paid`.
2. **Paiement acompte** : facture avec 3 acomptes → "Payer" sur l'acompte 1 → vérifier acompte 1 = `paid`, facture = `partially_paid`, acomptes 2-3 = `pending`.
3. **Annulation** : démarrer le checkout → fermer la fenêtre Stripe → retour `?paiement=annule` → vérifier facture inchangée.
4. **Carte refusée** : carte `4000…0002` → message d'erreur Stripe → la facture reste impayée.
5. **3DS** : carte `4000…3184` → authentification 3DS → paiement OK.
6. **Idempotence webhook** : depuis Stripe Dashboard → Webhooks → cliquer sur un event reçu → "Resend" → vérifier que la facture n'est pas marquée payée 2 fois (la colonne `propulspace.stripe_webhook_events.idempotent` reste à `false` mais aucun double UPDATE n'est appliqué grâce au filtre `neq('status', 'paid')`).

### 3.3 Vérifier côté admin

Pour suivre les paiements en mode test, deux options :

**Option A — Supabase Dashboard SQL Editor** :
```sql
SELECT invoice_number, status, paid_at, stripe_payment_intent_id, stripe_paid_at
FROM propulspace.invoices
WHERE stripe_payment_intent_id IS NOT NULL
ORDER BY paid_at DESC;
```

**Option B — vue admin** : interroger `public.propulspace_invoices_admin_v2` depuis le CRM (route admin de la fiche projet — UI à venir Sprint C).

Pour les paiements échoués :
```sql
SELECT created_at, project_id, action, diff
FROM propulspace.audit_log
WHERE resource_type = 'stripe_payment'
ORDER BY created_at DESC;
```

---

## 4. Passage en mode live

⚠️ **Ne JAMAIS faire sans le feu vert explicite de Lyes.** ⚠️

### 4.1 Prérequis avant le live

- [ ] Tous les scénarios test 3.2 validés sans bug.
- [ ] Compte Stripe entreprise complété (KYC, RIB, identité dirigeant, etc.).
- [ ] Stripe a "activé" le compte (peut prendre 24-48h après KYC).
- [ ] Politique de remboursement définie + page CGV à jour.
- [ ] Email de support actif (Stripe envoie des emails à `support@propulseo-site.com` en cas de litige).

### 4.2 Procédure de bascule

1. Sur Stripe Dashboard, basculer en mode **live** (toggle haut droite).
2. Developers → API keys → copier le nouveau `sk_live_…`.
3. Developers → Webhooks → recréer l'endpoint webhook (l'URL Supabase reste la même, mais le `whsec_…` change) :
   - URL identique
   - Events identiques
4. Mettre à jour les secrets Supabase :
   ```
   STRIPE_SECRET_KEY = sk_live_xxxxxxxx
   STRIPE_WEBHOOK_SECRET = whsec_xxxxxxxx  (nouveau, mode live)
   ```
5. **Redéployer les 2 edge functions** (sinon elles utilisent les anciennes valeurs en cache jusqu'au redémarrage Cold Start) :
   ```bash
   supabase functions deploy portal-create-checkout-session
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
6. **Test live à 1 €** : créer une facture test à 1 €, payer avec une vraie carte (perso ou pro), vérifier le crédit sur le compte Stripe live, puis **rembourser intégralement** depuis Stripe Dashboard. Ce test prouve que la chaîne est fonctionnelle bout en bout.
7. Communiquer le passage en prod à l'équipe et au premier client (Précieuse).

### 4.3 Rollback en mode test

Si bug majeur en live :
1. Stopper temporairement le webhook côté Stripe Dashboard (toggle "Active").
2. Reposer les secrets sur les valeurs test :
   ```
   STRIPE_SECRET_KEY = sk_test_xxxxxxxx
   STRIPE_WEBHOOK_SECRET = whsec_xxxxxxxx  (mode test)
   ```
3. Redéployer les fonctions.
4. Communiquer aux clients qu'un incident est en cours, refacturer manuellement si besoin (virement bancaire).

---

## 5. Remboursements

Pas d'UI dédiée pour V1. Procédure :

1. Stripe Dashboard → Payments → trouver le `PaymentIntent` correspondant (`pi_…`).
2. Cliquer "Refund payment" → montant intégral ou partiel → confirmer.
3. **Mettre à jour le statut côté DB** manuellement :
   ```sql
   -- Pour une facture entière
   UPDATE propulspace.invoices
     SET status = 'refunded'
     WHERE stripe_payment_intent_id = 'pi_xxx';

   -- Pour un acompte
   UPDATE propulspace.invoice_installments
     SET status = 'cancelled'  -- ou autre selon le contexte
     WHERE stripe_payment_intent_id = 'pi_xxx';
   ```
4. Informer le client par email.

Une vraie UI remboursement viendra Sprint C+ (Vue 10/11 admin).

---

## 6. Coûts

Tarifs Stripe France (au 2026-05-18) :
- Carte UE : **1,4 % + 0,25 €** par transaction
- Carte non-UE : 2,9 % + 0,25 €
- Pas d'abonnement mensuel.

→ Sur une facture de 2 000 € en France, frais ≈ 28,25 €. À intégrer dans les marges des devis.

---

## 7. Diagnostic & dépannage

### Le bouton "Payer" renvoie une erreur
- Ouvrir la console navigateur → onglet Network → voir la réponse de `portal-create-checkout-session`.
- Causes fréquentes :
  - `STRIPE_SECRET_KEY manquante` → secret pas posé côté Supabase.
  - `Accès portail refusé` → user pas client portail (ou `portal_client_email` mal renseigné côté CRM).
  - `Facture non payable dans son état actuel` → invoice.status = draft/cancelled/refunded.

### Le webhook reçoit mais ne traite pas
- Vérifier dans `propulspace.stripe_webhook_events` :
  ```sql
  SELECT * FROM propulspace.stripe_webhook_events
  WHERE NOT processed
  ORDER BY received_at DESC LIMIT 20;
  ```
- La colonne `processing_error` donne la cause. Causes fréquentes :
  - Metadata `target_type/target_id` manquant (le checkout a été créé sans passer par notre edge function).
  - Schéma audit_log différent (signaler).

### La facture ne passe pas en `partially_paid` ou `paid`
- Vérifier que le trigger est bien en place :
  ```sql
  SELECT tgname FROM pg_trigger
  WHERE tgrelid = 'propulspace.invoice_installments'::regclass;
  -- Doit contenir trg_recalc_invoice_status
  ```
- Le trigger skip si `invoice.status IN (draft, cancelled, refunded)`. Vérifier.

---

## 8. À faire (backlog)

- [ ] UI admin facturation complète (Sprint C — Vue 10/11)
- [ ] Email Brevo "Paiement reçu" au client (post-B.1)
- [ ] Email Brevo "Paiement refusé" aux admins (post-B.1)
- [ ] UI remboursement en 1 clic (Sprint C+)
- [ ] Stripe Tax pour automatiser la TVA selon pays (V2)
- [ ] Multi-devise (V2 — actuellement EUR uniquement)
