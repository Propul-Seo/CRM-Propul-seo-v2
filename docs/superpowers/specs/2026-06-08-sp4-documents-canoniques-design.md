# SP4 — Documents canoniques (fusion CRM ↔ Propul'Space)

> Tranche SP4 de la Stratégie C. Cadrée 2026-06-08 (workflow multi-agents + revue adversariale).
> Doc archi : `docs/superpowers/2026-06-05-crm-propulspace-fusion-architecture.md`.
> **Parallélisable avec SP1.** Tranche « la plus mûre » : R-008 déjà corrigé (mig. 200/201), vue d'union (254) déjà en place, RPC admin GED déjà en prod (mig. 281). Le portail reste vert à chaque palier.

## 1. Objectif
Rendre `propulspace.documents` la **table canonique** des documents projet, basculer les
écritures CRM (encore sur `project_documents_v2`) vers les RPC `admin_*`, puis supprimer
l'ancien chemin. Au passage : corriger le téléchargement des docs qualif côté portail et donner
à l'admin un **contrôle de visibilité par ligne, directement dans la liste**.

## 2. Périmètre

### Dans SP4
- **Fix portail** : téléchargement des docs qualif (bucket déduit, pas hardcodé).
- **Migration 288** : colonne `storage_bucket` sur `propulspace.documents` + recréation de
  `propulspace_documents_admin_v2` **avec colonne `bucket`** (prérequis bloquant).
- **Front CRM** : écritures (INSERT/DELETE) → RPC `admin_*`, lecture → vue admin, **toggle
  visibilité inline par ligne**, count onglet.
- **Migration 289** : backfill `project_documents_v2` → `propulspace.documents` (idempotent).
- **Migration 290** : DROP de l'ancien chemin (vue 254 + table `project_documents_v2`) — fin de SP4.

### Hors SP4 (reporté)
- Migration **physique** des fichiers de l'ancien bucket `project-documents` (cf. Q7c — on garde l'ancien bucket en lecture seule, routage via `storage_bucket`).
- Tout ce qui touche les jalons / activités / factures (SP3/SP5).

