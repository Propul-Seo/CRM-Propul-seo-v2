# Design Spec — next-public : Pages publiques clients

**Date :** 2026-04-11  
**Statut :** Approuvé  
**Sous-domaine :** `suivi.propulseo.fr`

---

## Contexte

Le CRM Propulseo (React 18 + Vite SPA) héberge actuellement 3 pages publiques clients dans son bundle :
- `/brief-invite/[token]` — formulaire d'invitation brief (Dark Premium design)
- `/brief/[token]` — formulaire brief client
- `/portal/[token]` — portail client (avancement, factures, checklist)

**Objectif :** Isoler ces pages dans un mini-projet Next.js (`next-public/`) déployé séparément sur Vercel sous `suivi.propulseo.fr`. Le CRM Vite reste inchangé.

---

## Architecture

### Structure des dossiers

```
next-public/
├── app/
│   ├── layout.tsx                    # Layout racine (fonts Inter, metadata globale)
│   ├── brief-invite/[code]/
│   │   ├── page.tsx                  # Server Component — fetch invitation par short_code
│   │   └── BriefInviteForm.tsx       # Client Component — formulaire interactif
│   ├── brief/[code]/
│   │   ├── page.tsx                  # Server Component — fetch brief par short_code
│   │   └── BriefForm.tsx             # Client Component — formulaire / récap lecture seule
│   └── portal/[code]/
│       ├── page.tsx                  # Server Component — fetch données portail
│       └── PortalView.tsx            # Client Component — vue interactive
├── lib/
│   ├── supabase-server.ts            # Client Supabase SSR (anon key)
│   └── utils.ts                      # cn(), formatDate(), generateShortCode()
├── components/
│   ├── Orb.tsx                       # Orbe décoratif Dark Premium
│   ├── Logo.tsx                      # Logo Propulseo
│   ├── PageShell.tsx                 # Fond #0a0118 + overscroll + overflow-x hidden
│   └── GlassCard.tsx                 # Carte glassmorphism
├── .env.local                        # SUPABASE_URL + SUPABASE_ANON_KEY
├── package.json
├── next.config.ts
└── tailwind.config.ts
```

### Flux de données

1. `page.tsx` (Server Component) → fetch Supabase avec `short_code` → valide état (soumis ? expiré ?)
2. Si invalide/expiré → render page d'erreur statique
3. Si valide → passe `data` en props au Client Component
4. Client Component gère l'état local + soumission vers Edge Function Supabase
5. Aucune clé Supabase n'est exposée au navigateur

---

## Pages individuelles

### `/brief-invite/[code]`
- **Validation SSR :** `short_code` existe + `submitted_at IS NULL`
- Si déjà soumis → page "Formulaire déjà complété, merci !"
- Si code invalide → page 404 élégante
- **Soumission :** appel Edge Function `create-project-from-brief` → `submitted_at = now()`
- **Usage unique garanti** côté DB

### `/brief/[code]`
- Même logique que brief-invite
- Si déjà soumis → affiche récap en lecture seule du brief envoyé
- Soumission → `submitted_at = now()`

### `/portal/[code]`
- **Pas d'usage unique** — consultation multiple autorisée
- **Expiration :** colonne `expires_at`, vérifiée côté SSR
- Durée par défaut : 90 jours après génération (configurable dans le CRM)
- Si expiré → "Ce lien a expiré, contactez votre chargé de projet"

---

## Sécurité & Short Codes

### Remplacement des UUID
Les UUID (ex: `02dfd2e1-9372-461f-b7f9-cbeb73789869`) sont remplacés par des **codes courts 8 caractères** alphanum lisibles.

```ts
// Alphabet sans caractères ambigus (0/O/I/l exclus)
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generateShortCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => CHARS[b % CHARS.length])
    .join('')
}
// Exemple : X3K7MQZR → suivi.propulseo.fr/brief-invite/X3K7MQZR
```

Les anciens UUID restent valides en fallback (colonne séparée, pas de suppression).

### Migrations Supabase

```sql
-- brief_invitations : short_code + usage unique
ALTER TABLE brief_invitations
  ADD COLUMN short_code TEXT UNIQUE,
  ADD COLUMN submitted_at TIMESTAMPTZ;

-- projects_v2 (portal) : short_code + expiration
ALTER TABLE projects_v2
  ADD COLUMN portal_short_code TEXT UNIQUE,
  ADD COLUMN portal_expires_at TIMESTAMPTZ;

-- briefs_v2 : short_code + usage unique
ALTER TABLE briefs_v2
  ADD COLUMN short_code TEXT UNIQUE,
  ADD COLUMN submitted_at TIMESTAMPTZ;
```

---

## Déploiement Vercel

### Configuration projet
- **Repo :** même repo que le CRM (monorepo)
- **Nouveau projet Vercel :** `propulseo-public`
- **Root Directory :** `next-public`
- **Framework :** Next.js (auto-détecté)
- **Env vars :** `SUPABASE_URL`, `SUPABASE_ANON_KEY` (sans préfixe `VITE_`)

### DNS — chez le registrar
```
CNAME  suivi  cname.vercel-dns.com
```

### Relation avec le CRM
- Le CRM Vite (`crm-v2`) reste **inchangé** — ses routes `/brief-invite/`, `/brief/`, `/portal/` continuent de fonctionner pendant la migration
- Une fois `next-public` en production, les nouveaux liens générés pointent vers `suivi.propulseo.fr`
- Les anciens liens UUID restent actifs sur le CRM Vite

---

## SEO & Metadata

```ts
export async function generateMetadata({ params }) {
  const data = await fetchData(params.code)
  return {
    title: `Brief projet — ${data?.client_name ?? 'Propulseo'}`,
    description: 'Complétez votre brief projet en quelques minutes.',
    robots: 'noindex, nofollow', // pages privées — pas d'indexation
  }
}
```

Toutes les pages sont `noindex` — ce sont des liens privés.

---

## Design

- **Identique au CRM** : Dark Premium (`#0a0118`, orbes, glassmorphism, shimmer)
- Composants extraits dans `next-public/components/` — pas de dépendance partagée avec le CRM
- Police : Inter via `next/font` (optimisé natif)
- Tailwind CSS avec config copiée depuis le CRM

---

## Ce qui n'est PAS dans ce projet

- Pas d'auth utilisateur (pages publiques only)
- Pas de dashboard admin
- Pas de pages marketing/SEO
- Pas de i18n
