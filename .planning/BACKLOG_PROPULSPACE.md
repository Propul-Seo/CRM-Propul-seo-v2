# Backlog Propul'Space — Items hors-périmètre

> Items détectés pendant les tâches mais hors du périmètre traité.
> Format imposé par `00_REGLES_GLOBALES.md`.

---

## 2026-05-17 [Sprint A.1] — Trouvé pendant dump migrations

### Item B-001 — Renommer `EspaceClient/` en `Propulspace/`
**Description** : le code TS vit dans `src/modules/EspaceClient/` alors que le schéma DB est `propulspace`, les vues sont `propulspace_*_v2`, le nom produit est "Propul'Space". Incohérence nomenclature.

**Impact** : Nice-to-have (DX, confusion possible pour Etienne)

**Sprint cible suggéré** : Avant Sprint C (avant que les Vues 10/11 admin ajoutent encore du code dans `EspaceClient/`)

**Effort estimé** : M (renommage + maj imports + maj routes + tests visuels)

---

### Item B-002 — `react-error-boundary` au niveau `PortalShell`
**Description** : un crash JS sur n'importe quelle page portail = page blanche complète. Pas de fallback gracieux.

**Impact** : Important (UX désastreuse en cas de bug)

**Sprint cible suggéré** : Sprint B.5 (QA Précieuse)

**Effort estimé** : S (1-2h)

---

### Item B-003 — Split `DashboardPage` et `InvoicesPage`
**Description** : `DashboardPage` (122 lignes) et `InvoicesPage` (170 lignes) mélangent fetch + UI. Devraient être splittés en `<KpisRow />` + `<ActivityFeed />` et `<InvoicesList />` + `<InstallmentsTable />`.

**Impact** : Nice-to-have (lisibilité, testabilité)

**Sprint cible suggéré** : Sprint B.5 ou refacto post-Sprint C

**Effort estimé** : M (split + tests)

---

### Item B-004 — Câbler `audit_log` côté UI admin (R-005)
**Description** : la table `propulspace.audit_log` reçoit les events (5 rows en prod) mais aucune page admin ne les affiche. Demande client RGPD potentielle non couverte.

**Impact** : Important (conformité RGPD)

**Sprint cible suggéré** : Sprint C ou post-C

**Effort estimé** : M (page admin `/admin/propulspace/audit` + filtres + pagination)

---

### Item B-005 — Tracking `analytics_events` (Q-002 tranchée)
**Description** : la table `propulspace.analytics_events` existe avec 4 indexes, mais aucun event n'est tracké côté front. Décider si on garde + câble, ou si on supprime la table.

**Impact** : Nice-to-have (visibilité funnel)

**Sprint cible suggéré** : Post-Sprint B (après que le funnel soit stabilisé)

**Effort estimé** : M si on câble, XS si on supprime

---

### Item B-006 — Trigger `on_auth_user_created` non versionné côté propulspace
**Description** : la fonction `handle_new_user()` est patchée par `propulspace_150` mais le trigger qui l'appelle (`on_auth_user_created`) est créé par une migration CRM antérieure non identifiée. Sur env neuf, l'ordre dépend du tri des fichiers. Risque latent.

**Impact** : Nice-to-have (Sprint A.1 documenté le sujet)

**Sprint cible suggéré** : Backlog

**Effort estimé** : S (identifier la migration source + documenter dans baseline)

---

### Item B-007 — Doublon stockage uploads qualification (R-010)
**Description** : Les fichiers de qualification sont stockés à la fois dans la table relationnelle `qualification_uploads` ET dans les colonnes JSON `existing_site_screenshots/logo_file_url/brand_guide_url` de `qualification_leads`. Pas de trigger de sync. Désync possible.

**Impact** : Important (intégrité données)

**Sprint cible suggéré** : Backlog refacto qualification (post-Sprint B)

