# Emails transactionnels — Propul'Space

10 templates HTML inline-styled, max-width 600px, compatible Gmail/Outlook/Apple Mail.

## Format

Chaque email existe en **2 versions** :

| Fichier | Pour |
|---|---|
| `NN-name.html` | Preview avec valeurs d'exemple — à ouvrir dans le navigateur pour visualiser |
| `NN-name.brevo.html` | Template prêt pour Brevo avec variables `{{ params.X }}` |

**Aperçu rapide** : ouvre `index.html` dans ton navigateur → grille des 10 emails côte à côte.

## Variables par email

| # | Email | Variables |
|---|---|---|
| 30 | `magic-link` | `first_name`, `magic_link_url` |
| 31 | `qualif-confirmation` | `first_name`, `preferred_contact_method` |
| 32 | `new-lead-alert` *(interne)* | `company_name`, `quality_score`, `lead_id`, `first_name`, `sector`, `budget`, `timeline`, `admin_url` |
| 33 | `invoice-sent` | `first_name`, `invoice_number`, `amount`, `due_date`, `payment_url` |
| 34 | `invoice-reminder` | `first_name`, `invoice_number`, `amount`, `days_overdue`, `payment_url`, `contact_url` |
| 35 | `payment-received` | `first_name`, `invoice_number`, `amount`, `paid_at`, `receipt_url` |
| 36 | `signature-requested` | `first_name`, `doc_title`, `doc_type`, `expires_at`, `sign_url` |
| 37 | `signature-completed` | `first_name`, `doc_title`, `signed_at`, `portal_url` |
| 38 | `portal-welcome` | `first_name`, `portal_url` |
| 39 | `new-deliverable` | `first_name`, `doc_title`, `doc_type`, `project_name`, `download_url` |

## Sujets recommandés

Tous les sujets sont **dans le `<title>`** de chaque version Brevo — copie-colle directement dans Brevo.

## Conventions design respectées

- Max-width 600px (responsive collapse < 620px via media query)
- Inline styles partout (compat Outlook)
- Tables `role="presentation"` pour le layout (pas de divs)
- Bouton CTA = `<table>` autour d'un `<a>` (workaround Outlook)
- Police : `-apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif` (fallback gracieux si Inter non chargé)
- Violet `#7C3AED` sur CTA, `#5B21B6` sur les liens texte
- Footer signature avec SIRET conformité française
- Pas d'emoji dans le chrome — autorisés uniquement dans les sujets (#32 🎯) et les corps de mail thématiques (#31 timeline, #38 bienvenue)

## Hook côté code

```ts
// Edge function portal-send-transactional-email
await brevo.sendTransactional({
  templateId: TEMPLATE_IDS[emailKey],  // mappé en variable d'env
  to: [{ email: user.email, name: user.first_name }],
  params: { ...vars },                  // les variables du tableau ci-dessus
});
```

## Variables système Brevo à ajouter

Stocke les `templateId` Brevo dans une table `email_templates` ou en variables d'env :

```
BREVO_TPL_MAGIC_LINK=11
BREVO_TPL_QUALIF_CONFIRM=12
BREVO_TPL_NEW_LEAD=13
BREVO_TPL_INVOICE_SENT=14
... etc
```

## Tests à faire avant prod

- [ ] Envoi test depuis Brevo vers Gmail, Outlook, Apple Mail desktop + mobile
- [ ] Rendu sombre (Apple Mail iOS, Outlook.com) — les couleurs sombres doivent rester lisibles
- [ ] Liens non cliqués après 7 jours → quarantaine
- [ ] Désabonnement obligatoire pour emails non-transactionnels (38, 39 selon RGPD)
- [ ] SPF + DKIM + DMARC configurés sur `propulseo-site.com`
