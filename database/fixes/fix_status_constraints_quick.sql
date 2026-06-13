-- =====================================================
-- CORRECTION RAPIDE DES CONTRAINTES DE STATUT
-- =====================================================
-- Script pour corriger immédiatement les contraintes de statut

-- Supprimer les contraintes existantes
ALTER TABLE crm_byw_records DROP CONSTRAINT IF EXISTS crm_byw_records_status_check;
ALTER TABLE crm_bot_one_records DROP CONSTRAINT IF EXISTS crm_bot_one_records_status_check;

-- Ajouter les nouvelles contraintes avec les valeurs du frontend
ALTER TABLE crm_byw_records 
ADD CONSTRAINT crm_byw_records_status_check 
CHECK (status IN ('active', 'inactive', 'archived', 'prospect', 'client', 'perdu'));

ALTER TABLE crm_bot_one_records 
ADD CONSTRAINT crm_bot_one_records_status_check 
CHECK (status IN ('active', 'inactive', 'archived', 'prospect', 'en discussion', 'demo planifié', 'abonné', 'perdu'));

-- Vérifier que les contraintes ont été ajoutées
SELECT 
  'Contraintes de statut corrigées' as info,
  'Les valeurs prospect, en discussion, demo planifié, abonné, perdu sont maintenant acceptées' as message;
