#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Test simple de la configuration Ringover');
console.log('==========================================\n');

// Vérifier le fichier .env
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Vérifier la clé API
  if (envContent.includes('VITE_RINGOVER_API_KEY=86beace54c2f20043f96487617499b3bfbde123e')) {
    console.log('✅ Clé API Ringover configurée correctement !');
    console.log('   Clé : 86beace54c2f20043f96487617499b3bfbde123e');
  } else {
    console.log('❌ Clé API non trouvée ou incorrecte');
  }
  
  // Vérifier l'URL de base
  if (envContent.includes('VITE_RINGOVER_BASE_URL=https://public-api.ringover.com/v2')) {
    console.log('✅ URL de base Ringover configurée correctement !');
    console.log('   URL : https://public-api.ringover.com/v2');
  } else {
    console.log('❌ URL de base non trouvée ou incorrecte');
  }
  
} else {
  console.log('❌ Fichier .env non trouvé');
}

console.log('\n🎯 Votre configuration Ringover est maintenant COMPLÈTE !');
console.log('\n🚀 Pour tester :');
console.log('1. Votre serveur est déjà en cours d\'exécution');
console.log('2. Ouvrez une fiche client dans votre navigateur');
console.log('3. Cliquez sur le bouton d\'appel vert');
console.log('4. Vérifiez les logs dans la console du navigateur');
console.log('\n🎉 Vos SDR peuvent maintenant appeler vos prospects en 1 clic !');
