# Spec — Aperçu client admin (lecture seule) + interactions des cartes portail

**Date :** 2026-06-09
**Branche :** `feat/propulspace-portail-v2`
**Statut :** design validé (à implémenter)

## Contexte & objectif

Deux améliorations indépendantes du back-office admin du portail (Espace Client), livrables l'une après l'autre :

- **Chantier A — interactions des cartes** (factures / signatures / documents) : rendre la carte entière cliquable pour ouvrir l'aperçu, retirer les icônes d'aperçu dédiées (œil / loupe), et compacter les cartes de factures qui prennent trop de place.
- **Chantier B — « Voir comme le client »** : un bouton admin, dans le header du cockpit, qui ouvre le **vrai portail** de n'importe quel client en **lecture seule**, sans avoir à se connecter sur le compte du client.

Les deux sont **100 % front** (aucune migration DB).

---

## Chantier A — interactions des cartes

### Pattern commun « carte cliquable → aperçu »

Appliqué aux 3 onglets de façon identique :

1. La **zone d'info** de la carte devient cliquable (`onClick` → ouvre l'aperçu), accessible au clavier (`role="button"` + `tabIndex={0}` + gestion `Enter`/`Espace`), avec `cursor-pointer` et l'état hover existant.
2. **Tous les boutons d'action existants sont conservés** mais reçoivent `e.stopPropagation()` dans leur `onClick` pour ne pas déclencher l'aperçu.
3. On **retire l'icône d'aperçu dédiée** devenue redondante (œil sur factures, loupe sur documents).

### Détail par onglet

