# Handoff: Propul'Space v2 — Compléments

> **Bundle parallèle au v1.** Ne remplace rien. À déballer en parallèle dans le repo CRM, en gardant `design_handoff_propulspace/` intact.

## Ce qui est livré ici

**17 nouvelles vues desktop** + **10 emails transactionnels** + tokens et primitives identiques à v1.

```
design_handoff_propulspace_v2/
├── README.md                ← ce fichier
├── tokens/                  ← copies des fichiers v1 (pour autonomie du bundle)
├── mockups/
│   ├── vues-index.html      ← ★ point d'entrée : router avec les 17 vues + lien vers les emails
│   ├── _lib/                ← primitives + shells (copies v1 + v2-shared.jsx)
│   └── vue-13 → vue-29.html
└── emails/
    ├── index.html           ← preview des 10 emails côte à côte
    ├── README.md            ← variables Brevo + mapping
    └── NN-name.html + NN-name.brevo.html
```

## Comment ouvrir

```bash
cd design_handoff_propulspace_v2/mockups
python3 -m http.server 8000
# Puis : http://localhost:8000/vues-index.html
```

---

## Périmètre + conventions respectées

- **Desktop uniquement** (mobile traité plus tard)
- **Mêmes tokens** que v1 (`tokens/colors_and_type.css` est identique). Si tu mets à jour v1, mets à jour v2.
- **Conventions DB Phase 1 respectées** (voir paragraphe Notes plus bas) :
  - Tables : `propulspace.*`
  - FK : `project_id` partout
  - User table : `public.users` avec colonnes `portal_enabled`, `portal_linked_project_id`, `portal_last_login_at`, `onboarding_completed`
  - Projets : `public.projects_v2`

---

## Détail des 17 vues

### Portail client — pages d'erreur et retours (6 vues)

| # | URL | Description |
|---|---|---|
| **13** | `/espace-client/login?error=expired` | Magic link expiré (15 min) — 2 états (expired + invalid) |
| **14** | `/espace-client/*` (404) | Page introuvable dans PortalLayout, big 404 gradient + retour |
| **16** | `/espace-client/factures/paiement/success?session_id=X` | Retour Stripe OK — facture + montant + reçu |
| **17** | `/espace-client/factures/paiement/cancel` | Paiement interrompu, ton neutre |
| **18** | `/espace-client/signatures/sign/success?token=X` | DocuSeal OK + audit info (timestamp + IP) |
| **19** | `/espace-client/signatures/sign/cancel` | DocuSeal interrompu — bouton reprendre |

**Pattern partagé** : composant `StatusPage` (dans `_lib/v2-shared.jsx`) — bulle d'icône colorée, titre gradient, sous-titre, bloc détails optionnel, CTA primary + secondary, footnote.

### Portail client — pages annexes (4 vues)

| # | URL | Description |
|---|---|---|
| **15** | `/diagnostic/mon-diagnostic` | Récap qualification read-only après création compte. 2 modes (prospect / activé) avec CTA différents |
| **20** | (mode global) | Portail suspendu (`projects_v2.portal_enabled = false`). Carte centrée + contacts WhatsApp / Email |
| **21** | `/espace-client/profil` | 3 sections (Mes infos · Notifications · Sécurité) + dropdown menu avatar |
| **22** | (feature flag) | Page maintenance générique avec ETA |

### Admin CRM — Sheets (2 vues)

| # | Déclencheur | Description |
|---|---|---|
| **23** | Vue 11 tab Signatures · bouton "Envoyer à signer" | Sheet right 480px · Type doc (4 options) · Upload PDF · Date expiration (date picker + relative) · Signataire read-only · Message custom |
| **24** | Vue 11 tab Documents · bouton "Uploader" | Sheet right 480px · Drop zone multi-fichiers · Pour chaque fichier : type (12 options) + visibilité (toggle) + description |

### Admin CRM — AlertDialogs (4 vues)

Tous utilisent le composant `AlertDialogPreview` (dans `_lib/v2-shared.jsx`).

| # | Action | Champs requis | Confirm |
|---|---|---|---|
| **25** | Désactiver portail | `textarea` raison (obligatoire) → `projects_v2.portal_deactivation_reason` | destructive |
| **26** | Supprimer document | (aucun champ) | destructive |
| **27** | Annuler facture (sent/overdue → cancelled) | `textarea` motif | destructive |
| **28** | Disqualifier lead | `select` 5 raisons + `textarea` optionnel | destructive |

### Admin CRM — Notifications (1 vue)

| # | Composant | Description |
|---|---|---|
| **29** | Bell + Popover (header admin) | Bell icon avec badge rouge count · Popover 400px · 3 sections (Urgentes rouge · À traiter orange · Info gris) · Empty state si aucune notif |

---

## 10 emails transactionnels

**Format** : HTML inline-styled, table-based pour compat Outlook/Gmail, max-width 600px, responsive (collapse < 620px), Inter avec fallback Arial.

Chaque email existe en **2 versions** :
- `NN-name.html` — valeurs d'exemple pour preview navigateur
- `NN-name.brevo.html` — variables `{{ params.X }}` prêtes à coller dans Brevo

