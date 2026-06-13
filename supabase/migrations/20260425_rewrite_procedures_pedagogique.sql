-- ============================================================
-- Réécriture des 16 fiches Procédures en version pédagogique
-- ============================================================
-- Corrections :
--   1. Apostrophes simples dans les JSON (dollar-quoting n'escape pas)
--   2. Vocabulaire accessible (termes tech expliqués au premier usage)
--   3. Encadrés "💡 Astuce" et "⚠️ Attention" pour guider
--
-- Pattern : UPDATE ... WHERE slug = ... (les fiches existent déjà)
-- Le trigger log_procedure_revision archive automatiquement l'ancienne version.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Acheter un nom de domaine sur Namecheap
-- ------------------------------------------------------------
UPDATE public.procedures SET
  summary = 'Acheter un nom de domaine (l''adresse web d''un site, ex. monentreprise.fr) sur Namecheap, pas à pas.',
  content = $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [
        { "type": "text", "text": "Un " },
        { "type": "text", "marks": [{ "type": "bold" }], "text": "nom de domaine" },
        { "type": "text", "text": " c''est l''adresse web d''un site (ex. " },
        { "type": "text", "marks": [{ "type": "code" }], "text": "propulseo-site.com" },
        { "type": "text", "text": "). Il se loue à l''année auprès d''un « registrar » (vendeur agréé). Namecheap est fiable, peu cher et interface simple." }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Va sur " },
          { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://www.namecheap.com", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "namecheap.com" },
          { "type": "text", "text": "." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Tape le nom de domaine voulu dans la barre de recherche (ex. " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "monentreprise" },
          { "type": "text", "text": ")." }
        ]}]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Choisis l''extension (la terminaison après le point) :" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "marks": [{ "type": "code" }], "text": ".fr" },
              { "type": "text", "text": " : activité française, clients français." }
            ]}]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "marks": [{ "type": "code" }], "text": ".com" },
              { "type": "text", "text": " : international, le plus reconnu." }
            ]}]}
          ]}
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Clique " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Add to cart" },
          { "type": "text", "text": " (ajouter au panier) sur la ligne du domaine choisi." }
        ]}]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [
            { "type": "text", "text": "Ouvre le panier (icône 🛒 en haut à droite) et vérifie :" }
          ]},
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "marks": [{ "type": "bold" }], "text": "WhoisGuard / Privacy" },
              { "type": "text", "text": " activé (gratuit chez Namecheap) — cache tes infos perso du registre public WHOIS." }
            ]}]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "text": "Durée : 1 an suffit au démarrage." }
            ]}]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "marks": [{ "type": "bold" }], "text": "Auto-renew" },
              { "type": "text", "text": " activé : le domaine se renouvelle tout seul à l''échéance, tu ne risques pas de le perdre par oubli." }
            ]}]}
          ]}
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Clique " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Checkout" },
          { "type": "text", "text": " (passer commande)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Crée un compte Namecheap (email + mot de passe) ou connecte-toi." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Remplis tes infos (nom, adresse — obligatoires même si cachées par WhoisGuard) et paie par carte ou PayPal." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Ouvre l''email de confirmation et clique le lien de validation — obligatoire pour activer le domaine." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Dans " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Dashboard → Domain List" },
          { "type": "text", "text": ", le domaine doit apparaître avec le statut " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Active" },
          { "type": "text", "text": ". C''est bon." }
        ]}]}
      ]},
      { "type": "blockquote", "content": [
        { "type": "paragraph", "content": [
          { "type": "text", "text": "👉 Envoie ensuite les identifiants Namecheap (login + mot de passe) à ton interlocuteur Propul'SEO de façon sécurisée (1Password, Bitwarden, ou message chiffré)." }
        ]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "💡 Astuces" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Si ton nom exact est déjà pris, teste des variantes (avec/sans tiret, autre extension)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Active la " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "double authentification" },
          { "type": "text", "text": " dans ton compte Namecheap (Account → Security) — un domaine volé est très compliqué à récupérer." }
        ]}]}
      ]}
    ]
  }$jsonb$::jsonb,
  content_text = 'Nom de domaine adresse web site loué année registrar Namecheap fiable peu cher. Étapes namecheap.com recherche extension .fr France .com international Add to cart panier WhoisGuard Privacy gratuit cache infos WHOIS durée 1 an Auto-renew renouvellement auto Checkout compte connexion infos nom adresse carte PayPal email confirmation validation Dashboard Domain List Active. Envoyer identifiants Propul''SEO sécurisé 1Password Bitwarden chiffré. Astuces variantes tiret extension double authentification Security domaine volé.'
WHERE slug = 'acheter-nom-de-domaine-namecheap';


-- ------------------------------------------------------------
-- 2. Se connecter à Claude Code
-- ------------------------------------------------------------
UPDATE public.procedures SET
  summary = 'Installer Claude Code (l''assistant IA d''Anthropic pour coder dans le terminal) et démarrer sa première session.',
  content = $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [
        { "type": "text", "marks": [{ "type": "bold" }], "text": "Claude Code" },
        { "type": "text", "text": " est un " },
        { "type": "text", "marks": [{ "type": "bold" }], "text": "agent de programmation" },
        { "type": "text", "text": " fait par Anthropic. Il tourne dans le " },
        { "type": "text", "marks": [{ "type": "bold" }], "text": "terminal" },
        { "type": "text", "text": " (la console texte de ton ordi) et il peut lire/écrire du code, lancer des commandes, commit sur git… en langage naturel. Voici comment le mettre en place." }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Ce qu''il te faut avant" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Un " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "compte Anthropic" },
          { "type": "text", "text": " avec abonnement Pro (20 $/mois) ou Max (100-200 $/mois)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Un " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "terminal" },
          { "type": "text", "text": " (sur Mac : appli " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Terminal" },
          { "type": "text", "text": " ou " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "iTerm2" },
          { "type": "text", "text": " ; sur Windows : PowerShell ou WSL)." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Installation" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Ouvre ton terminal et colle cette commande (elle télécharge et installe Claude Code) :" }] },
          { "type": "codeBlock", "content": [{ "type": "text", "text": "curl -fsSL https://claude.ai/install.sh | bash" }] }
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Ferme et rouvre le terminal pour qu''il détecte la nouvelle commande " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "claude" },
          { "type": "text", "text": "." }
        ]}]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Place-toi dans le dossier d''un projet et lance Claude :" }] },
          { "type": "codeBlock", "content": [{ "type": "text", "text": "cd ~/mon-projet\nclaude" }] }
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "La première fois, Claude ouvre ton navigateur pour te connecter à ton compte Anthropic. Valide, reviens au terminal — tu es connecté." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Dans Claude, tape " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "/init" },
          { "type": "text", "text": ". Il analyse le projet et crée un fichier " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "CLAUDE.md" },
          { "type": "text", "text": " qui sert de " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "mémoire" },
          { "type": "text", "text": " persistante pour ton projet." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Utiliser Claude Code dans VSCode ou Cursor" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Ouvre VSCode ou Cursor. Va dans l''onglet " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Extensions" },
          { "type": "text", "text": " (icône carrée à gauche) et cherche " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Claude Code" },
          { "type": "text", "text": "." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Installe l''extension officielle (éditeur Anthropic)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Ouvre-la (raccourci Cmd+Shift+P → tape « Claude: Start session »). L''authentification est partagée avec le terminal, donc rien à refaire." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "💡 Astuces" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Le fichier " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "CLAUDE.md" },
          { "type": "text", "text": " est chargé à chaque conversation. Garde-le court (patterns, commandes, conventions) — sinon tu gaspilles du contexte." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Avant toute tâche sérieuse, active le " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Plan Mode" },
          { "type": "text", "text": " (Shift+Tab deux fois). Claude planifie avant de modifier quoi que ce soit." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Doc officielle : " },
          { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://docs.claude.com/en/docs/claude-code/overview", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "docs.claude.com/en/docs/claude-code" }
        ]}]}
      ]}
    ]
  }$jsonb$::jsonb,
  content_text = 'Claude Code agent programmation Anthropic terminal console lire écrire code commandes git langage naturel. Prérequis compte Anthropic Pro 20 dollars Max 100 200 dollars terminal Mac iTerm2 Windows PowerShell WSL. Installation curl https claude.ai install.sh bash fermer rouvrir commande claude. cd dossier projet claude navigateur connexion Anthropic. /init analyse crée CLAUDE.md mémoire persistante. VSCode Cursor Extensions Claude Code installation Cmd Shift P Start session partagée terminal. Astuces CLAUDE.md court contexte Plan Mode Shift Tab planifier avant modifier. Doc officielle.'
WHERE slug = 'se-connecter-claude-code';


