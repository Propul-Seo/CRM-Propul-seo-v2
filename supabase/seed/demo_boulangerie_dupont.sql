-- =============================================================================
-- SEED DÉMO — « Site vitrine — Boulangerie Dupont »
-- =============================================================================
-- But : remplir l'espace client + le back-office admin Propul'Space avec un jeu
--       de données réaliste (jalons, documents, factures, échéances, signatures,
--       onboarding) pour la démo de l'UI premium.
--
-- Où l'exécuter : Supabase SQL Editor du projet ERP (tbuqctfgjjxnevmsvucl).
--                 Le MCP Supabase n'est pas branché sur l'ERP → exécution manuelle.
--
-- AVANT D'EXÉCUTER :
--   • Le portail doit être ACTIVÉ sur le projet (projects_v2.portal_client_email
--     = 'lyestriki@gmail.com'). Sinon le script s'arrête avec un message clair.
--   • Le script désactive brièvement le trigger « guard » de projects_v2. Cela
--     exige d'être PROPRIÉTAIRE de la table. Dans le SQL Editor Supabase, le rôle
--     est `postgres`, owner par défaut → OK. Si l'erreur « must be owner of table
--     projects_v2 » apparaît, exécuter en tant que propriétaire de la table.
--
-- Idempotent : le script RÉSOUT le projet via portal_client_email, exige qu'il
--              soit UNIQUE, PURGE ses données démo, puis les RÉINSÈRE. Rejouable
--              sans doublon, scopé au SEUL projet démo (aucune autre donnée touchée).
--
-- Tout-ou-rien : le bloc est une seule transaction (un seul DO). En cas d'erreur,
--                TOUT est annulé par le rollback global — y compris la désactivation
--                du trigger guard, qui est donc toujours rétabli (jamais laissé off).
--
-- Notes :
--   • Les URLs de fichiers (file_url / pdf_url / signing_url) sont FICTIVES : la
--     liste s'affiche, mais le téléchargement réel échouera tant que les fichiers
--     ne sont pas réellement déposés dans le Storage. C'est volontaire.
--   • Numéros de facture FIXES (PS-DEMO-01/02) au lieu de next_invoice_number() :
--     on ne consomme PAS la séquence légale anti-fraude FR, et le clean+reseed
--     réutilise les mêmes numéros sans collision.
--   • Le guard de projects_v2 est désactivé par MOTIF (pg_trigger ILIKE
--     '%guard_portal_columns%') → robuste à un éventuel drift de nom entre prod
--     (« guard_portal_columns_admin_only ») et repo (« trg_… »).
--   • Les triggers d'audit (documents/invoices/signatures) restent ACTIFS : le
--     journal du projet est purgé EN DERNIER, puis les INSERT le re-remplissent
--     → l'onglet « Activité » du back-office admin se peuple tout seul.
-- =============================================================================

DO $$
DECLARE
  v_email        text := 'lyestriki@gmail.com';
  v_project      uuid;
  v_count        int;
  v_trg          text;
  v_quote_doc    uuid;
  v_contract_doc uuid;
  v_inv_solde    uuid;
  v_snapshot     jsonb;
