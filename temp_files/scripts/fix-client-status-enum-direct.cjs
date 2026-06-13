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
  console.log('🔧 Test de l\'enum client_status...');
  
  try {
    console.log('🧪 Test de création d\'un contact avec le statut "offre_envoyee"...');
    
    const testEmail = 'test-offre-' + Date.now() + '@example.com';
    
    const { data: testContact, error: testError } = await supabase
      .from('clients')
      .insert({
        name: 'Test Contact - Offre Envoyée',
        email: testEmail,
        status: 'offre_envoyee',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (testError) {
      console.log('❌ Erreur:', testError.message);
      console.log('');
      console.log('💡 Solution:');
      console.log('1. Allez dans l\'interface Supabase');
      console.log('2. Ouvrez l\'éditeur SQL');
      console.log('3. Exécutez cette commande:');
      console.log('   ALTER TYPE client_status ADD VALUE IF NOT EXISTS \'offre_envoyee\';');
      console.log('4. Cliquez sur "Run"');
      console.log('5. Testez à nouveau la création de contact dans le CRM');
    } else {
      console.log('✅ Test réussi - Contact créé');
      await supabase.from('clients').delete().eq('email', testEmail);
      console.log('🎉 L\'enum client_status fonctionne correctement !');
    }
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
  }
}

fixClientStatusEnum();