-- ------------------------------------------------------------
-- 3. Hook Claude Code
-- ------------------------------------------------------------
UPDATE public.procedures SET
  summary = 'Mettre en place un hook Claude Code : une action qui se déclenche automatiquement (ex. lancer le lint après chaque modif de fichier).',
  content = $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [
        { "type": "text", "text": "Un " },
        { "type": "text", "marks": [{ "type": "bold" }], "text": "hook" },
        { "type": "text", "text": " c''est une commande que Claude Code lance " },
        { "type": "text", "marks": [{ "type": "italic" }], "text": "automatiquement" },
        { "type": "text", "text": " à des moments précis (avant d''utiliser un outil, après avoir modifié un fichier, au démarrage d''une session…). Très utile pour automatiser des vérifications (lint, tests) sans que Claude ait à y penser." }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Moments où un hook peut se déclencher" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "PreToolUse" },
          { "type": "text", "text": " — avant qu''un outil soit utilisé (peut bloquer l''outil si le hook renvoie une erreur)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "PostToolUse" },
          { "type": "text", "text": " — juste après l''utilisation d''un outil (le plus courant : lint/tests après Edit)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "SessionStart / SessionEnd" },
          { "type": "text", "text": " — au début ou à la fin d''une session Claude." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Stop" },
          { "type": "text", "text": " — quand Claude s''arrête de répondre (utile pour notifier, faire un rappel…)." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Mettre en place un hook (exemple : lancer le lint après chaque modif)" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Ouvre le fichier " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "~/.claude/settings.json" },
          { "type": "text", "text": " (réglages globaux, s''appliquent à tous tes projets). Crée-le s''il n''existe pas." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Pour un hook spécifique à un projet : utilise " },
          { "type": "text", "marks": [{ "type": "code" }], "text": ".claude/settings.json" },
          { "type": "text", "text": " à la racine du projet." }
        ]}]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Colle cette configuration :" }] },
          { "type": "codeBlock", "content": [{ "type": "text", "text": "{\n  \"hooks\": {\n    \"PostToolUse\": [\n      {\n        \"matcher\": \"Edit|Write\",\n        \"hooks\": [\n          {\n            \"type\": \"command\",\n            \"command\": \"npm run lint --silent\"\n          }\n        ]\n      }\n    ]\n  }\n}" }] }
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Sauvegarde. Redémarre Claude Code pour qu''il prenne en compte le hook." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Vérifie : demande à Claude d''éditer un fichier. Tu dois voir la commande lint s''exécuter juste après." }
        ]}]}
      ]},
      { "type": "blockquote", "content": [
        { "type": "paragraph", "content": [
          { "type": "text", "text": "💡 Facile à configurer sans toucher au JSON : dans Claude, tape « configure un hook qui … » — la skill " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "update-config" },
          { "type": "text", "text": " le fait pour toi." }
        ]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Cas d''usage concrets" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Lancer " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "npm run lint" },
          { "type": "text", "text": " après chaque modif (évite le code cassé)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Bloquer un " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "git push" },
          { "type": "text", "text": " sur la branche " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "main" },
          { "type": "text", "text": " (via PreToolUse + exit non-zero)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Notification Slack à la fin d''une session longue (SessionEnd)." }
        ]}]}
      ]},
      { "type": "paragraph", "content": [
        { "type": "text", "text": "Doc officielle : " },
        { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://docs.claude.com/en/docs/claude-code/hooks", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "docs.claude.com/en/docs/claude-code/hooks" }
      ]}
    ]
  }$jsonb$::jsonb,
  content_text = 'Hook Claude Code commande automatique moments précis avant outil après modif session démarrage automatiser vérifications lint tests. Moments PreToolUse avant outil bloquer PostToolUse après outil lint tests Edit SessionStart SessionEnd Stop notifier rappel. Configuration ~/.claude/settings.json global .claude/settings.json projet hooks PostToolUse matcher Edit Write command npm run lint silent. Redémarrer Claude vérifier éditer fichier lint exécute. Skill update-config configurer sans JSON. Cas usage npm lint bloquer git push main PreToolUse exit non-zero notification Slack SessionEnd. Doc officielle.'
WHERE slug = 'configurer-hook-claude-code';


-- ------------------------------------------------------------
-- 4. MCP Supabase
-- ------------------------------------------------------------
UPDATE public.procedures SET
  summary = 'Brancher Claude Code à une base Supabase via MCP pour qu''il puisse lire/écrire la DB en langage naturel.',
  content = $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [
        { "type": "text", "text": "Le " },
        { "type": "text", "marks": [{ "type": "bold" }], "text": "MCP (Model Context Protocol)" },
        { "type": "text", "text": " est le « standard » qui permet à Claude de parler à des services externes (Supabase, Stripe, Figma…). Le MCP Supabase donne à Claude des super-pouvoirs sur ta base de données : lister les tables, faire des requêtes SQL, appliquer des migrations, lire les logs, le tout via ton langage naturel." }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Ce qu''il te faut" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Claude Code déjà installé (voir fiche " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Se connecter à Claude Code" },
          { "type": "text", "text": ")." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Un " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Personal Access Token (PAT) Supabase" },
          { "type": "text", "text": " — un jeton qui prouve à Supabase que c''est bien toi. À générer dans " },
          { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://supabase.com/dashboard/account/tokens", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "ton dashboard Supabase → Account → Access Tokens" },
          { "type": "text", "text": "." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Dans ton dashboard Supabase : Account → Access Tokens → " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Generate new token" },
          { "type": "text", "text": ". Copie immédiatement la valeur (tu ne la reverras plus)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Ouvre le fichier " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "~/.claude/mcp_servers.json" },
          { "type": "text", "text": " (crée-le s''il n''existe pas)." }
        ]}]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Colle cette configuration (remplace " }, { "type": "text", "marks": [{ "type": "code" }], "text": "sbp_XXX" }, { "type": "text", "text": " par ton token) :" }] },
          { "type": "codeBlock", "content": [{ "type": "text", "text": "{\n  \"mcpServers\": {\n    \"supabase\": {\n      \"command\": \"npx\",\n      \"args\": [\n        \"-y\",\n        \"@supabase/mcp-server-supabase@latest\",\n        \"--access-token\",\n        \"sbp_XXXXXXXXXXXXXXXXXXXX\"\n      ]\n    }\n  }\n}" }] }
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Redémarre Claude Code. Dans la session, tape " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "/mcp" },
          { "type": "text", "text": " — tu dois voir " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "supabase" },
          { "type": "text", "text": " listé comme connecté (✅)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Teste : demande « liste mes projets Supabase ». Claude utilise automatiquement le MCP." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "⚠️ Sécurité (important)" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Pour travailler sur un seul projet, ajoute " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "\"--project-ref\", \"ton_project_id\"" },
          { "type": "text", "text": " dans les " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "args" },
          { "type": "text", "text": ". Évite de donner accès à tous tes projets à la fois." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "En production, passe en mode lecture seule : ajoute " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "\"--read-only\"" },
          { "type": "text", "text": ". Claude pourra lire mais rien modifier." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Ne commit jamais " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "mcp_servers.json" },
          { "type": "text", "text": " avec le token dedans — ajoute-le au " },
          { "type": "text", "marks": [{ "type": "code" }], "text": ".gitignore" },
          { "type": "text", "text": "." }
        ]}]}
      ]},
      { "type": "paragraph", "content": [
        { "type": "text", "text": "Doc officielle : " },
        { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://supabase.com/docs/guides/getting-started/mcp", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "supabase.com/docs/guides/getting-started/mcp" }
      ]}
    ]
  }$jsonb$::jsonb,
  content_text = 'MCP Model Context Protocol standard Claude services externes Supabase Stripe Figma. MCP Supabase super pouvoirs base de données lister tables requêtes SQL migrations logs langage naturel. Prérequis Claude Code Personal Access Token PAT jeton dashboard Account Access Tokens. Étapes generate new token copier mcp_servers.json ~/.claude mcpServers supabase npx mcp-server-supabase access-token sbp_XXX. Redémarrer /mcp connecté tester liste projets. Sécurité project-ref un projet read-only lecture seule prod ne jamais commit mcp_servers.json gitignore. Doc officielle.'
WHERE slug = 'connecter-mcp-supabase-claude';