## 3. Décisions
- **Q7 — visibilité (validé)** : les docs uploadés depuis le CRM sont **internes par défaut**
  (`visible_to_client = false`). La bascule se fait via un **toggle directement sur chaque ligne
  de la liste de documents** (pas d'ouverture de fiche : un switch dans le tableau). Implémenté
  par `admin_update_document(p_document_id, p_visible_to_client=…)` avec `p_name=null` (ne touche
  QUE la visibilité — comportement confirmé mig. 281).
- **DM-07d — routage bucket (résolu)** : on **garde l'info de bucket** via une colonne
  `storage_bucket` sur `propulspace.documents`. Les nouveaux uploads CRM vont dans
  `propulspace-documents` ; les rows rapatriées (backfill) pointent vers `project-documents`. La
  vue admin expose `bucket = COALESCE(storage_bucket, <CASE inférence mig.254>)`. **Pas de
  déplacement physique de fichiers** (Q7c = option B : ancien bucket conservé en lecture).
- **R-008 / faille anon 254** : R-008 déjà corrigé ; la faille anon de la vue 254 est fermée par
  le **hotfix 285** (déjà écrit, indépendant). Le DROP de 254 en migration 290 la clôt définitivement.

## 4. Séquence (Stratégie C — portail vert à chaque palier)

### Phase 1 — Fix téléchargement portail (front only, aucune migration)
Les docs qualif ont `file_url = 'qualification/…'` (bucket `propulspace-uploads`), mais
`DocumentsPage.tsx:8` hardcode `STORAGE_BUCKET = 'propulspace-documents'` → signed URL échoue.
- `constants.ts` (tab documents) : ajouter `inferBucket(file_url): 'propulspace-documents' | 'propulspace-uploads' | 'external'` (réplique le `CASE` de la vue 254, l.70-74).
- `DocumentsPage.tsx:17` : `getSignedStorageUrl(STORAGE_BUCKET, …)` → `getSignedStorageUrl(inferBucket(doc.file_url), …)` ; supprimer la constante hardcodée.
- **Test** : un doc `file_url='qualification/…'` est téléchargeable depuis le portail.

### Phase 2 — Migration 288 (prérequis bloquant) : `storage_bucket` + vue admin avec `bucket`
> **Critique adversariale intégrée** : la vue `propulspace_documents_admin_v2` (mig. 281) n'a
> **pas** de colonne `bucket`. Sans ça, le download CRM casse dès qu'on bascule la lecture. Cette
> migration est donc un **prérequis bloquant** des phases 3-4, pas une option.

```sql
BEGIN;

-- 1. Mémoriser le bucket réel (NULL = inférence par défaut sur file_url)
ALTER TABLE propulspace.documents
  ADD COLUMN IF NOT EXISTS storage_bucket text NULL;

COMMENT ON COLUMN propulspace.documents.storage_bucket IS
  'Bucket Storage réel. NULL => inféré depuis file_url. Renseigné=project-documents pour les docs CRM rapatriés (SP4).';

-- 2. Recréer la vue admin AVEC bucket = COALESCE(storage_bucket, CASE…)
DROP VIEW IF EXISTS public.propulspace_documents_admin_v2;
CREATE VIEW public.propulspace_documents_admin_v2
  WITH (security_invoker = true) AS
SELECT
  id, project_id, document_type, category, name, description,
  file_url, file_size_bytes, file_mime_type, version,
  visible_to_client, uploaded_by_client, viewed_by_client_at, created_at,
  COALESCE(
    storage_bucket,
    CASE
      WHEN file_url LIKE 'qualification/%' THEN 'propulspace-uploads'
      WHEN file_url LIKE 'http%'           THEN 'external'
      ELSE 'propulspace-documents'
    END
  ) AS bucket
FROM propulspace.documents
WHERE deleted_at IS NULL;

REVOKE ALL ON public.propulspace_documents_admin_v2 FROM anon;
GRANT SELECT ON public.propulspace_documents_admin_v2 TO authenticated;

COMMIT;
```

### Phase 3 — Bascule front CRM (un seul lot)
| Fichier | Action |
|---|---|
| `constants.ts` (tab documents) | `BUCKET = 'project-documents'` → `'propulspace-documents'` (path `${projectId}/…` déjà conforme à la policy mig. 201). Étendre le type `Doc` : ajouter `bucket: string` + `visible_to_client: boolean`. |
| `DocumentsTabV3.tsx` (lecture, ~l.35) | Lire `supabase.from('propulspace_documents_admin_v2').eq('project_id', projectId)` (plus la vue d'union). |
| `DocumentsTabV3.tsx` (INSERT, ~l.91) | Remplacer `v2.from('project_documents').insert` par `adminRpc('admin_create_document', { p_project_id, p_name, p_file_url, p_document_type, p_category, p_file_size_bytes, p_file_mime_type, p_visible_to_client: false })`. |
| `DocumentsTabV3.tsx` (DELETE, ~l.125) | Suppression storage du fichier d'abord (anti-orphelin), puis `adminRpc('admin_delete_document', { p_document_id: doc.id })` (soft-delete). |
| `DocumentsTabV3.tsx` (téléchargement, ~l.145) | `supabase.storage.from(doc.bucket)` — `doc.bucket` vient désormais de la vue admin (colonne ajoutée en 288). |
| `DocumentsTabV3.tsx` (guard, ~l.112) | Remplacer `doc.source === 'portal'` par `doc.uploaded_by_client` (la vue admin n'expose pas `source`). |
| `DocumentsTabV3.tsx` (**nouveau — toggle inline**) | Un switch « Visible portail » **par ligne** → `adminRpc('admin_update_document', { p_document_id: doc.id, p_visible_to_client: next })` puis refresh. |
| `useProjectTabCounts.ts:36` | `v2.from('project_documents')` → `supabase.from('propulspace_documents_admin_v2').select('id', { count:'exact', head:true }).eq('project_id', projectId)`. |
| `adminRpc.ts` | Vérifier/compléter `AdminRpcMap` pour `admin_create_document` / `admin_update_document` / `admin_delete_document` (signatures mig. 281). |

> Après la phase 3, la vue d'union 254 n'est plus lue par le CRM (mais reste vivante jusqu'au DROP en 290).

### Phase 4 — Migration 289 : backfill (idempotent)
```sql
INSERT INTO propulspace.documents (
  id, project_id, document_type, category, name, description,
  file_url, file_size_bytes, file_mime_type, version,
  visible_to_client, uploaded_by_client, uploaded_by, storage_bucket, created_at
)
SELECT
  d.id, d.project_id,
  CASE d.category   -- mapping inverse du CASE de la vue 254
    WHEN 'contract' THEN 'contract' WHEN 'invoice' THEN 'invoice'
    WHEN 'report' THEN 'report' WHEN 'deliverable' THEN 'deliverable'
    WHEN 'mockup' THEN 'asset_logo' ELSE 'other'
  END,
  d.category, d.name, d.uploader_name,           -- uploader_name -> description (pas de col dédiée)
  d.file_path, d.file_size, d.mime_type,
  NULLIF(regexp_replace(coalesce(d.version,''), '\D', '', 'g'), '')::int,  -- version text -> int (NULL si non num.)
  false,                                          -- docs CRM legacy = internes
  false,
  d.uploaded_by,
  'project-documents',                            -- fichiers physiques restés dans l'ancien bucket
  d.created_at
FROM public.project_documents_v2 d
ON CONFLICT (id) DO NOTHING;
```
- **Vérif** : `SELECT count(*) FROM project_documents_v2 v WHERE NOT EXISTS (SELECT 1 FROM propulspace.documents d WHERE d.id=v.id)` → `0`.

### Phase 5 — Migration 290 : suppression de l'ancien chemin (fin de SP4, après ~1 semaine)
```sql
DROP VIEW  IF EXISTS public.project_documents_unified_v2;   -- clôt aussi définitivement la faille anon
DROP TABLE IF EXISTS public.project_documents_v2;
```
+ front : retirer `project_documents: 'project_documents_v2'` de `V2_TABLE_MAP` (`src/lib/supabase.ts:141`), retirer le bloc `project_documents_v2` de `database.ts`, supprimer `src/modules/ProjectsManagerV2/hooks/useDocumentsV2.ts` (dead code, 0 import).

## 5. Tests
- **Vitest** `inferBucket` : `'qualification/x'`→`propulspace-uploads` ; `'http…'`→`external` ; `'<uuid>/…'`→`propulspace-documents`.
- **Runtime (Lyes)** : upload CRM → doc en `propulspace_documents_admin_v2`, **invisible portail** par défaut ; toggle ligne → visible côté portail ; download CRM OK (nouveau + rapatrié) ; delete CRM → `deleted_at` non null, disparu de la liste.
- **SQL** post-289 : requête de vérif backfill = 0 manquant ; `propulspace_documents_v2` (vue client) ≥ avant (pas de régression portail).

## 6. Contraintes load-bearing (ne PAS casser)
Vues `propulspace_*_v2` (on **recrée** seulement `..._admin_v2`, jamais les vues client) · `portal_project_id()` · RPC `admin_*` (on les **appelle**, on ne les redéfinit pas hors 288) · trigger `guard_portal_columns_admin_only` · `V2_TABLE_MAP` (retrait en 290 seulement, après bascule) · 2 sessions Supabase. Le portail lit `propulspace_documents_v2` (vue client) → **intouchée** par SP4.

## 7. Definition of Done
- [ ] Phase 1 : download docs qualif OK côté portail · test `inferBucket` vert.
- [ ] Migration 288 appliquée (colonne + vue admin avec `bucket`) · `database.ts` à jour.
- [ ] Phase 3 : `tsc` pas plus rouge · `npm run build` vert · upload/download/delete/toggle CRM OK (Lyes).
- [ ] Migration 289 appliquée · vérif backfill = 0 manquant.
- [ ] Portail vert (docs visibles inchangés) (Lyes).
- [ ] Migration 290 **différée** (~1 semaine) : DROP vue 254 + table legacy + nettoyage front/types.
- [ ] Commits séparés par phase, branche dédiée SP4.

## 8. Risques / vigilance
- **Ordre strict** : 288 (vue avec `bucket`) AVANT la bascule lecture (phase 3), sinon download CRM cassé. C'est le point #1 de la revue adversariale.
- **`document_type` du backfill** : mapping inverse imparfait (`mockup`→`asset_logo` arbitraire) ; acceptable, `category` reste la valeur CRM d'origine.
- **`version` text→int** : valeurs non numériques → NULL (documenté). Aucune perte fonctionnelle (le front recalcule à partir de 1).
- **Fichiers physiques** : restent dans `project-documents` (bucket conservé en lecture). Ne pas supprimer ce bucket en 290.
- **Numéros** : 288/289/290 indicatifs (285 hotfix, 286/287 = SP1). Renuméroter en continu selon l'ordre réel d'application.