Voir `emails/README.md` pour la liste complète des variables par email.

| # | Slug | Recipient | Trigger |
|---|---|---|---|
| 30 | `magic-link` | client | demande de connexion |
| 31 | `qualif-confirmation` | prospect | submit du formulaire qualif |
| 32 | `new-lead-alert` | admin (team@) | nouveau lead qualifié |
| 33 | `invoice-sent` | client | facture émise et envoyée |
| 34 | `invoice-reminder` | client | cron J+3 / J+7 / J+14 |
| 35 | `payment-received` | client | webhook Stripe `payment_intent.succeeded` |
| 36 | `signature-requested` | client | document envoyé à signer |
| 37 | `signature-completed` | client | webhook DocuSeal `submission.completed` |
| 38 | `portal-welcome` | client | activation du portail (Phase 5) |
| 39 | `new-deliverable` | client | upload d'un document type `livrable` visible client |

---

## Notes / écarts vs brief

### Schema DB — convention `propulspace.*` vs PRD original

Le PRD original (v2_EN.md) parle de tables `portal_*` dans le schéma `public`. Le brief actuel demande tables dans le schéma dédié `propulspace.*`, FK `project_id` (pas `client_id`), et table user dans `public.users` avec colonnes `portal_*` étendues.

**J'ai suivi le brief actuel.** Si tu vois des références à `portal_qualification_leads` dans le PRD, ce sera désormais `propulspace.qualification_leads`. Les sheets et alerts citent ces noms de tables dans leurs help-texts.

Voir `Propulspace/PHASE_1_PLAN_VALIDATED.md` pour la décision validée.

### Vue 21 — Profil éditable ou read-only V1 ?

**Choix retenu** : éditable pour `name`, `phone`, `company`. Email reste read-only (visuel input grisé). Les préférences de notification sont actives (toggles fonctionnels).

→ Si Lyes préfère read-only en V1, désactiver les inputs côté code. Le design ne bouge pas.

### Vue 20 — Mode portail suspendu : afficher la raison ou rester opaque ?

**Choix retenu** : opaque. On affiche seulement « Votre espace est temporairement suspendu » + date de désactivation + canaux de contact. La raison interne (`portal_deactivation_reason`) reste invisible au client.

→ Justification : éviter les conflits relationnels si la raison est négative (impayé, désaccord). Le contact direct résout le cas par cas.

### Email #30 magic-link — bypass Supabase Auth ?

**Choix retenu** : design du template comme si on bypassait Supabase Auth et envoyait directement via Brevo. Ça donne plus de contrôle sur le branding et l'expiration custom.

→ Décision tech à valider avec Lyes. Côté Edge Function, il faudra `auth.admin.generateLink({ type: 'magiclink' })` puis envoi Brevo manuel.

### Vue 29 — Realtime ou polling ?

**Choix retenu** : design supporte les deux. Le badge count est un nombre simple. Pour V1, polling 30s est suffisant. Migration vers Supabase Realtime quand le volume justifie.

→ Aucun indicateur "LIVE" affiché dans le mockup pour rester agnostique.

---

## Réutilisation des primitives v1

Tous ces composants sont déjà dans `_lib/primitives.jsx` (copié de v1) :

| Composant | Usage en v2 |
|---|---|
| `Icon` | Partout |
| `Badge` | Tous les statuts |
| `Button` | Tous les CTA |
| `KpiTile` | (non utilisé en v2) |
| `Hero` | (non utilisé en v2) |
| `Progress` | (non utilisé en v2) |
| `EmptyState` | Notifications vide (vue 29) |
| `SectionHead` | Aucune |

**Nouveaux composants v2** dans `_lib/v2-shared.jsx` :

- `StatusPage` — utilisé par vues 13/16/17/18/19/20/22
- `AlertDialogPreview` — utilisé par vues 25/26/27/28

À porter en `src/components/ui/` shadcn quand tu codes en prod.

---

## Plan d'attaque suggéré (comme dans le brief original)

1. **AlertDialogs 25-28** — courts, factorisables → débloque les flows admin
2. **Pages d'erreur 13, 14, 16-19** — pattern simple répété, ~30 min chacune via `StatusPage`
3. **Pages annexes 20-22** — pattern shell, contenu varié
4. **Récap qualification 15** — réutilise les sections du form v1
5. **Sheets 23-24** — réutilise les patterns d'inputs admin
6. **Notifications panel 29** — composant atypique
7. **Emails 30-39** — branchement Brevo, totalement indépendant

**Estimation** : 6-8h pour quelqu'un familier avec le DS v1.

---

## Liens utiles

- Bundle v1 : `design_handoff_propulspace/` (à garder intact)
- PRD : `docs/PRD_PROPULSPACE_v2_EN.md`
- Plan Phase 1 validé : `Propulspace/PHASE_1_PLAN_VALIDATED.md`
- Module cible : `src/modules/EspaceClient/`
- Tokens upstream : `src/modules/EspaceClient/shared/layouts/portal-theme.css`

Bonne implé 🚀
