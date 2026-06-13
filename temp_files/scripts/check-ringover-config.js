#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration Ringover');
console.log('==========================================\n');

// Vérifier le fichier .env
const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ Fichier .env non trouvé !');
  console.log('💡 Exécutez : node scripts/setup-ringover.js');
  process.exit(1);
}

// Lire le fichier .env
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  console.log('📁 Fichier .env trouvé ✓');
  
  // Vérifier les variables Ringover
  let ringoverApiKey = '';
  let ringoverBaseUrl = '';
  
  lines.forEach(line => {
    if (line.startsWith('REACT_APP_RINGOVER_API_KEY=')) {
      ringoverApiKey = line.split('=')[1];
    }
    if (line.startsWith('REACT_APP_RINGOVER_BASE_URL=')) {
      ringoverBaseUrl = line.split('=')[1];
    }
  });
  
  console.log('\n🔑 Variables Ringover :');
  
  if (ringoverApiKey && ringoverApiKey !== 'YOUR_RINGOVER_API_KEY') {
    console.log('✅ REACT_APP_RINGOVER_API_KEY : Configurée ✓');
    console.log(`   Valeur : ${ringoverApiKey.substring(0, 10)}...`);
  } else {
    console.log('❌ REACT_APP_RINGOVER_API_KEY : Non configurée');
    console.log('   💡 Remplacez YOUR_RINGOVER_API_KEY par votre vraie clé');
  }
  
  if (ringoverBaseUrl) {
    console.log('✅ REACT_APP_RINGOVER_BASE_URL : Configurée ✓');
    console.log(`   Valeur : ${ringoverBaseUrl}`);
  } else {
    console.log('❌ REACT_APP_RINGOVER_BASE_URL : Manquante');
  }
  
  // Vérifier les composants
  console.log('\n🧩 Composants Ringover :');
  
  const components = [
    'src/services/ringoverService.ts',
    'src/components/common/CallButton.tsx',
    'src/components/common/PhoneNumberDisplay.tsx',
    'src/components/common/ClientCallHeader.tsx',
    'src/config/ringover.ts'
  ];
  
  let allComponentsExist = true;
  
  components.forEach(component => {
    const componentPath = path.join(process.cwd(), component);
    if (fs.existsSync(componentPath)) {
      console.log(`✅ ${component} ✓`);
    } else {
      console.log(`❌ ${component} manquant`);
      allComponentsExist = false;
    }
  });
  
  // Vérifier l'intégration dans ContactDetails
  const contactDetailsPath = path.join(process.cwd(), 'src/modules/ContactDetails/index.tsx');
  if (fs.existsSync(contactDetailsPath)) {
    const contactDetailsContent = fs.readFileSync(contactDetailsPath, 'utf8');
    if (contactDetailsContent.includes('ClientCallHeader')) {
      console.log('✅ Intégration dans ContactDetails ✓');
    } else {
      console.log('❌ Intégration dans ContactDetails manquante');
    }
  }
  
  console.log('\n📊 Résumé :');
  
  if (ringoverApiKey && ringoverApiKey !== 'YOUR_RINGOVER_API_KEY' && allComponentsExist) {
    console.log('🎉 Configuration complète ! Votre ERP est prêt pour Ringover !');
    console.log('\n🚀 Pour tester :');
    console.log('1. Redémarrez votre serveur : npm run dev');
    console.log('2. Ouvrez une fiche client');
    console.log('3. Cliquez sur le bouton d\'appel');
    console.log('4. Vérifiez les logs dans la console');
  } else {
    console.log('⚠️  Configuration incomplète');
    console.log('\n💡 Actions à effectuer :');
    if (!ringoverApiKey || ringoverApiKey === 'YOUR_RINGOVER_API_KEY') {
      console.log('1. Configurez votre clé API dans le fichier .env');
    }
    if (!allComponentsExist) {
      console.log('2. Vérifiez que tous les composants sont créés');
    }
  }
  
} catch (error) {
  console.error('❌ Erreur lors de la vérification :', error.message);
  process.exit(1);
}