-- ------------------------------------------------------------
-- 5. Rédiger un PRD
-- ------------------------------------------------------------
UPDATE public.procedures SET
  summary = 'Écrire un PRD (cahier des charges détaillé) avant de démarrer un projet : objectifs, utilisateurs, fonctionnalités, techno, planning.',
  content = $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [
        { "type": "text", "text": "Un " },
        { "type": "text", "marks": [{ "type": "bold" }], "text": "PRD (Product Requirements Document)" },
        { "type": "text", "text": " c''est l''équivalent du cahier des charges en version moderne. Il répond à la question : " },
        { "type": "text", "marks": [{ "type": "italic" }], "text": "qu''est-ce qu''on construit, pour qui, et comment ?" },
        { "type": "text", "text": " Écrire un PRD avant de coder évite de construire pendant 2 mois un produit dont personne ne voulait." }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Les 10 sections d''un PRD Propul'SEO" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Contexte & problème" },
          { "type": "text", "text": " — pourquoi ce projet ? qui a ce problème aujourd''hui ? comment il le gère actuellement ?" }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Objectifs" },
          { "type": "text", "text": " — 1 objectif principal chiffré (ex. « gagner 50 clients payants en 6 mois ») + 2-3 métriques de succès." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Utilisateurs cibles" },
          { "type": "text", "text": " — décrire 2-3 profils-types (le " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "persona" },
          { "type": "text", "text": ") : qui, leur contexte, leur niveau technique, leurs frustrations." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Scope V1 (ce qui est dans vs dehors)" },
          { "type": "text", "text": " — liste ce que la V1 fait " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "ET surtout ce qu''elle ne fait pas" },
          { "type": "text", "text": ". C''est la section qui sauve le projet des « encore une petite chose »." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "User stories" },
          { "type": "text", "text": " — formulaire magique : « " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "En tant que [type d''utilisateur], je veux [action], afin de [bénéfice]." },
          { "type": "text", "text": " »" }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Architecture & stack" },
          { "type": "text", "text": " — quels outils on utilise ? (framework front, base de données, hébergement, auth, etc.)" }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Modèle de données" },
          { "type": "text", "text": " — les tables principales et leurs relations (même un schéma rapide sur papier/Miro)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Critères d''acceptation" },
          { "type": "text", "text": " — pour chaque user story : « c''est bon quand… » (checklist testable)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Risques" },
          { "type": "text", "text": " — ce qui peut mal tourner (techniques, légaux, dépendances tierces) + comment on l''évite." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Planning" },
          { "type": "text", "text": " — milestones (grandes étapes) avec dates cibles." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Comment on le rédige chez Propul'SEO" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Call de brainstorm avec le client (45-60 min). Note brute dans Obsidian, pas encore structurée." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "On passe la note brute à Claude Code en " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Plan Mode" },
          { "type": "text", "text": " avec la skill " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "superpowers:brainstorming" },
          { "type": "text", "text": ". Claude pose les bonnes questions pour combler les trous." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "On itère 1-2h (parfois avec le client en parallèle sur Slack) jusqu''au document final." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "On stocke le PRD dans le vault Obsidian du projet + on envoie au client une version allégée en PDF (sans détails tech)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Le client valide par écrit" },
          { "type": "text", "text": " avant qu''on démarre. C''est la base du contrat." }
        ]}]}
      ]},
      { "type": "blockquote", "content": [
        { "type": "paragraph", "content": [
          { "type": "text", "text": "👉 Règle d''or : un bon PRD fait 3 à 8 pages. Plus court = tu as des angles morts. Plus long = personne ne le lit." }
        ]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Pour aller plus loin" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "italic" }], "text": "The Mom Test" },
          { "type": "text", "text": " (Rob Fitzpatrick) — comment poser les bonnes questions au client avant d''écrire le PRD." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Obviously Awesome" },
          { "type": "text", "text": " (April Dunford) — framework pour positionner un produit en 5 étapes." }
        ]}]}
      ]}
    ]
  }$jsonb$::jsonb,
  content_text = 'PRD Product Requirements Document cahier des charges moderne qu''est-ce qu''on construit pour qui comment. Évite 2 mois produit dont personne ne voulait. 10 sections Propul''SEO contexte problème pourquoi qui problème aujourd''hui gère. Objectifs principal chiffré 50 clients 6 mois 2 3 métriques succès. Utilisateurs cibles 2 3 profils persona contexte niveau technique frustrations. Scope V1 dans dehors ce qu''elle ne fait pas sauve encore une petite chose. User stories En tant que je veux afin de. Architecture stack framework front base de données hébergement auth. Modèle de données tables relations schéma Miro. Critères acceptation c''est bon quand checklist testable. Risques techniques légaux dépendances mitigations. Planning milestones dates cibles. Rédaction Propul''SEO brainstorm client 45 60 min note brute Obsidian Claude Code Plan Mode skill brainstorming questions. Itère 1 2h client Slack. Vault Obsidian PDF client. Client valide écrit contrat. 3 à 8 pages angles morts personne lit. Mom Test Rob Fitzpatrick questions. Obviously Awesome April Dunford positionner produit 5 étapes.'
WHERE slug = 'rediger-prd-product-requirements-document';


-- ------------------------------------------------------------
-- 6. Onboarder un nouveau client
-- ------------------------------------------------------------
UPDATE public.procedures SET
  summary = 'Le parcours complet pour accueillir un nouveau client : du premier appel jusqu''au démarrage du projet.',
  content = $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [
        { "type": "text", "text": "Bien accueillir un nouveau client = moins d''allers-retours, un projet qui démarre clean et un NPS (satisfaction) élevé. Voici le parcours type de Propul'SEO." }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étape 1 — Qualification (appel 30 min)" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Appel découverte pour comprendre son besoin. On utilise la grille " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "BANT" },
          { "type": "text", "text": " (Budget, Authority, Need, Timing) : a-t-il un budget ? est-ce lui qui décide ? son besoin est-il clair ? c''est pour quand ?" }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "On crée sa fiche dans le CRM Propul'SEO (module CRM Principal ou ERP selon le type de projet)." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étape 2 — Brief détaillé (45-60 min)" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "On envoie au client le " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "lien de brief" },
          { "type": "text", "text": " (module Brief du CRM — un formulaire public avec un code court à 8 caractères). Le client le remplit tranquille de son côté." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Une fois rempli, on fait un call de clarification sur les points flous." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étape 3 — Devis" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "On génère le devis dans le CRM (voir fiche " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Rédiger un devis Propul'SEO" },
          { "type": "text", "text": ")." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "On l''envoie par email + via le portail client. Relance à J+3 si pas de retour." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étape 4 — Signature & acompte" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Contrat via Legalstart (ou template interne). Signature électronique (Yousign, Pandadoc)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Acompte de 30 à 50 % avant démarrage — lien Stripe ou virement SEPA." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étape 5 — Collecte des accès" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "On envoie au client les fiches procédures pertinentes (ex. " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Acheter un nom de domaine Namecheap" },
          { "type": "text", "text": ") pour qu''il prépare les comptes et nous envoie les identifiants." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Les accès sont stockés dans le CRM → onglet Accès du projet (chiffré)." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étape 6 — Kick-off (30 min)" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Présentation de l''équipe Propul'SEO qui s''occupe du projet, planning, canal de communication (Slack Connect ou channel dédié sur Discord)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Validation du planning + date de la première livraison intermédiaire." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "✅ Checklist avant de démarrer le dev" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Contrat signé par les deux parties" }] }]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Acompte reçu" }] }]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Accès stockés dans le CRM" }] }]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Un chef de projet Propul'SEO attribué" }] }]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Canal de communication en place" }] }]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Première livraison calendarisée" }] }]}
      ]}
    ]
  }$jsonb$::jsonb,
  content_text = 'Onboarding client Propul''SEO moins allers retours démarrage clean NPS satisfaction élevé. Étape 1 qualification appel 30 min BANT Budget Authority Need Timing décide besoin pour quand. Fiche CRM Principal ERP. Étape 2 brief 45 60 min lien brief module Brief formulaire public code court 8 caractères tranquille. Call clarification points flous. Étape 3 devis CRM fiche Rédiger devis envoyer email portail relance J+3. Étape 4 signature acompte contrat Legalstart template interne Yousign Pandadoc acompte 30 à 50 avant démarrage Stripe virement SEPA. Étape 5 accès fiches procédures Namecheap identifiants CRM onglet Accès chiffré. Étape 6 kick-off 30 min présentation équipe planning Slack Connect Discord validation première livraison. Checklist contrat acompte accès chef de projet canal livraison.'
WHERE slug = 'onboarder-nouveau-client';


