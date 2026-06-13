#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Test rapide de la configuration Ringover');
console.log('==========================================\n');

// Vérifier que tous les composants sont présents
const requiredFiles = [
  'src/services/ringoverService.ts',
  'src/components/common/CallButton.tsx',
  'src/components/common/PhoneNumberDisplay.tsx',
  'src/components/common/ClientCallHeader.tsx',
  'src/config/ringover.ts',
  '.env'
];

console.log('📁 Vérification des fichiers requis :');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} ✓`);
  } else {
    console.log(`❌ ${file} manquant`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Certains fichiers sont manquants !');
  console.log('💡 Exécutez d\'abord : node scripts/setup-ringover.cjs');
  process.exit(1);
}

// Vérifier la configuration
console.log('\n🔑 Vérification de la configuration :');
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

if (envContent.includes('YOUR_RINGOVER_API_KEY')) {
  console.log('⚠️  Clé API non configurée');
  console.log('💡 Remplacez YOUR_RINGOVER_API_KEY par votre vraie clé dans le fichier .env');
} else if (envContent.includes('REACT_APP_RINGOVER_API_KEY=')) {
  console.log('✅ Clé API configurée ✓');
} else {
  console.log('❌ Variable REACT_APP_RINGOVER_API_KEY manquante');
}

// Vérifier l'intégration dans ContactDetails
console.log('\n🔗 Vérification de l\'intégration :');
const contactDetailsPath = path.join(process.cwd(), 'src/modules/ContactDetails/index.tsx');
if (fs.existsSync(contactDetailsPath)) {
  const contactDetailsContent = fs.readFileSync(contactDetailsPath, 'utf8');
  
  if (contactDetailsContent.includes('ClientCallHeader')) {
    console.log('✅ Intégration dans ContactDetails ✓');
  } else {
    console.log('❌ Intégration dans ContactDetails manquante');
  }
  
  if (contactDetailsContent.includes('getCurrentSdrId')) {
    console.log('✅ Import de getCurrentSdrId ✓');
  } else {
    console.log('❌ Import de getCurrentSdrId manquant');
  }
}

console.log('\n🎯 Prochaines étapes :');
console.log('1. Configurez votre clé API Ringover dans le fichier .env');
console.log('2. Redémarrez votre serveur : npm run dev');
console.log('3. Ouvrez une fiche client et testez le bouton d\'appel');
console.log('4. Vérifiez les logs dans la console du navigateur');

console.log('\n📚 Documentation complète : docs/RINGOVER_INTEGRATION.md');
console.log('🔧 Script de vérification : node scripts/check-ringover-config.cjs');

console.log('\n🎉 Configuration prête ! Il ne vous reste qu\'à ajouter votre clé API !');
