# 🚀 Guide de Déploiement Ringover - Fonction Edge Supabase

## ❌ Problème Identifié
L'API Ringover bloque les requêtes directes depuis le navigateur (erreur CORS). La solution est d'utiliser une **fonction Edge Supabase** qui fait l'appel côté serveur.

## ✅ Solution Implémentée
- ✅ Fonction Edge `ringover-call` créée
- ✅ Service client modifié pour utiliser la fonction Edge
- ✅ Plus de problèmes CORS

## 🚀 Déploiement Rapide

### Option 1: Via Supabase CLI (Recommandé)

```bash
# 1. Installer Supabase CLI
npm install -g supabase

# 2. Se connecter
supabase login

# 3. Lier le projet (remplacez VOTRE_PROJECT_REF)
supabase link --project-ref VOTRE_PROJECT_REF

# 4. Déployer la fonction
supabase functions deploy ringover-call

# 5. Configurer l'API key
supabase secrets set RINGOVER_API_KEY=86beace54c2f20043f96487617499b3bfbde123e
```

### Option 2: Via Dashboard Supabase (Manuel)

1. **Allez sur votre dashboard Supabase**
2. **Section "Edge Functions"**
3. **Cliquez "New Function"**
4. **Nom: `ringover-call`**
5. **Copiez le code de `supabase/functions/ringover-call/index.ts`**
6. **Section "Settings" → "Environment variables"**
7. **Ajoutez: `RINGOVER_API_KEY = 86beace54c2f20043f96487617499b3bfbde123e`**

## 🧪 Test Après Déploiement

1. **Rafraîchissez votre page**
2. **Ouvrez une fiche client**
3. **Cliquez sur "Test Connectivité" dans le panneau orange**
4. **Cliquez sur "Test Appel"**
5. **Testez le bouton vert "Appeler" principal**

## 🔍 Vérification

- ✅ **Connectivité**: Devrait retourner `true`
- ✅ **Test Appel**: Devrait réussir
- ✅ **Bouton Appeler**: Devrait être cliquable
- ❌ **Plus d'erreurs CORS**

## 🆘 En Cas de Problème

1. **Vérifiez que la fonction est déployée**: `supabase functions list`
2. **Vérifiez les variables d'environnement**: `supabase secrets list`
3. **Regardez les logs**: Dashboard Supabase → Edge Functions → Logs
4. **Vérifiez la console du navigateur** pour les erreurs détaillées

## 📱 Fonctionnalités Disponibles

- ✅ **Click-to-Call** via Ringover
- ✅ **Gestion des erreurs** complète
- ✅ **Logs de débogage** détaillés
- ✅ **Interface utilisateur** intuitive
- ✅ **Pas de problèmes CORS**

---

**🎯 Objectif**: Remplacer les appels directs à l'API Ringover par des appels via la fonction Edge Supabase, éliminant ainsi les problèmes CORS et permettant au bouton "Appeler" de fonctionner correctement.
