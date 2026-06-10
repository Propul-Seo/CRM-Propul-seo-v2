# Signature électronique maison (SES — Niveau 1) — Design

**Date :** 2026-06-09
**Statut :** validé (cadrage) — en attente revue spec avant plan d'implémentation
**Branche :** `feat/propulspace-portail-v2`

## Contexte & décision

On abandonne DocuSeal / Documenso (service externe à héberger + certificat PKI + ops).
On construit une **signature électronique simple (SES)** directement dans le portail.

Cadre légal : valable pour des devis/contrats B2B (eIDAS art. 25 ; Code civil 1366-1367).
Pas de présomption automatique de fiabilité (réservée au qualifié) → la robustesse repose
sur un **journal de preuve** (identité via session portail authentifiée, horodatage, IP,
user-agent, empreinte SHA-256 du PDF, consentement). Niveau 2 (scellement PAdES) = hors scope,
ajoutable plus tard sans casser ce design.

## Modèle de données

La table `propulspace.signatures` existe déjà et porte déjà `document_id`, `signer_ip`,
`signer_user_agent`, `status` (pending/signed/declined/expired/cancelled), `signed_at`,
`declined_at`, `decline_reason`, `created_by`, audit trigger. On retire le DocuSeal et on
ajoute le journal de preuve.

### Migration `propulspace_298_signature_maison_ses` (SQL prêt à coller)

```sql
-- propulspace_298_signature_maison_ses
-- DocuSeal -> signature électronique simple (SES) maison.
set search_path = propulspace, public;

-- 1. Colonnes DocuSeal devenues inutiles (aucune donnée en prod)
alter table propulspace.signatures
  drop column if exists docuseal_submission_id,
  drop column if exists docuseal_template_id,
  drop column if exists docuseal_signing_url;

-- 2. PDF signé : nom provider-agnostic
alter table propulspace.signatures
  rename column docuseal_signed_pdf_url to signed_pdf_url;

-- 3. Journal de preuve
alter table propulspace.signatures
  add column if not exists signed_name      text,
  add column if not exists signer_email     text,
  add column if not exists signature_image  text,        -- PNG (chemin storage)
  add column if not exists consent_at       timestamptz,
  add column if not exists document_sha256  text;
```

> `docuseal_submission_id` était `NOT NULL UNIQUE` → le drop retire la contrainte.
> Le `document_id` (FK vers `propulspace.documents`) désigne le PDF source à signer.

## Flux admin — demander une signature

`AdminSignatureForm` refondu (et passé au socle modal de la refonte A) :
- **Choisir un document du projet** (PDF déjà uploadé : devis/contrat) dans une liste —
  remplace l'ancien champ « Template DocuSeal (ID) ».
- + email signataire (pré-rempli `portal_client_email`), nom signataire (optionnel), type.
- Submit → RPC `admin_create_signature` (SECURITY DEFINER, schéma `propulspace` non exposé)
  → insère une ligne `status='pending'`, `document_id`, `signer_email`, `name`, `sent_at`.
- Puis envoi email Brevo `signature-requested` via `send-portal-email` (lien vers le portail).
- `useAdminSignatures` : retirer la sonde DocuSeal (`createEnabled` toujours vrai),
  `createSignature` appelle la RPC au lieu de l'edge function DocuSeal.

## Flux client — signer (UX type Yousign)

`SignaturesPage` → bouton « Signer » ouvre **`SignatureSignModal`** (nouveau) :
- aperçu du PDF (réutilise le viewer existant),
- **signature dessinée (canvas) OU tapée** (nom rendu en police manuscrite) — bascule,
- case obligatoire « Je certifie être <nom> et j'accepte de signer ce document »,
- bouton « Signer » → appelle l'edge function `portal-sign-document`.
- **Bloqué en mode aperçu admin** (`previewMode` → bouton désactivé, comme les autres écritures).

## Edge function `portal-sign-document` (cœur)

Entrée : `{ signature_id, signature_image (PNG base64), signed_name, consent: true }`.
Étapes :
1. **Auth** : vérifier le JWT du client portail ; la signature doit appartenir à un projet
   dont `portal_client_email` = email du caller ; sinon 403.
2. Refuser si `status !== 'pending'` (idempotence) ou consentement absent.
3. Charger le PDF source (`document_id` → storage), calculer son **SHA-256** (Web Crypto).
4. **Générer le PDF signé** avec `pdf-lib` : apposer l'image de signature + ajouter une
   **page de preuve** en fin de document :
   « Signé électroniquement le <horodatage> par <nom> (<email>) · IP <ip> ·
   empreinte SHA-256 <hash> · via l'espace client Propul'SEO ».
5. Upload du PDF signé dans le bucket `propulspace-documents` → `signed_pdf_url`.
6. Enregistrer la preuve sur la ligne : `signed_name`, `signer_email`, `signature_image`
   (upload PNG → chemin), `consent_at`, `signed_at`, `signer_ip` (header `x-forwarded-for`),
   `signer_user_agent`, `document_sha256`, `status='signed'`.
7. Email Brevo `signature-completed` (client + `team@propulseo-site.com`) avec le PDF signé.

Service role (écritures `propulspace` + storage). Aucune écriture client directe (RLS intacte).

## Emails (Brevo)
- `signature-requested` : réutilisé (déjà câblé).
- `signature-completed` : nouveau template (confirmation + lien PDF signé). Fallback : réutiliser
  un template générique si non créé côté Brevo (dégradation gracieuse, ne bloque pas la signature).

## Composants touchés / créés / supprimés

**Créés** : `portal-sign-document` (edge function), `SignatureSignModal` (client),
RPC `admin_create_signature`, migration 298.
**Modifiés** : `AdminSignatureForm`, `useAdminSignatures`, `SignaturesPage`,
`usePortalData` (type `PortalSignature` : `docuseal_*` → `signed_pdf_url` + champs preuve),
`SignatureStepper`/`signaturePreview` (refs `docuseal_*`).
**Supprimés** : edge functions `admin-docuseal-create-submission`, `docuseal-webhook` ;
`integrations/docuseal.ts` ; variables d'env `DOCUSEAL_*` (`.env.example`).

## Sécurité
- Écriture de signature uniquement via `portal-sign-document` (service role + vérif auth projet).
- Mode aperçu admin : signature désactivée (`previewMode`).
- Le `document_sha256` est figé au moment de la signature → détecte toute modif ultérieure du PDF source.

## Hors scope (Niveau 1)
- Scellement cryptographique PAdES du PDF (= Niveau 2).
- Multi-signataires / zones de signature multiples. Un signataire = le client du projet.

## Critères de test (recette)
1. Admin : créer une demande sur un document → ligne `pending` + email reçu.
2. Client : ouvrir le portail → « Signer » → dessiner puis tester le mode tapé → cocher consentement → signer.
3. Vérifier : PDF signé généré avec page de preuve (nom/horodatage/IP/SHA-256), `status='signed'`,
   `signed_pdf_url` téléchargeable, emails envoyés.
4. Mode aperçu admin : bouton « Signer » désactivé.
5. Sécurité : un client d'un autre projet ne peut pas signer cette demande (403).
