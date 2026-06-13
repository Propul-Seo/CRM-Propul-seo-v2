# 🚀 Guide de Déploiement - Edge Function admin-update-password

**Date :** 5 janvier 2025  
**Project ID :** `tbuqctfgjjxnevmsvucl`  
**Fonction :** `admin-update-password`

---

## 📋 PRÉREQUIS

1. ✅ Supabase CLI installé (`supabase` command)
2. ✅ Compte Supabase avec accès au projet
3. ✅ Token d'accès Supabase (Access Token)

---

## 🔐 ÉTAPE 1 : Se connecter à Supabase CLI

### Option A : Login interactif (recommandé)
```bash
supabase login
```
Cela ouvrira votre navigateur pour vous authentifier.

### Option B : Utiliser un token d'accès
```bash
# Définir le token comme variable d'environnement
export SUPABASE_ACCESS_TOKEN="votre-token-ici"

# Ou l'utiliser directement dans la commande
supabase login --token "votre-token-ici"
```

**Comment obtenir un Access Token :**
1. Allez sur https://supabase.com/dashboard
2. Cliquez sur votre profil (en haut à droite)
3. Allez dans "Access Tokens"
4. Créez un nouveau token ou utilisez un token existant

---

## 🔗 ÉTAPE 2 : Lier le projet Supabase

```bash
cd /Users/guimbard/Downloads/CRMPropulseo-main-1
supabase link --project-ref tbuqctfgjjxnevmsvucl
```

**Résultat attendu :**
```
Finished supabase link.
```

---

## 📦 ÉTAPE 3 : Déployer la fonction Edge

```bash
supabase functions deploy admin-update-password
```

**Résultat attendu :**
```
Deploying admin-update-password (project ref: tbuqctfgjjxnevmsvucl)
Deployed Function admin-update-password (https://tbuqctfgjjxnevmsvucl.supabase.co/functions/v1/admin-update-password)
```

---

## ✅ ÉTAPE 4 : Vérifier les variables d'environnement

### Variables automatiques (déjà disponibles)
Supabase fournit automatiquement ces variables aux Edge Functions :
- ✅ `SUPABASE_URL` - URL de votre projet
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Clé service role (admin)
- ✅ `SUPABASE_ANON_KEY` - Clé anonyme

**Vérification dans le Dashboard :**
1. Allez sur https://supabase.com/dashboard/project/tbuqctfgjjxnevmsvucl
2. Naviguez vers **Project Settings > Edge Functions**
3. Vérifiez que les variables sont listées

### Variables personnalisées (si nécessaire)
Si vous avez besoin de variables personnalisées :
```bash
supabase secrets set MY_CUSTOM_VAR=value
```

---

## 🔧 ÉTAPE 5 : Vérifier la configuration frontend

### Fichier `.env` ou `.env.local`
Assurez-vous que ces variables sont définies :

```env
VITE_SUPABASE_URL=<URL Supabase du projet>
VITE_SUPABASE_ANON_KEY=<récupérer depuis Supabase Dashboard → Settings → API Keys>
```

**Note :** Ces valeurs sont déjà configurées par défaut dans `src/lib/supabase.ts`, mais il est recommandé d'utiliser des variables d'environnement pour la production.

---

## 🧪 ÉTAPE 6 : Tester la fonction

### Test manuel via curl
```bash
# Récupérer votre token d'accès (depuis le frontend)
# Puis tester :
curl -X POST \
  https://tbuqctfgjjxnevmsvucl.supabase.co/functions/v1/admin-update-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": "user-uuid-here",
    "newPassword": "newpassword123"
  }'
```

### Test depuis le frontend
La fonction est déjà intégrée dans `src/modules/Settings/index.tsx` :
- Seuls les administrateurs (email: `team@propulseo-site.com`) peuvent utiliser cette fonction
- Accessible depuis la page Settings > Gestion des utilisateurs

---

## 📝 DÉTAILS DE LA FONCTION

### Sécurité
- ✅ Vérification de l'authentification (token requis)
- ✅ Vérification du rôle admin (email: `team@propulseo-site.com`)
- ✅ Validation du mot de passe (minimum 6 caractères)
- ✅ Protection contre l'auto-modification de l'admin

### Paramètres
```typescript
{
  targetUserId: string;  // UUID de l'utilisateur cible
  newPassword: string;   // Nouveau mot de passe (min 6 caractères)
}
```

### Réponse
```typescript
{
  success: boolean;
  message?: string;
  error?: string;
}
```

---

## 🔍 VÉRIFICATION POST-DÉPLOIEMENT

1. **Vérifier le déploiement :**
   ```bash
   supabase functions list
   ```

2. **Voir les logs :**
   ```bash
   supabase functions logs admin-update-password
   ```

3. **Tester depuis l'interface :**
   - Aller sur Settings > Gestion des utilisateurs
   - Cliquer sur "Modifier le mot de passe" pour un utilisateur
   - Vérifier que la modification fonctionne

---

## ❌ DÉPANNAGE

### Erreur : "Access token not provided"
```bash
# Solution : Se connecter d'abord
supabase login
```

### Erreur : "Project not linked"
```bash
# Solution : Lier le projet
supabase link --project-ref tbuqctfgjjxnevmsvucl
```

### Erreur : "Function not found"
```bash
# Solution : Vérifier que vous êtes dans le bon répertoire
cd /Users/guimbard/Downloads/CRMPropulseo-main-1
supabase functions deploy admin-update-password
```

### Erreur : "Configuration Supabase manquante"
- Vérifiez que les variables d'environnement sont définies dans le Dashboard Supabase
- Les variables `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` doivent être disponibles

---

## 📚 RESSOURCES

- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Project Dashboard](https://supabase.com/dashboard/project/tbuqctfgjjxnevmsvucl)

---

**Status :** ✅ Fonction prête à être déployée  
**Localisation :** `supabase/functions/admin-update-password/index.ts`

