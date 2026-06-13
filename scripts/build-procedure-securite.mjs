// Génère la migration SQL pour seed la fiche "Guide de sécurité — Vérifier
// qu'un site est sécurisé avant rendu" + crée la catégorie Sécurité.
// Run: node scripts/build-procedure-securite.mjs
// Écrit: supabase/migrations/20260429_seed_procedure_securite.sql

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { markdownToTiptap, plainText } from './md-to-tiptap.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '..', 'supabase', 'migrations', '20260429_seed_procedure_securite.sql')

const TITLE = 'Guide de sécurité — Vérifier qu\'un site est sécurisé avant rendu'
const SLUG = 'guide-securite-verification-avant-rendu'
const CATEGORY_SLUG = 'securite'
const TAGS = ['securite', 'rgpd', 'owasp', 'checklist', 'rendu-client', 'qualite']
const SUMMARY = 'Document interne Propul\'seo : 12 contrôles à faire avant tout rendu client (HTTPS, en-têtes, accès, OWASP, dépendances, secrets, email, RGPD, sauvegardes, monitoring, pages erreur). Outils gratuits, seuils de blocage, checklist finale.'

const MARKDOWN = String.raw`# 🛡️ Guide de sécurité — Propul'seo

## Comment vérifier qu'un site web est vraiment sécurisé, **même quand on n'est pas développeur**

> **Document interne Propul'seo** · Version 2.0
> Pour Lyes, Etienne, et toute personne qui valide un projet avant rendu client.

## 🎯 Pourquoi ce document existe

On ne livre **jamais** un site sans avoir vérifié qu'il est sécurisé. Pas par perfectionnisme, mais parce que les chiffres sont sans appel :

- **60 % des PME** victimes d'une cyberattaque majeure déposent le bilan dans les 18 mois (source : ANSSI).
- **Plus de la moitié des entreprises françaises** ont subi au moins une cyberattaque en 2023.
- **80 % des grandes fuites de données en 2024** ont été permises par un simple mot de passe sans double authentification (source : CNIL).
- Une faille RGPD peut coûter jusqu'à **10 millions d'euros ou 2 % du chiffre d'affaires** au client.

**Notre engagement chez Propul'seo :** quand on livre un site, le client n'a pas à se demander s'il est protégé. Nous l'avons vérifié pour lui.

## 📖 Comment lire ce document

Chaque test est expliqué en 5 parties :

1. **🤔 C'est quoi ?** — En langage simple, avec une analogie de la vie courante.
2. **⚠️ Ce qui peut arriver** — Un scénario réel si on ne fait rien.
3. **🔍 Comment vérifier** — L'outil gratuit à utiliser et où cliquer.
4. **✅ La note minimum** — Le seuil en-dessous duquel on ne livre pas.
5. **🛠️ Si problème** — Qui s'en occupe.

### Code couleur

- 🟥 **VITAL** — Sans ça, le site est en danger immédiat. **Blocage du rendu** tant que ce n'est pas corrigé.
- 🟧 **IMPORTANT** — Risque réel mais pas immédiat. À corriger avant rendu sauf justification écrite.
- 🟨 **RECOMMANDÉ** — Bonne pratique professionnelle. Idéalement fait, sinon noté dans le rapport.

## 🗂️ Sommaire

1. La porte d'entrée du site (HTTPS)
2. Les serrures supplémentaires (en-têtes de sécurité)
3. Les mots de passe et accès
4. Les pirates qui essaient d'entrer (OWASP Top 10)
5. Les pièces détachées du site (dépendances)
6. Les secrets (clés et mots de passe dans le code)
7. Les emails (SPF, DKIM, DMARC)
8. Le RGPD et les cookies
9. Les sauvegardes (la copie de secours)
10. La surveillance (le système d'alarme)
11. La page d'erreur (que se passe-t-il quand ça plante ?)
12. Le test final avant rendu

---

## 1. La porte d'entrée du site : est-ce qu'on peut écouter aux portes ?

### 🤔 C'est quoi ?

Quand un visiteur va sur un site, son ordinateur **discute** avec le serveur du site. Il envoie son nom, son adresse, parfois sa carte bancaire. Cette conversation peut se faire de deux façons :

- **HTTP** (sans le S) → c'est comme **envoyer une carte postale**. Tout le monde sur le chemin (le facteur, les voisins, le café Wi-Fi) peut lire ce qui est écrit dessus.
- **HTTPS** (avec le S) → c'est comme **envoyer une lettre dans une enveloppe scellée**. Personne ne peut la lire pendant le trajet.

Le HTTPS repose sur ce qu'on appelle un **certificat SSL/TLS**. C'est en quelque sorte la **carte d'identité numérique** du site, qui prouve aussi au visiteur qu'il est bien sur le bon site (et pas sur une copie pirate).

### ⚠️ Ce qui peut arriver

- Un client se connecte au Wi-Fi gratuit d'un café et remplit le formulaire de contact du site. Un pirate à 3 tables de là **lit en clair son nom, son email et son numéro de téléphone**.
- Pire : sur un site de e-commerce sans HTTPS, le pirate intercepte directement les **numéros de carte bancaire**.
- Google affiche un gros message rouge **"Site non sécurisé"** aux visiteurs → ils fuient → vous perdez vos clients.
- Le site est **déclassé** dans les résultats Google (le HTTPS est un critère de référencement officiel depuis 2014).

### 🔍 Comment vérifier

**Outil gratuit : [SSL Labs](https://www.ssllabs.com/ssltest/)** (la référence mondiale, utilisé par tous les pros)

1. Ouvrir [https://www.ssllabs.com/ssltest/](https://www.ssllabs.com/ssltest/)
2. Taper l'adresse du site (ex : ` + '`monsite.fr`' + `)
3. Cocher **"Do not show the results on the boards"** (pour ne pas afficher publiquement)
4. Cliquer sur **Submit**
5. Attendre 1-2 minutes
6. Lire la note (de A+ à F)

**Vérifications complémentaires :**

- Taper ` + '`http://monsite.fr`' + ` dans le navigateur → ça doit **automatiquement** rediriger vers ` + '`https://`' + `
- Le cadenas doit être visible et fermé dans la barre d'adresse du navigateur
- Cliquer sur le cadenas pour vérifier que le certificat est bien valide et pas expiré

### ✅ La note minimum

🟥 **VITAL** — Note **A** minimum sur SSL Labs. On vise toujours le **A+**.

🟥 **VITAL** — Toute connexion en HTTP doit être automatiquement redirigée en HTTPS.

### 🛠️ Si problème

Le développeur active le certificat (Let's Encrypt = gratuit, intégré dans Vercel et la plupart des hébergeurs) et configure la redirection HTTP → HTTPS.

---

## 2. Les serrures supplémentaires : les en-têtes de sécurité

### 🤔 C'est quoi ?

Imaginez votre maison. Vous avez **une porte d'entrée**, c'est bien. Mais une porte seule ne suffit pas : vous ajoutez **un verrou multipoints, un judas, une chaîne de sûreté, une alarme**. Chacun protège contre un type d'intrusion différent.

Sur un site web, c'est pareil. À côté du HTTPS (la porte), il y a **6 ou 7 "serrures"** invisibles qu'on appelle **en-têtes de sécurité (security headers)**. Ce sont des instructions que le site envoie au navigateur du visiteur, du genre :

- "Refuse de m'afficher si quelqu'un essaie de me copier dans une fausse fenêtre."
- "N'exécute pas de code venant d'ailleurs que de chez moi."
- "Force toujours la version sécurisée du site."

Ces serrures sont **gratuites**, **invisibles pour l'utilisateur**, et leur seule absence fait fuir tous les auditeurs sécurité.

### ⚠️ Ce qui peut arriver

Sans ces protections :

- Un pirate peut afficher votre site **dans une fausse fenêtre invisible**, et quand le visiteur clique sur "Acheter", il clique en réalité sur "Donner accès à mon compte". On appelle ça le **clickjacking** (détournement de clic).
- Du **code malveillant** peut être injecté depuis un autre site et s'exécuter chez vos visiteurs (vol de cookies, redirection vers des sites de phishing).
- Un audit sécurité du client (avant qu'il vous paye le solde) **vous descend en flammes** : "Aucun en-tête de sécurité configuré."

### 🔍 Comment vérifier

**Outil gratuit n°1 : [securityheaders.com](https://securityheaders.com)**

1. Ouvrir [https://securityheaders.com](https://securityheaders.com)
2. Taper l'adresse du site
3. Cocher **"Hide results"**
4. Cliquer sur **Scan**
5. Lire la note (de A+ à F) et la liste des en-têtes manquants

**Outil gratuit n°2 : [Mozilla Observatory](https://developer.mozilla.org/en-US/observatory)** (plus complet, recommandé par Mozilla)

1. Aller sur [https://developer.mozilla.org/en-US/observatory](https://developer.mozilla.org/en-US/observatory)
2. Taper le site
3. Cliquer sur **Scan**
4. Le rapport explique chaque ligne et donne des conseils

### ✅ La note minimum

🟥 **VITAL** — Note **A** minimum sur securityheaders.com.

🟧 **IMPORTANT** — Note **B+** minimum sur Mozilla Observatory.

**Les en-têtes obligatoires que doit envoyer le site :**

- ` + '`Strict-Transport-Security`' + ` — "Force toujours la version HTTPS, même si l'utilisateur tape HTTP."
- ` + '`Content-Security-Policy`' + ` — "N'exécute que le code qui vient de moi, refuse tout le reste."
- ` + '`X-Content-Type-Options`' + ` — "Ne laisse pas le navigateur deviner le type des fichiers, ça peut être dangereux."
- ` + '`X-Frame-Options`' + ` — "Refuse d'être affiché dans une fenêtre invisible (anti-clickjacking)."
- ` + '`Referrer-Policy`' + ` — "Ne donne pas trop d'infos sur d'où vient le visiteur."
- ` + '`Permissions-Policy`' + ` — "Désactive les fonctions du navigateur dont je n'ai pas besoin (caméra, micro, géoloc, etc.)."

### 🛠️ Si problème

Le développeur ajoute ces en-têtes en quelques minutes dans la configuration du site (fichier ` + '`next.config.js`' + ` pour les sites Next.js, ou panneau Vercel/hébergeur).

---

## 3. Les mots de passe et les accès

### 🤔 C'est quoi ?

Le mot de passe, c'est **la clé** de la maison. Mais **80 % des piratages d'envergure en 2024** ont commencé par un simple mot de passe volé (source : CNIL). Pourquoi ?

- Les gens utilisent **le même mot de passe partout**. Quand un site comme LinkedIn ou Adobe se fait pirater (ça arrive régulièrement), les pirates récupèrent des millions de couples email/mot de passe et les essaient ailleurs.
- Les mots de passe sont **trop simples** ("123456", "password", le prénom des enfants). Un pirate met **moins d'une seconde** à les deviner avec un logiciel.

La solution moderne, c'est la **double authentification (2FA / MFA)**. C'est comme **ajouter un deuxième verrou** : même si un voleur a la clé (le mot de passe), il lui manque encore le code reçu par téléphone (deuxième facteur).

### ⚠️ Ce qui peut arriver

- Un ancien employé du client garde son accès admin → un an plus tard, il se connecte et **détruit le site par vengeance**.
- Le mot de passe admin est ` + '`admin123`' + ` → un robot le trouve en quelques minutes et **prend le contrôle total**.
- Le client réutilise le même mot de passe que sur un forum piraté → un pirate **se connecte directement** au back-office.

### 🔍 Comment vérifier

**Pas d'outil de scan automatique pour ça**, c'est une **vérification organisationnelle**. À faire en checklist avec le client.

**La checklist accès & mots de passe :**

- ☐ **Aucun mot de passe par défaut** n'est resté actif (admin/admin, root/root, etc.)
- ☐ **Chaque personne a son propre compte** (pas de compte partagé "admin" utilisé par 3 personnes)
- ☐ **Double authentification activée** sur tous les comptes critiques : Vercel, Supabase, Google Workspace, hébergeur, gestionnaire de domaine, GitHub, Stripe…
- ☐ **Anciens employés / prestataires révoqués** : aucun ancien collaborateur n'a encore accès
- ☐ **Mots de passe stockés dans un coffre-fort numérique** (1Password, Bitwarden, Dashlane) — jamais dans un fichier Excel, jamais par email
- ☐ **Politique de mot de passe forte** côté site : minimum 12 caractères, refus des mots de passe les plus piratés (utiliser la liste [Have I Been Pwned](https://haveibeenpwned.com))
- ☐ **Principe du moindre privilège** : chacun a uniquement les accès dont il a besoin (pas tout le monde admin)

**Outils utiles :**

- [Have I Been Pwned](https://haveibeenpwned.com) — vérifier si une adresse email du client a déjà été compromise dans une fuite connue
- [1Password](https://1password.com), [Bitwarden](https://bitwarden.com) — coffres-forts numériques pour mots de passe
- Authy, Google Authenticator, Microsoft Authenticator — applis pour la double authentification

### ✅ La note minimum

🟥 **VITAL** — Double authentification activée sur **tous** les comptes critiques.

🟥 **VITAL** — Aucun mot de passe par défaut n'est encore actif.

🟧 **IMPORTANT** — Le client utilise un coffre-fort numérique pour ses mots de passe.

### 🛠️ Si problème

Briefing client : on lui explique pourquoi c'est critique, on installe le coffre-fort avec lui, on active la 2FA ensemble.

---

## 4. Les pirates qui essaient d'entrer : les 10 attaques les plus courantes

### 🤔 C'est quoi ?

Une organisation mondiale appelée **OWASP** publie chaque 4 ans la liste des **10 attaques les plus courantes** contre les sites web. C'est la **bible mondiale** de la sécurité web. La dernière version, l'**OWASP Top 10:2025**, est sortie fin 2025.

Voici les 10 dans l'ordre, expliquées simplement avec une analogie :

**1. Contrôles d'accès cassés (n°1 mondial — 3,73 % des sites touchés)**
🏠 *Analogie* : Vous avez bien fermé la porte d'entrée à clé. Mais la fenêtre de la cuisine n'a pas de serrure, et tout le monde le sait. Un pirate peut rentrer par la fenêtre.
*Concrètement* : un visiteur lambda peut accéder à des pages réservées aux admins juste en changeant l'adresse dans la barre URL.

**2. Mauvaise configuration (passé du n°5 au n°2)**
🏠 *Analogie* : La maison est bien construite, mais le constructeur a oublié de fermer la porte de garage. Et il a laissé les clés dessus.
*Concrètement* : un compte admin avec le mot de passe par défaut, un fichier de config exposé publiquement, un message d'erreur qui révèle la structure de la base de données.

**3. Failles de la chaîne d'approvisionnement (NOUVEAU en 2025)**
🏠 *Analogie* : Vous achetez une serrure réputée. Sauf que le fabricant s'est fait pirater, et tous ses clients ont la même copie de clé qui circule chez les voleurs.
*Concrètement* : votre site utilise une bibliothèque de code (un "ingrédient") qui a été infectée par un pirate. Vous installez l'infection avec elle.

**4. Problèmes de chiffrement**
🏠 *Analogie* : Vous gardez vos bijoux dans un coffre-fort, mais le coffre est en carton.
*Concrètement* : les mots de passe des utilisateurs sont stockés en clair dans la base de données, ou les communications passent en HTTP au lieu de HTTPS.

**5. Injections (le grand classique, descendu du 3 au 5)**
🏠 *Analogie* : Quelqu'un glisse un faux papier dans votre boîte aux lettres avec écrit "facture impayée, donnez 1000 €" — et votre comptable, sans vérifier, exécute l'ordre.
*Concrètement* : un visiteur tape dans un formulaire un texte qui n'est pas un vrai texte mais une **commande secrète**, et le site l'exécute aveuglément. Permet de voler toute la base de données (SQL injection) ou de pirater les visiteurs (XSS).

**6. Conception non sécurisée**
🏠 *Analogie* : La maison a été construite sans plan, en mode "on improvise". Les murs ne sont pas porteurs, l'électricité passe à côté de la plomberie.
*Concrètement* : le site n'a pas été pensé pour la sécurité dès le départ. Aucune rustine ne corrigera ça après coup.

**7. Failles d'authentification**
🏠 *Analogie* : Le code de l'alarme est "0000". N'importe qui peut le deviner.
*Concrètement* : pas de limite au nombre de tentatives de connexion (un robot peut tester 1 million de mots de passe), pas de double authentification, possibilité de se connecter en tant que quelqu'un d'autre.

**8. Problèmes d'intégrité des logiciels et des données**
🏠 *Analogie* : Vous recevez un colis Amazon, mais l'emballage est ouvert et il y a des traces. Vous acceptez quand même sans vérifier.
*Concrètement* : votre site télécharge automatiquement des mises à jour, mais ne vérifie pas si elles viennent vraiment du bon éditeur.

**9. Pas assez de surveillance et d'alertes**
🏠 *Analogie* : Vous êtes cambriolé pendant les vacances. Quand vous rentrez 3 semaines plus tard, vous ne savez pas quand c'est arrivé ni ce qui a été pris. Aucune caméra, aucune alarme.
*Concrètement* : le site se fait attaquer pendant des semaines avant que quelqu'un s'en rende compte. Pas de logs, pas d'alertes, pas de monitoring.

**10. Mauvaise gestion des erreurs (NOUVEAU en 2025)**
🏠 *Analogie* : Quand quelqu'un sonne avec un faux nom, votre porte ne se contente pas de rester fermée : elle affiche **un plan détaillé de votre maison** sur le paillasson.
*Concrètement* : quand une erreur survient, le site affiche le code source, la structure de la base, le mot de passe... Cadeau pour le pirate.

### ⚠️ Ce qui peut arriver

Les conséquences vont du **vol massif de données** (et l'amende RGPD qui va avec) à la **prise de contrôle totale** du site, en passant par la **revente de la base clients** sur le dark web.

### 🔍 Comment vérifier

**Outil gratuit n°1 : [Sucuri SiteCheck](https://sitecheck.sucuri.net)** — Détecte les sites déjà infectés, les blacklists Google, et donne un premier diagnostic. Limite : ne fait que de la détection en surface.

**Outil gratuit n°2 : [Quttera](https://quttera.com/website-malware-scanner)** — Détecte les malwares connus.

**Outil semi-pro : [OWASP ZAP](https://www.zaproxy.org)** — Scanner gratuit, mais demande un développeur pour l'utiliser correctement (faux positifs nombreux).

**Pour les projets sensibles → faire faire un vrai audit (pen test) :**

- Cabinets français : Vaadata, Synacktiv, YesWeHack
- Plateformes : YesWeHack (bug bounty)
- Coût : 3 000 à 15 000 € selon la taille du site

### ✅ La note minimum

🟥 **VITAL** — Sucuri SiteCheck doit être **clean** (aucun malware détecté, aucune blacklist).

🟧 **IMPORTANT** — Pour tout site qui traite des paiements ou des données sensibles : **audit pen test externe** avant la mise en production.

### 🛠️ Si problème

Si Sucuri détecte quelque chose, **arrêt immédiat** du rendu : un site infecté ne se livre pas. Le développeur identifie la source, nettoie, et on relance les tests.

---

## 5. Les pièces détachées du site : les mises à jour

### 🤔 C'est quoi ?

Un site web moderne, c'est comme **une voiture neuve assemblée à partir de pièces de centaines de fournisseurs différents**. On estime que **80 % du code** d'un site n'est pas écrit par votre développeur, mais par des bibliothèques externes (comme les pièces détachées d'une voiture).

Le problème ? **Régulièrement**, on découvre qu'une de ces pièces a un défaut de fabrication (= une faille de sécurité). Le fournisseur sort un correctif. Si vous ne l'installez pas, vous **roulez avec un airbag défectueux**.

L'OWASP a élevé ce risque à la **3e place mondiale** en 2025, sous le nom "Failles de la chaîne d'approvisionnement logicielle".

### ⚠️ Ce qui peut arriver

- **Cas WordPress** (60 % des sites web mondiaux) : un plugin obsolète sur un seul site sur dix permet à un pirate de prendre le contrôle complet du site, et parfois du serveur entier. C'est la **première cause de piratage** sur WordPress.
- **Cas npm** (l'écosystème JavaScript moderne) : en 2024-2025, plusieurs paquets très populaires ont été **infectés par des pirates** qui ont volé des cryptomonnaies aux utilisateurs.

### 🔍 Comment vérifier

**Pour les sites avec WordPress, Joomla, Drupal :**

- Le développeur lance un scan dans le back-office
- [WPScan](https://wpscan.com) — scanner gratuit dédié WordPress
- [Sucuri](https://sitecheck.sucuri.net) — détection à distance

**Pour les sites modernes (Next.js, React…) :**

- Commande à lancer dans le code : ` + '`npm audit`' + `
- Service en ligne : [Snyk](https://snyk.io) (gratuit jusqu'à un certain volume)
- **Dependabot** activé sur GitHub (gratuit) → propose automatiquement les correctifs sous forme de "Pull Requests"

**Sur Snyk :**

1. Connecter le compte GitHub
2. Sélectionner le repo du projet
3. Lancer le scan
4. Lire le nombre de vulnérabilités par niveau (Low, Medium, High, Critical)

### ✅ La note minimum

🟥 **VITAL** — **Aucune** vulnérabilité de niveau **High** ou **Critical** au moment du rendu.

🟧 **IMPORTANT** — **Aucune** vulnérabilité de niveau **Medium** sans justification écrite.

🟧 **IMPORTANT** — Dependabot ou équivalent activé sur le repo, pour que le client soit alerté automatiquement après le rendu.

### 🛠️ Si problème

Le développeur fait les mises à jour avant le rendu et teste qu'elles ne cassent rien.

---

## 6. Les secrets : clés et mots de passe cachés

### 🤔 C'est quoi ?

Un site moderne utilise plein de **services externes** : envoi d'emails (Resend, SendGrid), paiement (Stripe), base de données (Supabase), analytics (Google), etc. Pour communiquer avec eux, le site utilise des **clés secrètes** (qu'on appelle "API keys" ou "tokens") — c'est l'équivalent d'**un badge d'accès professionnel**.

Le problème : ces clés sont **parfois oubliées dans le code**, qui finit publié sur GitHub, **visible par toute la planète**.

Des **robots scannent GitHub en permanence** à la recherche de ces clés. Une clé Stripe oubliée peut permettre à un pirate de **vider votre compte client** en quelques minutes.

### ⚠️ Ce qui peut arriver

- Un développeur stagiaire pousse le code sur GitHub avec la clé AWS dedans → en **6 minutes**, un robot la trouve, lance 50 serveurs de minage de cryptomonnaie → facture de **30 000 €** sur le compte AWS du client.
- (Cas réel arrivé à des dizaines de boîtes en 2023-2024.)

### 🔍 Comment vérifier

**Outil gratuit : [gitleaks](https://github.com/gitleaks/gitleaks)** (référence du secteur)

À lancer dans le code :

` + '```bash\ngitleaks detect --source . --verbose\n```' + `

**Service intégré GitHub :** Secret Scanning (gratuit, activé par défaut sur les repos publics, à activer sur les privés).

**Préventif :** mettre un "pre-commit hook" qui empêche tout commit contenant un secret.

### ✅ La note minimum

🟥 **VITAL** — **Aucun** secret détecté dans le code ou l'historique Git.

🟥 **VITAL** — Toutes les clés sensibles sont dans des **variables d'environnement** (jamais dans le code source).

🟧 **IMPORTANT** — GitHub Secret Scanning activé sur le repo.

### 🛠️ Si problème

Si une clé est trouvée :

1. **Révoquer immédiatement** la clé sur le service concerné (Stripe, AWS, etc.) — même si on pense que personne ne l'a vue.
2. Générer une nouvelle clé.
3. Nettoyer l'historique Git (compliqué, mais possible avec ` + '`git-filter-repo`' + ` ou BFG Repo-Cleaner).
4. Vérifier les logs du service pour détecter une utilisation suspecte.

---

## 7. Les emails : éviter qu'on usurpe votre identité

### 🤔 C'est quoi ?

Quand votre client envoie un email depuis ` + '`contact@monsite.fr`' + `, comment Gmail sait-il que **c'est bien lui** et pas un pirate qui se fait passer pour lui ?

C'est ce qu'on appelle **l'authentification d'email**. Elle repose sur **3 mécanismes**, à configurer dans les **réglages DNS** du domaine :

- **SPF** — *"Voici la liste officielle des serveurs autorisés à envoyer des emails en mon nom."* (équivalent d'une **liste blanche** de facteurs autorisés à porter votre courrier).
- **DKIM** — *"Chaque email que j'envoie est signé numériquement, comme une enveloppe cachetée à la cire."* (impossible à imiter sans la clé privée).
- **DMARC** — *"Si quelqu'un essaie de se faire passer pour moi sans respecter SPF et DKIM, voici ce que je veux qu'on en fasse : rejeter / mettre en spam / ignorer."*

### ⚠️ Ce qui peut arriver

Sans ces protections :

- Un pirate envoie un email **"de votre client"** à ses propres clients : *"Bonjour, notre IBAN a changé, voici le nouveau pour votre prochain virement..."* → **escroquerie au virement** (fraude au président, en hausse en 2025 selon la CNIL).
- Vos emails légitimes (factures, devis, newsletter) **arrivent en spam** chez vos destinataires → vous perdez des ventes.
- Google et Yahoo **rejettent purement et simplement** les emails non authentifiés (depuis février 2024 pour les expéditeurs en masse).

### 🔍 Comment vérifier

**Outil gratuit n°1 : [mail-tester.com](https://www.mail-tester.com)** (le plus simple)

1. Aller sur [https://www.mail-tester.com](https://www.mail-tester.com)
2. Ils donnent une adresse email aléatoire
3. Envoyer un email **depuis le site du client** (formulaire de contact, email transactionnel, newsletter…) à cette adresse
4. Cliquer sur "Then check your score"
5. Lire la note sur 10

**Outil gratuit n°2 : [MXToolbox](https://mxtoolbox.com)** — Vérifier individuellement SPF, DKIM, DMARC

1. Aller sur [https://mxtoolbox.com](https://mxtoolbox.com)
2. Choisir l'outil "SPF Record Lookup" / "DKIM Lookup" / "DMARC Lookup"
3. Entrer le domaine
4. Vérifier que chaque enregistrement existe et est valide

**Outil gratuit n°3 : [dmarcian](https://dmarcian.com/dmarc-inspector/)** — Inspection DMARC dédiée

### ✅ La note minimum

🟥 **VITAL** — Note mail-tester.com : **10/10**

🟥 **VITAL** — SPF, DKIM et DMARC tous **présents et valides**

🟧 **IMPORTANT** — Politique DMARC en ` + '`quarantine`' + ` (mise en spam) ou ` + '`reject`' + ` (rejet). Pas en ` + '`none`' + ` (rien faire), qui ne sert à rien.

🟧 **IMPORTANT** — Adresse de reporting DMARC configurée pour recevoir les rapports d'usurpation

### 🛠️ Si problème

Le développeur configure les enregistrements DNS chez le registrar (OVH, Gandi, Cloudflare, etc.). 30 minutes à 1 heure de travail.

---

## 8. Le RGPD : protéger les données des visiteurs

### 🤔 C'est quoi ?

Le **RGPD** (Règlement Général sur la Protection des Données) est la **loi européenne** qui dit aux entreprises : *"Si vous collectez des données sur les visiteurs (nom, email, comportement…), vous devez les protéger ET demander leur permission."*

C'est **obligatoire**, pas optionnel. La **CNIL** (l'autorité française) peut sanctionner jusqu'à **10 millions d'euros ou 2 % du chiffre d'affaires** mondial.

### ⚠️ Ce qui peut arriver

- Le client se fait sanctionner par la CNIL pour bandeau cookies non conforme : amende de **5 000 à 100 000 €** pour une PME.
- Une fuite de données + absence de mesures de sécurité raisonnables → **plainte d'un client + amende RGPD** + obligation d'informer toutes les personnes concernées.
- Mauvaise réputation : les clients perdent confiance dès qu'ils voient un bandeau cookies abusif.

### 🔍 Comment vérifier

**Le bandeau cookies (obligation CNIL) — outil gratuit : [Cookiebot scanner](https://www.cookiebot.com/en/gdpr-cookie-scanner)** (gratuit pour 1 site)

**Vérifications visuelles :**

- ☐ Le bandeau apparaît à la **première visite**
- ☐ **"Accepter" et "Refuser"** sont aussi simples l'un que l'autre (mêmes couleurs, même taille de bouton). Une croix ou "Continuer sans accepter" cachée = non conforme.
- ☐ **Aucun cookie non essentiel** n'est déposé tant que l'utilisateur n'a pas consenti (vérifier avec l'extension Chrome [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie))
- ☐ Le consentement est **conservé** (pas demandé à chaque page)
- ☐ Possibilité de **modifier/retirer** son consentement à tout moment (lien en pied de page)

**Les mentions légales** — page obligatoire qui doit contenir :

- ☐ Nom de l'entreprise, forme juridique, capital social, RCS, SIRET
- ☐ Adresse du siège
- ☐ Téléphone et email de contact
- ☐ Nom du directeur de la publication
- ☐ Hébergeur du site (nom + adresse + téléphone)

**La politique de confidentialité** — page obligatoire qui doit expliquer :

- ☐ **Quelles données** sont collectées (nom, email, adresse IP, comportement…)
- ☐ **Pourquoi** (la "finalité" : envoyer des newsletters, livrer un produit, etc.)
- ☐ **Sur quelle base légale** (consentement, contrat, intérêt légitime…)
- ☐ **Combien de temps** sont-elles conservées
- ☐ **Avec qui** sont-elles partagées (sous-traitants, hébergeurs, etc.)
- ☐ **Quels sont les droits** des visiteurs (accès, rectification, suppression, portabilité)
- ☐ **Comment exercer ces droits** (email du DPO ou contact)

**Le scan des trackers — outil gratuit : [Blacklight](https://themarkup.org/blacklight)** (du média The Markup, très visuel)

1. Aller sur [https://themarkup.org/blacklight](https://themarkup.org/blacklight)
2. Taper l'URL du site
3. Cliquer sur **Scan**
4. Lire le rapport : nombre de cookies, trackers tiers, fingerprinting, session recording…

**Outil gratuit alternatif : [Webbkoll](https://webbkoll.dataskydd.net)** (orienté RGPD européen)

### ✅ La note minimum

🟥 **VITAL** — Bandeau cookies **conforme CNIL** (Refuser aussi simple qu'Accepter)

🟥 **VITAL** — Mentions légales et politique de confidentialité **complètes et accessibles**

🟥 **VITAL** — Aucun tracker actif **avant** le consentement

🟧 **IMPORTANT** — Hébergement dans l'Union Européenne (ou pays adéquat selon la CNIL)

🟧 **IMPORTANT** — Pour les sites recevant des données sensibles (santé, finance, RH) : **analyse d'impact RGPD (AIPD)** réalisée

### 🛠️ Si problème

- Bandeau cookies : utiliser une solution conforme comme [Axeptio](https://www.axeptio.eu) (français) ou [Tarteaucitron](https://tarteaucitron.io) (open source gratuit)
- Mentions légales et politique : générateur officiel CNIL ou avocat spécialisé pour les cas sensibles

---

## 9. Les sauvegardes : la copie de secours

### 🤔 C'est quoi ?

Une **sauvegarde**, c'est une **copie de tout le site** (fichiers + base de données), stockée ailleurs, qu'on peut **restaurer** en cas de problème.

L'ANSSI recommande la **règle du "3-2-1"** :

- **3** copies des données
- sur **2** supports différents
- dont **1** stockée hors site (dans un autre lieu physique ou un autre cloud)

### ⚠️ Ce qui peut arriver

- **Ransomware** (rançongiciel) : un pirate chiffre toutes vos données et exige une rançon. Sans sauvegarde, vous payez (ou vous perdez tout).
- **Erreur humaine** : un employé supprime par erreur une table de la base de données. Sans sauvegarde, c'est définitif.
- **Panne de l'hébergeur** : c'est rare mais ça arrive (cf. incendie OVH Strasbourg en 2021, des milliers de sites perdus définitivement).
- **Mise à jour qui casse tout** : le site ne démarre plus après une mise à jour ratée. Sans sauvegarde, on repart de zéro.

### 🔍 Comment vérifier

Pas d'outil de scan — c'est une **vérification organisationnelle**.

**La checklist sauvegarde :**

- ☐ **Sauvegardes automatiques** activées (quotidiennes minimum pour les sites actifs)
- ☐ **Stockage hors-site** : sur un autre serveur que celui du site (cloud différent, S3, Backblaze, etc.)
- ☐ **Rétention raisonnable** : ex. quotidiennes sur 7 jours + hebdomadaires sur 1 mois + mensuelles sur 6 mois
- ☐ **Test de restauration mensuel** — LE POINT LE PLUS NÉGLIGÉ et le plus critique. Une sauvegarde qu'on n'a jamais testée n'est pas une sauvegarde, c'est une supposition.
- ☐ **Documentation** de la procédure de restauration (qui sait faire quoi, en combien de temps)

**Sur la stack Propul'seo (Next.js + Supabase + Vercel) :**

- **Vercel** — versionning automatique du code via Git → tout déploiement est rollback-able en 1 clic
- **Supabase** — sauvegardes automatiques quotidiennes incluses (selon le plan), à compléter par export manuel hebdomadaire dans un bucket S3 externe pour les sites critiques
- **Code source** — GitHub avec branches protégées + sauvegarde GitHub vers un autre service (BackHub, Rewind, ou simple miroir GitLab)

### ✅ La note minimum

🟥 **VITAL** — Sauvegardes automatiques **actives** au moment du rendu

🟥 **VITAL** — **Au moins 1 test de restauration** réussi avant la livraison (sur un environnement de préproduction)

🟧 **IMPORTANT** — Sauvegarde hors-site (cloud différent du serveur principal)

🟧 **IMPORTANT** — Procédure de restauration **documentée** et remise au client

### 🛠️ Si problème

Mise en place avant le rendu d'un système automatique. Sur la stack Vercel/Supabase, c'est essentiellement une activation + un script.

---

## 10. La surveillance : le système d'alarme

### 🤔 C'est quoi ?

Un site sécurisé sans surveillance, c'est comme **une maison avec une alarme... qui ne sonne nulle part**. Si personne ne voit l'incident, il continue.

La surveillance, c'est **3 choses** :

1. **Monitoring de disponibilité (uptime)** — Le site répond-il toujours ? S'il tombe, on est alerté en 1 minute, pas en 24h quand un client appelle.
2. **Monitoring d'erreurs** — Y a-t-il des bugs en cours ? Combien d'utilisateurs sont impactés ? Quelles pages sont concernées ?
3. **Monitoring de sécurité** — Tentatives de connexion suspectes, pics de trafic anormaux, requêtes bizarres.

L'OWASP a placé "Pas assez de surveillance et d'alertes" dans son Top 10 — c'est la **9e cause de problèmes** dans le monde.

### ⚠️ Ce qui peut arriver

- Le site est tombé **à 22h le vendredi**. Personne ne s'en rend compte. Le client voit le drame **lundi matin** : 60 heures de chiffre d'affaires perdues, des centaines de visiteurs frustrés.
- Le certificat SSL **expire un jeudi** sans alerte. Vendredi, tous les visiteurs voient un message rouge "Site dangereux" et fuient.
- Un pirate teste **10 000 mots de passe** sur le compte admin pendant la nuit. Sans monitoring, personne ne le remarque jusqu'à la réussite.

### 🔍 Comment vérifier

**Monitoring de disponibilité (uptime) — outils gratuits ou peu chers :**

- [UptimeRobot](https://uptimerobot.com) — Gratuit jusqu'à 50 sites, vérification toutes les 5 minutes
- [BetterStack](https://betterstack.com) — Plus moderne, alertes Slack/SMS
- [Pingdom](https://www.pingdom.com) — Référence du marché, payant

**Monitoring d'erreurs :**

- [Sentry](https://sentry.io) — Référence pour Next.js, plan gratuit suffisant pour la plupart des sites
- Logs Vercel intégrés
- [LogRocket](https://logrocket.com) — Replay de session pour comprendre les bugs

**Monitoring du certificat SSL :**

- UptimeRobot le fait gratuitement
- [SSLMate Cert Spotter](https://sslmate.com/certspotter) pour les alertes avancées

**Monitoring du domaine :**

- Surveillance de l'expiration du nom de domaine (un domaine non renouvelé = catastrophe)
- Surveillance des changements DNS suspects

### ✅ La note minimum

🟥 **VITAL** — Monitoring uptime actif sur le site, avec **alertes email/SMS** au client et au support Propul'seo

🟥 **VITAL** — Alerte sur expiration du certificat SSL (30 jours avant)

🟧 **IMPORTANT** — Monitoring d'erreurs (Sentry ou équivalent) actif

🟧 **IMPORTANT** — Surveillance des logs d'authentification (tentatives d'intrusion sur le back-office)

### 🛠️ Si problème

Mise en place pendant la phase finale du projet (1-2h de configuration).

---

## 11. La page d'erreur : rester discret quand ça plante

### 🤔 C'est quoi ?

Quand un visiteur tape une URL qui n'existe pas, ou quand le site rencontre un bug, **deux écrans peuvent s'afficher** :

- **Le bon écran** : *"Désolé, cette page n'existe pas. [Retour à l'accueil]"* — discret, élégant, marqué à votre image.
- **Le mauvais écran** : un écran rempli de **code source**, de noms de fichiers, de versions de logiciels, de chemins serveur. **Cadeau** pour un pirate qui veut comprendre comment attaquer le site.

L'OWASP a ajouté en 2025 un nouveau Top 10 : "Mauvaise gestion des erreurs". C'est devenu un sujet majeur.

### ⚠️ Ce qui peut arriver

- Une erreur affiche ` + '`Postgres SQL error at line 47: column \'admin_password\' returned NULL`' + ` → un pirate apprend qu'il y a une colonne ` + '`admin_password`' + `, sur quel système c'est, etc.
- Un message ` + '`Stack trace: /home/user/myproject/api/users.js:127`' + ` → le pirate connaît la **structure interne** du code.
- Un visiteur lambda tombe sur un écran d'erreur cryptique → il fuit, vous perdez un prospect.

### 🔍 Comment vérifier

**Test manuel rapide** (5 minutes, à faire sur tout site avant rendu) :

1. **Tester le 404** : taper ` + '`https://monsite.fr/n-importe-quoi-qui-existe-pas-1234`' + `
2. **Tester le 500** : essayer de "casser" un formulaire (caractères spéciaux, champs vides, fichiers énormes…)
3. Vérifier qu'aucun écran ne montre :
   - Code source ou stack trace
   - Versions de logiciels (` + '`Node 18.4`' + `, ` + '`Next.js 14.2`' + `, ` + '`PostgreSQL 15.3`' + `…)
   - Chemins serveur (` + '`/var/www/...`' + `)
   - Messages d'erreur de base de données
   - Adresse IP du serveur

**Outil utile : [Wappalyzer](https://www.wappalyzer.com/)** — extension navigateur qui montre quelles techno sont visibles (côté visiteur). Idéal de masquer les versions précises.

### ✅ La note minimum

🟥 **VITAL** — Page 404 personnalisée et **propre**, sans aucune info technique

🟥 **VITAL** — Page 500 personnalisée et **propre**

🟥 **VITAL** — En production, le mode "debug" est **désactivé** (NODE_ENV=production)

🟧 **IMPORTANT** — En-tête ` + '`Server`' + ` masqué (ne pas révéler "nginx 1.18", "Apache 2.4", etc.)

🟧 **IMPORTANT** — En-tête ` + '`X-Powered-By`' + ` retiré (par défaut, Next.js le supprime déjà)

### 🛠️ Si problème

Le développeur crée des pages 404/500 personnalisées et désactive les messages détaillés. 1-2h de travail.

---

## 12. Le test final avant rendu

### La règle d'or

> **Aucun rendu ne se fait avant que cette page ne soit validée par Lyes ou Etienne.**

### La grande checklist (à imprimer ou copier dans Notion)

` + '```' + `
PROJET : ________________________________
CLIENT : ________________________________
DATE DE RENDU PRÉVUE : __________________
VALIDATEUR : Lyes ☐  /  Etienne ☐
` + '```' + `

### 🟥 NIVEAU VITAL (bloquant)

**🔒 Sécurité de base :**

- ☐ SSL Labs : note A minimum (visé : A+) — Note obtenue : ___
- ☐ securityheaders.com : note A minimum — Note obtenue : ___
- ☐ Sucuri SiteCheck : clean (aucune blacklist) — ✅ / ❌
- ☐ Redirection HTTP→HTTPS active — ✅ / ❌
- ☐ Cadenas valide dans le navigateur — ✅ / ❌

**🔑 Accès :**

- ☐ Aucun mot de passe par défaut actif — ✅ / ❌
- ☐ Double authentification activée partout — ✅ / ❌
- ☐ Anciens collaborateurs révoqués — ✅ / ❌

**🛡️ Code & dépendances :**

- ☐ Aucune vulnérabilité High/Critical (npm audit) — ✅ / ❌
- ☐ Aucun secret détecté dans le code (gitleaks) — ✅ / ❌
- ☐ Build production réussi sans erreur — ✅ / ❌

**📧 Email :**

- ☐ mail-tester : 10/10 — Note : ___
- ☐ SPF + DKIM + DMARC valides — ✅ / ❌

**🔐 RGPD :**

- ☐ Bandeau cookies conforme CNIL — ✅ / ❌
- ☐ Mentions légales complètes — ✅ / ❌
- ☐ Politique de confidentialité complète — ✅ / ❌
- ☐ Aucun tracker avant consentement (Blacklight) — ✅ / ❌

**💾 Sauvegarde :**

- ☐ Sauvegarde automatique active — ✅ / ❌
- ☐ Test de restauration réussi — Date : ___

**📡 Surveillance :**

- ☐ Monitoring uptime configuré + alertes — ✅ / ❌
- ☐ Alerte expiration certificat SSL — ✅ / ❌

**🎭 Erreurs :**

- ☐ Page 404 personnalisée et propre — ✅ / ❌
- ☐ Page 500 personnalisée et propre — ✅ / ❌
- ☐ Aucun message d'erreur technique en prod — ✅ / ❌

### 🟧 NIVEAU IMPORTANT (à corriger sauf justification)

- ☐ Mozilla Observatory : note B+ minimum — Note : ___
- ☐ Aucune vulnérabilité Medium — ✅ / ❌
- ☐ Politique DMARC en quarantine ou reject — ✅ / ❌
- ☐ Hébergement en UE (ou pays adéquat CNIL) — ✅ / ❌
- ☐ GitHub Secret Scanning activé — ✅ / ❌
- ☐ Sentry ou monitoring d'erreurs configuré — ✅ / ❌
- ☐ Coffre-fort de mots de passe utilisé — ✅ / ❌
- ☐ En-têtes Server et X-Powered-By masqués — ✅ / ❌

### 🟨 NIVEAU RECOMMANDÉ (best effort)

- ☐ DNSSEC activé — ✅ / ❌
- ☐ Records CAA configurés — ✅ / ❌
- ☐ HSTS Preload soumis — ✅ / ❌
- ☐ Sauvegardes hors-site (cloud différent) — ✅ / ❌
- ☐ Procédure de restauration documentée — ✅ / ❌
- ☐ Audit pen test externe (sites sensibles) — ✅ / ❌

### Décision finale

- ☐ TOUS les points 🟥 VITAL sont validés
- ☐ Les points 🟧 IMPORTANT non validés ont une justification écrite
- ☐ Le rapport client a été préparé

**DÉCISION : ☐ RENDU AUTORISÉ    ☐ RENDU REPORTÉ**

Si reporté, raison et nouveau délai : ________________________________________

Validé par : ____________  Date : ____________

---

## 📋 Annexe 1 — Liste rapide des outils gratuits

- **HTTPS / SSL** — [SSL Labs](https://www.ssllabs.com/ssltest/)
- **En-têtes sécurité** — [securityheaders.com](https://securityheaders.com)
- **Audit global** — [Mozilla Observatory](https://developer.mozilla.org/en-US/observatory)
- **Détection malware** — [Sucuri SiteCheck](https://sitecheck.sucuri.net)
- **Email (score global)** — [mail-tester.com](https://www.mail-tester.com)
- **DNS / SPF / DKIM / DMARC** — [MXToolbox](https://mxtoolbox.com)
- **DMARC dédié** — [dmarcian](https://dmarcian.com/dmarc-inspector/)
- **Cookies & trackers** — [Blacklight](https://themarkup.org/blacklight)
- **Cookies (RGPD)** — [Webbkoll](https://webbkoll.dataskydd.net)
- **Vulnérabilités code** — [Snyk](https://snyk.io)
- **Secrets dans le code** — [gitleaks](https://github.com/gitleaks/gitleaks)
- **Monitoring uptime** — [UptimeRobot](https://uptimerobot.com)
- **Monitoring erreurs** — [Sentry](https://sentry.io)
- **Données compromises** — [Have I Been Pwned](https://haveibeenpwned.com)
- **Performance** — [PageSpeed Insights](https://pagespeed.web.dev)
- **Réputation URL** — [VirusTotal](https://www.virustotal.com)

## 📋 Annexe 2 — Mini-lexique (à donner au client)

- **HTTPS / SSL / TLS** — Le "petit cadenas" en haut de la barre du navigateur. Conversation chiffrée entre le visiteur et le site.
- **En-tête de sécurité (security header)** — Instruction invisible que le site envoie au navigateur pour activer une protection.
- **Faille (vulnérabilité)** — Faiblesse d'un site qu'un pirate peut exploiter pour entrer ou voler des données.
- **Injection SQL** — Attaque qui fait croire à la base de données que la commande d'un visiteur est une commande système.
- **XSS (Cross-Site Scripting)** — Attaque qui fait exécuter du code malveillant dans le navigateur d'un autre visiteur.
- **CSRF** — Attaque qui fait faire à un visiteur, à son insu, une action qu'il n'a pas voulue.
- **Clickjacking** — Attaque qui superpose une fausse fenêtre invisible pour faire cliquer le visiteur sur autre chose.
- **2FA / MFA** — Double authentification : mot de passe + code temporaire (par SMS, app, ou clé physique).
- **CSP (Content Security Policy)** — Règle qui dit au navigateur quels contenus il a le droit d'afficher ou d'exécuter.
- **HSTS** — Règle qui force le navigateur à toujours utiliser HTTPS, même si l'utilisateur tape HTTP.
- **SPF / DKIM / DMARC** — Trois mécanismes pour empêcher qu'on usurpe votre identité par email.
- **DNSSEC** — Signature des enregistrements DNS pour empêcher qu'on les falsifie.
- **Pen test (test d'intrusion)** — Audit de sécurité où un expert essaie d'attaquer le site comme un vrai pirate.
- **OWASP Top 10** — La référence mondiale des 10 attaques les plus courantes contre les sites web.
- **RGPD** — Loi européenne sur la protection des données personnelles.
- **DPO** — Délégué à la Protection des Données. Personne en charge du RGPD dans l'entreprise.
- **ANSSI** — Agence française de cybersécurité. Édite les recommandations de référence en France.
- **CNIL** — Autorité française de protection des données. Peut sanctionner en cas de manquement RGPD.

## 📋 Annexe 3 — Sources officielles

Les recommandations de ce document sont basées sur les standards officiels :

- **OWASP Top 10:2025** — La référence mondiale en sécurité applicative — [owasp.org/Top10/2025](https://owasp.org/Top10/2025/)
- **ANSSI** — Agence nationale de la sécurité des systèmes d'information — [cyber.gouv.fr](https://cyber.gouv.fr) — Guide d'hygiène informatique, Guide de sécurisation des sites web (côté navigateur), Guide TPE/PME en 13 questions
- **CNIL** — [cnil.fr](https://www.cnil.fr) — Guide de la sécurité des données personnelles (édition 2024), Fiches "Sécuriser les sites web", "Sécuriser les serveurs", Recommandations 2025 sur l'authentification multifacteur
- **Mozilla Foundation** — Web Security Guidelines

## 📋 Annexe 4 — Que faire en cas d'incident

Si le client subit une attaque pendant la garantie ou après :

**Dans les premières 24 heures :**

1. **Constater et préserver les preuves** : capture d'écran, logs, mails reçus
2. **Isoler** : si possible, mettre le site en mode maintenance
3. **Changer tous les mots de passe critiques** (admin, hébergeur, base de données)
4. **Révoquer les clés API** suspectes

**Dans les 72 heures :**

5. **Notifier la CNIL** si fuite de données personnelles ([cnil.fr/notifier-violation](https://www.cnil.fr/fr/notifier-une-violation-de-donnees-personnelles)) — c'est une **obligation légale**
6. **Déposer plainte** au commissariat ou en ligne sur [cybermalveillance.gouv.fr](https://www.cybermalveillance.gouv.fr)
7. **Informer les utilisateurs concernés** si leurs données ont fuité

**Pour aider :**

- **Cybermalveillance.gouv.fr** — assistance gratuite pour PME/TPE — [cybermalveillance.gouv.fr](https://www.cybermalveillance.gouv.fr)
- **CERT-FR** — Computer Emergency Response Team officiel français — [cert.ssi.gouv.fr](https://www.cert.ssi.gouv.fr)

---

**Version 2.0** — Document à réviser tous les 6 mois.

**Maintenu par** : Lyes & Etienne — Propul'seo

> *Ce document est inspiré des standards OWASP, ANSSI et CNIL, adapté pour un usage opérationnel chez Propul'seo.*
`

