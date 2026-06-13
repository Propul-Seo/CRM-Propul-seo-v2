# QA E2E Phase 2 — checklist post-merge

Ce document liste les vérifications à mener manuellement APRÈS merge dans `main` pour confirmer que les 10 emails transactionnels Brevo fonctionnent en prod.

## Pré-requis

- Configurations dashboard Supabase faites (cf. `supabase-auth-templates.md` pour #30 et #38)
- Comptes test prêts :
  - 1 lead test (peut être créé via `/diagnostic`)
  - 1 projet test avec `portal_client_email` valide (ex. `lyes.triki+qa@yahoo.fr`)
  - 1 compte Stripe test mode actif
  - 1 template DocuSeal de test

## Scénarios à vérifier

### 1. Soumission `/diagnostic` → #31 (client) + #32 (équipe)
1. Aller sur `/diagnostic`
2. Remplir le formulaire avec email test
3. Soumettre
4. Vérifier :
   - [ ] Email client reçu avec rendu visuel correct
   - [ ] Email équipe reçu à team@propulseo-site.com
   - [ ] DB : 2 rows dans `transactional_emails_sent` (template_keys `qualif-confirmation` et `new-lead-alert`)

### 2. Paiement Stripe → #35 payment-received
1. En Stripe test mode, payer une facture via le portail client
2. Vérifier :
   - [ ] Email client reçu
   - [ ] DB : 1 row `payment-received` statut `sent`, dedupe_key = stripe_event_id
3. Forcer un re-trigger du webhook depuis Stripe dashboard
4. Vérifier :
   - [ ] DB : toujours 1 row (pas de doublon)
   - [ ] Le client ne reçoit pas de 2e email

### 3. DocuSeal flow → #36 (request) + #37 (completed)
1. Dans CRM admin, créer une submission DocuSeal sur un projet test
2. Vérifier :
   - [ ] Email signataire reçu (notre template Brevo, PAS celui de DocuSeal — visuel cohérent avec les autres emails)
3. Signer le document dans DocuSeal
4. Vérifier :
   - [ ] Email "signature complétée" reçu
   - [ ] DB : 2 rows (`signature-requested`, `signature-completed`), statut `sent`

### 4. Bouton "Envoyer la facture" → #33
1. Dans CRM admin, ouvrir un projet avec facture
2. Cliquer "Envoyer la facture" (bouton bleu, dans sidebar admin de la fiche projet)
3. Vérifier :
   - [ ] Toast succès
   - [ ] Email client reçu
4. Cliquer 2e fois
5. Vérifier :
   - [ ] Toast "Email déjà envoyé"
   - [ ] DB : pas de nouvelle row

### 5. Bouton "Relancer" → #34
1. Cliquer "Relancer" sur la même facture
2. Vérifier :
   - [ ] Toast succès, email reçu
3. Cliquer 2e fois (même jour)
4. Vérifier :
   - [ ] Toast "déjà envoyé"
5. (Pour test J+1 : changer la date système ou attendre — dedupe_key inclut la date ISO)

### 6. Bouton "Notifier le client" sur document deliverable → #39
1. Dans CRM admin, onglet Documents du projet, uploader un livrable (catégorie `deliverable`)
2. Cliquer "Notifier le client"
3. Vérifier :
   - [ ] Toast succès, email reçu avec lien de téléchargement
   - [ ] Lien fonctionne (signed URL 60s — cliquer rapidement)
4. Cliquer 2e fois
5. Vérifier :
   - [ ] Toast "Déjà notifié"

### 7. Magic Link Supabase Auth → #30
1. Sur `/login` portail client, demander un magic-link
2. Vérifier :
   - [ ] Email reçu avec rendu visuel correct (DA Sky Aurora)
   - [ ] Lien fonctionne (login auto)

### 8. Portal Welcome (Invite) → #38
1. Dans CRM admin, sur un projet test, cliquer "Activer le portail" sur un nouveau client
2. Vérifier :
   - [ ] Email reçu
   - [ ] Lien d'activation fonctionne (set password + redirection portail)

### 9. Non-régression R-018 RLS
Re-run via Supabase MCP `execute_sql` les 7 tests de `tests/sql/projects_v2_rls.sql`. Tous doivent passer (7/7).

### 10. Logs Brevo
Dans `propulspace.transactional_emails_sent`, vérifier après chaque scénario :
- [ ] Status = `sent` pour tous les emails partis
- [ ] `brevo_message_id` non null
- [ ] Pas de rows `failed` (sinon investigate dans `error_message`)

## En cas d'échec

- Inspecter `propulspace.transactional_emails_sent` (filtrer sur `status = 'failed'`)
- Voir les logs Supabase Edge Functions : `mcp__claude_ai_Supabase__get_logs` type `edge-function`
- Vérifier que `BREVO_API_KEY` est bien set dans les secrets edge functions
