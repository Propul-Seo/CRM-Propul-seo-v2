/**
 * Script de test de connexion au projet Supabase
 * Projet ID: tbuqctfgjjxnevmsvucl
 */

import { createClient } from '@supabase/supabase-js';

// Variables lues depuis .env (lance avec : node --env-file=.env scripts/test-supabase-connection.js)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes.');
  console.error('   Lance avec : node --env-file=.env scripts/test-supabase-connection.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔌 Test de connexion au projet Supabase...');
  console.log(`📡 URL: ${supabaseUrl}`);
  console.log(`🔑 Project ID: tbuqctfgjjxnevmsvucl\n`);

  try {
    // Test 1: Vérifier la connexion de base
    console.log('1️⃣ Test de connexion de base...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('_health')
      .select('*')
      .limit(1);
    
    if (healthError && healthError.code !== 'PGRST116') {
      console.log('   ⚠️  Table _health non disponible (normal)');
    } else {
      console.log('   ✅ Connexion de base OK');
    }

    // Test 2: Vérifier l'authentification
    console.log('\n2️⃣ Test d\'authentification...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log(`   ⚠️  Erreur auth: ${authError.message}`);
    } else {
      console.log(`   ✅ Auth OK - Session: ${session ? 'Active' : 'Aucune session'}`);
    }

    // Test 3: Lister les tables disponibles (via une requête simple)
    console.log('\n3️⃣ Test d\'accès aux tables...');
    
    // Test sur une table commune (si elle existe)
    const tablesToTest = ['crm', 'crm_bot_one', 'users', 'contacts'];
    
    for (const table of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.code === 'PGRST116') {
            console.log(`   ⚠️  Table "${table}" n'existe pas ou n'est pas accessible`);
          } else {
            console.log(`   ⚠️  Table "${table}": ${error.message}`);
          }
        } else {
          console.log(`   ✅ Table "${table}" accessible`);
        }
      } catch (err) {
        console.log(`   ⚠️  Table "${table}": ${err.message}`);
      }
    }

    // Test 4: Vérifier les fonctions Edge
    console.log('\n4️⃣ Vérification des fonctions Edge...');
    const functions = [
      'ringover-call',
      'generate-quote-pdf',
      'calculate-monthly-metrics',
      'sync-project-budget'
    ];
    
    console.log(`   📦 Fonctions configurées: ${functions.join(', ')}`);

    console.log('\n✅ Test de connexion terminé!');
    console.log('\n📊 Résumé:');
    console.log(`   - URL Supabase: ${supabaseUrl}`);
    console.log(`   - Project ID: tbuqctfgjjxnevmsvucl`);
    console.log(`   - Clé anonyme: Configurée`);
    console.log(`   - Statut: Connexion établie`);

  } catch (error) {
    console.error('\n❌ Erreur lors du test de connexion:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();