// Transformations sémantiques avant conversion :
//   - lignes 🟥/🟧/🟨 standalone → blockquote (callouts colorés via data-callout)
//   - items "- ☐ ..." → GFM task list "- [ ] ..." (vraies cases à cocher)
function preprocessMarkdown(md) {
  return md
    .split('\n')
    .map((line) => {
      // 🟥/🟧/🟨 en début de ligne (hors liste) → préfixer par "> "
      if (/^[🟥🟧🟨]/.test(line)) return '> ' + line
      // "- ☐ " → "- [ ] " (GFM task list syntax)
      if (/^(\s*)- ☐ /.test(line)) return line.replace(/^(\s*)- ☐ /, '$1- [ ] ')
      return line
    })
    .join('\n')
}

const PROCESSED = preprocessMarkdown(MARKDOWN)
const tiptap = markdownToTiptap(PROCESSED)
const contentText = plainText(MARKDOWN)

// Échappe les apostrophes pour SQL (PG simple quote → '')
const sqlEscape = (s) => s.replace(/'/g, "''")

// JSON brut, on utilisera un dollar-quote pour éviter les soucis d'échappement
// Mais on doit s'assurer qu'aucune occurrence de notre tag ne soit dans le JSON.
const dollarTag = '$proc_securite$'
if (JSON.stringify(tiptap).includes(dollarTag)) {
  throw new Error('Dollar-quote tag collision: change the tag.')
}

const sql = `-- ============================================================
-- Seed — Catégorie "Sécurité" + Fiche "Guide de sécurité — Vérifier
-- qu'un site est sécurisé avant rendu" (v2.0)
-- ============================================================
-- Dépend de : 20260424_procedures_module.sql
-- Idempotent (ON CONFLICT (slug) DO NOTHING)
-- ============================================================

-- 1. Nouvelle catégorie Sécurité
INSERT INTO public.procedure_categories (name, slug, icon, color, sort_order) VALUES
  ('Sécurité', 'securite', 'Shield', '#dc2626', 5)
ON CONFLICT (slug) DO NOTHING;

-- 2. Fiche (UPSERT — met à jour le contenu si la fiche existe déjà)
INSERT INTO public.procedures (title, slug, category_id, tags, summary, content, content_text)
SELECT
  '${sqlEscape(TITLE)}',
  '${SLUG}',
  (SELECT id FROM public.procedure_categories WHERE slug = '${CATEGORY_SLUG}'),
  ARRAY[${TAGS.map((t) => `'${t}'`).join(',')}],
  '${sqlEscape(SUMMARY)}',
  ${dollarTag}${JSON.stringify(tiptap)}${dollarTag}::jsonb,
  '${sqlEscape(contentText)}'
ON CONFLICT (slug) DO UPDATE SET
  title        = EXCLUDED.title,
  category_id  = EXCLUDED.category_id,
  tags         = EXCLUDED.tags,
  summary      = EXCLUDED.summary,
  content      = EXCLUDED.content,
  content_text = EXCLUDED.content_text,
  updated_at   = now();
`

writeFileSync(OUT, sql, 'utf8')
console.log(`✅ Migration écrite : ${OUT}`)
console.log(`   - ${tiptap.content.length} blocs racine`)
console.log(`   - content_text : ${contentText.length} caractères`)
