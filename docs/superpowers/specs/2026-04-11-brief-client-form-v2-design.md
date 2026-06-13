# Design Spec — Formulaire Brief Client V2 (Glassmorphism)

**Date :** 2026-04-11  
**Fichier cible :** `src/modules/ClientBrief/ClientBriefPage.tsx`

---

## Vue d'ensemble

Refonte complète de l'UI/UX du formulaire public `/brief/:token`. On conserve la logique métier existante (hook `useBriefByToken`, 6 champs, validation, soumission) et on remplace uniquement la couche visuelle et les interactions.

**Principe directeur :** Glassmorphism sur fond dégradé — cards translucides avec backdrop-blur, progression visuelle, animations en cascade, écran de confirmation avec récapitulatif.

---

## 1. Structure générale

Page unique (pas de wizard multi-étapes). Tous les champs sont visibles simultanément. La progression est indiquée par un compteur et des badges.

```
┌─────────────────────────────┐
│ Header sticky (logo + titre)│
├─────────────────────────────┤
│ Barre progression (6 segs)  │
├─────────────────────────────┤
│ Hero (titre projet + desc)  │
├─────────────────────────────┤
│ Card champ 1                │
│ Card champ 2                │
│ Card champ 3                │
│ Card champ 4                │
│ Card champ 5                │
│ Card champ 6                │
├─────────────────────────────┤
│ Bouton Envoyer              │
├─────────────────────────────┤
│ Footer                      │
└─────────────────────────────┘
```

---

## 2. Fond de page

```css
background: linear-gradient(160deg, #ede9fe 0%, #f0f9ff 50%, #fdf4ff 100%);
min-height: 100vh;
```

Fond fixe, non-scrollable (reste en place derrière le contenu).

---

## 3. Header

- **Position :** sticky top-0, z-index élevé
- **Background :** `rgba(255,255,255,0.75)` + `backdrop-filter: blur(16px)`
- **Bordure basse :** `1px solid rgba(255,255,255,0.9)`
- **Hauteur :** 60px
- **Contenu gauche :** logo image Propul'SEO (`w-8 h-8`) + nom `Propul'SEO` en dégradé `from-indigo-500 to-purple-500` (gradient text)
- **Contenu droite :** nom du projet (`data.projectName`), tronqué si trop long

**Logo URL :**  
`https://lh3.googleusercontent.com/pw/AP1GczN1Fx4MCRF05ZyLZ8eE7yq6l3O04S9H5NUlRQng3NGehC4bVTl4SA0EdX8yJ4cEgMGjbPkELigm1WxcMBR8QCh4QSMgDVikjqv8mizSPn2r-zv-pKbMK10JVMTK4Fo1kd4VUXASX_owtWiT6X6cRao=w590-h423-s-no-gm?authuser=0`

---

## 4. Barre de progression

- 6 segments horizontaux avec gap, border-radius arrondi
- Segment rempli : `background: linear-gradient(to right, #6366f1, #a855f7)`
- Segment partiel (en cours) : même gradient, opacity 35%
- Segment vide : `rgba(99,102,241,0.12)`
- Label sous les segments : `"X / 6 champs remplis"` en violet, mis à jour en temps réel
- Logique : un champ est "rempli" si `value.trim().length > 0`

---

## 5. Hero

- Pas de banner gradient (le fond de page suffit)
- Padding `pt-5 pb-4 px-5`
- `h2` : titre du projet, `text-[22px] font-extrabold text-indigo-950`
- `p` : description fixe, `text-[11px] text-slate-500 leading-relaxed`

---

## 6. Cards de champ

**Style de base :**
```css
background: rgba(255,255,255,0.65);
backdrop-filter: blur(10px);
border: 1.5px solid rgba(255,255,255,0.95);
border-radius: 16px;
padding: 14px 16px;
box-shadow: 0 2px 16px rgba(99,102,241,0.07);
```

**État focus (card entière, pas seulement textarea) :**
```css
border-color: #a5b4fc;
box-shadow: 0 6px 24px rgba(99,102,241,0.18);
background: rgba(255,255,255,0.85);
```

**État rempli :**
```css
border-color: rgba(167,243,208,0.8);
box-shadow: 0 2px 12px rgba(34,197,94,0.08);
```

**Contenu de chaque card :**
- Badge numéro à gauche : `w-6 h-6 rounded-[8px]` dégradé violet, texte blanc, `font-extrabold text-[10px]`
- Quand le champ est rempli : badge devient `✓` avec dégradé vert `from-green-500 to-green-600`
- Label : `text-[11px] font-bold text-purple-900`
- Champ obligatoire : `*` rouge après le label
- Textarea : `text-[11px] text-slate-700 placeholder-slate-400 resize-none focus:outline-none w-full`
- Auto-resize : hauteur calculée dynamiquement via `scrollHeight`

---

## 7. Animations (Framer Motion — déjà installé)

- **Apparition en cascade :** chaque card entre avec `initial={{ opacity:0, y:16 }}` → `animate={{ opacity:1, y:0 }}`, délai de `index * 0.07s`, easing `[0.16,1,0.3,1]`
- **Focus card :** transition CSS `all 0.25s ease` (pas Framer, juste Tailwind transition)
- **Badge numéro → ✓ :** `AnimatePresence` + scale animation lors du passage filled/unfilled

---

## 8. Bouton d'envoi