**Effort estimé** : M (décider source de vérité + supprimer l'autre + migration sync historique)

---

### Item B-008 — Trigger `BEFORE INSERT` sur `invoices` pour forcer `invoice_number`
**Description** : `invoices.invoice_number` est `UNIQUE NOT NULL` mais sans DEFAULT auto. Le code applicatif doit appeler `propulspace.next_invoice_number()` à chaque INSERT. Risque de bug si oublié.

**Impact** : Important (conformité fiscale + DX)

**Sprint cible suggéré** : Sprint B.3 (en même temps que l'edge function Stripe qui créera les factures)

**Effort estimé** : XS (trigger 10 lignes)

---

### Item B-009 — Enforcer `is_locked` sur `invoices` via RLS
**Description** : `invoices.is_locked = true` est censé empêcher la modif d'une facture envoyée, mais aucun mécanisme DB ne le force. Repose sur l'applicatif. Risque humain (admin qui oublie).

**Impact** : Important (conformité fiscale FR)

**Sprint cible suggéré** : Sprint B.3

**Effort estimé** : S (ajouter une policy ou un trigger BEFORE UPDATE)

---

### Item B-010 — Monitoring `handle_new_user INSERT failed` WARNINGs (R-014)
**Description** : le try/catch silencieux peut masquer des INSERT failures côté internes. Aucun monitoring actif.

**Impact** : Nice-to-have (cas exotique)

**Sprint cible suggéré** : Quand on aura un setup logs/alerting Supabase (Phase 3+)

**Effort estimé** : XS (alerte sur pattern logs)

---

### Item B-011 — Clarifier `portal_enabled` (legacy) vs `portal_visible` (Propul'Space)
**Description** : `public.projects_v2.portal_enabled` (legacy ClientBrief) et `portal_visible` (Propul'Space) coexistent comme 2 flags différents. Source de confusion future.

**Impact** : Nice-to-have (DX)

**Sprint cible suggéré** : V3 CRM refacto

**Effort estimé** : S (renommer un des deux + migration)

---

### Item B-012 — Pas d'index sur `portal_client_email` (R-009)
**Description** : `portal_project_id()` v2 (migration 140) fait un `WHERE portal_client_email = ...` à chaque appel RLS d'un client. Sans index, full scan sur `projects_v2`. OK aujourd'hui (peu de projets), critique à 10k+.

**Impact** : Important (perf à terme)

**Sprint cible suggéré** : Sprint A.3 (en même temps que les tests sécu) OU backlog perf

**Effort estimé** : XS (`CREATE INDEX CONCURRENTLY` sur `portal_client_email WHERE portal_client_email IS NOT NULL`)

---

### ~~Item B-013 — `UNIQUE` sur `portal_client_email` (R-009)~~ → annulé
**Statut** : ~~Annulé 2026-05-17~~ — décision ADR-004 : multi-projets est le comportement souhaité, pas un bug. Voir B-014 ci-dessous pour la vraie évolution architecturale.

---

### Item B-015 — Durcir `ps_docs_client_insert` (R-015 — escalade privilèges)
**Description** : la policy permet à un client d'INSERT un document dans son projet, mais sans contrainte sur `uploaded_by` (FK `public.users`). Un client peut s'attribuer comme auteur n'importe quel user interne, polluant l'audit trail.

**Fix** : `WITH CHECK (... AND uploaded_by IS NULL)` — le client ne devrait jamais renseigner cette colonne (réservée aux uploads internes).

**Impact** : Critique (RGPD + intégrité audit)

**Sprint cible suggéré** : Sprint A.3 (bloc durcissement RLS)

**Effort estimé** : XS (1 ligne SQL + test)

---

### Item B-016 — Path prefix sur `ps_uploads_public_insert` (R-016)
**Description** : `anon` peut INSERT dans `propulspace-uploads` sans aucune contrainte de path. Pollution/écrasement possible si UUID connu.

**Fix** : `WITH CHECK (bucket_id = 'propulspace-uploads' AND name LIKE 'qualification/%')` OU validation via RPC SECURITY DEFINER avec session_token (cohérent avec fix R-011).

**Impact** : Élevé (intégrité fichiers + DoS possible)

**Sprint cible suggéré** : Sprint A.3 (avec R-011)

**Effort estimé** : S (1 ligne SQL + test, ou XS si RPC déjà créée pour R-011)

---

### Item B-017 — Forcer `submitted_at IS NOT NULL` quand `status='submitted'` (R-017)
**Description** : la policy `ps_qualif_public_update_draft` permet de passer en `submitted` sans `submitted_at`. Pipeline admin pollué par des leads "submitted" sans timestamp.

**Fix** : `WITH CHECK (status = 'draft' OR (status = 'submitted' AND submitted_at IS NOT NULL))` — ou un trigger BEFORE UPDATE qui force le timestamp.

**Impact** : Élevé (intégrité workflow commercial)

**Sprint cible suggéré** : Sprint A.3

**Effort estimé** : XS (1 ligne SQL + test)

---

### Item B-014 — Architecture multi-projets côté espace client (ADR-004)
**Description** : Permettre à un même client (un seul email portail) d'accéder à plusieurs projets via un switcher dans l'UI. Aujourd'hui `portal_project_id()` renvoie 1 projet (LIMIT 1), il faut faire évoluer vers `portal_project_ids()` (pluriel) + projet actif côté session client.

**Changements requis (résumé)** :
- DB :
  - Nouvelle fonction `propulspace.portal_project_ids() RETURNS UUID[]`
  - Refactoriser TOUTES les RLS qui utilisent `portal_project_id()` pour passer à `= ANY(portal_project_ids())` (ou garder via projet actif si on veut sécurité stricte)
- Frontend :
  - `usePortalAuth` charge la liste des projets de l'email
  - `PortalContext` expose `projects[]`, `activeProject`, `setActiveProject()`
  - `PortalShell` affiche un dropdown switcher si `projects.length > 1`
  - Persistance projet actif : localStorage ou cookie

**Impact** : Important (architecture core portail)

**Sprint cible suggéré** : à arbitrer — Sprint A.3 (en même temps que le durcissement RLS, logique vu le scope sécu) OU Sprint dédié post-B

**Effort estimé** : L (3-5 jours — refactor RLS + frontend + tests)

**Note** : aujourd'hui aucun client n'a 2 projets, donc le `LIMIT 1` actuel "fonctionne" sans déclencher le bug. À traiter avant le 2e client multi-projets.
