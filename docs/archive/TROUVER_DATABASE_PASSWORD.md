# 🔐 Comment trouver le mot de passe de la base de données Supabase

Le CLI Supabase demande le mot de passe de la base de données pour établir la connexion.

---

## 📍 OÙ TROUVER LE MOT DE PASSE

### Option 1 : Dashboard Supabase (recommandé)

1. **Allez sur le Dashboard de votre projet :**
   - https://supabase.com/dashboard/project/tbuqctfgjjxnevmsvucl/settings/database

2. **Section "Database Password"**
   - Vous verrez votre mot de passe (ou un champ pour le définir)
   - Si vous ne vous en souvenez pas, vous pouvez le réinitialiser

3. **Réinitialiser le mot de passe (si nécessaire)**
   - Cliquez sur "Reset database password"
   - Un nouveau mot de passe sera généré
   - ⚠️ **Copiez-le immédiatement** (il ne sera affiché qu'une fois)

---

## 🔗 LIEN DIRECT

**Réinitialiser le mot de passe :**
https://supabase.com/dashboard/project/tbuqctfgjjxnevmsvucl/settings/database

---

## 📝 ALTERNATIVE : Utiliser la connexion sans mot de passe

Si vous ne voulez pas utiliser le mot de passe de la base de données, vous pouvez :

### Option A : Utiliser la connexion via l'API (sans mot de passe DB)
```bash
# Le lien peut fonctionner sans mot de passe si vous utilisez l'API uniquement
supabase link --project-ref tbuqctfgjjxnevmsvucl --password ""
```

### Option B : Passer directement au déploiement (si le lien n'est pas strictement nécessaire)
```bash
# Certaines opérations peuvent fonctionner sans lien local
supabase functions deploy admin-update-password --project-ref tbuqctfgjjxnevmsvucl
```

---

## ⚠️ IMPORTANT

- Le mot de passe de la base de données est **différent** de :
  - Votre mot de passe de compte Supabase
  - L'Access Token
  - Les API Keys (anon/service_role)

- C'est le mot de passe PostgreSQL de votre projet Supabase

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Allez sur : https://supabase.com/dashboard/project/tbuqctfgjjxnevmsvucl/settings/database
2. ✅ Trouvez ou réinitialisez le mot de passe
3. ✅ Copiez-le dans le terminal quand demandé
4. ✅ Continuez avec le déploiement

