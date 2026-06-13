# 🔑 Comment trouver votre Access Token Supabase

Pour déployer la fonction Edge `admin-update-password`, vous avez besoin d'un **Access Token** (token d'accès personnel).

---

## 📍 OÙ TROUVER L'ACCESS TOKEN

### ✅ BONNE PAGE : Access Tokens (Profil utilisateur)

1. **Cliquez sur votre profil** (en haut à droite du dashboard)
   - Icône de profil/avatar en haut à droite

2. **Sélectionnez "Access Tokens"** dans le menu déroulant
   - Ou allez directement sur : https://supabase.com/dashboard/account/tokens

3. **Créez un nouveau token** ou **copiez un token existant**
   - Cliquez sur "Generate new token"
   - Donnez-lui un nom (ex: "CLI Deployment")
   - Copiez le token (⚠️ il ne sera affiché qu'une seule fois)

---

## ❌ CE N'EST PAS ICI

### Page "JWT Keys" (ce que vous voyez actuellement)
- ❌ **JWT Secret** : Utilisé pour signer les tokens d'authentification de l'application
- ❌ **Access token expiry time** : Durée de validité des tokens utilisateurs
- ✅ Utile pour la configuration de l'app, mais **pas pour le CLI**

### Page "API Keys" (dans Project Settings)
- ✅ **anon key** : Clé publique pour le frontend
- ✅ **service_role key** : Clé admin (à garder secrète)
- ✅ Utile pour la configuration de l'app, mais **pas pour le CLI**

---

## 🚀 UTILISER L'ACCESS TOKEN

Une fois que vous avez votre Access Token :

### Option 1 : Variable d'environnement
```bash
export SUPABASE_ACCESS_TOKEN="votre-token-ici"
supabase link --project-ref tbuqctfgjjxnevmsvucl
supabase functions deploy admin-update-password
```

### Option 2 : Directement dans la commande
```bash
supabase login --token "votre-token-ici"
supabase link --project-ref tbuqctfgjjxnevmsvucl
supabase functions deploy admin-update-password
```

---

## 📝 RÉCAPITULATIF DES CLÉS

| Type | Où le trouver | Usage |
|------|---------------|-------|
| **Access Token** | Profil > Access Tokens | Authentification CLI Supabase |
| **JWT Secret** | Settings > JWT Keys | Signer les tokens Auth |
| **anon key** | Settings > API Keys | Frontend (publique) |
| **service_role key** | Settings > API Keys | Backend/Admin (secrète) |

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Allez sur votre profil (en haut à droite)
2. ✅ Cliquez sur "Access Tokens"
3. ✅ Créez ou copiez un token
4. ✅ Utilisez-le pour vous connecter au CLI

---

**Lien direct :** https://supabase.com/dashboard/account/tokens

