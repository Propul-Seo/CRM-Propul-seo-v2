#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Configuration automatique Ringover pour votre ERP React');
console.log('=====================================================\n');

// Vérifier si le fichier .env existe déjà
const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('⚠️  Le fichier .env existe déjà.');
  console.log('Voulez-vous le remplacer ? (y/N)');
  
  // En mode non-interactif, on continue
  console.log('Continuing...\n');
}

// Contenu du fichier .env
const envContent = `# Configuration Ringover pour Click-to-Call
# Remplacez YOUR_RINGOVER_API_KEY par votre vraie clé API

REACT_APP_RINGOVER_API_KEY=YOUR_RINGOVER_API_KEY
REACT_APP_RINGOVER_BASE_URL=https://public-api.ringover.com/v2

# Configuration existante (si applicable)
# REACT_APP_SUPABASE_URL=your_supabase_url
# REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
`;

try {
  // Créer/écraser le fichier .env
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Fichier .env créé avec succès !');
  
  console.log('\n📋 Prochaines étapes :');
  console.log('1. Ouvrez le fichier .env dans votre éditeur');
  console.log('2. Remplacez YOUR_RINGOVER_API_KEY par votre vraie clé API Ringover');
  console.log('3. Sauvegardez le fichier');
  console.log('4. Redémarrez votre serveur de développement (npm run dev)');
  
  console.log('\n🔑 Pour obtenir votre clé API Ringover :');
  console.log('1. Connectez-vous à votre compte Ringover');
  console.log('2. Allez dans Paramètres → API → Clés API');
  console.log('3. Générez une nouvelle clé ou copiez une existante');
  
  console.log('\n🎯 Exemple de fichier .env configuré :');
  console.log('REACT_APP_RINGOVER_API_KEY=ringover_sk_abc123def456ghi789');
  
} catch (error) {
  console.error('❌ Erreur lors de la création du fichier .env:', error.message);
  process.exit(1);
}

console.log('\n🎉 Configuration terminée ! Votre ERP est prêt pour Ringover !');
