const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixClientStatusEnum() {
  console.log('🔧 Correction de l\'enum client_status...');
  
  try {
    console.log('➕ Ajout de la valeur offre_envoyee...');
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: "ALTER TYPE client_status ADD VALUE IF NOT EXISTS 'offre_envoyee';"
    });
    
    if (addError) {
      console.log('⚠️  Erreur:', addError.message);
    } else {
      console.log('✅ Valeur ajoutée');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: testContact, error: testError } = await supabase
      .from('clients')
      .insert({
        name: 'Test Contact',
        email: 'test-offre-' + Date.now() + '@example.com',
        status: 'offre_envoyee',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (testError) {
      console.log('❌ Erreur test:', testError.message);
    } else {
      console.log('✅ Test réussi');
      await supabase.from('clients').delete().eq('email', testContact.email);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

fixClientStatusEnum()
  .then(() => console.log('🎉 Terminé!'))
  .catch(error => console.error('❌ Erreur fatale:', error));
