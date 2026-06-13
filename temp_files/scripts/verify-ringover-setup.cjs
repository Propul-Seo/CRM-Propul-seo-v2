#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎯 Vérification finale de la configuration Ringover');
console.log('================================================\n');

// Couleurs pour la console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.bold}${msg}${colors.reset}`)
};

// Vérification complète
let allChecksPassed = true;
const checks = [];

// 1. Vérifier les fichiers requis
log.title('📁 Vérification des fichiers requis :');

const requiredFiles = [
  { path: 'src/services/ringoverService.ts', name: 'Service Ringover' },
  { path: 'src/components/common/CallButton.tsx', name: 'Composant CallButton' },
  { path: 'src/components/common/PhoneNumberDisplay.tsx', name: 'Composant PhoneNumberDisplay' },
  { path: 'src/components/common/ClientCallHeader.tsx', name: 'Composant ClientCallHeader' },
  { path: 'src/config/ringover.ts', name: 'Configuration Ringover' },
  { path: '.env', name: 'Fichier de configuration' }
];

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file.path);
  if (fs.existsSync(filePath)) {
    log.success(`${file.name} ✓`);
    checks.push({ name: file.name, status: 'success' });
  } else {
    log.error(`${file.name} manquant`);
    checks.push({ name: file.name, status: 'error' });
    allChecksPassed = false;
  }
});

// 2. Vérifier la configuration .env
log.title('\n🔑 Vérification de la configuration :');

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('REACT_APP_RINGOVER_API_KEY=')) {
    if (envContent.includes('YOUR_RINGOVER_API_KEY')) {
      log.warning('Clé API non configurée - Remplacez YOUR_RINGOVER_API_KEY par votre vraie clé');
      checks.push({ name: 'Configuration clé API', status: 'warning' });
    } else {
      // Vérifier si une vraie clé API est configurée (pas juste la variable vide)
      const apiKeyLine = envContent.split('\n').find(line => line.startsWith('REACT_APP_RINGOVER_API_KEY='));
      const apiKey = apiKeyLine ? apiKeyLine.split('=')[1] : '';
      
      if (apiKey && apiKey.length > 10) { // Une vraie clé API fait plus de 10 caractères
        log.success('Clé API configurée ✓');
        checks.push({ name: 'Configuration clé API', status: 'success' });
      } else {
        log.warning('Clé API configurée mais semble vide ou trop courte');
        checks.push({ name: 'Configuration clé API', status: 'warning' });
      }
    }
  } else {
    log.error('Variable REACT_APP_RINGOVER_API_KEY manquante');
    checks.push({ name: 'Configuration clé API', status: 'error' });
    allChecksPassed = false;
  }
  
  if (envContent.includes('REACT_APP_RINGOVER_BASE_URL=')) {
    log.success('URL de base configurée ✓');
    checks.push({ name: 'Configuration URL de base', status: 'success' });
  } else {
    log.error('Variable REACT_APP_RINGOVER_BASE_URL manquante');
    checks.push({ name: 'Configuration URL de base', status: 'error' });
    allChecksPassed = false;
  }
} else {
  log.error('Fichier .env non trouvé');
  checks.push({ name: 'Fichier .env', status: 'error' });
  allChecksPassed = false;
}

// 3. Vérifier l'intégration
log.title('\n🔗 Vérification de l\'intégration :');

const contactDetailsPath = path.join(process.cwd(), 'src/modules/ContactDetails/index.tsx');
if (fs.existsSync(contactDetailsPath)) {
  const contactDetailsContent = fs.readFileSync(contactDetailsPath, 'utf8');
  
  if (contactDetailsContent.includes('ClientCallHeader')) {
    log.success('Intégration dans ContactDetails ✓');
    checks.push({ name: 'Intégration ContactDetails', status: 'success' });
  } else {
    log.error('Intégration dans ContactDetails manquante');
    checks.push({ name: 'Intégration ContactDetails', status: 'error' });
    allChecksPassed = false;
  }
  
  if (contactDetailsContent.includes('getCurrentSdrId')) {
    log.success('Import de getCurrentSdrId ✓');
    checks.push({ name: 'Import getCurrentSdrId', status: 'success' });
  } else {
    log.error('Import de getCurrentSdrId manquant');
    checks.push({ name: 'Import getCurrentSdrId', status: 'error' });
    allChecksPassed = false;
  }
} else {
  log.error('Fichier ContactDetails non trouvé');
  checks.push({ name: 'Fichier ContactDetails', status: 'error' });
  allChecksPassed = false;
}