-- ------------------------------------------------------------
-- 7. Rédiger un devis dans le CRM
-- ------------------------------------------------------------
UPDATE public.procedures SET
  summary = 'Créer, chiffrer et envoyer un devis propre depuis le module Devis du CRM Propul''SEO.',
  content = $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [
        { "type": "text", "text": "Un devis c''est la première preuve de sérieux qu''on envoie à un prospect. Il doit être clair, chiffré ligne par ligne, et avoir une date de validité. Voici le process dans le CRM Propul'SEO." }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Avant de commencer" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "La fiche client doit exister dans le CRM (CRM Principal ou ERP)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Le brief doit être validé (voir fiche " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Onboarder un nouveau client" },
          { "type": "text", "text": ")." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Ouvre la fiche client dans le CRM → onglet " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Devis" },
          { "type": "text", "text": " → bouton " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Nouveau devis" },
          { "type": "text", "text": "." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Titre du devis au format : " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "[Nom client] - [Nom projet] - Devis v1" },
          { "type": "text", "text": "." }
        ]}]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Ajoute les lignes de prestation une par une :" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "marks": [{ "type": "bold" }], "text": "Intitulé clair" },
              { "type": "text", "text": " (ex. « Développement front Next.js + intégration design Figma »)." }
            ]}]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "marks": [{ "type": "bold" }], "text": "Quantité" },
              { "type": "text", "text": " (jours, forfait, nombre de pages, etc.)." }
            ]}]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "marks": [{ "type": "bold" }], "text": "Prix unitaire HT" },
              { "type": "text", "text": " (hors taxes)." }
            ]}]}
          ]}
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Conditions de paiement : 30 à 50 % à la signature, solde à la livraison." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Date de validité : J+30 (le devis n''est plus valable après 30 jours)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Bouton " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Aperçu / PDF" },
          { "type": "text", "text": " pour générer le PDF final. Relis-le avant d''envoyer." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Bouton " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Envoyer au client" },
          { "type": "text", "text": " : le client reçoit un email avec le PDF en pièce jointe + un lien vers son portail pour valider." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Passe le statut de la fiche client en " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "devis_envoye" },
          { "type": "text", "text": "." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Règles de chiffrage Propul'SEO" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "TJM (taux journalier) : [À COMPLÉTER PAR L''ÉQUIPE] €/j HT pour un dev sénior, [...] €/j HT pour un designer." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "On privilégie le " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "forfait" },
          { "type": "text", "text": " (prix fixe) quand le scope est clair. Le TJM est gardé pour les missions flexibles." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Prévoir 20 % de marge technique pour absorber les imprévus (réécriture de code legacy, refacto, etc.)." }
        ]}]}
      ]},
      { "type": "blockquote", "content": [
        { "type": "paragraph", "content": [
          { "type": "text", "text": "👉 Relances : J+3 (rappel sympa), J+7 (questions ?), J+14 (dernière chance). Au-delà de J+30 sans réponse, passe la fiche en " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "perdu" },
          { "type": "text", "text": " avec un motif." }
        ]}
      ]}
    ]
  }$jsonb$::jsonb,
  content_text = 'Devis première preuve sérieux prospect clair chiffré ligne date validité CRM Propul''SEO module Devis. Avant fiche client CRM Principal ERP brief validé. Étapes nouveau devis titre Client Projet v1 lignes prestation intitulé clair dev Next.js design Figma quantité jours forfait pages prix unitaire HT hors taxes. Conditions paiement 30 à 50 signature solde livraison. Validité J+30 30 jours. Aperçu PDF relire envoyer email pièce jointe lien portail statut devis_envoye. Règles chiffrage TJM taux journalier dev sénior designer forfait prix fixe scope clair missions flexibles marge technique 20 imprévus legacy refacto. Relances J+3 rappel J+7 questions J+14 dernière chance J+30 perdu motif.'
WHERE slug = 'rediger-devis-crm';


-- ------------------------------------------------------------
-- 8. Cloudflare DNS
-- ------------------------------------------------------------
UPDATE public.procedures SET
  summary = 'Transférer la gestion des DNS d''un domaine vers Cloudflare pour gagner du cache, du SSL gratuit et de la protection anti-attaques.',
  content = $jsonb${
    "type": "doc",
    "content": [
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "C'est quoi le DNS ?" }] },
      { "type": "paragraph", "content": [
        { "type": "text", "text": "Le " },
        { "type": "text", "marks": [{ "type": "bold" }], "text": "DNS (Domain Name System)" },
        { "type": "text", "text": " c''est l''annuaire d''internet. Il dit « le domaine " },
        { "type": "text", "marks": [{ "type": "code" }], "text": "monsite.fr" },
        { "type": "text", "text": " pointe vers le serveur d''IP 1.2.3.4 ». Quand tu « délègues les DNS » à Cloudflare, c''est Cloudflare qui gère cet annuaire pour ton domaine." }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Pourquoi Cloudflare ?" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "CDN (Content Delivery Network)" },
          { "type": "text", "text": " : les images et fichiers sont servis depuis le serveur le plus proche du visiteur → le site charge plus vite." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "SSL gratuit" },
          { "type": "text", "text": " (le https) activé automatiquement." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Protection anti-DDoS" },
          { "type": "text", "text": " : Cloudflare filtre les attaques avant qu''elles n''atteignent ton site." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Tout ça " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "gratuit" },
          { "type": "text", "text": " (plan Free largement suffisant pour la majorité des sites)." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Ce qu''il te faut" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Un compte gratuit sur " },
          { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://dash.cloudflare.com", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "dash.cloudflare.com" },
          { "type": "text", "text": "." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "L''accès au compte du registrar où le domaine est acheté (Namecheap, OVH, Gandi…)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "La liste des enregistrements DNS actuels (souvent visibles chez le registrar). Les noter au cas où." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Dans Cloudflare : " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Add a site" },
          { "type": "text", "text": ". Tape ton domaine (ex. " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "exemple.fr" },
          { "type": "text", "text": ")." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Choisis le plan " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Free" },
          { "type": "text", "text": ". Cloudflare scanne automatiquement les enregistrements DNS (~30 secondes)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Vérifie que tous les enregistrements importants sont là (A pour le site, MX pour l''email, TXT pour SPF/DKIM). Ajoute à la main ceux qui manquent." }
        ]}]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [
            { "type": "text", "text": "Pour chaque ligne, choisis entre nuage orange et nuage gris :" }
          ]},
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "marks": [{ "type": "bold" }], "text": "🟠 Proxied (orange)" },
              { "type": "text", "text": " — Cloudflare relaie le trafic, active cache + SSL + protection. À mettre sur le site web." }
            ]}]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "marks": [{ "type": "bold" }], "text": "⚪ DNS only (gris)" },
              { "type": "text", "text": " — Cloudflare ne fait que rediriger. À mettre sur les emails (MX) et les enregistrements TXT — sinon l''email casse." }
            ]}]}
          ]}
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Cloudflare affiche 2 adresses de serveurs de noms (ex. " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "arya.ns.cloudflare.com" },
          { "type": "text", "text": " et " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "rob.ns.cloudflare.com" },
          { "type": "text", "text": "). Copie-les." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Va chez le registrar (ex. Namecheap → Domain List → Manage → Nameservers). Choisis « Custom DNS » et remplace les nameservers par ceux de Cloudflare. Sauvegarde." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "La propagation (le temps que la planète entière sache que ton domaine utilise Cloudflare) prend entre 5 min et 24 h — typiquement < 1 h." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Cloudflare envoie un email quand c''est actif. Dans le dashboard, le statut passe à " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Active" },
          { "type": "text", "text": "." }
        ]}]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [
            { "type": "text", "text": "Active les bons réglages :" }
          ]},
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "text": "SSL/TLS → " },
              { "type": "text", "marks": [{ "type": "bold" }], "text": "Full (strict)" }
            ]}]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "marks": [{ "type": "bold" }], "text": "Always Use HTTPS" },
              { "type": "text", "text": " (redirige tout http vers https)" }
            ]}]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "marks": [{ "type": "bold" }], "text": "HTTP/3" },
              { "type": "text", "text": " (protocole plus rapide)" }
            ]}]}
          ]}
        ]}
      ]},
      { "type": "blockquote", "content": [
        { "type": "paragraph", "content": [
          { "type": "text", "text": "⚠️ Point critique : toujours laisser les MX et TXT en nuage gris. Un nuage orange sur un MX casse la réception des emails." }
        ]}
      ]}
    ]
  }$jsonb$::jsonb,
  content_text = 'DNS annuaire internet domaine pointe serveur IP. Déléguer DNS Cloudflare gère annuaire. Pourquoi Cloudflare CDN Content Delivery Network images fichiers serveur proche visiteur charge vite. SSL gratuit https automatique. Protection DDoS filtre attaques. Gratuit plan Free. Prérequis compte dash.cloudflare.com registrar Namecheap OVH Gandi enregistrements DNS. Étapes add site domaine plan Free scan 30 secondes vérifier A site MX email TXT SPF DKIM ajouter manquants. Proxied orange cache SSL protection site web DNS only gris MX TXT sinon email casse. 2 nameservers arya rob cloudflare copier registrar Custom DNS remplacer sauvegarde propagation 5 min 24h 1h email active. SSL TLS Full strict Always HTTPS HTTP 3. Attention MX TXT gris orange MX casse réception emails.'
WHERE slug = 'deleguer-domaine-cloudflare';


