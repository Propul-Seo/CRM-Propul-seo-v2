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
python -m propulseo_mcp.server
```
Le serveur attend sur l'entrée/sortie standard (stdio). En usage normal, c'est
**Claude qui le lance** automatiquement (voir §6) — inutile de le démarrer à la main.

---

## 6. Enregistrer le MCP dans Claude

> Le `.env` est lu via un **chemin absolu** calculé depuis le code : pas besoin de
> mettre le secret dans la configuration du client. Indiquez simplement le
> **python du venv** et le module.

Repérez le chemin du python du venv :
- Windows : `<dossier>\propulseo-mcp\.venv\Scripts\python.exe`
- Mac/Linux : `<dossier>/propulseo-mcp/.venv/bin/python`

### A. Claude Code (CLI)

Depuis le dossier `propulseo-mcp` :

**Windows**
```powershell
claude mcp add propulseo-crm -- .\.venv\Scripts\python.exe -m propulseo_mcp.server
```
**Mac/Linux**
```bash
claude mcp add propulseo-crm -- ./.venv/bin/python -m propulseo_mcp.server
```
Vérifier : `claude mcp list` (le serveur doit apparaître `connected`).
Pour le retirer : `claude mcp remove propulseo-crm`.

### B. Claude Desktop (app Windows & Mac)

Éditer le fichier de configuration (le créer s'il n'existe pas) :
- **Windows** : `%APPDATA%\Claude\claude_desktop_config.json`
- **Mac** : `~/Library/Application Support/Claude/claude_desktop_config.json`

Y ajouter (adapter les chemins **absolus** ; sous Windows, **doubler les `\`**) :

```jsonc
{
  "mcpServers": {
    "propulseo-crm": {
      "command": "C:\\chemin\\propulseo-mcp\\.venv\\Scripts\\python.exe",
      "args": ["-m", "propulseo_mcp.server"]
    }
  }
}
```
Exemple **Mac** :
```jsonc
{
  "mcpServers": {
    "propulseo-crm": {
      "command": "/Users/vous/propulseo-mcp/.venv/bin/python",
      "args": ["-m", "propulseo_mcp.server"]
    }
  }
}
```
Puis **quitter complètement et relancer Claude Desktop**. L'icône outils (🔌)
doit lister les outils `propulseo-crm`.

---

## 7. Utilisation

Deux familles d'outils :

### Outils génériques (toutes les tables)
- `server_status` — état + mode dry-run + test connexion (à appeler en premier).
- `list_tables` — liste des tables par section.
- `describe_table` — colonnes, types, champs obligatoires, valeurs d'enum.
- `db_select`, `db_get`, `db_insert`, `db_update`, `db_delete` — CRUD universel.

### Outils nommés (section CRM, déjà câblés)
`crm_list_contacts`, `crm_get_contact`, `crm_create_contact`, `crm_update_contact`,
`crm_delete_contact`, idem pour `client` et `lead`, plus
`crm_list_contact_activities` / `crm_log_contact_activity`.

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

## 8. Installer chez l'associé (autre machine)

1. Copier le dossier `propulseo-mcp` (sans le `.env`).
2. Suivre §1 → §4 (installer Python, créer le venv, `pip install`, créer son
   propre `.env` avec la clé `service_role`).
3. Suivre §6 pour brancher Claude Code et/ou Claude Desktop.
> Chaque poste a son propre `.env` local. La clé n'est jamais transmise par le code.

---

## 9. Limitations connues

- Les **identifiants/mots de passe** des accès (`agency_accesses`,
  `project_accesses_v2`) sont chiffrés côté base : lisibles en métadonnées mais
  non modifiables via ce MCP (nécessiterait une fonction serveur dédiée).
- Les **uploads de fichiers** (Supabase Storage) ne sont pas gérés : on peut créer
  la *métadonnée* d'un document, pas téléverser le binaire.
- Les **tables d'archives / métriques** sont en lecture seule.

## 10. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `Variables d'environnement manquantes` | `.env` absent/incomplet | Refaire §3 |
| `HTTP 401` au `ping` | clé service_role erronée | Recopier la clé (§3) |
| Écritures « simulées » | `MCP_DRY_RUN=true` | Passer à `false` + relancer Claude |
| Outils absents dans Desktop | chemin python/JSON | Vérifier chemins absolus (§6.B) + relancer |