| Onglet | Fichier | Clic carte ouvre | Icône retirée | Actions conservées (`stopPropagation`) |
|---|---|---|---|---|
| Factures | `admin/components/InvoiceCard.tsx` | `onPreview()` → `InvoicePreviewDialog` (aperçu formaté, comportement actuel de l'œil) | `Eye` (preview) | PDF (`onPdf`), éditer, supprimer, relancer, annuler, envoyer |
| Signatures | `admin/components/SignaturesTab.tsx` | aperçu `FilePreviewDialog` : signée → `docuseal_signed_pdf_url` ; non signée → ouvre `docuseal_signing_url` (page DocuSeal) | — (pas d'œil dédié) | « PDF signé » (download), relancer, annuler |
| Documents | `admin/components/DocumentsTab.tsx` | `setPreview(doc)` → `FilePreviewDialog` | `Eye` (loupe preview) | download, visibilité client, éditer, supprimer |

### Compactage des cartes de factures

Sur `InvoiceCard.tsx` uniquement : réduire l'encombrement vertical d'environ moitié.
- Conteneur `p-5` → `p-3` (ou `p-3.5`).
- Regrouper **montant + statut sur une seule ligne**, métadonnées (échéances, dates) resserrées dessous.
- Boutons d'action en icônes plus petites, sur la même ligne que le titre si possible.
- Conserver lisibilité et hiérarchie ; pas de perte d'information, juste de la densité.

### Vérification A

Type-check + build, puis vérification visuelle/comportementale (par l'utilisateur, navigateur) :
clic sur la carte = aperçu ; clic sur une action ≠ aperçu ; cartes de factures nettement plus compactes.

---

## Chantier B — « Voir comme le client » (lecture seule)

### Décision clé : aucune migration RLS

La RLS du portail **autorise déjà l'admin à lire tous les projets** :
- 6 tables `propulspace.*` (`project_steps`, `documents`, `invoices`, `invoice_installments`, `signatures`, `onboarding_responses`) : policy `ps_*_admin_all` **`FOR ALL`** `USING (propulspace.is_admin())` — migration 070.
- `public.project_activities_v2` : policy `activities_v2_team_all` **`FOR ALL`** `USING (public.is_team_member())` ; la vue portail `propulspace_activities_v2` filtre déjà `visible_to_client = true` — migration 297.
- `public.projects_v2` : déjà lisible par l'équipe/admin (le cockpit liste tous les projets).

Les vues `public.propulspace_*_v2` sont en `security_invoker = true` (migration 130) : elles appliquent la RLS de la table sous-jacente dans le contexte de l'utilisateur courant. Un **admin** les requêtant passe par les policies `*_admin_all` / `team_all` → il voit **tout**.

**Conséquence (le vrai travail) :** la RLS admin étant permissive (tous les projets), les requêtes du portail — qui aujourd'hui ne filtrent pas par `project_id` et comptent sur la RLS client pour scoper à un seul projet — doivent en mode admin **filtrer explicitement** par le `project_id` cible **et répliquer les prédicats de visibilité client** (sinon l'aperçu montrerait d'autres projets et/ou des données non visibles du client).

### Architecture (3 briques, toutes front)

#### Brique 1 — Couche data du portail rendue explicite

Dans `client/hooks/usePortalData.ts`, ajouter à chaque requête de liste un filtre explicite par `project.id` (issu du `PortalContext`) **+ les prédicats de parité client**. Ces filtres sont :
- **redondants mais sans effet** pour un vrai client (la RLS scope déjà au même projet) ;
- **nécessaires** pour l'aperçu admin (la RLS ne scope pas).

Donc **aucune branche `previewMode` dans la couche data** : les hooks filtrent toujours par `context.project.id`, ce qui les rend corrects dans les deux cas (défense en profondeur pour les vrais clients en bonus).

| Hook | Vue | Filtres à appliquer |
|---|---|---|
| `usePortalInvoices` | `propulspace_invoices_v2` | `.eq('project_id', pid).neq('status','draft')` |
| échéances (requête sur `propulspace_invoice_installments_v2`) | `propulspace_invoice_installments_v2` | scoper aux échéances des factures non-draft du projet (`.in('invoice_id', <ids des factures du projet>)`) — nom de hook exact à confirmer au plan |
| `usePortalDocuments` | `propulspace_documents_v2` | `.eq('project_id', pid).eq('visible_to_client', true).is('deleted_at', null)` |
| `usePortalSignatures` | `propulspace_signatures_v2` | `.eq('project_id', pid)` |
| `usePortalProjectSteps` | `propulspace_project_steps_v2` | `.eq('project_id', pid).eq('visible_to_client', true)` |
| `usePortalProjectActivities` | `propulspace_activities_v2` | `.eq('project_id', pid)` (la vue filtre déjà `visible_to_client`) |
| `usePortalProjectDetails` | `projects_v2` | déjà `.eq('id', project.id)` — inchangé |

`pid = project.id` du `PortalContext`.

#### Brique 2 — Provider d'aperçu + résolution du projet cible

- `PortalContext` (`shared/context/PortalContext.tsx`) gagne un champ `previewMode: boolean` (défaut `false`), exposé via `usePortal()`.
- Le flux client réel (`usePortalAuth` → `PortalGuard` → `PortalProvider`) reste **inchangé** (`previewMode: false`).
- Nouveau provider **`AdminPortalPreviewProvider`** (sous `admin/`) : prend le `projectId` de la route, charge `projects_v2` par id (route déjà gardée admin → accès OK), et fournit le `PortalContext` avec `{ email: <portal_client_email du projet>, project, previewMode: true, signOut: <retour cockpit> }`.

#### Brique 3 — Route, garde, bouton, lecture seule

- **Route** : `/portails/clients/:projectId/apercu-client/*`, **gardée admin** (`usePropulspaceAdmin` / `PropulspaceAdminGuard`), qui monte `AdminPortalPreviewProvider` + le `PortalShell` + les pages client réutilisées (`DashboardPage`, `ProjectPage`, `DocumentsPage`, `InvoicesPage`, `SignaturesPage`, `ProfilePage`).
  - `PortalShell` doit naviguer via un **`basePath` configurable** (défaut `/espace-client`, l'aperçu utilise la base admin) ou des liens relatifs, pour que la nav interne du portail fonctionne sous la route admin.
- **Bandeau d'aperçu** : barre fixe en haut « Mode aperçu — portail de *[nom client]* », visible quand `previewMode`, avec un bouton « Retour au cockpit ».
- **Lecture seule** (gating piloté par `previewMode`) — masquer/désactiver les actions d'écriture du portail :
  - `InvoicesPage.tsx:50-62` — bouton de paiement Stripe (`portal-create-checkout-session`).
  - `ProfilePage.tsx:32-46` — mise à jour profil + changement de mot de passe.
  - CTA de signature (ouverture DocuSeal `docuseal_signing_url`) côté `SignaturesPage`.
  - Tout bouton d'upload de document s'il est exposé côté page.
- **Bouton « Voir comme le client »** dans `admin/components/cockpit/CockpitClientHeader.tsx` (zone actions/KPI), qui navigue vers `…/apercu-client` pour le `projectId` courant (`useParams`).

### Data flow

```
Admin loggé (rôle admin/manager)
  └─ clic « Voir comme le client » (CockpitClientHeader, projectId courant)
     └─ route /portails/clients/:projectId/apercu-client  [garde admin]
        └─ AdminPortalPreviewProvider : charge projects_v2 by id → PortalContext{ project, previewMode:true }
           └─ PortalShell (basePath admin) → pages client réutilisées
              └─ usePortalData : filtre .eq('project_id', pid) + prédicats parité
                 └─ vues propulspace_*_v2 (security_invoker) → RLS admin (is_admin / team_all) → données du projet cible
                    └─ rendu identique au portail client, en lecture seule (writes masqués), bandeau d'aperçu
```

### Cas limites / erreurs

- **Non-admin** atteignant la route → redirigé par la garde admin.
- **`projectId` inexistant / sans portail** → page « projet introuvable » (état géré par le provider).
- **Écritures** : neutralisées par `previewMode` côté UI ; en défense, aucune requête d'écriture n'est émise par l'aperçu.

### Vérification B

- Type-check + build.
- Par l'utilisateur (navigateur) : admin → bouton → portail du client X s'affiche à l'identique ; bandeau d'aperçu présent ; navigation interne du portail OK ; aucune action d'écriture disponible ; route inaccessible en non-admin ; **aucune fuite d'un autre projet** (vérifier 2 clients différents).

---

## Découpage & ordre de livraison

Tranches verticales, livrées et validées dans l'ordre :

1. **Phase A** — interactions des 3 cartes + compactage factures (sans risque, feedback immédiat).
2. **Phase B1** — couche data explicite (`usePortalData` : filtres `project_id` + parité) + `previewMode` dans `PortalContext`.
3. **Phase B2** — `AdminPortalPreviewProvider` + route admin + `PortalShell` `basePath` + bandeau d'aperçu.
4. **Phase B3** — gating lecture seule (masquage des actions d'écriture) + bouton dans le header du cockpit.

Critère de passage à la phase suivante : type-check + build verts, et la vérif comportementale de la phase précédente OK.

## Risques & non-objectifs (YAGNI)

- **Non-objectif** : aucune impersonation auth réelle, aucun lien magique, aucune écriture « au nom du client ». Strictement lecture seule.
- **Non-objectif** : pas de migration RLS (l'accès admin existe déjà).
- **Risque routing** : la réutilisation des pages client sous une base admin impose un `basePath`/liens relatifs propres dans `PortalShell` — point d'intégration à traiter en phase B2.
- **Risque parité** : si un nouveau hook portail oublie le filtre `project_id`, l'aperçu admin pourrait mélanger des projets → la couche data (brique 1) centralise ce filtre par `context.project.id` pour éviter ça.
