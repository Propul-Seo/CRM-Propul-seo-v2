# Brevo (Sendinblue) — Runbook Propul'Space

Document opérationnel pour configurer le **Custom SMTP Brevo** afin que les emails Auth Supabase (invitation portail, reset password, magic link) sortent au nom de Propul'Seo et non plus avec le branding LOCAGAME hérité du projet Supabase partagé.

---

## 1. Pourquoi ?

Le projet Supabase ERP est mutualisé entre LOCAGAME et Propul'Seo. Sans Custom SMTP :
- Les emails Auth (invitation, reset, magic link) partent depuis l'IP/domaine Supabase générique
- Branding "LOCAGAME" parfois visible (R-004 documenté dans PROGRESS_PROPULSPACE.md)
- Taux de spam élevé (réputation IP partagée)
- Aucun tracking côté Propul'Seo

Brevo Custom SMTP résout : on connecte Supabase Auth à Brevo via SMTP relayé, les emails sortent du domaine Propul'Seo, avec son DKIM/SPF et son IP de réputation.

---

## 2. Création du compte Brevo

1. https://www.brevo.com/fr/ — créer le compte au nom de **Propul'Seo SAS** (ne pas réutiliser un compte personnel).
2. Plan **Free** suffit pour démarrer (300 emails/jour). Passer au plan **Lite** (~25€/mois pour 20k emails/mois) si volume > 300/jour.
3. Renseigner les infos entreprise (SIREN, secteur, RGPD).

---

## 3. Authentification du domaine d'envoi

⚠️ **Étape critique pour la délivrabilité.** Sans authentification de domaine, les emails arrivent quasi systématiquement en spam.

### 3.1 Ajouter `propulseo-site.com` dans Brevo

Brevo Dashboard → **Senders & IP** → **Senders** → **Add a sender** :
- Type : `Domain` (pas Single email)
- Domain : `propulseo-site.com`

### 3.2 Configurer les DNS (chez votre registrar — OVH, Gandi, etc.)

Brevo affiche 3 entrées DNS à ajouter :

| Type | Hôte | Valeur (exemple — Brevo fournit la vraie) |
|---|---|---|
| TXT (SPF) | `@` ou racine | `v=spf1 include:spf.sendinblue.com mx ~all` |
| TXT (DKIM) | `mail._domainkey` | `k=rsa; p=MIGfMA0GCSqGSIb3DQE...` |
| CNAME (DKIM bis) | `dkim1._domainkey` | `dkim1.sendinblue.com` |

Si un SPF existe déjà (pour Gmail Workspace par exemple), **ne PAS en créer un deuxième** — fusionner les `include:` :
```
v=spf1 include:_spf.google.com include:spf.sendinblue.com ~all
```

Attendre 30 min – 2h pour la propagation DNS, puis cliquer "Authenticate this domain" dans Brevo. Les 3 entrées doivent passer ✅.

### 3.3 Bonus : DMARC

Recommandé pour la délivrabilité. Ajouter une 4e entrée TXT :

| Type | Hôte | Valeur |
|---|---|---|
| TXT (DMARC) | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@propulseo-site.com` |

Démarrer en `p=none` (monitor only) pendant 2-3 semaines, puis passer en `p=quarantine` quand on est sûr que tout passe.

---

## 4. Récupérer la clé SMTP

Brevo Dashboard → **SMTP & API** → **SMTP** :

- Server : `smtp-relay.brevo.com`
- Port : `587` (STARTTLS recommandé) ou `465` (SSL)
- Login : votre adresse email Brevo (celle du compte)
- **SMTP key** : cliquer "Generate a new SMTP key" → copier (commence par `xkeysib-…`)

⚠️ Cette clé donne accès à l'envoi sur votre quota Brevo — **à ne pas commiter**.

---

## 5. Configurer Supabase Auth pour utiliser Brevo

Supabase Dashboard → **Authentication** → **Settings** → section **SMTP Settings** :

| Champ | Valeur |
|---|---|
| Enable Custom SMTP | ✅ activé |
| Sender email | `no-reply@propulseo-site.com` (ou autre, doit appartenir au domaine authentifié) |
| Sender name | `Propul'Seo` |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | (votre login Brevo, l'adresse email du compte) |
| Password | (la SMTP key `xkeysib-…`) |
| Minimum interval between emails per user | `60` secondes (rate-limit) |

Sauvegarder. Supabase enverra désormais les emails Auth via Brevo.

---

## 6. Personnaliser les templates Auth

Supabase Dashboard → **Authentication** → **Email Templates** :

4 templates à customiser (HTML) :

