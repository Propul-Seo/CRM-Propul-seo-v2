-- =============================================================================
-- 302 — Purge définitive de la corbeille du 13 juin 2026
-- Date : 2026-07-02 (appliquée en prod via MCP Supabase le même jour)
-- -----------------------------------------------------------------------------
-- 15 tables (cluster e-commerce/réservation étranger : categories, products,
-- product_themes, product_availability, themes, delivery_zones, customers,
-- addresses, reservations, reservation_items, admin_users + orphelins :
-- google_tokens, project_checklists, client_post_assets, client_post_comments).
-- 0 référence vivante vérifiée (FK, fonctions, vues, triggers), 3 semaines en
-- corbeille sans incident. IRRÉVERSIBLE — validé par Etienne le 2026-07-02.
-- =============================================================================

DROP SCHEMA trash_2026_06_13 CASCADE;
