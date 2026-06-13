# 🚀 Configuration Rapide Ringover - Click-to-Call

## ⚡ **Configuration en 3 étapes !**

### **Étape 1 : Exécuter le script de configuration**
```bash
node scripts/setup-ringover.js
```

### **Étape 2 : Ajouter votre clé API**
1. Ouvrez le fichier `.env` créé
2. Remplacez `YOUR_RINGOVER_API_KEY` par votre vraie clé API Ringover
3. Sauvegardez le fichier

### **Étape 3 : Vérifier la configuration**
```bash
node scripts/check-ringover-config.js
```

## 🔑 **Comment obtenir votre clé API Ringover ?**

1. **Connectez-vous** à votre compte Ringover
2. Allez dans **Paramètres** → **API** → **Clés API**
3. **Générez une nouvelle clé** ou copiez une existante
4. **Copiez la clé** dans votre fichier `.env`

## 📁 **Fichiers créés automatiquement**

- ✅ `src/services/ringoverService.ts` - Service API Ringover
- ✅ `src/components/common/CallButton.tsx` - Bouton d'appel
- ✅ `src/components/common/PhoneNumberDisplay.tsx` - Affichage numéro
- ✅ `src/components/common/ClientCallHeader.tsx` - En-tête client
- ✅ `src/config/ringover.ts` - Configuration
- ✅ `.env` - Variables d'environnement

## 🎯 **Exemple de fichier .env configuré**

```bash
# Configuration Ringover pour Click-to-Call
REACT_APP_RINGOVER_API_KEY=ringover_sk_abc123def456ghi789
REACT_APP_RINGOVER_BASE_URL=https://public-api.ringover.com/v2
```

## 🧪 **Test de la configuration**

1. **Redémarrez** votre serveur : `npm run dev`
2. **Ouvrez** une fiche client
3. **Cliquez** sur le bouton d'appel
4. **Vérifiez** les logs dans la console

## 🚨 **En cas de problème**

- **Vérifiez** que votre clé API est correcte
- **Exécutez** le script de vérification
- **Consultez** la documentation complète : `docs/RINGOVER_INTEGRATION.md`

---

**🎉 Votre ERP est maintenant prêt pour Ringover !**

Vos SDR peuvent appeler vos prospects en 1 clic ! 🚀