```css
background: linear-gradient(135deg, #6366f1, #a855f7);
border-radius: 14px;
padding: 14px;
box-shadow: 0 6px 20px rgba(99,102,241,0.38);
```

- Icône send (Lucide `Send`, `w-3.5 h-3.5`)
- État `submitting` : spinner blanc animé + texte "Envoi en cours…"
- État `disabled` : opacity 50%

---

## 9. Footer

```
[logo miniature] Propul'SEO · 🔒 Accès par lien unique
```

- Logo : `w-3.5 h-3.5`, opacity 60%, border-radius 3px
- Texte "Propul'SEO" en `text-indigo-500 font-bold`
- Reste : `text-slate-400 text-[10px]`

---

## 10. Écran de confirmation (Version B — Récap)

Affiché quand `submitted === true` ou `alreadySubmitted === true`.

**Structure :**

```
┌─────────────────────────────┐
│ Header (même que formulaire)│
├─────────────────────────────┤
│ Zone top centrée :          │
│   ✓ badge vert arrondi      │
│   "Brief transmis !"        │
│   "Voici un récapitulatif…" │
├─────────────────────────────┤
│ Label "Vos réponses"        │
│ Card récap champ 1          │
│ Card récap champ 2          │
│ Card récap champ N          │
│ (seulement champs non vides)│
├─────────────────────────────┤
│ Footer                      │
└─────────────────────────────┘
```

**Cards récap :** même style glassmorphism, `border-color: rgba(167,243,208,0.8)` (vert), label en `text-[9px] font-bold text-indigo-500 uppercase tracking-wide`, valeur en `text-[11px] text-slate-700 whitespace-pre-wrap`.

**Cas `alreadySubmitted` (brief déjà soumis avant cette session) :** titre "Brief déjà transmis" + date de soumission + mêmes cards récap.

**Animation d'entrée :** `motion.div` avec `initial={{ opacity:0, scale:0.95 }}` → `animate={{ opacity:1, scale:1 }}`, duration 0.4s.

---

## 11. États de chargement & erreur

Inchangés fonctionnellement, à restyler dans le même thème glassmorphism :
- **Loading :** spinner indigo centré sur fond dégradé
- **Erreur / lien invalide :** icône `AlertCircle` rouge, texte `text-slate-700`, fond dégradé

---

## 12. Notifications email

### Comportement

À chaque soumission de brief (via `submitBrief`), une Supabase Edge Function est appelée côté serveur pour envoyer un email de notification.

**Destinataires :**
- `lyestriki@gmail.com` — toujours notifié (adresse fixe hardcodée dans la Edge Function)
- Liste d'emails supplémentaires — stockée en base, configurable depuis le DashboardV2

**Contenu de l'email :**
- Sujet : `[Brief] Nouveau brief reçu — {projectName}`
- Corps : récapitulatif HTML des champs remplis (nom du projet, chaque champ non vide avec son label)
- Expéditeur : `no-reply@propulseo.fr` via Resend

### Service d'envoi : Resend

- Edge Function `send-brief-notification` (nouvelle) appelée par `useBriefByToken` après soumission réussie
- Clé API Resend stockée dans les secrets Supabase : `RESEND_API_KEY`
- SDK : `fetch` natif vers `https://api.resend.com/emails` (pas de package npm)

### Stockage des emails supplémentaires

Nouvelle table Supabase : `notification_emails`

```sql
create table notification_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  label text,                    -- nom affiché (optionnel)
  active boolean default true,
  created_at timestamptz default now()
);
```

RLS : accessible uniquement aux admins (`is_admin()`).

### UI — Modale paramètres DashboardV2

- Déclencheur : bouton icône ⚙️ dans le header du DashboardV2 (à droite)
- Composant : `BriefNotificationsModal.tsx` dans `src/modules/DashboardV2/components/`
- Contenu :
  - Titre "Notifications brief"
  - Ligne fixe non-supprimable : `lyestriki@gmail.com` avec badge "Adresse principale"
  - Liste des emails supplémentaires : chaque ligne avec email, label optionnel, toggle actif/inactif, bouton supprimer
  - Formulaire d'ajout : input email + input label + bouton "Ajouter"
- Hook : `useNotificationEmails.ts` — CRUD sur la table `notification_emails`

---

## 13. Dépendances

| Librairie | Usage | Statut |
|-----------|-------|--------|
| `framer-motion` | Animations en cascade, AnimatePresence | Déjà installé |
| `lucide-react` | Icône Send, AlertCircle, CheckCircle2 | Déjà installé |
| Tailwind CSS | Classes utilitaires | Déjà installé |
| Resend | Envoi email via Edge Function | Nouveau (clé API requise) |

---

## 14. Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `src/modules/ClientBrief/ClientBriefPage.tsx` | Réécriture complète de la couche UI |
| `supabase/functions/send-brief-notification/index.ts` | Nouvelle Edge Function Resend |
| `supabase/migrations/XXXXXX_notification_emails.sql` | Nouvelle table + RLS |
| `src/modules/DashboardV2/components/BriefNotificationsModal.tsx` | Nouvelle modale paramètres |
| `src/modules/DashboardV2/hooks/useNotificationEmails.ts` | Hook CRUD emails |
| `src/modules/DashboardV2/index.tsx` | Ajout bouton ⚙️ + modale dans le header |
| `src/modules/ProjectsManagerV2/hooks/useBriefV2.ts` | Appel Edge Function après submitBrief |

La logique métier du formulaire (hook, state, validation) reste identique — seul le JSX/CSS change.