-- ------------------------------------------------------------
-- 9. Hébergement OVH
-- ------------------------------------------------------------
UPDATE public.procedures SET
  summary = 'Commander et configurer un hébergement web chez OVH (l''hébergeur standard Propul''SEO pour les sites clients).',
  content = $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [
        { "type": "text", "text": "L''" },
        { "type": "text", "marks": [{ "type": "bold" }], "text": "hébergement mutualisé" },
        { "type": "text", "text": " c''est un serveur partagé entre plusieurs sites (mutualisé = mutualiser les coûts). Suffisant pour la majorité des sites clients Propul'SEO : vitrine, WordPress, PrestaShop. Prix : 3 à 12 €/mois selon la gamme." }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étape 1 — Commander l''hébergement" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Va sur " },
          { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://www.ovhcloud.com/fr/web-hosting/", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "ovhcloud.com/fr/web-hosting" },
          { "type": "text", "text": "." }
        ]}]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Choisis la gamme en fonction du projet :" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "marks": [{ "type": "bold" }], "text": "Starter" },
              { "type": "text", "text": " (~3,50 €/mois) — site vitrine simple, 100 Go, 1 base de données." }
            ]}]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "marks": [{ "type": "bold" }], "text": "Perso" },
              { "type": "text", "text": " (~5 €/mois) — WordPress de base, 100 Go, 3 bases." }
            ]}]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "marks": [{ "type": "bold" }], "text": "Pro" },
              { "type": "text", "text": " (~9 €/mois) — WordPress avec trafic, boost PHP, 250 Go." }
            ]}]}
          ]}
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Rattache un domaine (déjà possédé ou à commander en même temps)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Valide la commande. OVH envoie un mail de confirmation, puis un mail d''« Installation » dans les ~15 min." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étape 2 — Première configuration" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Connecte-toi au " },
          { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://www.ovh.com/manager/", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "Manager OVH" },
          { "type": "text", "text": " (le panel de gestion)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Section " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Hébergements" },
          { "type": "text", "text": " → clique sur le nouveau." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Onglet " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "FTP - SSH" },
          { "type": "text", "text": " → crée un utilisateur FTP (nom + mot de passe). Le FTP c''est le protocole pour envoyer des fichiers sur le serveur. Note les identifiants dans le CRM." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Onglet " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Bases de données" },
          { "type": "text", "text": " → crée une base MySQL (nom + mot de passe + encodage UTF-8 MB4 pour supporter les emojis). C''est là que sera stocké WordPress, PrestaShop, etc." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Onglet " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Multisite" },
          { "type": "text", "text": " → rattache le domaine. Choisis PHP 8.2 ou plus (PHP 7 est obsolète). Active le SSL gratuit (Let's Encrypt)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Attends ~15 min : le temps que la propagation se fasse et que le SSL soit généré." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "💡 Astuces" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Toujours PHP 8.2 minimum pour WordPress (PHP 7 est vulnérable)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Pour WordPress : utilise l''installeur 1-click OVH (voir fiche dédiée)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Si le site dépasse 10 000 visites/jour : le mutualisé va saturer. Passe sur un VPS ou un hébergement Performance OVH." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Active les " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "backups automatiques" },
          { "type": "text", "text": " dès le démarrage (Manager → Backup). Indispensable pour dormir tranquille." }
        ]}]}
      ]}
    ]
  }$jsonb$::jsonb,
  content_text = 'Hébergement mutualisé serveur partagé plusieurs sites coûts. Propul''SEO vitrine WordPress PrestaShop 3 12 euros mois. Étape 1 commande ovhcloud.com gamme Starter 3 50 100 Go 1 base site vitrine. Perso 5 euros WordPress 100 Go 3 bases. Pro 9 euros trafic boost PHP 250 Go. Rattacher domaine. 15 min installation. Étape 2 config Manager OVH Hébergements FTP SSH utilisateur mot de passe protocole envoyer fichiers serveur CRM. Bases données MySQL UTF-8 MB4 emojis WordPress PrestaShop. Multisite domaine PHP 8.2 plus obsolète SSL gratuit Let''s Encrypt propagation. Astuces PHP 8.2 minimum vulnérable 1-click 10000 visites jour VPS Performance backups automatiques Manager Backup dormir tranquille.'
WHERE slug = 'configurer-hebergement-ovh';


-- ------------------------------------------------------------
-- 10. Installer WordPress sur OVH
-- ------------------------------------------------------------
UPDATE public.procedures SET
  summary = 'Installer WordPress sur un hébergement OVH — deux méthodes : l''installeur automatique (5 min, recommandé) ou l''installation manuelle.',
  content = $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [
        { "type": "text", "marks": [{ "type": "bold" }], "text": "WordPress" },
        { "type": "text", "text": " c''est le système de gestion de contenu (CMS) le plus utilisé au monde — ~43 % des sites web. Deux méthodes pour l''installer sur un hébergement OVH : l''installeur 1-click (rapide, pour un site standard) ou le manuel (pour un site custom ou une migration)." }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Ce qu''il te faut" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Un hébergement OVH configuré (voir fiche " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Configurer un hébergement mutualisé OVH" },
          { "type": "text", "text": ")." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Une base de données MySQL créée." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Un domaine rattaché avec SSL actif." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Méthode A — Installeur 1-click (recommandé)" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Manager OVH → Hébergement → onglet " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Modules en 1 clic" },
          { "type": "text", "text": "." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Clique " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Installer un module" },
          { "type": "text", "text": " → choisis " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "WordPress" },
          { "type": "text", "text": "." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Sélectionne le domaine cible, le sous-répertoire (" },
          { "type": "text", "marks": [{ "type": "code" }], "text": "/" },
          { "type": "text", "text": " pour un site complet, " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "/blog" },
          { "type": "text", "text": " pour un blog secondaire), langue française." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Remplis : nom du site, email admin, identifiant admin (" },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "surtout pas « admin »" },
          { "type": "text", "text": " — c''est la première combinaison que les bots essaient), mot de passe fort." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Choisis une base MySQL existante ou laisse OVH en créer une nouvelle." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Lance l''installation (~3-5 min). Ensuite, accède à l''admin via " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "ton-domaine.fr/wp-admin" },
          { "type": "text", "text": "." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Méthode B — Installation manuelle (FTP)" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Télécharge WordPress version française : " },
          { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://fr.wordpress.org/download/", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "fr.wordpress.org/download" },
          { "type": "text", "text": "." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Décompresse le zip. Upload le contenu (pas le dossier parent, juste ce qui est dedans) dans le dossier " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "/www" },
          { "type": "text", "text": " du serveur via un client FTP comme Filezilla ou Transmit." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Ouvre dans ton navigateur " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "ton-domaine.fr/wp-admin/install.php" },
          { "type": "text", "text": " — l''assistant WordPress démarre." }
        ]}]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Renseigne les infos de la base MySQL (visibles dans le Manager OVH) :" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "text": "Nom de la base, utilisateur, mot de passe." }
            ]}]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "text": "Hôte : souvent " },
              { "type": "text", "marks": [{ "type": "code" }], "text": "xxxxx.mysql.db" },
              { "type": "text", "text": " (affiché dans l''onglet Bases de données OVH)." }
            ]}]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "text": "Préfixe des tables : mets quelque chose d''aléatoire comme " },
              { "type": "text", "marks": [{ "type": "code" }], "text": "wp_abc123_" },
              { "type": "text", "text": " (jamais " },
              { "type": "text", "marks": [{ "type": "code" }], "text": "wp_" },
              { "type": "text", "text": " pour la sécurité)." }
            ]}]}
          ]}
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Identifiant admin + mot de passe fort. Valide. C''est installé." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "✅ Checklist post-installation (indispensable)" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Installer le plugin " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "WPS Hide Login" },
          { "type": "text", "text": " — change l''URL d''admin (pas " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "/wp-admin" },
          { "type": "text", "text": "), tape les bots de brute force." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Installer " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Wordfence" },
          { "type": "text", "text": " ou " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Limit Login Attempts" },
          { "type": "text", "text": " pour bloquer les tentatives de connexion." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Installer " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Yoast SEO" },
          { "type": "text", "text": " ou " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Rank Math" },
          { "type": "text", "text": " pour le SEO." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Activer les mises à jour automatiques (Réglages → Général)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Régler les permaliens sur " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "/%postname%/" },
          { "type": "text", "text": " (Réglages → Permaliens) — meilleur pour le SEO." }
        ]}]}
      ]}
    ]
  }$jsonb$::jsonb,
  content_text = 'WordPress CMS système gestion contenu 43 sites web. Deux méthodes OVH 1-click rapide manuel custom migration. Prérequis hébergement OVH base MySQL domaine SSL. Méthode A 1-click Manager Modules en 1 clic installer WordPress domaine sous-répertoire blog langue française nom site email admin identifiant pas admin bots combinaison mot de passe fort base MySQL existante nouvelle 3 5 min wp-admin. Méthode B manuel FTP fr.wordpress.org download décompresser upload /www Filezilla Transmit install.php base nom utilisateur mot de passe hôte mysql db Bases données OVH préfixe tables aléatoire wp_abc123 jamais wp_. Checklist WPS Hide Login URL admin bots brute force Wordfence Limit Login Attempts tentatives Yoast Rank Math SEO mises à jour automatiques permaliens postname.'
WHERE slug = 'installer-wordpress-ovh';


