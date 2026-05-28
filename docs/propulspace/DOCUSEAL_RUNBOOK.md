# DocuSeal — Runbook Propul'Space

Document opérationnel pour brancher la signature électronique DocuSeal sur le portail client. Permet aux clients de signer devis/contrats sans imprimer ni scanner.

---

## 1. État du code (Sprint B.4 livré le 2026-05-18)

| Composant | Statut |
|---|---|
| Tables `propulspace.signatures` + `docuseal_webhook_events` | ✅ (migration 050 + 060) |
| Vue `public.propulspace_signatures_v2` (whitelist colonnes safe) | ✅ (migration 190/195) |
| Edge function `admin-docuseal-create-submission` | ✅ Codée, **pas déployée** |
| Edge function `docuseal-webhook` | ✅ Codée, **pas déployée** |
| UI portail `SignaturesPage` (liste + bouton "Signer maintenant") | ✅ |
| UI admin pour déclencher une signature | ❌ Sprint C (Vue 11) |
| Compte DocuSeal | ❌ À créer côté Propul'Seo |
| Secrets Supabase (`DOCUSEAL_API_KEY`, `DOCUSEAL_WEBHOOK_SECRET`) | ❌ |

---

## 2. Choisir & créer le compte DocuSeal

Deux options :

### Option A — DocuSeal Cloud (recommandé V1)
- https://www.docuseal.com — plan "Pro" (~25€/mois) inclut webhooks + API.
- Avantage : zéro maintenance.

### Option B — DocuSeal self-hosted (V2)
- Open-source : https://github.com/docusealco/docuseal
- Pour migrer plus tard si on veut tout maîtriser.

→ **Aller en A pour démarrer.** Le code est compatible cloud + self-hosted (les endpoints sont les mêmes).

---

## 3. Créer les templates de signature

