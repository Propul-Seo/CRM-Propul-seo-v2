# MCP Propul'SEO CRM

Serveur **MCP local** (stdio) pour piloter le CRM/ERP Propul'SEO directement
depuis **Claude Code** et **Claude Desktop** : créer, lire, modifier et supprimer
des données dans toutes les sections (CRM, Projets, Comptabilité, Procédures,
Tâches, Communication, Portails, Paramètres).

> **Comment ça marche ?** Le CRM (`crm.propulseo-site.com`) est une application
> web qui s'appuie sur **Supabase**. Ce MCP appelle donc directement l'API REST
> Supabase (PostgREST) — la même que celle utilisée par l'interface web — en
> s'authentifiant avec la clé **service_role**.

---

## ⚠️ Sécurité — à lire en premier

- **Clé `service_role`** : c'est une clé **« super-admin »** qui ignore toutes les
  règles de sécurité (RLS) de la base. Quiconque la possède a **un accès total**.
  - Elle ne doit **jamais** être commitée, partagée par message, ou copiée côté
    navigateur. Elle vit **uniquement** dans le fichier `.env` local (ignoré par git).
- **Mode dry-run** : `MCP_DRY_RUN=true` est **actif par défaut**. Dans ce mode,
  toute écriture (create / update / delete) est **simulée** : l'outil renvoie ce
  qui *serait* fait, sans rien modifier. Passez à `false` quand vous êtes prêt.
- **Suppressions** : un `delete` renvoie d'abord un **résumé** de la ligne ciblée
  et n'exécute rien tant que vous ne rappelez pas l'outil avec `confirm=true`.
- **Colonnes chiffrées** (`*_enc` : identifiants/mots de passe des accès) sont en
  **lecture seule** et exclues des écritures, pour ne pas corrompre les données.

---

## 1. Prérequis