-- ------------------------------------------------------------
-- 11. Email pro Google Workspace
-- ------------------------------------------------------------
UPDATE public.procedures SET
  summary = 'Mettre en place un email professionnel (ex. contact@monentreprise.fr) via Google Workspace — avec toute la partie technique anti-spam simplifiée.',
  content = $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [
        { "type": "text", "marks": [{ "type": "bold" }], "text": "Google Workspace" },
        { "type": "text", "text": " (ex-G Suite), c''est un pack payant pour entreprises qui donne : Gmail avec ton propre domaine (" },
        { "type": "text", "marks": [{ "type": "code" }], "text": "contact@monentreprise.fr" },
        { "type": "text", "text": "), Drive, Agenda, Docs. Prix : ~6 €/utilisateur/mois en formule Starter. C''est le standard Propul'SEO pour les clients qui veulent un email pro." }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étape 1 — Souscrire" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Va sur " },
          { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://workspace.google.com/intl/fr/", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "workspace.google.com" },
          { "type": "text", "text": " → " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Commencer l'essai gratuit" },
          { "type": "text", "text": " (14 jours)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Renseigne : nom de l''entreprise, nombre d''employés, pays." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Tape le domaine déjà possédé (ex. " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "monclient.fr" },
          { "type": "text", "text": ")." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Crée le premier compte administrateur (ex. " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "contact@monclient.fr" },
          { "type": "text", "text": ") + mot de passe fort." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Saisis une carte bancaire (pour que l''abonnement s''active après l''essai)." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étape 2 — Brancher les emails au domaine (configuration DNS)" }] },
      { "type": "paragraph", "content": [
        { "type": "text", "text": "Pour que les emails " },
        { "type": "text", "marks": [{ "type": "code" }], "text": "@monclient.fr" },
        { "type": "text", "text": " arrivent chez Google (et pas ailleurs), on ajoute des « étiquettes » spéciales dans le DNS du domaine :" }
      ]},
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "MX" },
          { "type": "text", "text": " — dit « les emails du domaine vont chez Google »." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "SPF" },
          { "type": "text", "text": " — dit « Google a le droit d''envoyer des emails au nom de ce domaine »." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "DKIM" },
          { "type": "text", "text": " — une signature numérique qui prouve que l''email n''a pas été modifié en route." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "DMARC" },
          { "type": "text", "text": " — dit « que faire si SPF ou DKIM échouent » (marquer en spam ou refuser)." }
        ]}]}
      ]},
      { "type": "paragraph", "content": [
        { "type": "text", "text": "Sans ces 4 éléments, tes emails risquent de finir en spam." }
      ]},
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Dans l''Admin Console Google : bouton " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Activer Gmail" },
          { "type": "text", "text": " → Google affiche les 5 lignes MX à ajouter." }
        ]}]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Chez ton DNS (Cloudflare, OVH…), ajoute ces 5 lignes MX :" }] },
          { "type": "codeBlock", "content": [{ "type": "text", "text": "@  1   ASPMX.L.GOOGLE.COM\n@  5   ALT1.ASPMX.L.GOOGLE.COM\n@  5   ALT2.ASPMX.L.GOOGLE.COM\n@  10  ALT3.ASPMX.L.GOOGLE.COM\n@  10  ALT4.ASPMX.L.GOOGLE.COM" }] }
        ]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Ajoute la ligne SPF (en type TXT, valeur) :" }] },
          { "type": "codeBlock", "content": [{ "type": "text", "text": "v=spf1 include:_spf.google.com ~all" }] }
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Active DKIM : Admin Console → Apps → Google Workspace → Gmail → " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Authentifier l'email" },
          { "type": "text", "text": " → " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Generate new record" },
          { "type": "text", "text": ". Copie la clé TXT fournie et pose-la dans ton DNS." }
        ]}]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Ajoute la ligne DMARC (en type TXT sur " }, { "type": "text", "marks": [{ "type": "code" }], "text": "_dmarc.monclient.fr" }, { "type": "text", "text": ") :" }] },
          { "type": "codeBlock", "content": [{ "type": "text", "text": "v=DMARC1; p=quarantine; rua=mailto:dmarc@monclient.fr" }] }
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Retourne dans l''Admin Console Google et clique " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Activer Gmail" },
          { "type": "text", "text": ". Google vérifie la configuration (~15 min max)." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "💡 Astuces" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Teste la délivrabilité sur " },
          { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://www.mail-tester.com/", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "mail-tester.com" },
          { "type": "text", "text": ". Objectif : 10/10." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Pour ajouter un collaborateur : Admin Console → Utilisateurs → Ajouter (1 licence = 1 personne = +6 €/mois)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Alternatives moins chères : " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Zoho Mail" },
          { "type": "text", "text": " (gratuit jusqu''à 5 utilisateurs) ou les emails OVH inclus avec l''hébergement (moins bonne délivrabilité)." }
        ]}]}
      ]}
    ]
  }$jsonb$::jsonb,
  content_text = 'Google Workspace ex G Suite pack payant entreprises Gmail domaine contact@monentreprise Drive Agenda Docs 6 euros utilisateur mois Starter standard Propul''SEO email pro. Étape 1 souscrire workspace.google.com essai gratuit 14 jours nom entreprise employés pays domaine premier compte administrateur mot de passe fort carte bancaire abonnement. Étape 2 DNS emails arriver Google étiquettes domaine MX emails vont Google SPF droit envoyer emails DKIM signature numérique prouve email non modifié DMARC que faire SPF DKIM échouent spam refuser. Sans 4 éléments spam. Admin Console Activer Gmail 5 MX Cloudflare OVH ASPMX ALT1 ALT2 ALT3 ALT4 SPF TXT spf1 include _spf.google.com ~all. DKIM Admin Console Apps Gmail Authentifier Generate new record clé TXT DNS. DMARC _dmarc v DMARC1 p quarantine rua mailto. Google vérifie 15 min. Astuces mail-tester 10 sur 10 collaborateur Utilisateurs Ajouter licence 6 euros Zoho Mail 5 utilisateurs OVH inclus délivrabilité moins bonne.'
WHERE slug = 'email-pro-google-workspace';


-- ------------------------------------------------------------
-- 12. Google Search Console
-- ------------------------------------------------------------
UPDATE public.procedures SET
  summary = 'Déclarer un site dans Google Search Console pour suivre son indexation, ses requêtes et corriger les erreurs SEO.',
  content = $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [
        { "type": "text", "marks": [{ "type": "bold" }], "text": "Google Search Console (GSC)" },
        { "type": "text", "text": " c''est l''outil officiel Google pour suivre la santé SEO d''un site : est-ce que Google voit mes pages ? quelles requêtes m''amènent des visiteurs ? y a-t-il des erreurs d''affichage mobile ? Gratuit et indispensable pour tout site client." }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Va sur " },
          { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://search.google.com/search-console", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "search.google.com/search-console" },
          { "type": "text", "text": " avec le compte Google du client (ou un compte Propul'SEO avec accès délégué)." }
        ]}]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [
            { "type": "text", "text": "Clique " },
            { "type": "text", "marks": [{ "type": "bold" }], "text": "Ajouter une propriété" },
            { "type": "text", "text": ". Deux choix :" }
          ]},
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "marks": [{ "type": "bold" }], "text": "Domaine" },
              { "type": "text", "text": " (recommandé) — couvre tout : le domaine, les sous-domaines, http et https. Vérifié par DNS." }
            ]}]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "marks": [{ "type": "bold" }], "text": "Préfixe URL" },
              { "type": "text", "text": " — ne couvre qu''une URL précise." }
            ]}]}
          ]}
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Choisis " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Domaine" },
          { "type": "text", "text": ". Tape le domaine sans " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "https://" },
          { "type": "text", "text": " ni " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "www" },
          { "type": "text", "text": "." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Google te donne une valeur du type " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "google-site-verification=abc123..." },
          { "type": "text", "text": ". Copie-la." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Ajoute cette valeur dans ton DNS en type TXT sur " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "@" },
          { "type": "text", "text": " (= racine du domaine)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Retourne dans GSC → clique " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Vérifier" },
          { "type": "text", "text": ". Instantané si la propagation est OK. Sinon attendre 5-10 min et réessayer." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Dans le menu de gauche → " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Sitemaps" },
          { "type": "text", "text": " → soumets l''URL du sitemap (" },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "sitemap.xml" },
          { "type": "text", "text": " = fichier qui liste toutes les pages du site, ex. " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "https://exemple.fr/sitemap.xml" },
          { "type": "text", "text": ")." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Menu " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Paramètres" },
          { "type": "text", "text": " → invite les membres de l''équipe Propul'SEO en tant qu''utilisateurs. Choisis la permission : " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Total" },
          { "type": "text", "text": " (admin) ou " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Restreint" },
          { "type": "text", "text": " (lecture)." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "💡 Astuces" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Attends au moins 48 h avant de regarder les premières données — Google a besoin de temps pour explorer le site." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Pour pousser l''indexation d''une page importante : utilise " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Inspection d'URL" },
          { "type": "text", "text": " → " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Demander une indexation" },
          { "type": "text", "text": " (limite ~10 par jour)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Connecte GSC à Google Analytics 4 (Admin GA4 → Liaisons produits) pour croiser les données visiteurs et requêtes." }
        ]}]}
      ]}
    ]
  }$jsonb$::jsonb,
  content_text = 'Google Search Console GSC outil officiel Google santé SEO site Google voit pages quelles requêtes visiteurs erreurs affichage mobile gratuit indispensable. Étapes search.google.com search-console compte Google client Propul''SEO délégué ajouter propriété Domaine recommandé tout domaine sous-domaines http https DNS Préfixe URL précise. Domaine sans https www google-site-verification abc123 copier DNS TXT @ racine vérifier 5 10 min. Sitemaps soumettre URL sitemap.xml fichier liste pages exemple. Paramètres inviter membres équipe permission Total admin Restreint lecture. Astuces 48h premières données explorer site Inspection URL Demander indexation 10 jour GSC Google Analytics 4 Admin GA4 Liaisons produits croiser données visiteurs requêtes.'