| Template | Quand | Action |
|---|---|---|
| **Invite user** | Nouvel utilisateur (côté admin `inviteUserByEmail`) | A.2a — invitation portail client |
| **Magic Link** | `signInWithOtp` | A.2b — fallback magic link sur la page login |
| **Reset Password** | `resetPasswordForEmail` | A.2b — flow mot de passe oublié |
| **Confirm signup** | `signUp` (mais on a `shouldCreateUser: false`, donc rarement utilisé) | Garde le défaut |

Pour chacun :
- Subject : adapter au branding Propul'Seo (ex. `Votre accès à Propul'Space`)
- HTML body : remplacer la signature LOCAGAME par Propul'Seo + logo (URL publique du logo Propul'Seo hébergé)
- Variables disponibles : `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .Token }}`

Un template propre = un client qui clique sans hésiter. Investir 30 min ici fait gagner en taux de conversion.

### Exemple minimal (Invite user)

```html
<h2>Bienvenue sur Propul'Space</h2>
<p>Votre agence Propul'Seo vous a invité à accéder à votre espace client.</p>
<p>
  <a href="{{ .ConfirmationURL }}"
     style="background:linear-gradient(135deg, #7c3aed, #ec4899); color:white;
            padding:12px 24px; border-radius:8px; text-decoration:none;
            display:inline-block; font-weight:600;">
    Définir mon mot de passe
  </a>
</p>
<p style="color:#666; font-size:13px;">
  Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce mail.
</p>
<p style="color:#666; font-size:12px;">
  — L'équipe Propul'Seo<br>
  <a href="https://propulseo-site.com">propulseo-site.com</a>
</p>
```

---

## 7. Tester

### 7.1 Test côté Brevo

Brevo Dashboard → **Transactional** → **Statistics**. Après chaque email envoyé par Supabase, on voit la ligne ici (Send, Delivered, Open, Click, etc.).

### 7.2 Test côté Propul'Space

Procédure de test end-to-end :

1. Admin CRM → fiche projet → "Activer le portail" → renseigner un email perso (ex. `votre.email+test1@gmail.com`).
2. Vérifier que l'email reçu est branding Propul'Seo (pas LOCAGAME).
3. Cliquer le lien → atterrir sur `/espace-client/setup-password` → définir mdp.
4. Se déconnecter → `/espace-client/login` → "Mot de passe oublié" → email reçu (vérifier branding).

---

## 8. Côté code (variables d'env optionnelles)

Pour l'instant on n'appelle PAS l'API Brevo directement depuis le code — tout passe par Supabase Auth → SMTP Brevo. Donc **aucune variable côté repo**.

Si on veut plus tard envoyer des emails transactionnels custom (paiement reçu, kickoff confirmé, etc.) via l'API Brevo plutôt que via Supabase :

- Ajouter dans `.env.example` :
  ```
  BREVO_API_KEY=xkeysib-...
  BREVO_SENDER_EMAIL=no-reply@propulseo-site.com
  BREVO_SENDER_NAME=Propul'Seo
  ```
- Créer une edge function `send-transactional-email` qui prend `{ template_id, to, params }` et call `https://api.brevo.com/v3/smtp/email`.
- Stub Brevo déjà présent dans le code (R-006) — à activer.

À planifier Sprint B+ post-paiement Stripe (notif "paiement reçu" au client).

---

## 9. Diagnostic

### Les emails partent toujours avec branding LOCAGAME
- Vérifier que "Enable Custom SMTP" est bien activé côté Supabase (toggle).
- Vérifier que les templates ont été modifiés (par défaut Supabase = templates LOCAGAME hérités).
- Forcer un test pour voir.

### Les emails arrivent en spam
- DKIM/SPF/DMARC tous à ✅ dans Brevo ? (cf §3)
- Vérifier la réputation IP : Brevo → "Senders & IP" → IP score.
- Brevo Free utilise une IP partagée (réputation moins bonne). Passer en Lite si volume justifie.
- Tester avec https://www.mail-tester.com/ depuis Supabase.

### Erreur SMTP "Auth failed"
- Login = adresse email du compte Brevo, pas la "sender email" (`no-reply@…`).
- Password = la SMTP key (`xkeysib-…`), pas le mot de passe de compte Brevo.

### Rate-limit
- Brevo Free : 300 emails/jour, 9 emails/seconde max.
- Supabase Auth : 4 emails/heure/utilisateur par défaut (configurable côté Auth Settings).
- Si dépassement : passer en Lite ou augmenter la limite Supabase.

---

## 10. État & TODO

- [ ] Compte Brevo créé
- [ ] Domaine `propulseo-site.com` authentifié (SPF + DKIM)
- [ ] Custom SMTP activé côté Supabase Auth
- [ ] 3 templates personnalisés (Invite / Magic Link / Reset Password)
- [ ] Test E2E sur compte perso
- [ ] DMARC configuré (optionnel, V2)
- [ ] Edge function `send-transactional-email` pour notifs custom (post-Stripe)