- **Python 3.11+** ([python.org](https://www.python.org/downloads/) — sous Windows,
  cocher « Add python.exe to PATH » à l'installation).
- La clé `service_role` du projet Supabase ERP (voir §3).

Vérifier Python :
```bash
python --version    # ou py --version (Windows) / python3 --version (Mac/Linux)
```

## 2. Installation

Ouvrir un terminal **dans le dossier `propulseo-mcp`**.

### Windows (PowerShell)
```powershell
cd C:\chemin\vers\propulseo-mcp
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```
> Si PowerShell bloque l'activation :
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` puis réessayer.

### Mac / Linux (bash/zsh)
```bash
cd /chemin/vers/propulseo-mcp
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 3. Configuration (`.env`)

1. Copier le modèle :
   - Windows : `copy .env.example .env`
   - Mac/Linux : `cp .env.example .env`
2. Récupérer la clé `service_role` :
   **Dashboard Supabase → projet ERP → Project Settings → API → `service_role` →
   *Reveal* / copier.**
3. Éditer `.env` et coller la clé :
   ```env
   SUPABASE_URL=https://tbuqctfgjjxnevmsvucl.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...   # <-- votre clé service_role
   MCP_DRY_RUN=true                   # laisser true pour tester sans risque
   ```

## 4. Tester AVANT de brancher le MCP

Toujours dans le venv activé :
```bash
python test_connection.py
```
Le script vérifie la config, l'authentification, et liste 3 contacts.
Vous devez voir `=== Tout est OK ===`.

## 5. Lancer le serveur (manuel, optionnel)

```bash
python run_server.py
```
Le serveur attend sur l'entrée/sortie standard (stdio). En usage normal, c'est
**Claude qui le lance** automatiquement (voir §6) — inutile de le démarrer à la main.

> `run_server.py` est un lanceur qui ajoute le dossier du projet au `sys.path` :
> il fonctionne **quel que soit le répertoire courant** (Claude Code/Desktop ne
> fixent pas le cwd), sans avoir à installer le package ni à définir `PYTHONPATH`.

---

## 6. Enregistrer le MCP dans Claude

> Le `.env` est lu via un **chemin absolu** calculé depuis le code : **aucun secret
> à mettre dans la configuration du client**. On indique seulement le **python du
> venv** + le lanceur `run_server.py` (tous deux en chemins **absolus**, car ni
> Claude Code ni Claude Desktop ne fixent le répertoire de travail).

Chemins à utiliser (adapter `<dossier>` ; ta machine = `C:\Users\etien\Desktop\CRM-Propul-seo-v2-main\propulseo-mcp`) :
- Python venv — Windows : `<dossier>\.venv\Scripts\python.exe`
- Python venv — Mac/Linux : `<dossier>/.venv/bin/python`
- Lanceur : `<dossier>\run_server.py` (Windows) / `<dossier>/run_server.py` (Mac/Linux)

### A. Claude Code (CLI)

> **Important — portée :** utilisez **`--scope user`** pour que le serveur soit
> disponible dans **toutes vos conversations/projets**. Sans ce flag, la portée est
> `local` et le serveur n'apparaît QUE dans le dossier où vous l'avez ajouté.

```powershell
# Windows (ta machine) — une seule ligne :
claude mcp add --scope user --transport stdio propulseo-crm -- "C:\Users\etien\Desktop\CRM-Propul-seo-v2-main\propulseo-mcp\.venv\Scripts\python.exe" "C:\Users\etien\Desktop\CRM-Propul-seo-v2-main\propulseo-mcp\run_server.py"
```
```bash
# Mac/Linux :
claude mcp add --scope user --transport stdio propulseo-crm -- /chemin/propulseo-mcp/.venv/bin/python /chemin/propulseo-mcp/run_server.py
```
- Vérifier : `claude mcp list` puis `claude mcp get propulseo-crm` (doit être `connected`).
- Retirer (puis re-ajouter pour changer de portée) : `claude mcp remove propulseo-crm`.
- **Les outils ne se chargent qu'au démarrage d'une session** : ouvrez une **nouvelle**
  session après l'ajout, puis `/mcp` pour confirmer. Une discussion déjà ouverte ne
  verra jamais le serveur ajouté entre-temps.
- Portées : `local` = ce projet seulement · `user` = tous vos projets (recommandé) ·
  `project` = partagé via un `.mcp.json` versionné (pratique pour l'associé).

### B. Claude Desktop (app Windows & Mac)

Éditer le fichier de configuration (le créer s'il n'existe pas) :
- **Windows** : `%APPDATA%\Claude\claude_desktop_config.json`
  (= `C:\Users\<vous>\AppData\Roaming\Claude\claude_desktop_config.json`)
- **Mac** : `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows (ta machine — prêt à coller, `\` doublés) :**
```json
{
  "mcpServers": {
    "propulseo-crm": {
      "type": "stdio",
      "command": "C:\\Users\\etien\\Desktop\\CRM-Propul-seo-v2-main\\propulseo-mcp\\.venv\\Scripts\\python.exe",
      "args": ["C:\\Users\\etien\\Desktop\\CRM-Propul-seo-v2-main\\propulseo-mcp\\run_server.py"]
    }
  }
}
```
**Mac (exemple) :**
```json
{
  "mcpServers": {
    "propulseo-crm": {
      "type": "stdio",
      "command": "/Users/vous/propulseo-mcp/.venv/bin/python",
      "args": ["/Users/vous/propulseo-mcp/run_server.py"]
    }
  }
}
```
> Si le fichier contient déjà d'autres serveurs, ajoutez seulement l'entrée
> `"propulseo-crm": { ... }` à l'intérieur de `mcpServers` (ne dupliquez pas la clé).

Puis **quitter complètement** Claude Desktop (Windows : clic droit icône barre des
tâches → Quitter ; Mac : Cmd+Q) **et le relancer**. Les outils `propulseo-crm`
doivent apparaître (icône 🔌). En cas d'échec, les logs MCP de Claude Desktop
indiquent l'erreur de démarrage.

---

## 7. Utilisation

Deux familles d'outils :

### Outils génériques (toutes les tables)
- `server_status` — état + mode dry-run + test connexion (à appeler en premier).
- `list_tables` — liste des tables par section.
- `describe_table` — colonnes, types, champs obligatoires, valeurs d'enum.
- `db_select`, `db_get`, `db_insert`, `db_update`, `db_delete` — CRUD universel.

### Outils nommés par section (~166 outils)
Préfixe par section, chacun avec list / get / create / update / delete typés :
- `crm_*` — contacts, clients, leads, activités de contact
- `projets_*` — projets, checklists, factures, suivis, briefs, contacts projet, activités, documents, accès (RO), archives (RO)
- `compta_*` — écritures, ventilations, partenaires, transactions, métriques (RO), archives (RO)
- `procedures_*` — procédures, catégories, révisions
- `taches_*` — tâches, commentaires, tâches perso, tâches comm, archives (RO)
- `comm_*` — posts, médias, commentaires, métriques, posts client
- `portails_*` — accès agence (RO), invitations de brief
- `parametres_*` — réglages société, utilisateurs, profils, permissions, notifications
- `dashboard_*` — métriques mensuelles & stats annuelles (RO)

> Astuce : si tu ne connais pas l'outil exact, demande en langage naturel — Claude
> choisit l'outil ; ou utilise `list_tables` / `describe_table` puis les `db_*`.

### Exemples de demandes en langage naturel
- « Liste les 10 derniers contacts au statut *signe*. »
- « Crée un contact : Jean Dupont, jean@exemple.fr, société Acme. »
- « Passe le lead Acme au statut *en_negociation*. »
- « Supprime le contact <id>. » → Claude montre d'abord la fiche, puis demande confirmation.

### Workflow recommandé
1. `MCP_DRY_RUN=true` : tester les créations/modifs, vérifier les aperçus.
2. Quand c'est bon, passer `MCP_DRY_RUN=false` dans `.env` et **relancer Claude**.
3. Les suppressions exigent toujours `confirm=true`.

---

## 8. Installer chez l'associé (autre machine — Windows & Mac)

1. **Récupérer le dossier** `propulseo-mcp` **sans** le `.env` ni le `.venv`
   (copie clé USB / zip / `git clone` si versionné). Ne jamais transmettre la clé.
2. **Installer Python 3.11+** (§1).
3. **Créer le venv + dépendances** depuis le dossier `propulseo-mcp` :
   - Windows : `python -m venv .venv` ; `./.venv/Scripts/Activate.ps1` ; `pip install -r requirements.txt`
   - Mac/Linux : `python3 -m venv .venv` ; `source .venv/bin/activate` ; `pip install -r requirements.txt`
4. **Créer SON propre `.env`** (§3) avec **sa** clé `sb_secret_…` du projet ERP,
   `MCP_DRY_RUN=true`.
5. **Tester** : `python test_connection.py` → `=== Tout est OK ===`.
6. **Brancher Claude** (§6) en adaptant les chemins absolus à **sa** machine
   (son dossier, `\.venv\Scripts\python.exe` sous Windows ou `/.venv/bin/python` sous Mac,
   et `run_server.py`).
> Chaque poste a son propre `.env` local et sa propre clé. Rien de secret ne circule
> dans le code ni dans la config Claude.

---

## 9. Limitations connues

- Les **identifiants/mots de passe** des accès (`agency_accesses`,
  `project_accesses_v2`) sont chiffrés côté base : lisibles en métadonnées mais
  non modifiables via ce MCP (nécessiterait une fonction serveur dédiée).
- Les **uploads de fichiers** (Supabase Storage) ne sont pas gérés : on peut créer
  la *métadonnée* d'un document, pas téléverser le binaire.
- Les **tables d'archives / métriques** sont en lecture seule.
- La **création de comptes** utilisateurs passe par les Edge Functions `admin-*`
  (hors périmètre) : `users` / `user_profiles` / `user_permissions` sont en
  list/get/update uniquement.

### Volume d'outils
Le serveur expose **174 outils** (8 génériques + ~166 nommés). Claude Code charge
les définitions à la demande (aucun souci). Si Claude **Desktop** en montre trop ou
peine à choisir, vous pouvez réduire la surface : dans
`propulseo_mcp/sections/__init__.py`, commentez les `register(...)` des sections
non utilisées (les outils génériques `db_*` continuent de couvrir ces tables).

## 10. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `Variables d'environnement manquantes` | `.env` absent/incomplet | Refaire §3 |
| `HTTP 401` au `ping` | clé service_role erronée | Recopier la clé (§3) |
| Écritures « simulées » | `MCP_DRY_RUN=true` | Passer à `false` + relancer Claude |
| Outils absents dans Desktop | chemin python/JSON | Vérifier chemins absolus (§6.B) + relancer |