WHERE slug = 'setup-google-search-console';


-- ------------------------------------------------------------
-- 13. Audit SEO technique
-- ------------------------------------------------------------
UPDATE public.procedures SET
  summary = 'Checklist d''audit technique SEO à faire avant toute proposition commerciale : repérer les quick wins en ~2 h.',
  content = $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [
        { "type": "text", "text": "Avant de proposer une prestation SEO à un prospect, on fait un audit technique de 2h qui révèle les problèmes bloquants. Objectif : identifier des " },
        { "type": "text", "marks": [{ "type": "italic" }], "text": "quick wins" },
        { "type": "text", "text": " (gains rapides à fort impact) pour démontrer de la valeur immédiate." }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "1. Indexation (est-ce que Google voit le site ?)" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Dans Google, tape " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "site:monclient.fr" },
          { "type": "text", "text": ". Compare le nombre de résultats au vrai nombre de pages. Un gros écart = problème d''indexation." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Vérifie le fichier " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "robots.txt" },
          { "type": "text", "text": " (le « panneau d''affichage » pour les moteurs de recherche). Un mauvais réglage peut bloquer tout le site." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Vérifie que " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "sitemap.xml" },
          { "type": "text", "text": " existe et est à jour." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Dans GSC → Couverture : pages exclues (noindex, erreurs, dupliqués)." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "2. Performance (le site est-il rapide ?)" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Teste sur " },
          { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://pagespeed.web.dev", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "PageSpeed Insights" },
          { "type": "text", "text": ". Les " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Core Web Vitals" },
          { "type": "text", "text": " doivent être : LCP (temps de chargement) < 2,5 s, INP (réactivité) < 200 ms, CLS (stabilité visuelle) < 0,1." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Teste 3 pages différentes (home, page type, article), en mobile et desktop." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Regarde la taille des images : format AVIF ou WebP idéalement (plus léger que PNG/JPG), lazy-loading (chargement différé), compression gzip/brotli." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "TTFB (temps de réponse serveur) < 600 ms. Au-delà d''1 s → envisage cache + CDN (Cloudflare)." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "3. Contenu & structure HTML" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Une seule balise H1 par page (le titre principal). H2 et H3 pour la hiérarchie." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "code" }], "text": "<title>" },
          { "type": "text", "text": " 50-60 caractères, " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "meta description" },
          { "type": "text", "text": " 120-155 caractères. Uniques sur chaque page." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Attributs " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "alt" },
          { "type": "text", "text": " sur toutes les images (texte alternatif — pour les malvoyants et Google)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Données structurées Schema.org : Organization, WebSite, Article, FAQPage quand pertinent (aide Google à comprendre le contenu)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Contenu dupliqué : ajouter une balise " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "<link rel=\"canonical\">" },
          { "type": "text", "text": " qui pointe vers la version principale." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "4. Liens & maillage" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Chaque page doit être accessible en moins de 3 clics depuis la home." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Liens cassés : utiliser " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Screaming Frog" },
          { "type": "text", "text": " (gratuit jusqu''à 500 URLs) ou " },
          { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://www.deadlinkchecker.com", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "deadlinkchecker.com" },
          { "type": "text", "text": "." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Profil de backlinks (liens externes qui pointent vers le site) : Ahrefs ou SEMrush (payants), ou " },
          { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://neilpatel.com/ubersuggest/", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "Ubersuggest" },
          { "type": "text", "text": " (version gratuite)." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "5. Livrable" }] },
      { "type": "paragraph", "content": [
        { "type": "text", "text": "Rédige un rapport Notion ou Obsidian. Pour chaque section : constat + impact (haut/moyen/faible) + action corrective. Exporte en PDF pour le client et organise un call de restitution de 30 min." }
      ]}
    ]
  }$jsonb$::jsonb,
  content_text = 'Audit technique SEO 2h prospect problèmes bloquants quick wins gains rapides fort impact valeur immédiate. 1 Indexation Google voit site site:monclient.fr compare nombre résultats vrai nombre pages écart problème. robots.txt panneau affichage moteurs recherche mauvais réglage bloque. sitemap.xml existe à jour. GSC Couverture pages exclues noindex erreurs dupliqués. 2 Performance rapide PageSpeed Insights Core Web Vitals LCP temps chargement 2.5 s INP réactivité 200 ms CLS stabilité visuelle 0.1. 3 pages home article mobile desktop. Images AVIF WebP léger PNG JPG lazy-loading chargement différé compression gzip brotli. TTFB temps réponse serveur 600 ms 1 s cache CDN Cloudflare. 3 Contenu structure HTML H1 titre principal H2 H3 hiérarchie. title 50 60 caractères meta description 120 155 uniques. alt attributs images malvoyants Google. Schema.org Organization WebSite Article FAQPage Google comprendre. Canonical contenu dupliqué version principale. 4 Liens maillage 3 clics home. Liens cassés Screaming Frog 500 URLs deadlinkchecker. Backlinks Ahrefs SEMrush Ubersuggest gratuite. 5 Livrable rapport Notion Obsidian constat impact action PDF client call restitution 30 min.'
WHERE slug = 'audit-seo-technique-initial';


-- ------------------------------------------------------------
-- 14. Figma pour un projet client
-- ------------------------------------------------------------
UPDATE public.procedures SET
  summary = 'Structurer un fichier Figma propre dès le démarrage : pages, composants, tokens de design, annotations pour les devs.',
  content = $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [
        { "type": "text", "text": "Un fichier Figma bien rangé = transmission design → dev fluide, pas de composants qui traînent, pas de couleurs en dur dans le code." }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Structure des pages (dans cet ordre)" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "📋 Cover" },
          { "type": "text", "text": " — logo du projet + nom + statut (V1, V2…) + lien vers le PRD." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "🎨 Foundations" },
          { "type": "text", "text": " — les " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "tokens" },
          { "type": "text", "text": " (couleurs, typo, espacements, arrondis, ombres). Ce sont les briques qui seront utilisées partout." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "🧩 Components" },
          { "type": "text", "text": " — composants atomiques (Button, Input, Card…) avec toutes leurs variantes." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "🧱 Patterns" },
          { "type": "text", "text": " — sections récurrentes (Header, Footer, Hero, CTA block…)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "🖼️ Screens — Desktop" },
          { "type": "text", "text": " — toutes les pages en format 1440 px." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "📱 Screens — Mobile" },
          { "type": "text", "text": " — toutes les pages en format 375 px." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "🔧 Dev annotations" },
          { "type": "text", "text": " — notes pour les devs (animations, interactions, API à appeler…)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "🗑️ Archive" },
          { "type": "text", "text": " — anciennes versions et explorations abandonnées." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Mise en place" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Duplique le template " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Propul'SEO starter kit" },
          { "type": "text", "text": " (team Figma Propul'SEO)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Renomme : " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "[Client] - [Projet] - Design" },
          { "type": "text", "text": "." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Crée les " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Variables Figma" },
          { "type": "text", "text": " (couleurs primaire/secondaire/neutre, typo, espacements). " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Obligatoire" },
          { "type": "text", "text": " : ces tokens seront repris tels quels dans Tailwind/CSS côté dev." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Crée les composants atomiques avec leurs variantes (taille, état, style)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Décline en mobile avec auto-layout responsive (breakpoint 768 px)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Ajoute des commentaires dev avec les sticky notes FigJam ou le plugin " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Redlines" },
          { "type": "text", "text": "." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Partage en mode " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Can view" },
          { "type": "text", "text": " avec le client, " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Can edit" },
          { "type": "text", "text": " avec les devs." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "💡 Astuces" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Utilise le plugin " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Figma Code Connect" },
          { "type": "text", "text": " — il lie les composants Figma aux composants React du code. Énorme gain pour les devs." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Jamais de couleurs en dur : toujours via Variables. Ça garantit la cohérence et facilite les refontes." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Un seul composant « main » par archetype, pas de duplicates. Les variantes se gèrent avec le panneau Variants." }
        ]}]}
      ]}
    ]
  }$jsonb$::jsonb,
  content_text = 'Figma fichier bien rangé transmission design dev fluide composants traînent couleurs dur code. Structure pages Cover logo projet nom statut V1 V2 lien PRD. Foundations tokens couleurs typo espacements arrondis ombres briques. Components atomiques Button Input Card variantes. Patterns Header Footer Hero CTA. Screens Desktop 1440 px Mobile 375 px. Dev annotations animations interactions API. Archive anciennes versions explorations abandonnées. Mise en place dupliquer template Propul''SEO starter kit team Figma renommer Client Projet Design. Variables Figma couleurs primaire secondaire neutre typo espacements obligatoire tokens Tailwind CSS. Composants atomiques variantes taille état style. Mobile auto-layout responsive breakpoint 768. Commentaires dev FigJam Redlines. Partage Can view client Can edit devs. Astuces Code Connect React devs. Couleurs jamais dur Variables cohérence refontes. Composant main archetype duplicates Variants.'
WHERE slug = 'preparer-figma-projet-client';


-- ------------------------------------------------------------
-- 15. Onboarder un membre d'équipe
-- ------------------------------------------------------------
UPDATE public.procedures SET
  summary = 'Accueillir un nouveau collaborateur dans Propul''SEO : comptes, accès CRM, outils, documentation, premier projet.',
  content = $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [
        { "type": "text", "text": "Un onboarding interne raté = 3 mois perdus. Cette checklist rend un nouveau membre autonome en moins d''une semaine." }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "J-3 — Avant son arrivée" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Signer la promesse ou le contrat (via Legalstart)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Commander le matériel (MacBook, casque) si besoin." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Désigner un parrain ou une marraine dans l''équipe (son point de contact pour les petites questions)." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "J0 — Jour d''arrivée" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Comptes pro" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "text": "Créer son email " },
              { "type": "text", "marks": [{ "type": "code" }], "text": "prenom@propulseo-site.com" },
              { "type": "text", "text": " (Google Workspace)." }
            ]}]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "text": "Activer la double authentification (Google Authenticator ou Authy)." }
            ]}]}
          ]}
        ]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "CRM Propul'SEO" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "text": "Un admin crée son user : Settings → Utilisateurs → Nouveau." }
            ]}]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "text": "Attribuer le bon rôle : " },
              { "type": "text", "marks": [{ "type": "code" }], "text": "admin" },
              { "type": "text", "text": ", " },
              { "type": "text", "marks": [{ "type": "code" }], "text": "manager" },
              { "type": "text", "text": ", " },
              { "type": "text", "marks": [{ "type": "code" }], "text": "developer" },
              { "type": "text", "text": ", " },
              { "type": "text", "marks": [{ "type": "code" }], "text": "sales" },
              { "type": "text", "text": ", " },
              { "type": "text", "marks": [{ "type": "code" }], "text": "marketing" },
              { "type": "text", "text": " ou " },
              { "type": "text", "marks": [{ "type": "code" }], "text": "ops" },
              { "type": "text", "text": "." }
            ]}]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "text": "Activer les permissions (" },
              { "type": "text", "marks": [{ "type": "code" }], "text": "can_view_dashboard" },
              { "type": "text", "text": ", " },
              { "type": "text", "marks": [{ "type": "code" }], "text": "can_view_leads" },
              { "type": "text", "text": ", etc.)." }
            ]}]}
          ]}
        ]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Outils" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Inviter sur Slack / Discord." }] }]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "text": "Ajouter à l''organisation GitHub (équipe " },
              { "type": "text", "marks": [{ "type": "code" }], "text": "devs" },
              { "type": "text", "text": " ou " },
              { "type": "text", "marks": [{ "type": "code" }], "text": "design" },
              { "type": "text", "text": ")." }
            ]}]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Inviter sur la team Figma (pour les roles design/dev)." }] }]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Donner un seat Claude Pro pour les devs." }] }]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Partager l''accès au coffre 1Password ou Bitwarden d''équipe." }] }]}
          ]}
        ]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Documentation" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Accès au vault Obsidian partagé." }] }]},
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [
              { "type": "text", "text": "Envoyer les fiches " },
              { "type": "text", "marks": [{ "type": "italic" }], "text": "Se connecter à Claude Code" },
              { "type": "text", "text": ", " },
              { "type": "text", "marks": [{ "type": "italic" }], "text": "Rédiger un devis" },
              { "type": "text", "text": ", et la présentation Propul'SEO (PDF)." }
            ]}]}
          ]}
        ]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Semaine 1 — Intégration" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Point quotidien 15 min avec le parrain/la marraine." }] }]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Affectation sur un projet « facile » (correction mineure, petite feature)." }] }]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Participation aux standups de l''équipe." }] }]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "J+30 — Bilan" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Entretien 45 min avec le manager." }] }]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Feedback dans les deux sens." }] }]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Ajustement des permissions CRM selon l''usage observé." }] }]}
      ]}
    ]
  }$jsonb$::jsonb,
  content_text = 'Onboarding interne membre équipe 3 mois perdus checklist autonome moins une semaine. J-3 promesse contrat Legalstart matériel MacBook casque parrain marraine point contact. J0 arrivée comptes pro email prenom propulseo-site.com Google Workspace double authentification Google Authenticator Authy. CRM admin Settings Utilisateurs Nouveau rôle admin manager developer sales marketing ops permissions can_view_dashboard can_view_leads. Outils Slack Discord GitHub devs design Figma team Claude Pro 1Password Bitwarden. Documentation vault Obsidian fiches Claude Code devis présentation PDF. Semaine 1 intégration point quotidien 15 min parrain marraine projet facile correction mineure feature standups équipe. J+30 bilan entretien 45 min manager feedback permissions CRM usage observé.'