// 4. Résumé des vérifications
log.title('\n📊 Résumé des vérifications :');

const successCount = checks.filter(c => c.status === 'success').length;
const warningCount = checks.filter(c => c.status === 'warning').length;
const errorCount = checks.filter(c => c.status === 'error').length;

console.log(`\n${colors.green}✅ Succès : ${successCount}${colors.reset}`);
console.log(`${colors.yellow}⚠️  Avertissements : ${warningCount}${colors.reset}`);
console.log(`${colors.red}❌ Erreurs : ${errorCount}${colors.reset}`);

// 5. Recommandations
log.title('\n🎯 Recommandations :');

if (allChecksPassed && warningCount === 0) {
  log.success('Configuration complète ! Votre ERP est prêt pour Ringover !');
  console.log('\n🚀 Pour tester :');
  console.log('1. Redémarrez votre serveur : npm run dev');
  console.log('2. Ouvrez une fiche client');
  console.log('3. Cliquez sur le bouton d\'appel');
  console.log('4. Vérifiez les logs dans la console');
} else if (allChecksPassed && warningCount > 0) {
  log.warning('Configuration fonctionnelle mais incomplète');
  console.log('\n💡 Actions à effectuer :');
  console.log('1. Configurez votre clé API dans le fichier .env');
  console.log('2. Remplacez YOUR_RINGOVER_API_KEY par votre vraie clé');
  console.log('3. Redémarrez votre serveur');
} else {
  log.error('Configuration incomplète');
  console.log('\n🔧 Actions à effectuer :');
  console.log('1. Exécutez : node scripts/setup-ringover.cjs');
  console.log('2. Vérifiez que tous les composants sont créés');
  console.log('3. Configurez votre clé API');
}

// 6. Scripts disponibles
log.title('\n🛠️  Scripts disponibles :');

const scripts = [
  { name: 'setup-ringover.cjs', description: 'Configuration automatique' },
  { name: 'check-ringover-config.cjs', description: 'Vérification détaillée' },
  { name: 'test-ringover.cjs', description: 'Test rapide' },
  { name: 'verify-ringover-setup.cjs', description: 'Vérification finale (ce script)' }
];

scripts.forEach(script => {
  const scriptPath = path.join(process.cwd(), 'scripts', script.name);
  if (fs.existsSync(scriptPath)) {
    log.success(`${script.name} - ${script.description}`);
  } else {
    log.error(`${script.name} - Manquant`);
  }
});

// 7. Documentation
log.title('\n📚 Documentation :');

const docs = [
  { name: 'RINGOVER_QUICK_START.md', description: 'Guide de démarrage rapide' },
  { name: 'RINGOVER_SETUP.md', description: 'Configuration étape par étape' },
  { name: 'docs/RINGOVER_INTEGRATION.md', description: 'Documentation complète' }
];

docs.forEach(doc => {
  const docPath = path.join(process.cwd(), doc.name);
  if (fs.existsSync(docPath)) {
    log.success(`${doc.name} - ${doc.description}`);
  } else {
    log.error(`${doc.name} - Manquant`);
  }
});

console.log('\n' + '='.repeat(50));

if (allChecksPassed && warningCount === 0) {
  log.success('🎉 FÉLICITATIONS ! Votre ERP Ringover est 100% prêt !');
} else if (allChecksPassed) {
  log.warning('⚠️  Presque prêt ! Il ne vous reste qu\'à configurer votre clé API');
} else {
  log.error('❌ Configuration incomplète - Suivez les recommandations ci-dessus');
}

console.log('\n' + '='.repeat(50));
