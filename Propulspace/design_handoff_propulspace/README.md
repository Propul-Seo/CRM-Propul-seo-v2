# Handoff: Propul'Space — Portail client premium

## Overview

**Propul'Space** est le portail client premium intégré au CRM Propul'SEO. Ce bundle contient 12 vues desktop (8 portail client + 1 onboarding + 3 admin CRM) à implémenter dans `src/modules/EspaceClient/` du repo [CRM-Propul-seo-v2](https://github.com/Propul-Seo/CRM-Propul-seo-v2).

Le portail couvre le parcours complet : prospect anonyme → qualification → discovery → contrat → acompte → onboarding → projet actif → livré. Côté client : light theme calme et premium. Côté admin : dark theme dense aligné sur le reste du CRM.

## ⚠️ À propos des fichiers de design

**Les fichiers HTML dans `mockups/` sont des références visuelles**, pas du code de production à copier. Ils ont été générés avec React via `@babel/standalone` dans le navigateur pour montrer le rendu final exact.

**Ta mission** : recréer ces designs dans l'environnement existant du CRM —
- React 18 + TypeScript 5 + Vite 5
- shadcn/ui (Radix primitives) + Tailwind CSS 3
- Supabase pour la data + auth + storage
- Zustand (sliced store) pour le state UI
- React Hook Form + Zod pour les formulaires
- TanStack Query pour les fetches
- Lucide React pour les icônes

Le module doit vivre dans `src/modules/EspaceClient/` (déjà scaffolé avec `shared/layouts/PortalLayout.tsx` — voir `upstream-ref/`).

**Source de vérité primaire** : `docs/PRD_PROPULSPACE_v2_EN.md` dans le repo CRM. Lis-le AVANT de coder. Il contient le schéma Supabase complet (24 tables `portal_*`), les edge functions, les politiques RLS, et la logique conditionnelle du formulaire de qualification (13 règles).

## Fidelity

**Pixel-perfect / high-fidelity.** Couleurs, espacements, rayons, ombres, typographie : tous les tokens sont fixés dans `tokens/colors_and_type.css`. À recréer à l'identique.

Le code shadcn/ui sera l'implémentation cible (pas le HTML React inline des mockups). Réutilise `Card`, `Tabs`, `Badge`, `Button`, `Dialog`, `Sheet`, `Table`, `Skeleton`, `Avatar`, `Progress`, `Tooltip`, `Form`, `RadioGroup`, `Checkbox`, `Accordion`, `Input`, `Textarea`, `AlertDialog`.

---

## Structure du bundle

```
design_handoff_propulspace/
├── README.md                          ← ce fichier
│
├── tokens/                            ← design tokens (à recopier dans Tailwind config + portal-theme.css)
│   ├── colors_and_type.css            ← tokens globaux (couleurs, type, spacing, motion)
│   ├── portal.css                     ← styles utilitaires portail client
│   └── admin.css                      ← styles utilitaires admin CRM dark
│
├── upstream-ref/                      ← code production EXISTANT — source de vérité
│   ├── portal-theme.css               ← le fichier en place dans src/modules/EspaceClient/shared/layouts/
│   ├── PortalLayout.tsx               ← shell déjà scaffolé : header + tabs + FAB
│   ├── PortalTabBar.tsx               ← tab bar mobile + desktop
│   ├── PortalContactFab.tsx           ← bouton flottant de contact
│   └── PortalLayout.preview.tsx       ← exemple de contenu (à remplacer par les vraies routes)
│
└── mockups/                           ← les 12 vues HTML (références visuelles)
    ├── vues-index.html                ← router : page d'accueil pour parcourir
    ├── all-vues.html                  ← toutes les vues empilées en iframes
    ├── vue-01-login.html              ← + 11 autres vue-XX-*.html
    └── _lib/                          ← composants React des mockups (à NE PAS copier en l'état)
```

**Comment ouvrir** : `cd design_handoff_propulspace/mockups && python3 -m http.server` puis aller sur `http://localhost:8000/vues-index.html`.

---

## Design tokens

### Couleurs

```css
/* Portail client (light) */
--ps-bg:              #FAFAFA;   /* page background (off-white) */
--ps-bg-elevated:     #FFFFFF;   /* cards, sheets */
--ps-bg-subtle:       #F4F4F5;   /* chips, hover-rest */
--ps-fg:              #18181B;   /* primary text */
--ps-fg-secondary:    #52525B;   /* body, support */
--ps-fg-muted:        #A1A1AA;   /* metadata, placeholder */

--ps-primary:         #7C3AED;   /* LE seul accent — violet */
--ps-primary-hover:   #6D28D9;
--ps-primary-deep:    #5B21B6;   /* texte violet sur fond clair */
--ps-primary-subtle:  #EDE9FE;   /* fond chip sélectionné */

--ps-success:         #16A34A;   --ps-success-subtle: #DCFCE7;
--ps-warning:         #EA580C;   --ps-warning-subtle: #FFEDD5;
--ps-danger:          #DC2626;   --ps-danger-subtle:  #FEE2E2;

--ps-border:          #E4E4E7;
--ps-border-soft:     #F0F0F2;   /* card outlines */

/* Admin CRM (dark violet) — distinct du portail */
--a-bg-0:    #020205;   --a-bg-1: #070512;   --a-bg-2: #0f0b1e;
--a-fg:      #ECECEE;   --a-fg-2: #A8A4B5;
--a-neon:    #8B5CF6;   --a-neon-light: #A78BFA;   --a-neon-deep: #6D28D9;
```

### Typographie

- **Font** : Inter, weights 400/500/600/700. Loaded via Google Fonts.
- **Tabular-nums** sur tous les chiffres (`font-variant-numeric: tabular-nums`) — utiliser via classe `.ps-num`.
- **Features Inter** : `font-feature-settings: "cv11", "ss03", "cv02"`.
- Scale : Display 32/40 · H1 24/32 · H2 18/28 · Body 15/24 · Small 13/20 · Tiny 12/16 · Eyebrow 10.5px uppercase.
- Letter-spacing : `-0.025em` titres, `-0.005em` body.

### Espacement / radii / ombres

```css
--ps-radius-input:  8px;    /* form fields, small buttons */
--ps-radius-card:   14px;   /* cards */
--ps-radius-modal:  16px;   /* dialogs, sheets */
--ps-radius-pill:   9999px; /* badges */

--ps-shadow-card:    0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.05);
--ps-shadow-raised:  0 4px 12px -2px rgba(91,33,182,.10), 0 2px 4px -1px rgba(16,24,40,.06);
--ps-shadow-fab:     0 10px 30px -8px rgba(124,58,237,.45), 0 4px 10px -2px rgba(124,58,237,.25), inset 0 1px 0 rgba(255,255,255,.15);
```

### Motion

- **Easing standard** : `cubic-bezier(0.4, 0, 0.2, 1)` (state changes)
- **Easing entrance** : `cubic-bezier(0.16, 1, 0.3, 1)` (fade-up)
- Durées : 150ms fast · 200ms base · 300ms slow (jamais plus)
- **Aucun bounce, aucun spring** — le ton est calme

### Iconographie

**Lucide React exclusivement**. Stroke 1.9 par défaut, 2.4 actif. Tailles 14–22px selon contexte. Voir `tokens/portal.css` pour le mapping canonique.

---

## Les 12 vues

### Vue 1 — Login (`/espace-client/login`)

**But** : première impression. Magic-link uniquement, pas de mot de passe.

**Layout** : page autonome (PAS de PortalLayout). Carte centrée verticalement + horizontalement, max-width 380px, padding 32px.

**Composants** :
- Logo pill violet (44px) avec icône `Sparkles` + texte "Propul'SEO"
- H1 gradient text (linear `var(--ps-fg)` → `var(--ps-primary-deep)`) : "Votre espace Propul'SEO"
- Sous-titre : "Connectez-vous pour suivre votre projet"
- Input email (height 46px, radius 8px, focus ring 3px violet à 16% opacity)
- Bouton primary (height 48px, ≥ 44px requis, gradient violet) : "Recevoir mon lien de connexion"
- Lien helper : "Vous n'avez pas reçu de lien ? Contactez-nous"
- Footer : "© 2026 Propul'SEO · Hébergé en France 🇫🇷"

**3 états** :
1. **Initial** — formulaire vide
2. **Loading** — spinner blanc (rotation 800ms) + "Envoi en cours…" + input disabled
3. **Success** — formulaire remplacé par un encart `--ps-primary-subtle` avec emoji ✉️, l'email du client en gras, et "Il reste valide 15 minutes."

**Backend** : magic-link via Brevo (cf PRD §3.4 `portal-submit-qualification`).

---

### Vue 2 — Dashboard client (`/espace-client`)

**But** : le "money shot". Le client comprend en 5 secondes où il en est.

**Layout** (la V2 validée) : **2 colonnes**, sidebar gauche 320px persistante (sticky top), main droite.

**Sidebar (3 cartes empilées)** :
1. **Carte projet** — Eyebrow "Mon projet" · titre projet · big number `65` en gradient violet (52px, font-weight 700) + `%` discret · progress bar 6px gradient · "Étape 3 de 6 · Développement". Card padding 22, position: relative, avec radial blur top-right.
2. **Carte prochain jalon** — Date en chip carré 44×44 (`JUIN` / `22`) + label + temps restant.
3. **Carte contact** — Avatar Lyes (gradient orange) + nom + rôle + boutons WhatsApp + Email.

**Main** :
1. Eyebrow "Vendredi 15 mai · 14:22" + H1 gradient "Bon retour, Sophie"
2. **Bandeau action** (priorité 1) — gradient `--ps-primary-subtle → #fff`, icône `receipt` dans carré violet rounded, "1 action requise" / "Régler la facture PS-1031 · 5 000,00 €" / "Échéance 15 juin · Stripe en 1 clic" + bouton primary "Payer maintenant"
3. **KPI strip 4 colonnes** : Heures (42 h, violet) · Docs livrés (8, blue) · Payé 2026 (8 000 €, green) · Onboarding (60 %, orange)
4. **Activité + Documents 2 colonnes** — listes avec icônes circulaires teintées par catégorie

**Empty state** : projet fraîchement activé → sidebar simplifiée + EmptyState central avec icône `sparkles` + "Votre projet démarre bientôt. Nous préparons tout pour vous." + CTA "Contacter Propul'SEO".

**Loading state** : skeletons violets (shimmer animation 1.5s loop, gradient `rgba(124,58,237,0.04)` → `0.10` → `0.04`). Mêmes dimensions que les vraies cartes.

---

### Vue 3 — Qualification 7 étapes (`/diagnostic`)

**But** : porte d'entrée publique. Prospect → compte créé automatiquement à la fin. 7 minutes max.

**Layout** : PAS de PortalLayout. Sticky top frosted avec progress bar fine (4px) violet. Carte centrée max-width 700px, padding 32px.

**Pour chaque étape** :
- Eyebrow "Étape X sur 7" + H1 gradient (24px) + sous-titre
- Champs / radios / checkboxes
- Footer : bouton "Précédent" (outline, sauf step 1) + bouton "Suivant" (primary, large)
- Auto-save badge "Sauvegardé ✓" (vert) en haut à droite

**Logique conditionnelle (13 règles)** — voir PRD §3.5 :
- Step 2 : "Avez-vous un site ?" → branches "Oui/obsolète" (URL + captures + trafic + problèmes) vs "Non" (juste domaine).
- Step 4 : E-commerce coché → plateforme + volume produits. Réservation → type.
- Step 5 : Charte complète → 2 uploads ; Logo seul → 1 upload ; Rien → question "création identité ?".
- Step 6 : Budget < 2000€ → bannière douce sans bloquer. Délai < 1 mois → textarea "pourquoi ?".

**Radios visuelles step 5** : 3 cartes (🎨 Charte / 🖼️ Logo / ❓ Rien). Step 6 : 5 cartes budget avec emoji (💡 🚀 ⭐ 💎 🏆) — note PRD : emoji autorisés UNIQUEMENT comme labels user-choice, jamais en chrome produit.

**Step 7** : récap pliable de toutes les réponses (`Accordion` shadcn). CTA primaire "Envoyer mon diagnostic" + CTA secondaire désactivé "Réserver un RDV 30 min — bientôt".

**Page merci** : carte 580px, badge gradient circle 64×64 avec check, "Merci Sophie !" en gradient, timeline 3 étapes (📞 Appel découverte / 📄 Proposition / 🚀 Démarrage), bouton "Retour au site".

**Backend** : POST → `portal-submit-qualification` edge function. Auto-save côté client localStorage + server (PATCH partiel toutes les 30s ou onBlur). Anti-spam : honeypot + rate limit IP + reCAPTCHA v3 si spam détecté.

---

### Vue 4 — Factures (`/espace-client/factures`)

**Layout main content** : eyebrow + H1 gradient "Mes factures" + sous-titre.

**3 KPI tiles** : "À payer" (7 500 €, orange) · "Payé en 2026" (8 000 €, green) · "Total émis" (15 500 €, violet).

**Table desktop** (shadcn `Table`) : N° (mono) · Date · Montant TTC (bold tabular) · Échéance · Statut (badge) · Action.
- "À payer" → badge violet, bouton `Payer`
- "Payée" → badge green, bouton outline `PDF`
- "En retard" → badge red + icône AlertTriangle, bouton danger `Payer maintenant`

**Sheet détail** (shadcn `Sheet` side="right", 440px) :
- En-tête : numéro + statut badge + bouton close
- Big amount en gradient : 5 000,00 €
- Sections : Émetteur (Propul'SEO + SIRET 98108609300011 + 5 av des Arrouturous, 64320 Idron) · Client snapshot · Détail lignes (mini-table) · Totaux (sous-total / TVA 0% / total)
- Section échéances (si applicable) : tableau échéances avec statut individuel
- Mention "TVA non applicable, art. 293 B du CGI" (italique 11.5px)
- CTA grand bouton "Payer X € · Stripe" ou "Télécharger le PDF"

**Backend** : `portal-create-payment-link` edge function génère Stripe Payment Link. Webhook `portal-stripe-webhook` met à jour `portal_invoices.status` + `paid_at`. Numérotation atomique via `nextval('portal_invoice_number_seq')`.

---

### Vue 5 — Projet (`/espace-client/projet`)

**Layout 2-col** : main 1fr (timeline) + sidebar 360px (KPI + livrables sticky).

**Main** :
- Eyebrow "Projet en cours" + H1 gradient projet + badge "En cours"
- Progress bar globale 65%
- Card "Étapes du projet" — `<ol>` de 6 étapes en timeline verticale

**TimelineStep** : nœud circulaire 30×30 à gauche (vert avec check si done · violet plein + shadow ring 4px si current · gris bordered si upcoming) + ligne verticale 2px qui relie les nœuds (verte si done, gris sinon). Body droite : label + dates monospaced + (si current) description dans encart violet subtle.

**Sidebar** :
- KpiTile "Heures travaillées" (42h, violet)
- Carte "Prochain jalon" avec date chip carré (`JUIN` / `22` style mini-calendrier) + label + délai
- Carte "Derniers livrables" — 3 rows avec icône PDF rouge + nom + date + bouton Télécharger

**Empty state** : EmptyState central "Votre projet démarre bientôt..." + icône `rocket`.

**Backend** : table `portal_project_steps` (step_order, label, status, dates, visible_to_client). Bidirectionnalité avec `projects` côté CRM admin — voir PRD §3.

---

### Vue 6 — Documents (`/espace-client/documents`)

**Layout** : header avec H1 + search input 320px à droite (icône search).

**Filtres** : 7 chips horizontaux pill — Tous · Devis · Contrats · Factures · Livrables · Assets · Légal. Active state = `--ps-primary-subtle` fond + texte deep.

**Table desktop** :
- Colonne Nom : icône fichier teintée (PDF rouge / image bleu / zip violet) + nom + badge "Nouveau" (orange) si non consulté
- Type · Date · Taille (tabular-nums)
- Bouton outline "Télécharger" droite

**Upload zone (bas de page)** : dashed border, icône `upload` dans bulle violet subtle, "Déposez vos fichiers ici · 25 MB max", boutons "Parcourir mes fichiers" + select Type (Asset / Contenu / Autre).

**Backend** : Supabase Storage bucket `propulspace-documents`. RLS via `portal_documents.client_id IN (SELECT portal_linked_client_id FROM users WHERE auth_user_id = auth.uid() AND portal_enabled = true)`. Marquer `viewed_by_client_at` à l'ouverture, `downloaded_by_client_at` au download (event tracking).

---

### Vue 7 — Signatures (`/espace-client/signatures`)

**Layout** : header + bannière violet subtle "X document en attente de votre signature" si pending > 0.

**Cartes 2-col grid** : chaque signature dans une carte avec :
- Avatar circulaire 44px (violet subtle si pending, green subtle si signed)
- Titre + métadonnées (Type · Envoyé le X · Signé le Y si signed)
- Badge statut
- Footer boutons : "Signer maintenant" (primary, prominent) si pending — "PDF signé" (outline) si signed

**Carte pending highlight** : border violet 25% opacity + shadow violet diffuse + box-shadow inset.

**Sheet détail audit trail** : statut en gradient + audit rows (Document envoyé / Email ouvert / Document consulté / Signature électronique / IP signataire mono / Émulateur d'agent) + bouton "Télécharger le PDF signé".

**Backend** : DocuSeal Cloud free tier. `portal-docuseal-send` → submission. Webhook `portal-docuseal-webhook` met à jour `portal_signatures.status`. Audit log dans `portal_audit_log`.

---

### Vue 8 — Aide (`/espace-client/aide`)

**Layout 2-col** : main FAQ + sidebar contacts directs sticky.

**FAQ Accordion** (shadcn) — 5 questions :
1. "Comment payer une facture ?"
2. "Comment signer un document ?"
3. "Comment ajouter un document ?"
4. "Comment contacter Propul'SEO ?"
5. "Mes données sont-elles protégées ?"

Chaque item : titre 15px / 500 weight + icône `chevron-down` qui rotate 180° quand ouvert. Body : 13.5px / lh 1.6 / color secondary, max-width 720px.

**Tutoriel** : carte horizontale icône `play-circle` violet + label + bouton "Lancer" → relance la modal d'onboarding (vue 12).

**Sidebar contacts** : 3 cartes (WhatsApp green / Email violet / Téléphone blue), chacune avec icône teintée + label + sub + bouton primary block.

---

### Vue 9 — Admin · Leads qualifiés (`/admin/leads-qualifies`)

**Layout** : `AdminShell` (dark, sidebar gauche 232px violet sombre).

**Sidebar admin** : brand pill mini + navigation 8 items (Dashboard / Leads qualifiés / CRM / Projets / Portails clients (sub-item) / Comptabilité / Communication / Calendrier). Item actif = `rgba(139,92,246,0.15)` fond + inset border violet. Badge red sur "Leads qualifiés" = 3 (en attente callback). User card en bas (avatar + nom + rôle).

**Main** :
- Header avec breadcrumb "CRM › Acquisition" + H1 + boutons "Exporter CSV" (ghost) + "Créer un lead" (primary)
- 4 KPI tiles : Total leads (47) · Ce mois (12) · En attente callback (3, amber) · Score moyen (62/70)
- Bar filtres : search + select Statut + select Secteur + slider Score min + date range + bouton "Réinitialiser"
- Table : Date · Nom (avatar circulaire coloré + nom) · Société · Secteur · Budget · Score qualité (barre colorée verte/jaune/rouge selon seuil 60/40) · Statut badge · chevron

**Score qualité** : `(budget × 40) + (decision × 30) = 70 max` selon PRD. Formule simplifiée V1.

**Backend** : table `portal_qualification_leads`. `portal-calculate-quality-score` edge function. Pagination Supabase avec `.range()`.

---

### Vue 10 — Admin · Portails actifs (`/admin/espace-client`)

**Layout** : `AdminShell`, breadcrumb "Production › Propul'Space".

**3 KPI** : Portails actifs (3) · Actions en attente (2, amber) · Taux d'usage hebdo (67%, green).

**Card "Actions urgentes"** (border red 25%, gradient red overlay) : list de rows avec icône teintée tons rouges/oranges (impayé en retard, client inactif > 21j) + CTA "Relancer" / "Contacter".

**Table portails** : Projet · Client (avatar + nom) · Dernière connexion (rouge si > 14j) · Actions pending (badge si > 0) · Score d'usage (% + barre) · "Ouvrir panel →".

**Calcul score d'usage** : combinaison de (jours depuis last login, taux ouverture docs, taux paiement à temps). Cible 60% pour vert.

---

### Vue 11 — Admin · Panel par client (`/admin/espace-client/[project_id]`)

**Layout** : `AdminShell` + header client (avatar 52px + nom + badge "Portail actif" + URL portail mono + boutons "Voir le portail" / "Désactiver" en danger).

**6 onglets** : Overview · Documents · Factures · Signatures · Activité · Analytics. Badge amber sur Signatures si pending.

**Tab Overview** :
- 3 InfoCards : Statut portail (Actif, green) · Dernière connexion · Phase actuelle
- 2-col cards : "Informations portail" (URL slug, couleur primaire, activé le/par, démo pré-rempli) + "Bidirectionnalité — sync" (projet CRM lié, étapes visibles, conflits, dernière update)

**Tab Factures** :
- Header avec bouton "Créer une facture" primary
- Layout 1.4fr + 1fr : table à gauche, **Sheet création inline à droite** (toujours visible)
- Sheet : N° auto-incrémenté · LineRow editor (description + qté + PU + total auto) · Bouton "Ajouter une ligne" dashed · Totaux (HT / TVA 0% / TTC) · Date échéance + bouton "Échéances multiples" · Textarea notes internes · Boutons "Brouillon" / "Envoyer au client"

**Tab Analytics** :
- 4 KPI : Jours depuis dernière connexion · Total connexions · Documents téléchargés · Délai paiement moyen
- 2 cards : "Engagement hebdomadaire" (bar chart 6 colonnes, dernier en gradient avec glow) + "Factures payées" (big ratio 2/3 + progress bar + liste détaillée)

**Tabs Documents/Signatures/Activité** (non démontrés dans le mockup) : suivent le même pattern de table + bouton "Uploader/Envoyer" + Sheet de création. Voir PRD §3 pour le détail.

---

### Vue 12 — Onboarding wizard (`/espace-client?onboarding=1`)

**Format** : modal overlay shadcn `Dialog`. Backdrop `rgba(24,24,27,0.55)` + `blur(4px)`. Modal max-width 600px, radius 18px, ombre profonde.

**Structure 3 étapes** :
1. **"Bienvenue"** — eyebrow + H2 gradient + sous-titre + 4 mini-cartes (Dashboard / Projet / Documents / Factures) avec icône Lucide dans bulle violet subtle
2. **"Payez en 1 clic"** — mock simplifié d'une ligne facture + flèche SVG dashed pointant vers le bouton "Payer"
3. **"Signez facilement"** — mock card signature highlight violet + flèche vers "Signer maintenant" + CTA "C'est parti !" avec animation `ps-fab-pulse` (subtle box-shadow pulse 2s loop)

**Footer modal** : dots de progression (current = pill élargi 24px) + bouton "Précédent" ghost (sauf step 1) + bouton primary "Suivant" / "C'est parti !".

**Skip** : bouton X rond 32px en haut à droite, fond `--ps-bg-subtle`. Déclenche `localStorage.onboarding_done = true` + ferme.

**Backend** : flag `users.onboarding_done`. Si false ET dernière connexion < 7 jours → afficher au mount du dashboard.

---

## State management

### Zustand slices (existing)
Ajouter un slice `portalSlice.ts` :
```ts
interface PortalSlice {
  activeTab: PortalTab;
  setActiveTab: (tab: PortalTab) => void;
  invoiceDetailOpen: string | null;
  signatureDetailOpen: string | null;
  onboardingOpen: boolean;
  dismissOnboarding: () => void;
}
```

### TanStack Query hooks
```ts
usePortalInvoices(clientId)        // GET portal_invoices WHERE client_id
usePortalDocuments(clientId, filter) // GET portal_documents WHERE client_id AND visible_to_client
usePortalSignatures(clientId)
usePortalProjectSteps(projectId)
useQualificationLead(leadId)
```

### Realtime
S'abonner aux canaux Supabase realtime pour :
- `portal_invoices` updates (statut paid)
- `portal_signatures` updates (statut signed)
- `portal_documents` inserts (nouveau livrable)
→ Toast notification + invalidation TanStack Query.

---

## Edge Functions à brancher

Toutes existent dans le PRD §3.4 :
- `portal-submit-qualification` — POST formulaire qualif → crée lead + user + envoie email Brevo
- `portal-create-payment-link` — Stripe Payment Link pour une facture
- `portal-stripe-webhook` — webhook idempotent (table `portal_stripe_webhook_events.event_id UNIQUE`)
- `portal-docuseal-send` — envoyer document à signer
- `portal-docuseal-webhook` — webhook idempotent
- `portal-generate-invoice-pdf` — PDF FR-conforme (Edge Function avec puppeteer ou jsPDF)
- `portal-send-transactional-email` — wrapper Brevo
- `portal-export-invoices` — CSV/XLSX UTF-8 BOM
- `portal-daily-cron` — overdue marking, reminders, expirations

---

## Sécurité — Row Level Security

**0 fuite tolérée.** Suite Vitest dédiée obligatoire avant pilote (PRD §3.3).

Patterns clés :
```sql
-- Client peut lire SES factures
CREATE POLICY "portal_invoices_client_read" ON portal_invoices FOR SELECT USING (
  client_id IN (
    SELECT portal_linked_client_id FROM users
    WHERE auth_user_id = auth.uid() AND portal_enabled = true
  )
);

-- Admin a accès total
CREATE POLICY "portal_invoices_admin_full" ON portal_invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
);
```

Tests obligatoires : "Client A ne peut PAS lire les données de Client B" pour chaque table `portal_*`.

---

## Responsive

**Mobile-first 375px baseline** — actuellement les mockups sont desktop. À adapter :
- Sidebar persistante dashboard (vue 2) → cartes empilées sous le greeting
- Tabs desktop horizontales → bottom nav fixe 4 onglets primaires + sheet "Plus" pour Signatures/Aide
- Tables → cartes empilées
- Sheets → bottom sheets (shadcn `Sheet` side="bottom")
- FAB position 80px from bottom (clear of nav)
- Touch targets ≥ 44px partout

Voir `upstream-ref/PortalTabBar.tsx` qui gère déjà mobile vs desktop variant.

---

## Assets

- **Logo** : aucun SVG wordmark fourni — utiliser actuellement le pill gradient violet avec icône `Sparkles` + texte "Propul'SEO". Demander à Lyes le SVG officiel avant la mise en prod.
- **Fonts** : Inter via Google Fonts CDN. Pour offline → self-host depuis [rsms.me/inter](https://rsms.me/inter/).
- **Icons** : `lucide-react` (déjà dans `package.json`).
- **Images** : aucune photo/illustration dans le portail (volontaire — "operational, not editorial" per PRD).

---

## Plan d'attaque recommandé

Suivre le plan validé en Phases 1–8 (cf `Propulspace/PHASE_1_PLAN_VALIDATED.md`). Pour le frontend :

1. **Phase 4 (J21-J28)** — Module admin : ajouter sidebar nav item "Portails clients", construire Vue 10 (overview) + Vue 11 (panel) + Vue 9 (leads) déjà dans le scope du CRM
2. **Phase 5 (J29-J38)** — Client-facing : layout `PortalLayout` est déjà fait → construire les 5 tabs (vues 2, 4, 5, 6, 7) + Vue 8 (aide), wizard Vue 12, sticky contact FAB
3. **Phase 6 (J39-J43)** — Onboarding form pré-rempli (Vue 3 sera côté public ou portail privé selon Phase 0 vs Phase 6)

---

## Questions à clarifier avec Lyes / Etienne

- Wordmark SVG officiel
- Cible mobile (responsive prioritaire ou plus tard ?)
- Vue 11 — détailler les 3 onglets Documents/Signatures/Activité (pas dans le mockup)
- Stripe : 1 compte Propul'SEO ou par client ? PRD dit 1 compte avec Etienne comme représentant légal
- DocuSeal : templates pré-créés ou template par signature ?
- Vue 9 — colonnes additionnelles voulues (`utm_source`, `pappers_enrichment`) ?

---

## Liens utiles

- Repo CRM : https://github.com/Propul-Seo/CRM-Propul-seo-v2
- PRD : `docs/PRD_PROPULSPACE_v2_EN.md`
- Plan Phase 1 validé : `Propulspace/PHASE_1_PLAN_VALIDATED.md`
- Module cible : `src/modules/EspaceClient/`
- Tokens upstream : `src/modules/EspaceClient/shared/layouts/portal-theme.css`

Bonne implémentation 🚀
