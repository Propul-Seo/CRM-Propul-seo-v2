#!/usr/bin/env node

/**
 * Script de diagnostic pour Propulseo CRM
 * Teste la connectivité et la configuration Supabase
 * Les credentials sont lus depuis les variables d'environnement
 */

import https from 'https';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Configuration depuis les variables d'environnement
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('🔍 Diagnostic Propulseo CRM - Test de Connexion\n');

// Test 1: Connectivité Internet
async function testInternetConnection() {
  console.log('1️⃣ Test de connectivité internet...');
  
  return new Promise((resolve) => {
    const req = https.get('https://httpbin.org/get', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Connectivité internet: OK');
        resolve(true);
      } else {
        console.log('❌ Connectivité internet: ÉCHEC');
        resolve(false);
      }
    });
    
    req.on('error', (err) => {
      console.log('❌ Connectivité internet: ÉCHEC -', err.message);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Connectivité internet: TIMEOUT');
      req.destroy();
      resolve(false);
    });
  });
}

// Test 2: Configuration Supabase
function testSupabaseConfig() {
  console.log('\n2️⃣ Test de configuration Supabase...');

  if (!SUPABASE_URL) {
    console.log('❌ URL Supabase: Non configurée (VITE_SUPABASE_URL manquante dans .env)');
    return false;
  } else {
    console.log('✅ URL Supabase: Configurée');
  }

  if (!SUPABASE_ANON_KEY) {
    console.log('❌ Clé Supabase: Non configurée (VITE_SUPABASE_ANON_KEY manquante dans .env)');
    return false;
  } else {
    console.log('✅ Clé Supabase: Configurée');
  }

  return true;
}

// Test 3: Connexion Supabase
async function testSupabaseConnection() {
  console.log('\n3️⃣ Test de connexion Supabase...');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Connexion Supabase: ÉCHEC -', error.message);
      return false;
    } else {
      console.log('✅ Connexion Supabase: OK');
      return true;
    }
  } catch (error) {
    console.log('❌ Connexion Supabase: ERREUR -', error.message);
    return false;
  }
}

// Test 4: Variables d'environnement
function testEnvironmentVariables() {
  console.log('\n4️⃣ Test des variables d\'environnement...');
  
  const envVars = {
    'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY,
    'VITE_APP_NAME': process.env.VITE_APP_NAME,
    'VITE_DEV_MODE': process.env.VITE_DEV_MODE
  };
  
  let allConfigured = true;
  
  Object.entries(envVars).forEach(([key, value]) => {
    if (!value) {
      console.log(`⚠️  ${key}: Non définie`);
      allConfigured = false;
    } else {
      console.log(`✅ ${key}: Définie`);
    }
  });
  
  return allConfigured;
}

// Fonction principale
async function runDiagnostics() {
  const results = {
    internet: false,
    config: false,
    supabase: false,
    env: false
  };
  
  try {
    results.internet = await testInternetConnection();
    results.config = testSupabaseConfig();
    results.supabase = await testSupabaseConnection();
    results.env = testEnvironmentVariables();
    
    console.log('\n📊 Résumé du diagnostic:');
    console.log('========================');
    console.log(`Internet: ${results.internet ? '✅' : '❌'}`);
    console.log(`Configuration: ${results.config ? '✅' : '⚠️'}`);
    console.log(`Supabase: ${results.supabase ? '✅' : '❌'}`);
    console.log(`Variables d'env: ${results.env ? '✅' : '⚠️'}`);
    
    console.log('\n💡 Recommandations:');
    if (!results.internet) {
      console.log('• Vérifiez votre connexion internet');
    }
    if (!results.config) {
      console.log('• Configurez vos variables d\'environnement');
    }
    if (!results.supabase) {
      console.log('• Vérifiez votre projet Supabase et ses clés API');
    }
    if (!results.env) {
      console.log('• Créez un fichier .env avec vos variables');
    }
    
    if (results.internet && results.supabase) {
      console.log('\n🎉 Tous les tests critiques sont passés !');
    } else {
      console.log('\n⚠️  Certains tests ont échoué. Vérifiez les recommandations ci-dessus.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
  }
}

// Exécuter le diagnostic
runDiagnostics(); 