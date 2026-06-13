# Spec — Génération PDF du Brief Client

**Date :** 2026-04-11  
**Statut :** Approuvé  
**Scope :** Génération client-side de deux PDFs depuis l'onglet Brief (CRM uniquement) : formulaire vierge à envoyer au client + récapitulatif des réponses reçues.

---

## Contexte

Le composant `ProjectBrief.tsx` (`src/modules/ProjectDetailsV2/components/ProjectBrief.tsx`) affiche le brief d'un projet. L'équipe Propulseo a besoin de pouvoir :
1. Télécharger un **formulaire vierge** à transmettre manuellement au client (avant ou sans passer par le lien web)
2. Télécharger un **récapitulatif** du brief rempli pour archivage ou partage

---

## Architecture

```
[ProjectBrief.tsx — CRM]
  → bouton "Télécharger le formulaire" (toujours visible)
     → PDFDownloadLink → BriefPDFDocument mode="blank"
     → téléchargement : brief-vierge-{slug-projet}.pdf

  → bouton "Télécharger le récapitulatif" (visible si brief non vide)
     → PDFDownloadLink → BriefPDFDocument mode="filled"
     → téléchargement : brief-recap-{slug-projet}.pdf
```

Génération 100% côté client via `@react-pdf/renderer`. Pas de Edge Function, pas de service tiers.

---

## Composants

### `BriefPDFDocument.tsx` (nouveau)
`src/modules/ProjectDetailsV2/components/BriefPDFDocument.tsx`

Composant React renvoyant un `<Document>` de `@react-pdf/renderer`.

**Props :**
```ts
interface BriefPDFDocumentProps {
  projectName: string
  brief: Partial<ProjectBrief> | null
  mode: 'blank' | 'filled'
  submittedAt?: string | null
}
```

**Layout :**

```
┌─────────────────────────────────────────┐
│  [Header gradient indigo→violet]         │
│  Logo "P" · Propul'SEO                  │
│  Titre : "Formulaire de brief client"   │  ← mode blank
│         ou "Récapitulatif brief client" │  ← mode filled
│  Date : 11/04/2026                      │
├─────────────────────────────────────────┤
│  Nom du projet (bandeau indigo clair)   │
│  [+ "Brief reçu le XX/XX" si filled]   │
├─────────────────────────────────────────┤
│  Section 1 — Objectif du projet (*)     │
│  [rectangle vide | texte réponse]       │
├─────────────────────────────────────────┤
│  Section 2 — Cible / utilisateurs       │
│  [rectangle vide | texte réponse]       │
├─────────────────────────────────────────┤
│  Section 3 — Pages / Fonctionnalités    │
│  [rectangle vide | texte réponse]       │
├─────────────────────────────────────────┤
│  Section 4 — Technologie / stack        │
│  [rectangle vide | texte réponse]       │
├─────────────────────────────────────────┤
│  Section 5 — Références design          │
│  [rectangle vide | texte réponse]       │
├─────────────────────────────────────────┤
│  Section 6 — Notes complémentaires      │
│  [rectangle vide | texte réponse]       │
├─────────────────────────────────────────┤
│  Footer : propulseo-site.com            │
│           contact@propulseo-site.com    │
└─────────────────────────────────────────┘
```

**Style :**
- Header : `background: linear-gradient #6366f1 → #8b5cf6`, texte blanc
- Bandeau projet : `background: #eef2ff`, texte indigo `#4f46e5`
- Sections : fond blanc, bordure `#e5e7eb`, label gris foncé, `*` rouge sur objectif
- Mode `blank` : rectangle vide `height: 48px`, bordure `#d1d5db`
- Mode `filled` : texte de la réponse, ou `"—"` si champ vide
- Footer : fond `#f9fafb`, texte gris clair, centré

**Nom de fichier téléchargé :**
- Blank : `brief-vierge-{slug}.pdf` où `slug = projectName.toLowerCase().replace(/\s+/g, '-')`
- Filled : `brief-recap-{slug}.pdf`

---

### `ProjectBrief.tsx` (modifié)
`src/modules/ProjectDetailsV2/components/ProjectBrief.tsx`

Ajout de deux boutons dans le header (à côté de `ShareBriefButton`), en utilisant `PDFDownloadLink` de `@react-pdf/renderer` :

```tsx
// Toujours visible
<PDFDownloadLink
  document={<BriefPDFDocument projectName={...} brief={brief} mode="blank" />}
  fileName={`brief-vierge-${slug}.pdf`}
>
  {({ loading }) => (
    <button>
      <Download className="h-3.5 w-3.5" />
      {loading ? 'Génération...' : 'Formulaire vierge'}
    </button>
  )}
</PDFDownloadLink>

// Visible seulement si au moins un champ rempli
{hasBriefContent && (
  <PDFDownloadLink
    document={<BriefPDFDocument projectName={...} brief={brief} mode="filled" submittedAt={brief?.submitted_at} />}
    fileName={`brief-recap-${slug}.pdf`}
  >
    {({ loading }) => (
      <button>
        <Download className="h-3.5 w-3.5" />
        {loading ? 'Génération...' : 'Récapitulatif'}
      </button>
    )}
  </PDFDownloadLink>
)}
```

`hasBriefContent` = au moins un champ parmi les 6 est non vide dans `brief`.

---

## Dépendance

```bash
npm install @react-pdf/renderer
```

Types inclus dans le package (`@react-pdf/renderer` exporte ses propres types TypeScript).

---

## Ce qui est hors scope

- Envoi par email depuis le CRM (phase 2, après validation du lien web)
- PDF sur la page publique `/brief/:token` (hors scope phase 1)
- Logo image Propulseo dans le PDF (texte "P" suffisant pour phase 1)
- PDF pour les types de briefs spécialisés (BriefSiteWeb, BriefERP, BriefComm)
