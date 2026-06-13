const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseContactsForeignKey() {
  console.log('🔍 Diagnostic de la structure des contacts...');
  
  try {
    // ÉTAPE 1: Vérifier l'utilisateur connecté
    console.log('\n📋 ÉTAPE 1: Vérification de l\'utilisateur connecté...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ Erreur lors de la récupération de l\'utilisateur:', userError.message);
      return;
    }
    
    if (!user) {
      console.log('❌ Aucun utilisateur connecté');
      return;
    }
    
    console.log('✅ Utilisateur connecté:', user.email);
    console.log('✅ User ID:', user.id);

    // ÉTAPE 2: Vérifier si l'utilisateur existe dans la table users
    console.log('\n📋 ÉTAPE 2: Vérification de l\'existence dans la table users...');
    const { data: userInTable, error: userTableError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
    
    if (userTableError) {
      console.log('⚠️  Erreur lors de la vérification de la table users:', userTableError.message);
    } else if (!userInTable) {
      console.log('❌ L\'utilisateur n\'existe pas dans la table users');
      console.log('💡 Solution: Créer l\'utilisateur dans la table users');
    } else {
      console.log('✅ Utilisateur trouvé dans la table users:', userInTable);
    }

    // ÉTAPE 3: Test de création d'un contact
    console.log('\n📋 ÉTAPE 3: Test de création d\'un contact...');
    const testContactData = {
      name: 'Test Contact - Diagnostic',
      email: 'test-diagnostic-' + Date.now() + '@example.com',
      phone: '+33123456789',
      address: '123 Test Street',
      company: 'Test Company',
      sector: 'Technology',
      status: 'prospect',
      user_id: user.id
    };

    const { data: testContact, error: testError } = await supabase
      .from('contacts')
      .insert([testContactData])
      .select()
      .single();

    if (testError) {
      console.log('❌ Erreur lors de la création du contact:', testError.message);
      console.log('');
      console.log('💡 Solutions possibles:');
      console.log('1. Vérifiez que la table users existe et contient l\'utilisateur');
      console.log('2. Vérifiez que la foreign key pointe vers la bonne table');
      console.log('3. Vérifiez que l\'utilisateur a les bonnes permissions');
    } else {
      console.log('✅ Test de création réussi:', testContact);
      
      // Nettoyer le contact de test
      await supabase
        .from('contacts')
        .delete()
        .eq('email', testContactData.email);
      console.log('🧹 Contact de test supprimé');
    }

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
  }
}

diagnoseContactsForeignKey();