WHERE slug = 'onboarder-membre-equipe';


-- ------------------------------------------------------------
-- 16. Clôturer un projet
-- ------------------------------------------------------------
UPDATE public.procedures SET
  summary = 'Fin de projet propre : recette, livraison, facture finale, archivage CRM, transfert doc au client.',
  content = $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [
        { "type": "text", "text": "Une clôture propre évite les retours de flammes 3 mois après. Voici la checklist." }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "1. Recette finale" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Envoyer au client la checklist de recette (copie de la liste fonctionnelle du PRD)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Call de revue de 45-60 min : on passe la checklist ensemble, en live." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Bugs bloquants = ticket prioritaire. Retours non-bloquants = liste à chiffrer en V2." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Obtenir un " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "PV de recette signé" },
          { "type": "text", "text": " (Procès-Verbal) — un simple mail du client validant la recette suffit." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "2. Livraison technique" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Pousser la version prod finale, puis taguer la release git : " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "v1.0.0" },
          { "type": "text", "text": "." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Si inclus dans le contrat : transférer la propriété du repo au client (ou l''inviter comme admin)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Livrer la documentation technique : " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "README.md" },
          { "type": "text", "text": " + " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "DEPLOYMENT.md" },
          { "type": "text", "text": " + tous les accès stockés dans le vault client." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Si CMS (WordPress, Strapi…) : formation rapide de l''admin côté client (30 min)." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "3. Facturation solde" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Dans le CRM : module Comptabilité → Nouvelle facture → facture solde." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Mentions légales obligatoires : SIRET, TVA, RIB, pénalités de retard, escompte." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Délai de paiement : 30 jours net (délai légal maximum en France : 60 jours)." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Relance J+31 si impayée. Mise en demeure J+60." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "4. Archivage CRM" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Passer le statut de la fiche projet en " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "closed" },
          { "type": "text", "text": " ou " },
          { "type": "text", "marks": [{ "type": "code" }], "text": "delivered" },
          { "type": "text", "text": "." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Remplir la date de livraison." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Vérifier que tous les documents (brief, devis, contrat, PV de recette) sont dans l''onglet Documents du projet." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Basculer la fiche dans le module " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Projets terminés" },
          { "type": "text", "text": "." }
        ]}]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "5. Post-mortem" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Session interne 30 min : ce qui a bien marché, ce qui a planté, ce qu''on change la prochaine fois." }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Si on découvre une procédure réutilisable → on crée une nouvelle fiche dans ce wiki !" }
        ]}]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "À J+14 après livraison : envoyer un NPS (Net Promoter Score — note de satisfaction sur 10) au client via Tally ou Typeform." }
        ]}]}
      ]},
      { "type": "blockquote", "content": [
        { "type": "paragraph", "content": [
          { "type": "text", "text": "👉 Proposer un contrat de maintenance 1 à 3 mois après la livraison (3 à 7 % du montant initial / mois). Revenu récurrent + on garde le lien." }
        ]}
      ]}
    ]
  }$jsonb$::jsonb,
  content_text = 'Clôture projet propre retours flammes 3 mois. 1 Recette checklist fonctionnelle PRD call revue 45 60 min live bugs bloquants tickets prioritaire retours non-bloquants V2 PV recette signé Procès-Verbal mail client valide. 2 Livraison technique version prod tag release git v1.0.0. Contrat transférer propriété repo client admin. Documentation README DEPLOYMENT accès vault client. CMS WordPress Strapi formation admin 30 min. 3 Facturation solde CRM Comptabilité nouvelle facture. Mentions légales SIRET TVA RIB pénalités retard escompte. Délai paiement 30 jours net légal 60. Relance J+31 mise demeure J+60. 4 Archivage CRM statut closed delivered date livraison documents brief devis contrat PV onglet Documents module Projets terminés. 5 Post-mortem 30 min bien marché planté change prochaine fois. Fiche réutilisable wiki. J+14 NPS Net Promoter Score note satisfaction 10 Tally Typeform. Maintenance 1 3 mois 3 7 pour cent revenu récurrent lien.'
WHERE slug = 'cloturer-projet';
