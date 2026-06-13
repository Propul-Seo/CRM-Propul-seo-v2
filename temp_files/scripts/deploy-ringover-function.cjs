#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Déploiement de la fonction Edge Ringover');
console.log('==========================================\n');

// Vérifier que la fonction Edge existe
const functionPath = path.join(__dirname, '..', 'supabase', 'functions', 'ringover-call', 'index.ts');
if (!fs.existsSync(functionPath)) {
  console.error('❌ Fonction Edge non trouvée:', functionPath);
  process.exit(1);
}

console.log('✅ Fonction Edge trouvée:', functionPath);

// Instructions de déploiement
console.log('\n📋 ÉTAPES DE DÉPLOIEMENT :');
console.log('1. Assurez-vous que Supabase CLI est installé :');
console.log('   npm install -g supabase');
console.log('');

console.log('2. Connectez-vous à votre projet Supabase :');
console.log('   supabase login');
console.log('   supabase link --project-ref VOTRE_PROJECT_REF');
console.log('');

console.log('3. Déployez la fonction Edge :');
console.log('   supabase functions deploy ringover-call');
console.log('');

console.log('4. Configurez la variable d\'environnement RINGOVER_API_KEY :');
console.log('   supabase secrets set RINGOVER_API_KEY=86beace54c2f20043f96487617499b3bfbde123e');
console.log('');

console.log('5. Vérifiez le déploiement :');
console.log('   supabase functions list');
console.log('');

console.log('🔧 ALTERNATIVE - Configuration manuelle :');
console.log('1. Allez sur votre dashboard Supabase');
console.log('2. Section "Edge Functions" → "ringover-call"');
console.log('3. Copiez le code de src/supabase/functions/ringover-call/index.ts');
console.log('4. Section "Settings" → "Environment variables"');
console.log('5. Ajoutez RINGOVER_API_KEY = 86beace54c2f20043f96487617499b3bfbde123e');
console.log('');

console.log('🎯 APRÈS DÉPLOIEMENT :');
console.log('- Testez la connectivité dans le panneau de diagnostic');
console.log('- Le bouton "Appeler" devrait maintenant fonctionner');
console.log('- Plus de problèmes CORS !');

// Vérifier si Supabase CLI est installé
try {
  const { execSync } = require('child_process');
  const version = execSync('supabase --version', { encoding: 'utf8' });
  console.log('\n✅ Supabase CLI détecté:', version.trim());
} catch (error) {
  console.log('\n⚠️  Supabase CLI non détecté');
  console.log('   Installez-le avec : npm install -g supabase');
}
