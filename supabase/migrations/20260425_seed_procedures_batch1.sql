-- ============================================================
-- Seed Batch 1 — 15 fiches wiki Procédures Propul'SEO
-- ============================================================
-- Dépend de : 20260424_procedures_module.sql + 20260425_seed_procedure_namecheap.sql
-- Idempotent via ON CONFLICT (slug) DO NOTHING
-- Catégories utilisées (slugs) : developpement, commercial, noms-de-domaine,
--   hebergement, email, seo, design, administratif
-- ============================================================

-- ============================================================
-- 1. Développement — Se connecter à Claude Code (CLI + VSCode)
-- ============================================================
INSERT INTO public.procedures (title, slug, category_id, tags, summary, content, content_text)
SELECT
  'Se connecter à Claude Code (CLI + VSCode)',
  'se-connecter-claude-code',
  (SELECT id FROM public.procedure_categories WHERE slug = 'developpement'),
  ARRAY['claude-code','anthropic','cli','vscode','onboarding-dev'],
  'Installer Claude Code, se connecter à son compte Anthropic et démarrer une session dans un projet.',
  $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Claude Code est l''agent de code d''Anthropic qui tourne dans le terminal. Voici comment l''installer et se connecter, sur Mac/Linux puis dans VSCode / Cursor." }] },
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Prérequis" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Un compte Anthropic (plan Pro 20$/mois ou Max 100-200$/mois)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Node.js 18+ installé (" }, { "type": "text", "marks": [{ "type": "code" }], "text": "node -v" }, { "type": "text", "text": " pour vérifier)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Un terminal (Terminal, iTerm2, VSCode terminal…)." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes — Installation CLI" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Ouvre un terminal et lance le script d''installation officiel :" }] },
          { "type": "codeBlock", "content": [{ "type": "text", "text": "curl -fsSL https://claude.ai/install.sh | bash" }] }
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Redémarre ton terminal (ou " }, { "type": "text", "marks": [{ "type": "code" }], "text": "source ~/.zshrc" }, { "type": "text", "text": ") pour charger la commande " }, { "type": "text", "marks": [{ "type": "code" }], "text": "claude" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Place-toi dans un projet et lance :" }] },
          { "type": "codeBlock", "content": [{ "type": "text", "text": "cd mon-projet && claude" }] }
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Au premier lancement, Claude ouvre ton navigateur pour t''authentifier sur " }, { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://claude.ai", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "claude.ai" }, { "type": "text", "text": ". Valide, reviens au terminal, c''est connecté." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Lance " }, { "type": "text", "marks": [{ "type": "code" }], "text": "/init" }, { "type": "text", "text": " dans Claude pour qu''il génère un fichier " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "CLAUDE.md" }, { "type": "text", "text": " à la racine de ton projet (contexte persistant chargé à chaque session)." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes — Extension VSCode / Cursor" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Dans VSCode ou Cursor, ouvre la Marketplace et cherche " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Claude Code" }, { "type": "text", "text": " (éditeur Anthropic)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Installe l''extension, puis ouvre la palette (Cmd+Shift+P) → " }, { "type": "text", "marks": [{ "type": "code" }], "text": "Claude: Start session" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "L''extension utilise la même auth que le CLI — si tu es déjà connecté en terminal, aucune action." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Astuces" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "CLAUDE.md est chargé à chaque conversation — garde-le " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "concis" }, { "type": "text", "text": " (patterns projet, commandes clés, conventions), sinon tu brûles du contexte." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Hiérarchie : " }, { "type": "text", "marks": [{ "type": "code" }], "text": "~/.claude/CLAUDE.md" }, { "type": "text", "text": " (global) → " }, { "type": "text", "marks": [{ "type": "code" }], "text": "./CLAUDE.md" }, { "type": "text", "text": " (projet) → sous-dossiers (chargés à la demande)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Utilise " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Shift+Tab Shift+Tab" }, { "type": "text", "text": " pour basculer en Plan Mode avant toute tâche non-triviale." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Doc officielle : " }, { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://docs.claude.com/en/docs/claude-code/overview", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "docs.claude.com/en/docs/claude-code" }] }] }
      ]}
    ]
  }$jsonb$::jsonb,
  'Claude Code est l''agent de code d''Anthropic qui tourne dans le terminal. Installation CLI : curl fsSL claude.ai install.sh bash. Lancer dans un projet : cd mon-projet claude. Auth via navigateur claude.ai. Commande /init pour générer CLAUDE.md. Extension VSCode Cursor Marketplace. CLAUDE.md hiérarchie global projet sous-dossiers. Plan Mode Shift Tab. Prérequis compte Anthropic Pro Max Node.js 18.'
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 2. Développement — Configurer un hook Claude Code
-- ============================================================
INSERT INTO public.procedures (title, slug, category_id, tags, summary, content, content_text)
SELECT
  'Configurer un hook Claude Code (automation)',
  'configurer-hook-claude-code',
  (SELECT id FROM public.procedure_categories WHERE slug = 'developpement'),
  ARRAY['claude-code','hooks','automation','workflow'],
  'Mettre en place un hook Claude Code pour automatiser lint, tests ou commit à des moments précis du cycle de vie.',
  $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Les hooks Claude Code sont des commandes exécutées automatiquement à des moments précis (avant/après un tool, au démarrage de session, etc.). Contrairement aux règles CLAUDE.md (probabilistes), les hooks sont " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "déterministes" }, { "type": "text", "text": "." }] },
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Événements disponibles" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "code" }], "text": "PreToolUse" }, { "type": "text", "text": " / " }, { "type": "text", "marks": [{ "type": "code" }], "text": "PostToolUse" }, { "type": "text", "text": " — avant/après l''exécution d''un outil" }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "code" }], "text": "UserPromptSubmit" }, { "type": "text", "text": " — à chaque envoi utilisateur" }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "code" }], "text": "SessionStart" }, { "type": "text", "text": " / " }, { "type": "text", "marks": [{ "type": "code" }], "text": "SessionEnd" }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "code" }], "text": "Stop" }, { "type": "text", "text": " / " }, { "type": "text", "marks": [{ "type": "code" }], "text": "PreCompact" }, { "type": "text", "text": " — quand Claude s''arrête ou compacte le contexte" }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Ouvre " }, { "type": "text", "marks": [{ "type": "code" }], "text": "~/.claude/settings.json" }, { "type": "text", "text": " (global) ou " }, { "type": "text", "marks": [{ "type": "code" }], "text": ".claude/settings.json" }, { "type": "text", "text": " (projet)." }] }] },
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Ajoute une entrée " }, { "type": "text", "marks": [{ "type": "code" }], "text": "hooks" }, { "type": "text", "text": " avec un événement cible. Exemple : lint auto après chaque édition :" }] },
          { "type": "codeBlock", "content": [{ "type": "text", "text": "{\n  \"hooks\": {\n    \"PostToolUse\": [\n      {\n        \"matcher\": \"Edit|Write\",\n        \"hooks\": [\n          { \"type\": \"command\", \"command\": \"npm run lint --silent\" }\n        ]\n      }\n    ]\n  }\n}" }] }
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Redémarre Claude Code pour que le hook soit pris en compte." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Teste : fais éditer un fichier par Claude, observe que le lint tourne après." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Types de hooks" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "command" }, { "type": "text", "text": " — script bash (le plus courant)" }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "prompt" }, { "type": "text", "text": " — évaluation par un modèle Claude (retourne JSON de décision)" }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "agent" }, { "type": "text", "text": " — sous-agent read-only (Read, Grep, Glob)" }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Astuces" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Un " }, { "type": "text", "marks": [{ "type": "code" }], "text": "PreToolUse" }, { "type": "text", "text": " peut " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "bloquer" }, { "type": "text", "text": " un tool (exit code non-zero) — utile pour empêcher le push sur main." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Pour configurer via chat, demande à Claude d''invoquer la skill " }, { "type": "text", "marks": [{ "type": "code" }], "text": "update-config" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Doc officielle : " }, { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://docs.claude.com/en/docs/claude-code/hooks", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "docs.claude.com/en/docs/claude-code/hooks" }] }] }
      ]}
    ]
  }$jsonb$::jsonb,
  'Hooks Claude Code commandes déterministes cycle de vie. Événements PreToolUse PostToolUse UserPromptSubmit SessionStart SessionEnd Stop PreCompact. Configuration settings.json global projet. Exemple PostToolUse matcher Edit Write command lint. Types command bash prompt modèle Claude agent sous-agent Read Grep Glob. PreToolUse peut bloquer tool exit non-zero empêcher push main. Skill update-config.'
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 3. Développement — Connecter un MCP Supabase à Claude
-- ============================================================
INSERT INTO public.procedures (title, slug, category_id, tags, summary, content, content_text)
SELECT
  'Connecter un MCP Supabase à Claude',
  'connecter-mcp-supabase-claude',
  (SELECT id FROM public.procedure_categories WHERE slug = 'developpement'),
  ARRAY['claude-code','mcp','supabase','base-de-donnees'],
  'Configurer le serveur MCP Supabase pour permettre à Claude d''interroger/éditer la base d''un projet Propul''SEO.',
  $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Le Model Context Protocol (MCP) permet à Claude de parler à des services externes (Supabase, Stripe, Figma…). Le MCP Supabase expose : lister tables, exécuter SQL, appliquer migrations, lire logs, etc." }] },
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Prérequis" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Un Personal Access Token (PAT) Supabase — à générer dans " }, { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://supabase.com/dashboard/account/tokens", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "dashboard/account/tokens" }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Claude Code installé (voir fiche " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Se connecter à Claude Code" }, { "type": "text", "text": ")." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "L''ID du projet Supabase cible (format " }, { "type": "text", "marks": [{ "type": "code" }], "text": "abcdefghijklmnop" }, { "type": "text", "text": ")." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Génère un PAT dans le dashboard Supabase (Account → Access Tokens → Generate new token). Copie-le immédiatement, il ne sera plus visible." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Ouvre " }, { "type": "text", "marks": [{ "type": "code" }], "text": "~/.claude/mcp_servers.json" }, { "type": "text", "text": " (le créer s''il n''existe pas)." }] }] },
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Ajoute l''entrée Supabase :" }] },
          { "type": "codeBlock", "content": [{ "type": "text", "text": "{\n  \"mcpServers\": {\n    \"supabase\": {\n      \"command\": \"npx\",\n      \"args\": [\n        \"-y\",\n        \"@supabase/mcp-server-supabase@latest\",\n        \"--access-token\",\n        \"sbp_XXXXXXXXXXXX\"\n      ]\n    }\n  }\n}" }] }
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Remplace " }, { "type": "text", "marks": [{ "type": "code" }], "text": "sbp_XXX" }, { "type": "text", "text": " par ton PAT. Sauvegarde." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Redémarre Claude Code. Lance " }, { "type": "text", "marks": [{ "type": "code" }], "text": "/mcp" }, { "type": "text", "text": " pour vérifier que " }, { "type": "text", "marks": [{ "type": "code" }], "text": "supabase" }, { "type": "text", "text": " apparaît comme connecté." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Teste : demande à Claude " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "\"liste mes projets Supabase\"" }, { "type": "text", "text": ". Il utilisera le tool " }, { "type": "text", "marks": [{ "type": "code" }], "text": "list_projects" }, { "type": "text", "text": "." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Astuces" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Pour restreindre Claude à un seul projet : ajoute " }, { "type": "text", "marks": [{ "type": "code" }], "text": "--project-ref ton_project_id" }, { "type": "text", "text": " dans les args." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Pour mode read-only : ajoute " }, { "type": "text", "marks": [{ "type": "code" }], "text": "--read-only" }, { "type": "text", "text": ". Conseillé en prod." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Ne jamais commit " }, { "type": "text", "marks": [{ "type": "code" }], "text": "mcp_servers.json" }, { "type": "text", "text": " avec un PAT — ajoute-le au " }, { "type": "text", "marks": [{ "type": "code" }], "text": ".gitignore" }, { "type": "text", "text": " si partagé par projet." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Doc : " }, { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://supabase.com/docs/guides/getting-started/mcp", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "supabase.com/docs/guides/getting-started/mcp" }] }] }
      ]}
    ]
  }$jsonb$::jsonb,
  'MCP Model Context Protocol Supabase Claude lister tables exécuter SQL migrations logs. Prérequis Personal Access Token PAT dashboard account tokens. Projet ID. Étapes générer PAT config mcp_servers.json npx supabase mcp-server-supabase access-token redémarrer /mcp vérifier connecté. Astuces project-ref restreindre read-only prod gitignore PAT. Doc supabase mcp.'
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 4. Développement — Rédiger un PRD
-- ============================================================
INSERT INTO public.procedures (title, slug, category_id, tags, summary, content, content_text)
SELECT
  'Rédiger un PRD (Product Requirements Document)',
  'rediger-prd-product-requirements-document',
  (SELECT id FROM public.procedure_categories WHERE slug = 'developpement'),
  ARRAY['prd','brief','planification','projet'],
  'Écrire un PRD clair avant de démarrer le développement d''un projet : objectifs, user stories, architecture, critères d''acceptation.',
  $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Le PRD (Product Requirements Document) fige les besoins avant le code. Indispensable pour éviter de construire quelque chose que personne n''attendait et pour briefer efficacement Claude Code en Plan Mode." }] },
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Structure type (sections obligatoires)" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Contexte & problème" }, { "type": "text", "text": " — pourquoi ce projet, qui en souffre aujourd''hui, quel signal de marché." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Objectifs (North Star + KPI)" }, { "type": "text", "text": " — 1 objectif principal mesurable + 2-3 métriques secondaires." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Utilisateurs cibles & personas" }, { "type": "text", "text": " — qui, leur contexte, leur niveau tech." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Scope V1 (IN / OUT)" }, { "type": "text", "text": " — liste explicite de ce qui est " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "hors scope" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "User stories" }, { "type": "text", "text": " — " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "En tant que X, je veux Y, afin de Z." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Architecture & stack" }, { "type": "text", "text": " — framework, DB, auth, hosting, tiers." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Modèle de données" }, { "type": "text", "text": " — tables principales + relations clés." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Critères d''acceptation" }, { "type": "text", "text": " — tests Gherkin ou checklist par user story." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Risques & mitigations" }, { "type": "text", "text": " — techniques, légaux, commerciaux." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Planning & milestones" }, { "type": "text", "text": " — M1/M2/M3 avec dates cibles." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Workflow recommandé" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Brainstorm avec le client (1 call 45-60 min). Note brute dans Obsidian." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Passe la note brute à Claude en Plan Mode avec la skill " }, { "type": "text", "marks": [{ "type": "code" }], "text": "superpowers:brainstorming" }, { "type": "text", "text": ". Il pose des questions ciblées." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Itère jusqu''au design doc complet (~1-2 h avec le client en parallèle sur Slack)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Stocke le PRD dans le dossier projet Obsidian + partage la version client-friendly (sans détails tech) en PDF." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Demande au client une validation écrite avant de démarrer le dev." }] }] }
      ]},
      { "type": "blockquote", "content": [
        { "type": "paragraph", "content": [{ "type": "text", "text": "👉 Un bon PRD fait 3-8 pages. Plus court = angles morts. Plus long = personne ne le lit." }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Ressources" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "The Mom Test" }, { "type": "text", "text": " (Rob Fitzpatrick) — poser les bonnes questions aux prospects avant le PRD." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "Obviously Awesome" }, { "type": "text", "text": " (April Dunford) — framework de positionnement en 5 étapes." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Template Obsidian : " }, { "type": "text", "marks": [{ "type": "code" }], "text": "05-Templates/Tpl-Note-Technique.md" }] }] }
      ]}
    ]
  }$jsonb$::jsonb,
  'PRD Product Requirements Document fige besoins avant code. Structure contexte problème objectifs North Star KPI utilisateurs personas scope V1 IN OUT user stories architecture stack modèle données critères acceptation Gherkin risques mitigations planning milestones. Workflow brainstorm client Claude Plan Mode skill brainstorming itération design doc Obsidian PDF validation écrite. 3 à 8 pages. Mom Test Obviously Awesome April Dunford.'
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 5. Commercial — Onboarder un nouveau client
-- ============================================================
INSERT INTO public.procedures (title, slug, category_id, tags, summary, content, content_text)
SELECT
  'Onboarder un nouveau client (brief → devis → kick-off)',
  'onboarder-nouveau-client',
  (SELECT id FROM public.procedure_categories WHERE slug = 'commercial'),
  ARRAY['onboarding','client','brief','devis','kick-off'],
  'Le parcours complet du lead jusqu''au démarrage opérationnel : qualification, brief, devis, signature, accès, kick-off.',
  $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Un onboarding client propre = moins de friction, moins d''allers-retours, meilleur NPS. Voici le parcours type Propul''SEO." }] },
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Qualification (30 min)" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Appel découverte. Qualifier via BANT : Budget, Authority, Need, Timing." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Créer la fiche lead dans le CRM Propul''SEO (module CRM Principal ou ERP selon typologie)." }] }] }
          ]}
        ]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Brief détaillé (45-60 min)" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Envoyer le lien de brief client (module Brief du CRM, lien public short_code 8 chars) — le client remplit en autonomie." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Call de clarification sur le formulaire rempli." }] }] }
          ]}
        ]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Devis" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Génération via le CRM → module Devis (voir fiche " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Rédiger un devis Propul''SEO" }, { "type": "text", "text": ")." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Envoi par email + portail client. Relance à J+3 si pas de réponse." }] }] }
          ]}
        ]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Signature & acompte" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Contrat via Legalstart ou template interne. Signature électronique (Yousign, Pandadoc)." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Acompte 30-50% avant démarrage — lien Stripe ou virement SEPA." }] }] }
          ]}
        ]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Collecte des accès" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Envoyer les fiches procédures " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Acheter un nom de domaine Namecheap" }, { "type": "text", "text": " et toute fiche pertinente selon le projet." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Stocker les accès dans le CRM → module Accès projet (chiffré)." }] }] }
          ]}
        ]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Kick-off (30 min)" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Présentation de l''équipe, planning, canal de communication (Slack Connect ou channel dédié)." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Validation du planning + prochaine livraison." }] }] }
          ]}
        ]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Checklist finale avant démarrage" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "☑ Contrat signé par les deux parties" }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "☑ Acompte reçu" }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "☑ Accès stockés dans le CRM" }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "☑ Chef de projet attribué côté Propul''SEO" }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "☑ Canal de communication en place" }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "☑ Premier jalon au calendrier partagé" }] }] }
      ]}
    ]
  }$jsonb$::jsonb,
  'Onboarding client Propul''SEO qualification 30 min BANT Budget Authority Need Timing CRM fiche lead. Brief 45 60 min lien brief client short_code 8 chars call clarification. Devis module Devis CRM email portail relance J+3. Signature contrat Legalstart Yousign Pandadoc acompte 30 50 Stripe SEPA. Collecte accès fiches procédures Namecheap CRM module Accès projet chiffré. Kick-off 30 min présentation équipe planning Slack Connect. Checklist contrat signé acompte reçu accès CRM chef de projet canal communication jalon calendrier.'
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 6. Commercial — Rédiger un devis Propul'SEO dans le CRM
-- ============================================================
INSERT INTO public.procedures (title, slug, category_id, tags, summary, content, content_text)
SELECT
  'Rédiger un devis Propul''SEO dans le CRM',
  'rediger-devis-crm',
  (SELECT id FROM public.procedure_categories WHERE slug = 'commercial'),
  ARRAY['devis','crm','pricing','commercial'],
  'Créer, chiffrer et envoyer un devis propre depuis le module Devis du CRM Propul''SEO.',
  $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Un devis = la première preuve de ton sérieux. Il doit être clair, chiffré par ligne et daté. Voici le process via le CRM Propul''SEO." }] },
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Prérequis" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Fiche client créée dans le CRM (CRM Principal ou ERP)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Brief validé (voir fiche " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Onboarder un nouveau client" }, { "type": "text", "text": ")." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Ouvre la fiche client → onglet " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Devis" }, { "type": "text", "text": " → bouton " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Nouveau devis" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Titre du devis : " }, { "type": "text", "marks": [{ "type": "code" }], "text": "[Client] - [Projet] - Devis v1" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Ajouter les lignes une par une. Pour chaque ligne :" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Intitulé explicite (ex. " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Développement front Next.js + intégration design" }, { "type": "text", "text": ")" }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Quantité (jours, forfait, nombre de pages…)" }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Prix unitaire HT" }] }] }
          ]}
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Ajouter les conditions de paiement : 30-50% à la signature, solde à la livraison." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Date de validité : J+30." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Générer le PDF via le bouton " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Aperçu / PDF" }, { "type": "text", "text": ". Relire." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Envoyer : bouton " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Envoyer au client" }, { "type": "text", "text": " (lien portail court + email automatique + PDF en PJ)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Changer le statut de la fiche client en " }, { "type": "text", "marks": [{ "type": "code" }], "text": "devis_envoye" }, { "type": "text", "text": "." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Règles de chiffrage" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Taux Propul''SEO standard : [À COMPLÉTER PAR L''ÉQUIPE] €/j HT (dev senior), [...] €/j HT (design)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Forfait préféré pour les projets cadrés. TJM pour les missions flexibles." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Prévoir 20% de marge technique pour les imprévus (réécriture legacy, refacto, etc.)." }] }] }
      ]},
      { "type": "blockquote", "content": [
        { "type": "paragraph", "content": [{ "type": "text", "text": "👉 Relance J+3, J+7, J+14. Après J+30 sans réponse, marquer la fiche " }, { "type": "text", "marks": [{ "type": "code" }], "text": "perdu" }, { "type": "text", "text": " avec motif." }] }
      ]}
    ]
  }$jsonb$::jsonb,
  'Devis Propul''SEO CRM module Devis. Prérequis fiche client CRM Principal ERP brief validé. Étapes nouveau devis titre client projet v1 lignes intitulé quantité prix unitaire HT conditions paiement 30 50 signature solde livraison validité J+30 PDF aperçu envoyer email portail statut devis_envoye. Règles chiffrage taux dev senior design TJM forfait marge technique 20. Relance J+3 J+7 J+14 après 30 perdu motif.'
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 7. Noms de domaine — Déléguer un domaine vers Cloudflare
-- ============================================================
INSERT INTO public.procedures (title, slug, category_id, tags, summary, content, content_text)
SELECT
  'Déléguer un domaine vers Cloudflare (DNS + proxy)',
  'deleguer-domaine-cloudflare',
  (SELECT id FROM public.procedure_categories WHERE slug = 'noms-de-domaine'),
  ARRAY['cloudflare','dns','domaine','ssl','cdn'],
  'Transférer la gestion DNS d''un domaine vers Cloudflare pour bénéficier du cache CDN, du SSL gratuit et de la protection DDoS.',
  $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Cloudflare est le meilleur DNS public gratuit + un CDN mondial + du SSL auto + de la protection DDoS. Déléguer un domaine = passer de 5 min à 10 min max, 0 downtime si fait correctement." }] },
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Prérequis" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Un compte Cloudflare (gratuit) : " }, { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://dash.cloudflare.com", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "dash.cloudflare.com" }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Accès au registrar du domaine (Namecheap, OVH, Gandi…)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Liste des enregistrements DNS actuels (A, MX, TXT, CNAME) — les noter." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Dans Cloudflare, clique " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Add a site" }, { "type": "text", "text": ". Tape ton domaine (ex. " }, { "type": "text", "marks": [{ "type": "code" }], "text": "exemple.fr" }, { "type": "text", "text": ")." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Choisis le plan " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Free" }, { "type": "text", "text": ". Cloudflare scanne les enregistrements DNS existants (30 sec)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Vérifie que tous les enregistrements critiques sont présents (A, MX pour l''email, TXT pour SPF/DKIM). Ajoute manuellement ceux qui manquent." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Pour chaque enregistrement A / CNAME : choisir " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Proxied (nuage orange)" }, { "type": "text", "text": " pour bénéficier du cache/SSL, ou " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "DNS only (nuage gris)" }, { "type": "text", "text": " pour les enregistrements mail et le debug." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Cloudflare affiche 2 nameservers (ex. " }, { "type": "text", "marks": [{ "type": "code" }], "text": "arya.ns.cloudflare.com" }, { "type": "text", "text": " + " }, { "type": "text", "marks": [{ "type": "code" }], "text": "rob.ns.cloudflare.com" }, { "type": "text", "text": "). Copie-les." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Va sur le registrar. Cherche la section " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Nameservers" }, { "type": "text", "text": " (ou " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Custom DNS" }, { "type": "text", "text": "). Remplace les nameservers par ceux de Cloudflare." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Sauvegarde. La propagation DNS prend de 5 min à 24 h (typiquement <1 h)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Cloudflare enverra un email quand le site est actif. Dans le dashboard, le statut passe à " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Active" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Activer : " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "SSL/TLS → Full (strict)" }, { "type": "text", "text": ", " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Always Use HTTPS" }, { "type": "text", "text": ", " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "HTTP/3" }, { "type": "text", "text": "." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Astuces" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Toujours laisser les " }, { "type": "text", "marks": [{ "type": "code" }], "text": "MX" }, { "type": "text", "text": " et " }, { "type": "text", "marks": [{ "type": "code" }], "text": "TXT" }, { "type": "text", "text": " en DNS only (nuage gris), sinon l''email casse." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Activer " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "DNSSEC" }, { "type": "text", "text": " après propagation (SSL/TLS → DNSSEC → Enable)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Doc : " }, { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://developers.cloudflare.com/dns/zone-setups/full-setup/", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "developers.cloudflare.com/dns/zone-setups/full-setup" }] }] }
      ]}
    ]
  }$jsonb$::jsonb,
  'Cloudflare DNS CDN SSL proxy protection DDoS gratuit. Prérequis compte Cloudflare registrar Namecheap OVH Gandi liste DNS A MX TXT CNAME. Étapes add site plan Free scan enregistrements ajouter manquants proxied orange DNS only gris mail debug nameservers copier registrar custom DNS remplacer sauvegarde propagation 5 min 24h status active SSL TLS Full strict Always HTTPS HTTP 3. Astuces MX TXT DNS only gris email DNSSEC activer.'
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 8. Hébergement — Configurer un hébergement mutualisé OVH
-- ============================================================
INSERT INTO public.procedures (title, slug, category_id, tags, summary, content, content_text)
SELECT
  'Configurer un hébergement mutualisé OVH',
  'configurer-hebergement-ovh',
  (SELECT id FROM public.procedure_categories WHERE slug = 'hebergement'),
  ARRAY['ovh','hebergement','mutualise','ftp'],
  'Commander et configurer un hébergement mutualisé OVH pour un site vitrine ou WordPress.',
  $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "L''hébergement mutualisé OVH est la solution standard Propul''SEO pour les sites clients peu trafiqués (vitrine, WordPress, PrestaShop). Prix : 3-12 €/mois selon la gamme." }] },
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes — Commande" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Va sur " }, { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://www.ovhcloud.com/fr/web-hosting/", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "ovhcloud.com/fr/web-hosting" }] }] },
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Choisis la gamme :" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Starter" }, { "type": "text", "text": " (~3,50 €/mois) : site vitrine simple, 100 Go, 1 base." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Perso" }, { "type": "text", "text": " (~5 €/mois) : WordPress basique, 100 Go, 3 bases." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Pro" }, { "type": "text", "text": " (~9 €/mois) : WordPress trafic modéré, PHP boost, 250 Go." }] }] }
          ]}
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Rattacher à un domaine (déjà possédé ou commander en même temps)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Valider la commande. OVH envoie un mail de confirmation + un mail \"Installation\" sous ~15 min." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes — Première configuration" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Connecte-toi au " }, { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://www.ovh.com/manager/", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "Manager OVH" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Section " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Hébergements" }, { "type": "text", "text": " → sélectionne le nouveau." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Onglet " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "FTP - SSH" }, { "type": "text", "text": " → crée un utilisateur FTP (nom + mot de passe). Note-les dans le CRM → Accès." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Onglet " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Bases de données" }, { "type": "text", "text": " → crée une base MySQL (nom + password root + collation UTF-8 MB4)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Onglet " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Multisite" }, { "type": "text", "text": " → rattacher le domaine. Choisir PHP 8.2+ et activer le SSL gratuit (Let''s Encrypt)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Attendre ~15 min la propagation + génération SSL." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Astuces" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Privilégier PHP 8.2+ pour WordPress. PHP 7 est obsolète." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Pour WordPress : utiliser l''installeur 1-click OVH (voir fiche dédiée)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Si trafic > 10K visites/jour, passer direct à un VPS ou à un hébergement Performance OVH. Le mutualisé saturera." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Activer les backups auto (Manager → Backup). Essentiel." }] }] }
      ]}
    ]
  }$jsonb$::jsonb,
  'Hébergement mutualisé OVH standard Propul''SEO vitrine WordPress PrestaShop 3 12 euros mois. Gammes Starter 3 50 100 Go 1 base. Perso 5 euros WordPress 100 Go 3 bases. Pro 9 euros trafic modéré PHP boost 250 Go. Rattacher domaine. Première config Manager OVH Hébergements FTP SSH créer utilisateur mot de passe CRM Accès bases de données MySQL UTF-8 MB4 Multisite domaine PHP 8.2 SSL Let''s Encrypt propagation. Astuces PHP 8.2 WordPress 1-click VPS Performance au dessus 10K visites jour backups auto.'
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 9. Hébergement — Installer WordPress sur OVH
-- ============================================================
INSERT INTO public.procedures (title, slug, category_id, tags, summary, content, content_text)
SELECT
  'Installer WordPress sur OVH (1-click + manuel)',
  'installer-wordpress-ovh',
  (SELECT id FROM public.procedure_categories WHERE slug = 'hebergement'),
  ARRAY['wordpress','ovh','cms','installation'],
  'Deux méthodes pour installer WordPress sur un hébergement OVH : l''installeur automatique (recommandé) ou l''installation manuelle via FTP.',
  $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "WordPress est le CMS le plus utilisé. Sur OVH, deux méthodes : 1-click (5 min, pour un site standard) ou manuel (15 min, pour un site custom ou une migration)." }] },
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Prérequis" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Hébergement OVH configuré (voir fiche " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Configurer un hébergement mutualisé OVH" }, { "type": "text", "text": ")." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Base MySQL créée." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Domaine rattaché + SSL actif." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Méthode A — Installeur 1-click (recommandée)" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Manager OVH → Hébergement → onglet " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Modules en 1 clic" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Clique " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Installer un module" }, { "type": "text", "text": " → choisis " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "WordPress" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Sélectionne : domaine cible, répertoire (racine ou " }, { "type": "text", "marks": [{ "type": "code" }], "text": "/blog" }, { "type": "text", "text": "), langue FR." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Renseigne : nom du site, email admin, login admin (" }, { "type": "text", "marks": [{ "type": "bold" }], "text": "pas \"admin\"" }, { "type": "text", "text": "), mot de passe fort." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Choisis la base MySQL existante ou laisse créer automatiquement." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Lance l''installation (~3-5 min). Accède ensuite à " }, { "type": "text", "marks": [{ "type": "code" }], "text": "ton-domaine.fr/wp-admin" }, { "type": "text", "text": "." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Méthode B — Manuel via FTP" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Télécharge WordPress FR : " }, { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://fr.wordpress.org/download/", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "fr.wordpress.org/download" }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Décompresse le ZIP. Upload le contenu (pas le dossier parent) dans " }, { "type": "text", "marks": [{ "type": "code" }], "text": "/www" }, { "type": "text", "text": " via FTP (Filezilla, Transmit)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Ouvre " }, { "type": "text", "marks": [{ "type": "code" }], "text": "ton-domaine.fr/wp-admin/install.php" }, { "type": "text", "text": " → l''assistant WordPress démarre." }] }] },
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Renseigne les infos base MySQL :" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Nom de la base, utilisateur, mot de passe (vus dans Manager OVH)." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Hôte : souvent " }, { "type": "text", "marks": [{ "type": "code" }], "text": "xxxxx.mysql.db" }, { "type": "text", "text": " (visible dans OVH)." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Préfixe : " }, { "type": "text", "marks": [{ "type": "code" }], "text": "wp_abc123_" }, { "type": "text", "text": " (aléatoire, pas " }, { "type": "text", "marks": [{ "type": "code" }], "text": "wp_" }, { "type": "text", "text": " pour la sécurité)." }] }] }
          ]}
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Login admin + password fort. Valider. Installation terminée." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Checklist post-installation" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Changer l''URL admin (plugin " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "WPS Hide Login" }, { "type": "text", "text": ")." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Installer " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Wordfence" }, { "type": "text", "text": " ou " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Limit Login Attempts" }, { "type": "text", "text": " pour la sécurité." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Installer " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Yoast SEO" }, { "type": "text", "text": " ou " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Rank Math" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Activer les mises à jour auto (Réglages → Générale)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Paramétrer les permaliens en " }, { "type": "text", "marks": [{ "type": "code" }], "text": "/%postname%/" }, { "type": "text", "text": "." }] }] }
      ]}
    ]
  }$jsonb$::jsonb,
  'WordPress OVH 1-click manuel. Prérequis hébergement OVH base MySQL domaine SSL. Méthode A 1-click Manager Modules en 1 clic installer WordPress domaine répertoire racine blog langue FR nom site email admin login pas admin mot de passe fort base MySQL. Méthode B manuel FTP fr.wordpress.org download décompresser upload /www Filezilla Transmit install.php base nom utilisateur mot de passe hôte mysql db préfixe wp_abc123 login password. Checklist WPS Hide Login Wordfence Limit Login Attempts Yoast Rank Math maj auto permaliens postname.'
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 10. Email — Créer un email pro Google Workspace
-- ============================================================
INSERT INTO public.procedures (title, slug, category_id, tags, summary, content, content_text)
SELECT
  'Créer un email pro avec Google Workspace',
  'email-pro-google-workspace',
  (SELECT id FROM public.procedure_categories WHERE slug = 'email'),
  ARRAY['google-workspace','email','dns','mx','spf','dkim'],
  'Configurer un email pro @domaine-client.fr via Google Workspace : souscription, MX, SPF, DKIM, DMARC.',
  $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Google Workspace (ex-G Suite) = Gmail pro + Drive + Agenda sur un domaine perso. Prix : ~6 €/user/mois en Starter. Standard Propul''SEO pour les clients qui veulent leur email pro." }] },
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes — Souscription" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Va sur " }, { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://workspace.google.com/intl/fr/", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "workspace.google.com" }, { "type": "text", "text": " → " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Commencer l''essai gratuit" }, { "type": "text", "text": " (14 jours)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Nom de l''entreprise, nombre d''employés, pays. Continue." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Choix du domaine : taper le domaine déjà possédé (ex " }, { "type": "text", "marks": [{ "type": "code" }], "text": "monclient.fr" }, { "type": "text", "text": ")." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Créer le premier compte admin : " }, { "type": "text", "marks": [{ "type": "code" }], "text": "contact@monclient.fr" }, { "type": "text", "text": " + mot de passe fort." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Entrer la carte bancaire (pour activer après l''essai). Commande validée." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes — Configuration DNS" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Admin Console Google → " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Activer Gmail" }, { "type": "text", "text": " → Google liste 5 enregistrements MX à ajouter." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [
          { "type": "text", "text": "Sur ton DNS (Cloudflare, OVH…), ajoute les 5 enregistrements MX Google :" }
        ]},
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "code" }], "text": "@  1  ASPMX.L.GOOGLE.COM" }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "code" }], "text": "@  5  ALT1.ASPMX.L.GOOGLE.COM" }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "code" }], "text": "@  5  ALT2.ASPMX.L.GOOGLE.COM" }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "code" }], "text": "@  10 ALT3.ASPMX.L.GOOGLE.COM" }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "code" }], "text": "@  10 ALT4.ASPMX.L.GOOGLE.COM" }] }] }
          ]}
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Ajouter SPF en TXT : " }, { "type": "text", "marks": [{ "type": "code" }], "text": "v=spf1 include:_spf.google.com ~all" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Activer DKIM depuis Admin Console → Apps → Google Workspace → Gmail → Authentifier l''email → Generate new record. Copier la clé TXT, la poser en DNS." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Ajouter DMARC en TXT sur " }, { "type": "text", "marks": [{ "type": "code" }], "text": "_dmarc.monclient.fr" }, { "type": "text", "text": " : " }, { "type": "text", "marks": [{ "type": "code" }], "text": "v=DMARC1; p=quarantine; rua=mailto:dmarc@monclient.fr" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Retourner dans Admin Console → cliquer " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Activer Gmail" }, { "type": "text", "text": ". Google vérifie les MX (~15 min max)." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Astuces" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Toujours configurer SPF + DKIM + DMARC : sans eux, les emails finissent en spam." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Tester la délivrabilité via " }, { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://www.mail-tester.com/", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "mail-tester.com" }, { "type": "text", "text": " (objectif 10/10)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Pour ajouter un utilisateur : Admin Console → Utilisateurs → Ajouter (1 licence = 1 user)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Alternative moins chère : " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Zoho Mail" }, { "type": "text", "text": " (gratuit jusqu''à 5 users) ou les emails OVH inclus avec l''hébergement (délivrabilité moins bonne)." }] }] }
      ]}
    ]
  }$jsonb$::jsonb,
  'Google Workspace Gmail pro Drive Agenda domaine 6 euros user mois Starter. Souscription workspace.google.com essai gratuit 14 jours nom entreprise employés pays domaine compte admin contact carte. DNS activer Gmail 5 MX ASPMX ALT1 ALT2 ALT3 ALT4. SPF v spf1 include _spf.google.com ~all. DKIM Admin Console Gmail authentifier generate TXT. DMARC _dmarc v DMARC1 p quarantine rua mailto. Activer Gmail vérification MX 15 min. Astuces SPF DKIM DMARC spam mail-tester 10 10 ajouter utilisateur Zoho 5 users OVH emails inclus.'
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 11. SEO — Setup Google Search Console
-- ============================================================
INSERT INTO public.procedures (title, slug, category_id, tags, summary, content, content_text)
SELECT
  'Setup Google Search Console (propriété + sitemap)',
  'setup-google-search-console',
  (SELECT id FROM public.procedure_categories WHERE slug = 'seo'),
  ARRAY['gsc','seo','google','sitemap','indexation'],
  'Déclarer un site dans Google Search Console, vérifier la propriété, soumettre le sitemap et activer le suivi d''indexation.',
  $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Google Search Console (GSC) est l''outil officiel Google pour suivre l''indexation, les requêtes, les erreurs et les Core Web Vitals d''un site. Gratuit, indispensable pour tout site client Propul''SEO." }] },
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Connecte-toi à " }, { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://search.google.com/search-console", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "search.google.com/search-console" }, { "type": "text", "text": " avec le compte Google du client (ou Propul''SEO avec accès délégué)." }] }] },
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "Clique " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Ajouter une propriété" }, { "type": "text", "text": ". Deux options :" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Domaine" }, { "type": "text", "text": " (recommandé) : couvre tous les sous-domaines + https/http. Vérification par DNS TXT." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Préfixe URL" }, { "type": "text", "text": " : couvre une seule URL exacte. Vérification par HTML tag, fichier, Analytics, DNS." }] }] }
          ]}
        ]},
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Choisis " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Domaine" }, { "type": "text", "text": ". Tape le domaine sans https ni www." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Google affiche un enregistrement TXT type " }, { "type": "text", "marks": [{ "type": "code" }], "text": "google-site-verification=abc123..." }, { "type": "text", "text": ". Copie-le." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Dans ton DNS : ajoute un enregistrement TXT sur " }, { "type": "text", "marks": [{ "type": "code" }], "text": "@" }, { "type": "text", "text": " avec la valeur copiée." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Retourne dans GSC → clique " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Vérifier" }, { "type": "text", "text": ". Succès instantané si propagation OK, sinon retenter après 5-10 min." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Menu gauche → " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Sitemaps" }, { "type": "text", "text": " → soumettre l''URL du sitemap (ex. " }, { "type": "text", "marks": [{ "type": "code" }], "text": "https://exemple.fr/sitemap.xml" }, { "type": "text", "text": ")." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Menu " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Paramètres" }, { "type": "text", "text": " → vérifier que le trafic est bien tracké. Inviter les membres d''équipe Propul''SEO en permission " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Total" }, { "type": "text", "text": " ou " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Restreint" }, { "type": "text", "text": "." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Astuces" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Laisser au moins 48 h avant d''attendre des premières données (indexation + performances)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Utiliser l''inspection d''URL pour forcer l''indexation d''une page importante (bouton " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Demander une indexation" }, { "type": "text", "text": ", ~10 requêtes/jour max)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Connecter GSC à Google Analytics 4 (Admin GA4 → Liaisons produits)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Guide : " }, { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://support.google.com/webmasters/answer/34592", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "support.google.com/webmasters/answer/34592" }] }] }
      ]}
    ]
  }$jsonb$::jsonb,
  'Google Search Console GSC indexation requêtes erreurs Core Web Vitals gratuit. Étapes compte Google client Propul''SEO délégué search.google.com search-console ajouter propriété Domaine sous-domaines DNS TXT préfixe URL HTML tag fichier Analytics. Domaine sans https www google-site-verification copier TXT @ valeur vérifier 5 10 min. Sitemaps soumettre URL sitemap.xml. Paramètres inviter membres Total Restreint. Astuces 48h données inspection URL indexation 10 jour connecter GA4 liaisons.'
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 12. SEO — Audit SEO technique initial
-- ============================================================
INSERT INTO public.procedures (title, slug, category_id, tags, summary, content, content_text)
SELECT
  'Audit SEO technique initial (checklist complète)',
  'audit-seo-technique-initial',
  (SELECT id FROM public.procedure_categories WHERE slug = 'seo'),
  ARRAY['seo','audit','technique','checklist','performance'],
  'Checklist d''audit technique SEO à exécuter lors de la reprise d''un site client : indexation, performance, contenu, liens.',
  $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Audit technique SEO de référence Propul''SEO — ~2 h par site. À exécuter avant toute proposition commerciale SEO pour identifier les quick wins." }] },
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "1. Indexation" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Chercher " }, { "type": "text", "marks": [{ "type": "code" }], "text": "site:domaine.fr" }, { "type": "text", "text": " dans Google → comparer au nombre de pages réelles." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Vérifier " }, { "type": "text", "marks": [{ "type": "code" }], "text": "robots.txt" }, { "type": "text", "text": " (ne pas bloquer /wp-admin/ par erreur)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Vérifier " }, { "type": "text", "marks": [{ "type": "code" }], "text": "sitemap.xml" }, { "type": "text", "text": " existe et est à jour." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "GSC → Couverture → pages exclues (noindex, erreurs, dupliqués)." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "2. Performance" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Core Web Vitals via " }, { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://pagespeed.web.dev", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "PageSpeed Insights" }, { "type": "text", "text": " — LCP <2,5s, INP <200ms, CLS <0,1." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Tester mobile + desktop sur 3 pages (home, page type, article)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Tailles images (AVIF/WebP), lazy-loading, compression gzip/brotli." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Temps de réponse serveur (TTFB <600ms). Si >1s → envisager cache/CDN." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "3. Contenu & structure" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "1 seule H1 par page, titres H2/H3 hiérarchisés." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Balises " }, { "type": "text", "marks": [{ "type": "code" }], "text": "<title>" }, { "type": "text", "text": " 50-60 chars, " }, { "type": "text", "marks": [{ "type": "code" }], "text": "meta description" }, { "type": "text", "text": " 120-155 chars, uniques par page." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Balises " }, { "type": "text", "marks": [{ "type": "code" }], "text": "alt" }, { "type": "text", "text": " présentes sur toutes les images informatives." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Schema.org structuré : Organization, WebSite, Article, FAQPage si pertinent." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Contenu dupliqué → canonical " }, { "type": "text", "marks": [{ "type": "code" }], "text": "<link rel=\"canonical\">" }, { "type": "text", "text": " pointant vers la version principale." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "4. Liens & maillage" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Maillage interne : chaque page accessible en <3 clics depuis la home." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Liens cassés : Screaming Frog (gratuit jusqu''à 500 URLs) ou " }, { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://www.deadlinkchecker.com", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "deadlinkchecker.com" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Backlinks : profil via Ahrefs/SEMrush ou " }, { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "https://neilpatel.com/ubersuggest/", "target": "_blank", "rel": "noopener noreferrer" } }], "text": "Ubersuggest" }, { "type": "text", "text": " (version gratuite)." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "5. Livrable" }] },
      { "type": "paragraph", "content": [{ "type": "text", "text": "Rédiger un rapport Notion/Obsidian avec pour chaque section : constat + impact (haut/moyen/faible) + action corrective. Partager en PDF au client + call de restitution 30 min." }] }
    ]
  }$jsonb$::jsonb,
  'Audit technique SEO Propul''SEO 2h quick wins. 1 Indexation site:domaine Google pages réelles robots.txt wp-admin sitemap.xml GSC Couverture exclues noindex erreurs dupliqués. 2 Performance Core Web Vitals PageSpeed Insights LCP 2.5 INP 200 CLS 0.1 mobile desktop 3 pages home article images AVIF WebP lazy gzip brotli TTFB 600ms cache CDN. 3 Contenu H1 H2 H3 title 50 60 meta description 120 155 alt images Schema.org Organization WebSite Article FAQPage canonical. 4 Maillage 3 clics Screaming Frog deadlinkchecker backlinks Ahrefs SEMrush Ubersuggest. 5 Livrable rapport Notion Obsidian constat impact action PDF client call restitution.'
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 13. Design — Préparer un fichier Figma pour un projet client
-- ============================================================
INSERT INTO public.procedures (title, slug, category_id, tags, summary, content, content_text)
SELECT
  'Préparer un fichier Figma pour un projet client',
  'preparer-figma-projet-client',
  (SELECT id FROM public.procedure_categories WHERE slug = 'design'),
  ARRAY['figma','design','design-system','maquettes'],
  'Structurer un fichier Figma propre dès le démarrage projet : pages, design system, composants, annotations dev.',
  $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Un fichier Figma bien structuré = transmission design → dev sans friction, pas de composants orphelins, pas de copie-colle de couleurs en dur." }] },
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Structure des pages (dans cet ordre)" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "📋 Cover" }, { "type": "text", "text": " — logo + nom projet + statut + lien PRD." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "🎨 Foundations" }, { "type": "text", "text": " — color tokens, typo, spacing, radius, shadows." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "🧩 Components" }, { "type": "text", "text": " — composants atomiques (Button, Input, Card…) avec variants + states." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "🧱 Patterns" }, { "type": "text", "text": " — sections récurrentes (Header, Footer, Hero, CTA block…)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "🖼️ Screens — Desktop" }, { "type": "text", "text": " — toutes les pages en 1440px." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "📱 Screens — Mobile" }, { "type": "text", "text": " — toutes les pages en 375px." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "🔧 Dev annotations" }, { "type": "text", "text": " — notes pour les devs (animations, interactions, API…)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "🗑️ Archive" }, { "type": "text", "text": " — anciennes versions, exploration rejetée." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Étapes de mise en place" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Dupliquer le template " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Propul''SEO starter kit" }, { "type": "text", "text": " (team Figma Propul''SEO)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Renommer : " }, { "type": "text", "marks": [{ "type": "code" }], "text": "[Client] - [Projet] - Design" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Définir les Variables (Figma Variables) : couleurs primary/secondary/neutral, typo, spacing. " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Obligatoire" }, { "type": "text", "text": " — ces tokens seront repris tels quels dans Tailwind / CSS." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Créer les composants atomiques avec variants (size, state, variant)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Décliner en mobile (auto-layout responsive + breakpoints à 768px)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Ajouter des commentaires dev avec " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "FigJam sticky notes" }, { "type": "text", "text": " ou plugin " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Redlines" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Partager en mode " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Can view" }, { "type": "text", "text": " avec le client, " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "Can edit" }, { "type": "text", "text": " avec les devs." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Astuces" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Utiliser le plugin " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Figma Code Connect" }, { "type": "text", "text": " pour mapper les composants Figma aux composants React (gain énorme en dev)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Jamais de hardcoded colors : toujours via Variables." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Un composant " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "main" }, { "type": "text", "text": " par archetype, pas de duplicates." }] }] }
      ]}
    ]
  }$jsonb$::jsonb,
  'Figma fichier projet client structure pages Cover Foundations color tokens typo spacing radius shadows Components Button Input Card variants states Patterns Header Footer Hero CTA Screens Desktop 1440 Mobile 375 Dev annotations Archive. Étapes dupliquer template Propul''SEO starter kit renommer Client Projet Design Variables couleurs primary secondary neutral Tailwind CSS composants atomiques variants size state variant mobile auto-layout breakpoints 768 commentaires FigJam sticky Redlines partager Can view client Can edit devs. Astuces Code Connect React Variables pas hardcoded main pas duplicates.'
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 14. Administratif — Onboarder un nouveau membre d'équipe
-- ============================================================
INSERT INTO public.procedures (title, slug, category_id, tags, summary, content, content_text)
SELECT
  'Onboarder un nouveau membre d''équipe Propul''SEO',
  'onboarder-membre-equipe',
  (SELECT id FROM public.procedure_categories WHERE slug = 'administratif'),
  ARRAY['onboarding','equipe','acces','rh'],
  'Checklist complète pour accueillir un nouveau collaborateur : comptes, accès CRM, outils, doc, premier projet.',
  $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Un onboarding raté = 3 mois perdus. Checklist Propul''SEO pour mettre un nouveau membre en autonomie en <1 semaine." }] },
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "J-3 — Avant l''arrivée" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Signer promesse/contrat (Legalstart)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Commander matériel si besoin (MacBook, casque)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Préparer un parrain/marraine dans l''équipe." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "J0 — Jour d''arrivée" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Comptes pro" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Créer email " }, { "type": "text", "marks": [{ "type": "code" }], "text": "prenom@propulseo-site.com" }, { "type": "text", "text": " (Google Workspace)." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Activer la double authentification (Google Authenticator)." }] }] }
          ]}
        ]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "CRM Propul''SEO" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Admin crée le user via Settings → Utilisateurs → Nouveau." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Rôle approprié : " }, { "type": "text", "marks": [{ "type": "code" }], "text": "admin" }, { "type": "text", "text": " / " }, { "type": "text", "marks": [{ "type": "code" }], "text": "manager" }, { "type": "text", "text": " / " }, { "type": "text", "marks": [{ "type": "code" }], "text": "developer" }, { "type": "text", "text": " / " }, { "type": "text", "marks": [{ "type": "code" }], "text": "sales" }, { "type": "text", "text": " / " }, { "type": "text", "marks": [{ "type": "code" }], "text": "marketing" }, { "type": "text", "text": " / " }, { "type": "text", "marks": [{ "type": "code" }], "text": "ops" }, { "type": "text", "text": "." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Toggles permissions : " }, { "type": "text", "marks": [{ "type": "code" }], "text": "can_view_dashboard" }, { "type": "text", "text": ", " }, { "type": "text", "marks": [{ "type": "code" }], "text": "can_view_leads" }, { "type": "text", "text": ", etc." }] }] }
          ]}
        ]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Outils" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Slack / Discord workspace." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "GitHub : ajouter à l''org, équipe " }, { "type": "text", "marks": [{ "type": "code" }], "text": "devs" }, { "type": "text", "text": " ou " }, { "type": "text", "marks": [{ "type": "code" }], "text": "design" }, { "type": "text", "text": "." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Figma team (si design/dev)." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Claude Pro seat (si dev)." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "1Password / Bitwarden vault partagé." }] }] }
          ]}
        ]},
        { "type": "listItem", "content": [
          { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Doc interne" }] },
          { "type": "bulletList", "content": [
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Accès au vault Obsidian partagé." }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Envoyer les fiches " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Se connecter à Claude Code" }, { "type": "text", "text": ", " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Rédiger un devis" }, { "type": "text", "text": ", et la présentation Propul''SEO." }] }] }
          ]}
        ]}
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Semaine 1 — Intégration" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Point quotidien 15 min avec le parrain." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Affectation sur un projet \"easy\" (correction mineure, petite feature)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Accès aux standups équipe." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "J+30 — Bilan" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Entretien avec le manager." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Feedback dans les 2 sens." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Ajustement des permissions CRM selon les besoins réels observés." }] }] }
      ]}
    ]
  }$jsonb$::jsonb,
  'Onboarding membre équipe Propul''SEO 1 semaine. J-3 promesse contrat Legalstart matériel MacBook casque parrain marraine. J0 comptes pro email prenom propulseo-site.com Google Workspace 2FA Authenticator. CRM admin Settings Utilisateurs Nouveau rôle admin manager developer sales marketing ops permissions can_view_dashboard can_view_leads. Outils Slack Discord GitHub devs design Figma team Claude Pro 1Password Bitwarden. Doc vault Obsidian fiches Claude Code devis présentation. Semaine 1 point quotidien 15 min parrain projet easy standups. J+30 entretien manager feedback permissions CRM.'
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 15. Administratif — Clôturer un projet
-- ============================================================
INSERT INTO public.procedures (title, slug, category_id, tags, summary, content, content_text)
SELECT
  'Clôturer un projet (livraison + archivage + facturation)',
  'cloturer-projet',
  (SELECT id FROM public.procedure_categories WHERE slug = 'administratif'),
  ARRAY['cloture','livraison','facturation','archivage'],
  'Fin de projet propre : recette, livraison, facture solde, archivage CRM, transfert documentation au client.',
  $jsonb${
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Une clôture propre évite les retours de flammes 3 mois après. Voici la checklist Propul''SEO." }] },
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "1. Recette finale" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Envoyer la checklist de recette au client (liste fonctionnelle du PRD)." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Call de revue 45-60 min : on passe la checklist ensemble." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Corrections bloquantes → ticket prioritaire. Non-bloquantes → liste de retours à chiffrer en V2." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Obtenir un " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "PV de recette signé" }, { "type": "text", "text": " (mail suffit)." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "2. Livraison" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Pousser la version prod finale + tag git " }, { "type": "text", "marks": [{ "type": "code" }], "text": "v1.0.0" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Transférer la propriété du repo au client (ou inviter en admin) si inclus au contrat." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Livrer la doc : " }, { "type": "text", "marks": [{ "type": "code" }], "text": "README.md" }, { "type": "text", "text": " + " }, { "type": "text", "marks": [{ "type": "code" }], "text": "DEPLOYMENT.md" }, { "type": "text", "text": " + accès stockés dans le vault client." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Former l''admin client (30 min) si CMS (WordPress, Strapi…)." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "3. Facturation solde" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Émettre la facture solde dans le CRM → module Comptabilité → Nouvelle facture." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Mentions légales : SIRET, TVA, RIB, pénalités de retard, escompte." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Délai de paiement : 30 jours net." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Relance J+31 si non-payée. Mise en demeure J+60." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "4. Archivage CRM" }] },
      { "type": "orderedList", "attrs": { "start": 1 }, "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Fiche projet : statut → " }, { "type": "text", "marks": [{ "type": "code" }], "text": "closed" }, { "type": "text", "text": " ou " }, { "type": "text", "marks": [{ "type": "code" }], "text": "delivered" }, { "type": "text", "text": "." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Date de livraison remplie." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Documents de projet (brief, devis, contrat, PV recette) tous dans l''onglet Documents." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Basculer la fiche dans le module " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Projets terminés" }, { "type": "text", "text": "." }] }] }
      ]},
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "5. Post-mortem" }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Session interne 30 min : ce qui a marché, ce qui a planté, ce qu''on change." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Si découvertes réutilisables → nouvelle fiche dans ce wiki Procédures." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Envoyer un " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "NPS" }, { "type": "text", "text": " au client à J+14 après livraison (Tally, Typeform)." }] }] }
      ]},
      { "type": "blockquote", "content": [
        { "type": "paragraph", "content": [{ "type": "text", "text": "👉 Proposer un contrat de maintenance 1-3 mois après (3-7% du montant initial / mois)." }] }
      ]}
    ]
  }$jsonb$::jsonb,
  'Clôture projet Propul''SEO. 1 Recette checklist fonctionnelle PRD call revue 45 60 min corrections bloquantes tickets prioritaires non-bloquantes V2 PV recette signé mail. 2 Livraison version prod tag git v1.0.0 transfert propriété repo client admin README DEPLOYMENT accès vault formation admin CMS WordPress Strapi 30 min. 3 Facturation solde module Comptabilité nouvelle facture SIRET TVA RIB pénalités retard escompte 30 jours net relance J+31 mise en demeure J+60. 4 Archivage CRM statut closed delivered date livraison documents brief devis contrat PV module Projets terminés. 5 Post-mortem 30 min marché planté change fiche wiki NPS Tally Typeform J+14. Maintenance 1 à 3 mois 3 à 7 pour cent.'
ON CONFLICT (slug) DO NOTHING;