BEGIN
  -- 0) Garde : sommes-nous sur le bon projet Supabase (ERP) ? ------------------
  IF to_regnamespace('propulspace') IS NULL THEN
    RAISE EXCEPTION 'Schéma propulspace absent — mauvais projet Supabase ? (attendu : ERP %).', 'tbuqctfgjjxnevmsvucl';
  END IF;

  -- 1) Résolution déterministe du projet démo (refuse 0 ou plusieurs) ----------
  SELECT count(*) INTO v_count
    FROM public.projects_v2
   WHERE lower(portal_client_email) = lower(v_email);

  IF v_count = 0 THEN
    RAISE EXCEPTION
      'Projet démo introuvable : aucun projects_v2 avec portal_client_email = %. '
      'Active d''abord le portail sur le projet « Boulangerie Dupont » depuis le CRM admin.', v_email;
  ELSIF v_count > 1 THEN
    RAISE EXCEPTION
      'Résolution ambiguë : % projets portent portal_client_email = %. Le seed exige un projet unique.', v_count, v_email;
  END IF;

  SELECT id INTO v_project
    FROM public.projects_v2
   WHERE lower(portal_client_email) = lower(v_email);

  RAISE NOTICE 'Projet démo résolu : %', v_project;

  v_snapshot := jsonb_build_object(
    'company',    'Boulangerie Dupont',
    'first_name', 'Marie',
    'phone',      '+33 6 12 34 56 78',
    'email',      v_email
  );

  -- 2) Purge scopée au projet démo --------------------------------------------
  --    Les triggers d'audit restent actifs ; on supprime le journal EN DERNIER
  --    pour effacer aussi les lignes 'delete' générées par les purges ci-dessus.
  DELETE FROM propulspace.invoice_installments
   WHERE invoice_id IN (SELECT id FROM propulspace.invoices WHERE project_id = v_project);
  DELETE FROM propulspace.invoices             WHERE project_id = v_project;
  DELETE FROM propulspace.signatures           WHERE project_id = v_project;
  DELETE FROM propulspace.documents            WHERE project_id = v_project;
  DELETE FROM propulspace.project_steps        WHERE project_id = v_project;
  DELETE FROM propulspace.onboarding_responses WHERE project_id = v_project;
  DELETE FROM propulspace.audit_log            WHERE project_id = v_project;

  -- 3) Fiche projet — désactivation DYNAMIQUE du guard le temps de l'UPDATE ----
  FOR v_trg IN
    SELECT tgname FROM pg_trigger
     WHERE tgrelid = 'public.projects_v2'::regclass
       AND NOT tgisinternal
       AND tgname ILIKE '%guard_portal_columns%'
  LOOP
    EXECUTE format('ALTER TABLE public.projects_v2 DISABLE TRIGGER %I', v_trg);
  END LOOP;

  UPDATE public.projects_v2 SET
      name              = 'Site vitrine — Boulangerie Dupont',
      client_name       = 'Marie Dupont',
      client_first_name = 'Marie',
      client_company    = 'Boulangerie Dupont',
      client_phone      = '+33 6 12 34 56 78',
      description        = 'Création d''un site vitrine moderne pour la Boulangerie Dupont : '
                         || 'présentation de la maison, mise en avant des produits (pains, '
                         || 'viennoiseries, pâtisseries), horaires, galerie photo et formulaire de contact.',
      status            = 'in_progress',
      presta_type       = ARRAY['site_web']::text[],
      budget            = 3500.00,
      progress          = 50,
      start_date        = CURRENT_DATE - 35,
      end_date          = CURRENT_DATE + 25,
      assigned_name     = 'Lucie Lebouter',
      updated_at        = now()
   WHERE id = v_project;

  FOR v_trg IN
    SELECT tgname FROM pg_trigger
     WHERE tgrelid = 'public.projects_v2'::regclass
       AND NOT tgisinternal
       AND tgname ILIKE '%guard_portal_columns%'
  LOOP
    EXECUTE format('ALTER TABLE public.projects_v2 ENABLE TRIGGER %I', v_trg);
  END LOOP;

  -- 4) Jalons (frise) — 3 terminés / 1 en cours / 2 à venir = 50 % ------------
  INSERT INTO propulspace.project_steps
    (project_id, step_order, label, description, status, date_start, date_planned_end, date_actual_end, visible_to_client)
  VALUES
    (v_project, 1, 'Brief & cadrage',              'Recueil du besoin, arborescence cible et planning.',          'completed',   CURRENT_DATE-35, CURRENT_DATE-30, CURRENT_DATE-30, true),
    (v_project, 2, 'Arborescence & wireframes',    'Structure des pages et zoning validés.',                      'completed',   CURRENT_DATE-29, CURRENT_DATE-22, CURRENT_DATE-22, true),
    (v_project, 3, 'Design UI (maquettes)',        'Maquettes haute fidélité des pages clés.',                    'completed',   CURRENT_DATE-21, CURRENT_DATE-11, CURRENT_DATE-10, true),
    (v_project, 4, 'Intégration & développement',  'Intégration responsive et mise en place du contenu.',         'in_progress', CURRENT_DATE-9,  CURRENT_DATE+8,  NULL,            true),
    (v_project, 5, 'Recette & contenus',           'Relecture, corrections et intégration des contenus finaux.',  'upcoming',    NULL,            CURRENT_DATE+18, NULL,            true),
    (v_project, 6, 'Mise en ligne',                'Bascule en production et configuration du nom de domaine.',   'upcoming',    NULL,            CURRENT_DATE+25, NULL,            true);

  -- 5) Documents (GED) — ids devis & contrat capturés pour les signatures -----
  --    (category est cosmétique : le portail filtre sur document_type, pas category.)
  INSERT INTO propulspace.documents
    (project_id, document_type, category, name, description, file_url, file_size_bytes, file_mime_type, version, visible_to_client, uploaded_by_client)
  VALUES
    (v_project, 'quote', 'contrats', 'Devis — Site vitrine', 'Devis détaillé de la prestation.',
     v_project::text || '/devis-boulangerie-dupont.pdf', 184320, 'application/pdf', 1, true, false)
  RETURNING id INTO v_quote_doc;

  INSERT INTO propulspace.documents
    (project_id, document_type, category, name, description, file_url, file_size_bytes, file_mime_type, version, visible_to_client, uploaded_by_client)
  VALUES
    (v_project, 'contract', 'contrats', 'Contrat de prestation', 'Contrat encadrant la mission.',
     v_project::text || '/contrat-prestation.pdf', 245760, 'application/pdf', 1, true, false)
  RETURNING id INTO v_contract_doc;

  INSERT INTO propulspace.documents
    (project_id, document_type, category, name, description, file_url, file_size_bytes, file_mime_type, version, visible_to_client, uploaded_by_client)
  VALUES
    (v_project, 'asset_charter', 'assets',    'Charte graphique',          'Charte fournie par le client (couleurs, logo, typographies).', v_project::text || '/charte-graphique.pdf',          3355443, 'application/pdf', 1, true, true),
    (v_project, 'asset_logo',    'assets',    'Logo Boulangerie Dupont',   'Logo vectorisé fourni par le client.',                         v_project::text || '/logo-boulangerie-dupont.png',     430080,  'image/png',       1, true, true),
    (v_project, 'deliverable',   'livrables', 'Maquettes validées',        'Export PDF des maquettes UI validées.',                        v_project::text || '/maquettes-v2.pdf',                5347737, 'application/pdf', 2, true, false),
    (v_project, 'report',        'livrables', 'Compte-rendu de cadrage',   'Synthèse de la réunion de lancement.',                         v_project::text || '/cr-cadrage.pdf',                  97280,   'application/pdf', 1, true, false);

  -- 6) Factures — acompte payé + solde envoyé (avec échéances) -----------------
  --    Numéros FIXES (pas la séquence légale) → rejouable, sans trou de numérotation.
  INSERT INTO propulspace.invoices
    (invoice_number, project_id, client_snapshot, is_deposit, amount_subtotal, vat_rate, amount_vat, amount_total, currency, line_items, status, issue_date, due_date, paid_at, client_visible_notes)
  VALUES
    ('PS-DEMO-01', v_project, v_snapshot, true,
     1050.00, 20, 210.00, 1260.00, 'EUR',
     jsonb_build_array(jsonb_build_object('label', 'Acompte 30 % — Site vitrine', 'quantity', 1, 'unit_price', 1050, 'total', 1050)),
     'paid', CURRENT_DATE-30, CURRENT_DATE-20, now() - interval '25 days',
     'Acompte de démarrage (30 %). Merci !');

  INSERT INTO propulspace.invoices
    (invoice_number, project_id, client_snapshot, is_deposit, amount_subtotal, vat_rate, amount_vat, amount_total, currency, line_items, status, issue_date, due_date, client_visible_notes)
  VALUES
    ('PS-DEMO-02', v_project, v_snapshot, false,
     2450.00, 20, 490.00, 2940.00, 'EUR',
     jsonb_build_array(jsonb_build_object('label', 'Solde 70 % — Site vitrine', 'quantity', 1, 'unit_price', 2450, 'total', 2450)),
     'sent', CURRENT_DATE-2, CURRENT_DATE+13,
     'Solde à régler à la livraison du site.')
  RETURNING id INTO v_inv_solde;

  INSERT INTO propulspace.invoice_installments
    (invoice_id, installment_number, label, amount, due_date, status)
  VALUES
    (v_inv_solde, 1, 'Échéance 1/2 — à la mise en recette', 1470.00, CURRENT_DATE+13, 'pending'),
    (v_inv_solde, 2, 'Échéance 2/2 — à la mise en ligne',   1470.00, CURRENT_DATE+30, 'pending');

  -- 7) Signatures — devis signé + contrat en attente --------------------------
  INSERT INTO propulspace.signatures
    (project_id, document_id, signature_type, name, docuseal_submission_id, status, sent_at, signed_at, docuseal_signed_pdf_url)
  VALUES
    (v_project, v_quote_doc, 'quote', 'Devis — Site vitrine', 'demo-bd-quote-0001', 'signed',
     now() - interval '32 days', now() - interval '31 days', v_project::text || '/devis-signe.pdf');

  INSERT INTO propulspace.signatures
    (project_id, document_id, signature_type, name, docuseal_submission_id, status, sent_at, expires_at, docuseal_signing_url)
  VALUES
    (v_project, v_contract_doc, 'contract', 'Contrat de prestation', 'demo-bd-contract-0001', 'pending',
     now() - interval '1 day', now() + interval '14 days', 'https://sign.example.com/demo-bd-contract');

  -- 8) Onboarding — complété à 60 % (INSERT → pas de cascade trigger sync) -----
  INSERT INTO propulspace.onboarding_responses
    (project_id, completion_percent, is_complete,
     welcome_first_name, welcome_last_name, welcome_phone, welcome_company,
     preferred_channel, availability_slots, email_notifications,
     welcome_current_step, welcome_completed_at, welcome_dismissed_count,
     logo_uploaded, charter_uploaded, has_provided_google_access)
  VALUES
    (v_project, 60, false,
     'Marie', 'Dupont', '+33 6 12 34 56 78', 'Boulangerie Dupont',
     'email', ARRAY['morning','afternoon']::text[], true,
     5, now() - interval '20 days', 0,
     true, true, true);

  RAISE NOTICE 'Seed démo Boulangerie Dupont OK — 6 jalons, 6 documents, 2 factures, 2 échéances, 2 signatures, 1 onboarding.';
END $$;