DocuSeal → Templates → New template :
- Uploader le PDF maître (ex. contrat de prestation type Propul'Seo).
- Placer les champs : `Nom`, `Prénom`, `Date`, `Signature`.
- Pour chaque champ, assigner le rôle `Client`.
- Sauvegarder → noter le `template_id` (entier visible dans l'URL ou via API).

Templates utiles à créer pour démarrer :
- `quote` — devis (1 page A4)
- `contract` — contrat de prestation (3-5 pages)
- `addendum` — avenant (1 page)

---

## 4. Récupérer la clé API

DocuSeal Dashboard → Settings → API → **Generate API key** → copier (commence souvent par `t_…` ou `dsk_…`).

Supabase Dashboard → Project Settings → Edge Functions → Secrets :
```
DOCUSEAL_API_KEY = <votre_clé>
DOCUSEAL_WEBHOOK_SECRET = <généré à l'étape 5>
```

---

## 5. Configurer le webhook DocuSeal

DocuSeal Dashboard → Webhooks → Add webhook :
- URL : `https://<project-id>.supabase.co/functions/v1/docuseal-webhook`
- Events à écouter :
  - `form.completed` (signature finalisée)
  - `form.declined` (client refuse la signature)
  - `submission.expired` (lien périmé)
- DocuSeal génère un `signing_secret` (HMAC SHA-256) à utiliser comme `DOCUSEAL_WEBHOOK_SECRET`.

---

## 6. Déployer les 2 edge functions

```bash
supabase functions deploy admin-docuseal-create-submission
supabase functions deploy docuseal-webhook --no-verify-jwt
```

⚠️ `docuseal-webhook` DOIT être `--no-verify-jwt` (DocuSeal n'envoie pas de JWT, sécurité par HMAC).

`admin-docuseal-create-submission` reste avec JWT verify (admin seul peut déclencher).

---

## 7. Déclencher une signature pour V1 (sans UI admin)

Pas d'UI admin avant Sprint C. Pour envoyer un devis/contrat à un client :

### Via Supabase Dashboard (SQL Editor) — non, c'est l'edge function qu'il faut appeler.

### Via curl (recommandé pour V1)

```bash
ADMIN_JWT=$(supabase auth get-token <votre-email-admin>)  # ou via UI CRM connexion
curl -X POST https://<project-id>.supabase.co/functions/v1/admin-docuseal-create-submission \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "uuid-du-projet",
    "template_id": "123",
    "name": "Contrat de prestation 2026",
    "signature_type": "contract",
    "signer_email": "client@exemple.com",
    "signer_name": "Marie Dupont",
    "send_email": true
  }'
```

DocuSeal envoie automatiquement l'email au client. Le client clique → page DocuSeal hébergée → signe → webhook arrive → `signatures.status` passe à `signed` + PDF récupéré.

### Via le portail client

Le client voit le doc à signer dans `/espace-client/signatures`. Statut `pending` avec bouton "Signer maintenant" → ouvre `docuseal_signing_url` dans un nouvel onglet.

---

## 8. Tester en mode dev DocuSeal

DocuSeal n'a pas de "mode test" comme Stripe. Solution : créer un compte de dev (gratuit) séparé du compte prod, ou utiliser des emails perso pour tester.

Scenarios à valider :

1. **Signature normale** : admin déclenche → client reçoit email → signe → vérifier `signatures.status = 'signed'` + `signed_pdf_url` rempli + bouton "Télécharger le PDF signé" actif côté portail.
2. **Refus** : client clique "Décliner" → vérifier `status = 'declined'` + `declined_at` rempli.
3. **Expiration** : laisser un lien expirer (typique 30 jours) → vérifier `status = 'expired'`.
4. **Idempotence** : depuis DocuSeal Dashboard → Webhooks → Resend un event → vérifier que `docuseal_webhook_events.idempotent` reste en place (table unique sur `docuseal_event_id`).

---

## 9. Côté admin : suivi des signatures

V1 = pas d'UI dédiée. Pour suivre les signatures en cours :

```sql
SELECT s.id, s.name, s.signature_type, s.status, s.sent_at, s.signed_at,
       p.name AS project_name
FROM propulspace.signatures s
LEFT JOIN public.projects_v2 p ON p.id = s.project_id
ORDER BY s.sent_at DESC;
```

Webhooks reçus :
```sql
SELECT received_at, event_type, processed, processing_error
FROM propulspace.docuseal_webhook_events
ORDER BY received_at DESC LIMIT 30;
```

UI admin complète prévue Sprint C.

---

## 10. Diagnostic

### Le client ne reçoit pas d'email
- DocuSeal → Submissions → vérifier que la submission a bien été créée.
- Si `send_email: true` passé, DocuSeal envoie via son propre SMTP — vérifier que l'email du client est correct.
- Bonus : on peut configurer DocuSeal pour utiliser notre SMTP Brevo (V2).

### Le webhook ne synchronise pas le statut
- Vérifier dans `propulspace.docuseal_webhook_events` :
  ```sql
  SELECT * FROM propulspace.docuseal_webhook_events
  WHERE NOT processed ORDER BY received_at DESC LIMIT 10;
  ```
- Causes fréquentes :
  - `docuseal_submission_id` ne matche aucune row dans `propulspace.signatures` → admin a peut-être créé la submission manuellement sans passer par l'edge fn.
  - Signature HMAC invalide (secret mal configuré) → l'edge fn refuse en 400.

### Erreur "Invalid signature"
- Vérifier que `DOCUSEAL_WEBHOOK_SECRET` côté Supabase = `signing_secret` côté DocuSeal Dashboard.
- Redéployer la fonction après changement de secret.

---

## 11. À faire (backlog)

- [ ] UI admin "Envoyer un document à signer" sur fiche projet V3 (Sprint C)
- [ ] Multi-signataires (admin + client) — V2
- [ ] Templates DocuSeal versionnés (admin upload PDF + drag-drop fields) — V2
- [ ] Rappels automatiques 24h / 7j si non signé — V2
- [ ] SMTP custom DocuSeal via Brevo — V2
