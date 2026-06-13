#!/usr/bin/env node

/**
 * Script pour ajouter le champ website à la table contacts
 * Usage: node scripts/add-website-to-contacts.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function addWebsiteToContacts() {
  // Vérifier les variables d'environnement
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement manquantes:');
    console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('🔄 Ajout du champ website à la table contacts...');
    
    // Vérifier si la colonne existe déjà
    const { data: existingColumns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'contacts')
      .eq('column_name', 'website');

    if (columnsError) {
      console.error('❌ Erreur lors de la vérification des colonnes:', columnsError);
      return;
    }

    if (existingColumns && existingColumns.length > 0) {
      console.log('✅ La colonne website existe déjà dans la table contacts');
      return;
    }

    // Ajouter la colonne website
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE contacts ADD COLUMN website TEXT;'
    });

    if (alterError) {
      console.error('❌ Erreur lors de l\'ajout de la colonne:', alterError);
      return;
    }

    console.log('✅ Colonne website ajoutée avec succès à la table contacts');
    
    // Ajouter un commentaire
    const { error: commentError } = await supabase.rpc('exec_sql', {
      sql: 'COMMENT ON COLUMN contacts.website IS \'Site internet du contact (optionnel)\';'
    });

    if (commentError) {
      console.warn('⚠️  Impossible d\'ajouter le commentaire:', commentError);
    } else {
      console.log('✅ Commentaire ajouté à la colonne website');
    }

    console.log('🎉 Migration terminée avec succès !');
    console.log('📝 Le champ website est maintenant disponible pour tous les nouveaux contacts');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  addWebsiteToContacts();
}

module.exports = { addWebsiteToContacts };
