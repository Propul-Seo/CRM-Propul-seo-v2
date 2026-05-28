# Templates Supabase Auth — handoff Lyes

Ce runbook explique comment installer les templates emails #30 (magic-link) et #38 (portal-welcome) dans le dashboard Supabase Auth pour le projet Propul'Space.

## Prérequis

- Accès dashboard Supabase, projet ERP (`tbuqctfgjjxnevmsvucl`)
- SMTP custom Brevo configuré (Settings > Auth > SMTP). Si non configuré, voir runbook Brevo séparé.

## #30 Magic Link

1. Dashboard Supabase > Authentication > Email Templates > **Magic Link**
2. **Subject** : copier le contenu du `<title>` du fichier `public/handoff-preview-v2/emails/30-magic-link.supabase-auth.html`
3. **Body (HTML)** : ouvrir le même fichier, copier tout le contenu (sauf le commentaire `<!-- SUPABASE AUTH TEMPLATE ... -->` en tête), coller dans le champ HTML
4. **Sauvegarder**
5. Test : depuis `/login` du portail client, demander un magic-link sur un email test (ex. lyes.triki+qa@yahoo.fr) — vérifier la réception + rendu visuel

## #38 Portal Welcome (= Invite User)

1. Authentication > Email Templates > **Invite User**
2. **Subject** : copier le `<title>` de `38-portal-welcome.supabase-auth.html`
3. **Body** : coller le contenu du fichier (sauf commentaire de tête)
4. **Sauvegarder**
5. Test : depuis le CRM admin, cliquer "Activer le portail" sur un projet test — vérifier la réception + lien d'activation OK

## Variables Supabase Auth

Les templates Supabase Auth utilisent la syntaxe Go templates :
- `{{ .ConfirmationURL }}` — l'URL d'action (login magique, activation, etc.)
- `{{ .Email }}` — l'email du destinataire
- `{{ .Token }}` — token brut (utile si lien custom)
- `{{ .SiteURL }}` — URL de base configurée dans Auth Settings

Les templates Brevo (helper sendTransactional) utilisent `{{ params.X }}` — c'est différent et NON compatible.

## En cas de rendu cassé

- Vérifier que Brevo SMTP est bien configuré (Settings > Auth > SMTP, port 587, domaine SPF+DKIM validés sur propulseo-site.com)
- Tester depuis un autre client mail (Gmail web, Outlook desktop) pour isoler les problèmes de rendu CSS

## Source HTML

- `public/handoff-preview-v2/emails/30-magic-link.supabase-auth.html`
- `public/handoff-preview-v2/emails/38-portal-welcome.supabase-auth.html`

Toute modification doit être faite dans ces fichiers ET re-copiée dans le dashboard (pas de sync auto).
