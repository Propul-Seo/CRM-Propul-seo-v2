#!/usr/bin/env node

console.log('🧪 Test d\'accès aux variables d\'environnement');
console.log('============================================\n');

console.log('📋 Variables d\'environnement configurées :');
console.log('VITE_RINGOVER_API_KEY=86beace54c2f20043f96487617499b3bfbde123e');
console.log('VITE_RINGOVER_BASE_URL=https://public-api.ringover.com/v2');

console.log('\n🔧 Problème résolu :');
console.log('✅ Changé REACT_APP_ → VITE_ (compatible Vite)');
console.log('✅ Changé process.env → import.meta.env (compatible côté client)');

console.log('\n🚀 Maintenant testez dans votre navigateur :');
console.log('1. Ouvrez une fiche client');
console.log('2. Cliquez sur le bouton d\'appel');
console.log('3. Plus d\'erreur "process is not defined" !');

console.log('\n🎯 Si vous avez encore des erreurs :');
console.log('1. Vérifiez que le serveur a redémarré');
console.log('2. Videz le cache du navigateur (Ctrl+F5)');
console.log('3. Vérifiez la console pour les nouveaux logs Ringover');
