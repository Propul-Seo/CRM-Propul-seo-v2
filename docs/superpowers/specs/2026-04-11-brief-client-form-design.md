# Spec — Formulaire Brief Client (lien à distance)

**Date :** 2026-04-11  
**Statut :** Approuvé  
**Scope :** Envoi d'un formulaire de brief au lead via un lien unique, remplissage côté client, retour automatique dans le CRM.

---

## Contexte

Le composant `ProjectBrief.tsx` (`src/modules/ProjectDetailsV2/components/ProjectBrief.tsx`) permet à l'équipe Propulseo de saisir le brief d'un projet. Actuellement les données sont en mock (`MOCK_BRIEFS`). La persistance Supabase était prévue pour le Sprint 2.

L'objectif de cette feature est de permettre d'envoyer un **lien de formulaire** au lead pour qu'il remplisse lui-même le brief. Même mécanique que le portail client existant (`portal_token` → `/portal/:token`).

---

## Architecture

```
[ProjectBrief.tsx — CRM]
  → bouton "Partager le formulaire"
  → génère brief_token (UUID) sur le projet
  → URL : /brief/{token}
  → copier dans le presse-papier

[/brief/:token — page publique, sans auth]
  → formulaire 6 champs
  → soumission → INSERT dans project_briefs (Supabase)
  → page de confirmation (lecture seule)

[ProjectBrief.tsx — CRM]
  → lit project_briefs depuis Supabase
  → badge "Brief reçu le XX/XX"
  → champs en lecture seule après soumission
```

---

## Schéma Supabase

### Table `project_briefs`

```sql
CREATE TABLE project_briefs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  objective        text,
  target_audience  text,
  pages            text,
  techno           text,
  design_references text,
  notes            text,
  status           text NOT NULL DEFAULT 'draft',
  -- draft | submitted | validated | frozen
  submitted_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- RLS : lecture publique via token (join projects), écriture publique via token
-- Mise à jour par l'équipe CRM authentifiée uniquement
```

### Colonnes sur `projects`

```sql
ALTER TABLE projects
  ADD COLUMN brief_token         uuid UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN brief_token_enabled boolean NOT NULL DEFAULT false;
```

---

## Composants

### `ShareBriefButton.tsx` (nouveau)
`src/modules/ProjectDetailsV2/components/ShareBriefButton.tsx`

Pattern identique à `SharePortalButton.tsx` :
- Bouton "Partager le formulaire" → active `brief_token_enabled = true`
- État actif : bouton "Copier le lien" + bouton révoquer
- URL : `${window.location.origin}/brief/${project.brief_token}`

### `ClientBriefPage.tsx` (nouveau)
`src/modules/ClientBrief/ClientBriefPage.tsx`

Page publique, style clair (fond blanc, pas de dark mode), sans auth.

**Comportement :**
1. Charger le nom du projet via une Edge Function `get-brief-form` (valide le token, retourne uniquement `project.name` + brief existant si soumis)
2. Si token invalide/désactivé → page d'erreur ("Ce lien est invalide ou a été désactivé.")
3. Si brief déjà soumis → afficher les réponses en lecture seule + message "Brief déjà transmis le XX/XX"
4. Sinon → formulaire avec les 6 champs

**Champs :**
| Clé | Label | Obligatoire |
|-----|-------|-------------|
| `objective` | Objectif du projet | Oui |
| `target_audience` | Cible / utilisateurs | Non |
| `pages` | Pages / Fonctionnalités attendues | Non |
| `techno` | Technologie / stack | Non |
| `design_references` | Références design (URLs, inspirations) | Non |
| `notes` | Notes complémentaires | Non |

**Validation :** `objective` non vide. Message d'erreur inline si absent.

**Soumission :** `UPSERT` dans `project_briefs` + `submitted_at = now()` + `status = 'submitted'`. Puis page de confirmation statique.

**Confirmation :** 
> "Merci ! Votre brief a bien été transmis à l'équipe Propul'SEO. Nous reviendrons vers vous rapidement."

### `ProjectBrief.tsx` (modifié)
`src/modules/ProjectDetailsV2/components/ProjectBrief.tsx`

- Données lues depuis Supabase via `useBriefV2` (supprimer le mock)
- Après soumission client : champs en lecture seule + badge "Brief reçu le XX/XX"
- Bouton "Modifier quand même" pour repasser en édition (status → `draft`)
- Intégration de `ShareBriefButton` dans le header du composant

### `useBriefV2.ts` (modifié)
`src/modules/ProjectsManagerV2/hooks/useBriefV2.ts`

- `fetchBrief(projectId)` → SELECT depuis `project_briefs`
- `saveBrief(projectId, fields)` → UPSERT
- `enableBriefToken(projectId)` / `disableBriefToken(projectId)` → UPDATE `projects`

---

## Route

Dans `App.tsx` (ou le routeur) :

```tsx
<Route path="/brief/:token" element={<ClientBriefPage />} />
```

Route publique, sans vérification d'auth, avant les routes protégées. Même pattern que `/portal/:token`.

---

## Sécurité

- `brief_token_enabled = false` → formulaire inaccessible même avec le token
- RLS Supabase : la page publique lit `projects` et écrit `project_briefs` via une Edge Function dédiée (`submit-brief`) qui valide le token côté serveur — pas d'accès direct à Supabase depuis la page publique
- Le lead ne voit jamais d'autres données projet que le nom du projet et les champs du brief

---

## Ce qui est hors scope

- Envoi par email automatique (phase 2, après cette feature)
- Notifications temps réel dans le CRM quand le brief est soumis (phase 2)
- Champs personnalisables selon le type de projet (phase 3)
