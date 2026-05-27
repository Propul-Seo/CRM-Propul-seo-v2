// _shared/email-templates/index.ts
// Source de vérité des templates emails transactionnels Brevo.
// Les .brevo.html dans public/handoff-preview-v2/emails/ servent de preview
// navigateur uniquement — toute modif doit être répliquée ici.

export type TemplateKey =
  | 'qualif-confirmation'   // #31 — au client après submit /diagnostic
  | 'new-lead-alert'        // #32 — à l'équipe après submit /diagnostic
  | 'invoice-sent'          // #33 — facture envoyée au client
  | 'invoice-reminder'      // #34 — relance facture impayée
  | 'payment-received'      // #35 — confirmation paiement reçu
  | 'signature-requested'   // #36 — document à signer
  | 'signature-completed'   // #37 — signature complétée
  | 'new-deliverable';      // #39 — nouveau livrable disponible

export const EMAIL_TEMPLATES: Record<TemplateKey, string> = {
  'qualif-confirmation': `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!-- SOURCE OF TRUTH: supabase/functions/_shared/email-templates/index.ts -->
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Votre diagnostic a bien été reçu — Propul'SEO</title>
<style>
  @media only screen and (max-width: 620px) {
    .container { width: 100% !important; }
    .px { padding-left: 20px !important; padding-right: 20px !important; }
    .py-hero { padding-top: 32px !important; padding-bottom: 32px !important; }
  }
  a { color: #5B21B6; text-decoration: underline; }
  .btn { background: #7C3AED !important; color: #ffffff !important; text-decoration: none !important; }
  .btn:hover { background: #6D28D9 !important; }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif; color: #18181B;">
<!-- Preheader -->
<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">Votre diagnostic a bien été reçu — Propul'SEO</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FAFAFA;">
  <tr>
    <td align="center" style="padding: 32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="container" width="600" style="width: 600px; max-width: 600px; background: #FFFFFF; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;">

        <!-- HEADER : brand pill -->
        <tr>
          <td class="px" align="left" style="padding: 24px 32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); border-radius: 8px; padding: 6px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">✦ Propul'SEO</td>
              </tr>
            </table>
          </td>
        </tr>


  <tr>
    <td class="px py-hero" style="padding: 28px 32px 8px;">
      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: #5B21B6; margin-bottom: 10px;">Merci !</div>
      <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; color: #18181B; margin: 0 0 14px;">Merci {{ params.first_name }} !</h1>
      <div style="font-size: 14.5px; line-height: 1.6; color: #52525B;">Votre diagnostic a bien été reçu. Nous l'étudions attentivement et revenons vers vous sous <strong style="color: #18181B;">24 heures</strong> par <strong style="color: #18181B;">{{ params.preferred_contact_method }}</strong>.</div>
    </td>
  </tr>
  <tr><td class="px" style="padding: 6px 32px 12px;">
    <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: #A1A1AA; margin: 8px 0 6px;">Les prochaines étapes</div>
  </td></tr>
  <tr>
    <td class="px" style="padding: 0 32px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">

        <tr>
          <td valign="top" width="40" style="padding: 8px 14px 8px 0;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #EDE9FE; color: #5B21B6; font-size: 13px; font-weight: 700; line-height: 28px; text-align: center;">📞</div>
          </td>
          <td style="padding: 8px 0;">
            <div style="font-size: 13.5px; font-weight: 600; color: #18181B;">1. Appel découverte</div>
            <div style="font-size: 12.5px; color: #A1A1AA; margin-top: 2px;">30 min · pour comprendre votre projet en détail</div>
          </td>
        </tr>
        <tr>
          <td valign="top" width="40" style="padding: 8px 14px 8px 0;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #EDE9FE; color: #5B21B6; font-size: 13px; font-weight: 700; line-height: 28px; text-align: center;">📄</div>
          </td>
          <td style="padding: 8px 0;">
            <div style="font-size: 13.5px; font-weight: 600; color: #18181B;">2. Proposition personnalisée</div>
            <div style="font-size: 12.5px; color: #A1A1AA; margin-top: 2px;">Devis détaillé sous 48-72h après l'appel</div>
          </td>
        </tr>
        <tr>
          <td valign="top" width="40" style="padding: 8px 14px 8px 0;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #EDE9FE; color: #5B21B6; font-size: 13px; font-weight: 700; line-height: 28px; text-align: center;">🚀</div>
          </td>
          <td style="padding: 8px 0;">
            <div style="font-size: 13.5px; font-weight: 600; color: #18181B;">3. Démarrage de votre projet</div>
            <div style="font-size: 12.5px; color: #A1A1AA; margin-top: 2px;">Création de votre Propul'Space dès signature</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td class="px" style="padding: 4px 32px 24px; font-size: 13.5px; color: #52525B; line-height: 1.55;">
    À très vite,<br>
    <strong style="color: #18181B;">L'équipe Propul'SEO</strong>
  </td></tr>

        <!-- FOOTER -->
        <tr>
          <td class="px" align="center" style="padding: 20px 32px 28px; border-top: 1px solid #F0F0F2; color: #A1A1AA; font-size: 11.5px; line-height: 1.55;">
            <strong style="color: #52525B;">Propul'SEO</strong> &nbsp;&middot;&nbsp; 5 av. des Arrouturous, 64320 Idron<br>
            <a href="mailto:contact@propulseo-site.com" style="color: #5B21B6;">contact@propulseo-site.com</a> &nbsp;&middot;&nbsp; SIRET 981 086 093 000 11<br>

            <div style="margin-top: 10px; color: #A1A1AA; font-size: 10.5px;">© 2026 Propul'SEO · Hébergé en France 🇫🇷</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`,

  'new-lead-alert': `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!-- SOURCE OF TRUTH: supabase/functions/_shared/email-templates/index.ts -->
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>🎯 Nouveau lead : {{ params.company_name }} (score {{ params.quality_score }}/70)</title>
<style>
  @media only screen and (max-width: 620px) {
    .container { width: 100% !important; }
    .px { padding-left: 20px !important; padding-right: 20px !important; }
    .py-hero { padding-top: 32px !important; padding-bottom: 32px !important; }
  }
  a { color: #5B21B6; text-decoration: underline; }
  .btn { background: #7C3AED !important; color: #ffffff !important; text-decoration: none !important; }
  .btn:hover { background: #6D28D9 !important; }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif; color: #18181B;">
<!-- Preheader -->
<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">🎯 Nouveau lead : {{ params.company_name }} (score {{ params.quality_score }}/70)</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FAFAFA;">
  <tr>
    <td align="center" style="padding: 32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="container" width="600" style="width: 600px; max-width: 600px; background: #FFFFFF; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;">

        <!-- HEADER : brand pill -->
        <tr>
          <td class="px" align="left" style="padding: 24px 32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); border-radius: 8px; padding: 6px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">✦ Propul'SEO</td>
              </tr>
            </table>
          </td>
        </tr>


  <tr>
    <td class="px py-hero" style="padding: 28px 32px 8px;">
      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: #5B21B6; margin-bottom: 10px;">🎯 Lead qualifié</div>
      <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; color: #18181B; margin: 0 0 14px;">Nouveau lead : {{ params.company_name }}</h1>
      <div style="font-size: 14.5px; line-height: 1.6; color: #52525B;">Score qualité <strong style="color: #18181B;">{{ params.quality_score }}/70</strong> — à contacter en priorité sous 24h.</div>
    </td>
  </tr>
  <tr>
    <td class="px" style="padding: 6px 32px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #F4F4F5; border-radius: 12px;">

        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; border-bottom: 1px solid #E4E4E7;">Contact</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; border-bottom: 1px solid #E4E4E7;">{{ params.first_name }}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; border-bottom: 1px solid #E4E4E7;">Société</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; border-bottom: 1px solid #E4E4E7;">{{ params.company_name }}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; border-bottom: 1px solid #E4E4E7;">Secteur</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; border-bottom: 1px solid #E4E4E7;">{{ params.sector }}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; border-bottom: 1px solid #E4E4E7;">Budget</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; border-bottom: 1px solid #E4E4E7;">{{ params.budget }}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; border-bottom: 1px solid #E4E4E7;">Délai souhaité</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; border-bottom: 1px solid #E4E4E7;">{{ params.timeline }}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; ">Score qualité</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; "><span style="color:#5B21B6;">{{ params.quality_score }}/70</span></td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td class="px" align="left" style="padding: 18px 32px 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="btn" style="background: #7C3AED; border-radius: 8px;">
            <a href="{{ params.admin_url }}" class="btn" style="display: inline-block; padding: 14px 22px; font-size: 14.5px; font-weight: 600; color: #ffffff; text-decoration: none; font-family: -apple-system, 'Inter', Arial, sans-serif; letter-spacing: -0.005em;">Voir dans l'admin &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

        <!-- FOOTER -->
        <tr>
          <td class="px" align="center" style="padding: 20px 32px 28px; border-top: 1px solid #F0F0F2; color: #A1A1AA; font-size: 11.5px; line-height: 1.55;">
            <strong style="color: #52525B;">Propul'SEO</strong> &nbsp;&middot;&nbsp; 5 av. des Arrouturous, 64320 Idron<br>
            <a href="mailto:contact@propulseo-site.com" style="color: #5B21B6;">contact@propulseo-site.com</a> &nbsp;&middot;&nbsp; SIRET 981 086 093 000 11<br>
            Email interne · destiné à team@propulseo-site.com
            <div style="margin-top: 10px; color: #A1A1AA; font-size: 10.5px;">© 2026 Propul'SEO · Hébergé en France 🇫🇷</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`,

  'invoice-sent': `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!-- SOURCE OF TRUTH: supabase/functions/_shared/email-templates/index.ts -->
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Facture {{ params.invoice_number }} — {{ params.amount }} €</title>
<style>
  @media only screen and (max-width: 620px) {
    .container { width: 100% !important; }
    .px { padding-left: 20px !important; padding-right: 20px !important; }
    .py-hero { padding-top: 32px !important; padding-bottom: 32px !important; }
  }
  a { color: #5B21B6; text-decoration: underline; }
  .btn { background: #7C3AED !important; color: #ffffff !important; text-decoration: none !important; }
  .btn:hover { background: #6D28D9 !important; }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif; color: #18181B;">
<!-- Preheader -->
<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">Facture {{ params.invoice_number }} — {{ params.amount }} €</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FAFAFA;">
  <tr>
    <td align="center" style="padding: 32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="container" width="600" style="width: 600px; max-width: 600px; background: #FFFFFF; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;">

        <!-- HEADER : brand pill -->
        <tr>
          <td class="px" align="left" style="padding: 24px 32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); border-radius: 8px; padding: 6px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">✦ Propul'SEO</td>
              </tr>
            </table>
          </td>
        </tr>


  <tr>
    <td class="px py-hero" style="padding: 28px 32px 8px;">
      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: #5B21B6; margin-bottom: 10px;">Nouvelle facture</div>
      <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; color: #18181B; margin: 0 0 14px;">Bonjour {{ params.first_name }},</h1>
      <div style="font-size: 14.5px; line-height: 1.6; color: #52525B;">Votre facture est disponible. Vous pouvez la régler en un clic via Stripe.</div>
    </td>
  </tr>
  <tr>
    <td class="px" style="padding: 6px 32px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #F4F4F5; border-radius: 12px;">

        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; border-bottom: 1px solid #E4E4E7;">N° de facture</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; border-bottom: 1px solid #E4E4E7;"><span style="font-family: ui-monospace, monospace;">{{ params.invoice_number }}</span></td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; border-bottom: 1px solid #E4E4E7;">Montant</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; border-bottom: 1px solid #E4E4E7;"><span style="color:#5B21B6; font-size: 16px;">{{ params.amount }} €</span></td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; ">Échéance</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; ">{{ params.due_date }}</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td class="px" align="left" style="padding: 18px 32px 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="btn" style="background: #7C3AED; border-radius: 8px;">
            <a href="{{ params.payment_url }}" class="btn" style="display: inline-block; padding: 14px 22px; font-size: 14.5px; font-weight: 600; color: #ffffff; text-decoration: none; font-family: -apple-system, 'Inter', Arial, sans-serif; letter-spacing: -0.005em;">Régler en 1 clic &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td class="px" style="padding: 4px 32px 22px; font-size: 12.5px; color: #A1A1AA;">
    Vous pouvez aussi <a href="{{ params.payment_url }}">voir cette facture dans votre espace</a>.<br>
    <em>TVA non applicable, art. 293 B du CGI.</em>
  </td></tr>

        <!-- FOOTER -->
        <tr>
          <td class="px" align="center" style="padding: 20px 32px 28px; border-top: 1px solid #F0F0F2; color: #A1A1AA; font-size: 11.5px; line-height: 1.55;">
            <strong style="color: #52525B;">Propul'SEO</strong> &nbsp;&middot;&nbsp; 5 av. des Arrouturous, 64320 Idron<br>
            <a href="mailto:contact@propulseo-site.com" style="color: #5B21B6;">contact@propulseo-site.com</a> &nbsp;&middot;&nbsp; SIRET 981 086 093 000 11<br>

            <div style="margin-top: 10px; color: #A1A1AA; font-size: 10.5px;">© 2026 Propul'SEO · Hébergé en France 🇫🇷</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`,

  'invoice-reminder': `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!-- SOURCE OF TRUTH: supabase/functions/_shared/email-templates/index.ts -->
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Rappel : facture {{ params.invoice_number }} en retard</title>
<style>
  @media only screen and (max-width: 620px) {
    .container { width: 100% !important; }
    .px { padding-left: 20px !important; padding-right: 20px !important; }
    .py-hero { padding-top: 32px !important; padding-bottom: 32px !important; }
  }
  a { color: #5B21B6; text-decoration: underline; }
  .btn { background: #7C3AED !important; color: #ffffff !important; text-decoration: none !important; }
  .btn:hover { background: #6D28D9 !important; }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif; color: #18181B;">
<!-- Preheader -->
<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">Rappel : facture {{ params.invoice_number }} en retard</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FAFAFA;">
  <tr>
    <td align="center" style="padding: 32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="container" width="600" style="width: 600px; max-width: 600px; background: #FFFFFF; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;">

        <!-- HEADER : brand pill -->
        <tr>
          <td class="px" align="left" style="padding: 24px 32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); border-radius: 8px; padding: 6px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">✦ Propul'SEO</td>
              </tr>
            </table>
          </td>
        </tr>


  <tr>
    <td class="px py-hero" style="padding: 28px 32px 8px;">
      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: #5B21B6; margin-bottom: 10px;">Rappel · sans pression</div>
      <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; color: #18181B; margin: 0 0 14px;">Bonjour {{ params.first_name }},</h1>
      <div style="font-size: 14.5px; line-height: 1.6; color: #52525B;">Nous remarquons que la facture <strong style="color: #18181B;">{{ params.invoice_number }}</strong> est en attente depuis <strong style="color: #18181B;">{{ params.days_overdue }} jours</strong>. Y a-t-il quelque chose qu'on puisse faire pour vous aider ?</div>
    </td>
  </tr>
  <tr>
    <td class="px" style="padding: 6px 32px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #F4F4F5; border-radius: 12px;">

        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; border-bottom: 1px solid #E4E4E7;">Facture</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; border-bottom: 1px solid #E4E4E7;"><span style="font-family: ui-monospace, monospace;">{{ params.invoice_number }}</span></td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; border-bottom: 1px solid #E4E4E7;">Montant</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; border-bottom: 1px solid #E4E4E7;">{{ params.amount }} €</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; ">Retard</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; "><span style="color:#EA580C;">{{ params.days_overdue }} jours</span></td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td class="px" align="left" style="padding: 18px 32px 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="btn" style="background: #7C3AED; border-radius: 8px;">
            <a href="{{ params.payment_url }}" class="btn" style="display: inline-block; padding: 14px 22px; font-size: 14.5px; font-weight: 600; color: #ffffff; text-decoration: none; font-family: -apple-system, 'Inter', Arial, sans-serif; letter-spacing: -0.005em;">Régler maintenant &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td class="px" style="padding: 4px 32px 22px; font-size: 13px; color: #52525B; line-height: 1.55;">
    Si vous rencontrez un souci ou souhaitez ajuster les modalités, <a href="{{ params.contact_url }}">écrivez-nous</a> — on trouvera une solution ensemble.
  </td></tr>

        <!-- FOOTER -->
        <tr>
          <td class="px" align="center" style="padding: 20px 32px 28px; border-top: 1px solid #F0F0F2; color: #A1A1AA; font-size: 11.5px; line-height: 1.55;">
            <strong style="color: #52525B;">Propul'SEO</strong> &nbsp;&middot;&nbsp; 5 av. des Arrouturous, 64320 Idron<br>
            <a href="mailto:contact@propulseo-site.com" style="color: #5B21B6;">contact@propulseo-site.com</a> &nbsp;&middot;&nbsp; SIRET 981 086 093 000 11<br>

            <div style="margin-top: 10px; color: #A1A1AA; font-size: 10.5px;">© 2026 Propul'SEO · Hébergé en France 🇫🇷</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`,

  'payment-received': `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!-- SOURCE OF TRUTH: supabase/functions/_shared/email-templates/index.ts -->
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Paiement bien reçu — merci ! ({{ params.invoice_number }})</title>
<style>
  @media only screen and (max-width: 620px) {
    .container { width: 100% !important; }
    .px { padding-left: 20px !important; padding-right: 20px !important; }
    .py-hero { padding-top: 32px !important; padding-bottom: 32px !important; }
  }
  a { color: #5B21B6; text-decoration: underline; }
  .btn { background: #7C3AED !important; color: #ffffff !important; text-decoration: none !important; }
  .btn:hover { background: #6D28D9 !important; }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif; color: #18181B;">
<!-- Preheader -->
<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">Paiement bien reçu — merci ! ({{ params.invoice_number }})</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FAFAFA;">
  <tr>
    <td align="center" style="padding: 32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="container" width="600" style="width: 600px; max-width: 600px; background: #FFFFFF; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;">

        <!-- HEADER : brand pill -->
        <tr>
          <td class="px" align="left" style="padding: 24px 32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); border-radius: 8px; padding: 6px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">✦ Propul'SEO</td>
              </tr>
            </table>
          </td>
        </tr>


  <tr>
    <td class="px py-hero" style="padding: 28px 32px 8px;">
      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: #5B21B6; margin-bottom: 10px;">✓ Paiement reçu</div>
      <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; color: #18181B; margin: 0 0 14px;">Merci {{ params.first_name }} !</h1>
      <div style="font-size: 14.5px; line-height: 1.6; color: #52525B;">Nous avons bien reçu votre paiement. Votre reçu officiel est joint à cet email et également disponible dans votre espace.</div>
    </td>
  </tr>
  <tr>
    <td class="px" style="padding: 6px 32px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #F4F4F5; border-radius: 12px;">

        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; border-bottom: 1px solid #E4E4E7;">Facture</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; border-bottom: 1px solid #E4E4E7;"><span style="font-family: ui-monospace, monospace;">{{ params.invoice_number }}</span></td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; border-bottom: 1px solid #E4E4E7;">Montant payé</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; border-bottom: 1px solid #E4E4E7;"><span style="color:#16A34A; font-size: 16px;">{{ params.amount }} €</span></td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; ">Date du paiement</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; ">{{ params.paid_at }}</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td class="px" style="padding: 6px 32px 18px;">
      <div style="background: #DCFCE7; color: #166534; padding: 12px 16px; border-radius: 10px; font-size: 13px; line-height: 1.55;">Pièce jointe : reçu_{{ params.invoice_number }}.pdf</div>
    </td>
  </tr>
  <tr>
    <td class="px" align="left" style="padding: 18px 32px 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="btn" style="background: #7C3AED; border-radius: 8px;">
            <a href="{{ params.receipt_url }}" class="btn" style="display: inline-block; padding: 14px 22px; font-size: 14.5px; font-weight: 600; color: #ffffff; text-decoration: none; font-family: -apple-system, 'Inter', Arial, sans-serif; letter-spacing: -0.005em;">Télécharger le reçu &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

        <!-- FOOTER -->
        <tr>
          <td class="px" align="center" style="padding: 20px 32px 28px; border-top: 1px solid #F0F0F2; color: #A1A1AA; font-size: 11.5px; line-height: 1.55;">
            <strong style="color: #52525B;">Propul'SEO</strong> &nbsp;&middot;&nbsp; 5 av. des Arrouturous, 64320 Idron<br>
            <a href="mailto:contact@propulseo-site.com" style="color: #5B21B6;">contact@propulseo-site.com</a> &nbsp;&middot;&nbsp; SIRET 981 086 093 000 11<br>

            <div style="margin-top: 10px; color: #A1A1AA; font-size: 10.5px;">© 2026 Propul'SEO · Hébergé en France 🇫🇷</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`,

  'signature-requested': `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!-- SOURCE OF TRUTH: supabase/functions/_shared/email-templates/index.ts -->
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Document à signer : {{ params.doc_title }}</title>
<style>
  @media only screen and (max-width: 620px) {
    .container { width: 100% !important; }
    .px { padding-left: 20px !important; padding-right: 20px !important; }
    .py-hero { padding-top: 32px !important; padding-bottom: 32px !important; }
  }
  a { color: #5B21B6; text-decoration: underline; }
  .btn { background: #7C3AED !important; color: #ffffff !important; text-decoration: none !important; }
  .btn:hover { background: #6D28D9 !important; }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif; color: #18181B;">
<!-- Preheader -->
<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">Document à signer : {{ params.doc_title }}</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FAFAFA;">
  <tr>
    <td align="center" style="padding: 32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="container" width="600" style="width: 600px; max-width: 600px; background: #FFFFFF; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;">

        <!-- HEADER : brand pill -->
        <tr>
          <td class="px" align="left" style="padding: 24px 32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); border-radius: 8px; padding: 6px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">✦ Propul'SEO</td>
              </tr>
            </table>
          </td>
        </tr>


  <tr>
    <td class="px py-hero" style="padding: 28px 32px 8px;">
      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: #5B21B6; margin-bottom: 10px;">Signature requise</div>
      <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; color: #18181B; margin: 0 0 14px;">Bonjour {{ params.first_name }},</h1>
      <div style="font-size: 14.5px; line-height: 1.6; color: #52525B;">Le document <strong style="color: #18181B;">{{ params.doc_title }}</strong> est prêt à être signé. La signature se fait en quelques secondes via DocuSeal.</div>
    </td>
  </tr>
  <tr>
    <td class="px" style="padding: 6px 32px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #F4F4F5; border-radius: 12px;">

        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; border-bottom: 1px solid #E4E4E7;">Document</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; border-bottom: 1px solid #E4E4E7;">{{ params.doc_title }}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; border-bottom: 1px solid #E4E4E7;">Type</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; border-bottom: 1px solid #E4E4E7;">{{ params.doc_type }}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; ">À signer avant le</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; ">{{ params.expires_at }}</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td class="px" align="left" style="padding: 18px 32px 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="btn" style="background: #7C3AED; border-radius: 8px;">
            <a href="{{ params.sign_url }}" class="btn" style="display: inline-block; padding: 14px 22px; font-size: 14.5px; font-weight: 600; color: #ffffff; text-decoration: none; font-family: -apple-system, 'Inter', Arial, sans-serif; letter-spacing: -0.005em;">Signer maintenant &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td class="px" style="padding: 4px 32px 22px; font-size: 12.5px; color: #A1A1AA; line-height: 1.55;">
    Signature électronique sécurisée via DocuSeal · valeur juridique équivalente à une signature manuscrite (eIDAS).
  </td></tr>

        <!-- FOOTER -->
        <tr>
          <td class="px" align="center" style="padding: 20px 32px 28px; border-top: 1px solid #F0F0F2; color: #A1A1AA; font-size: 11.5px; line-height: 1.55;">
            <strong style="color: #52525B;">Propul'SEO</strong> &nbsp;&middot;&nbsp; 5 av. des Arrouturous, 64320 Idron<br>
            <a href="mailto:contact@propulseo-site.com" style="color: #5B21B6;">contact@propulseo-site.com</a> &nbsp;&middot;&nbsp; SIRET 981 086 093 000 11<br>

            <div style="margin-top: 10px; color: #A1A1AA; font-size: 10.5px;">© 2026 Propul'SEO · Hébergé en France 🇫🇷</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`,

  'signature-completed': `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!-- SOURCE OF TRUTH: supabase/functions/_shared/email-templates/index.ts -->
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Document signé : {{ params.doc_title }}</title>
<style>
  @media only screen and (max-width: 620px) {
    .container { width: 100% !important; }
    .px { padding-left: 20px !important; padding-right: 20px !important; }
    .py-hero { padding-top: 32px !important; padding-bottom: 32px !important; }
  }
  a { color: #5B21B6; text-decoration: underline; }
  .btn { background: #7C3AED !important; color: #ffffff !important; text-decoration: none !important; }
  .btn:hover { background: #6D28D9 !important; }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif; color: #18181B;">
<!-- Preheader -->
<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">Document signé : {{ params.doc_title }}</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FAFAFA;">
  <tr>
    <td align="center" style="padding: 32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="container" width="600" style="width: 600px; max-width: 600px; background: #FFFFFF; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;">

        <!-- HEADER : brand pill -->
        <tr>
          <td class="px" align="left" style="padding: 24px 32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); border-radius: 8px; padding: 6px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">✦ Propul'SEO</td>
              </tr>
            </table>
          </td>
        </tr>


  <tr>
    <td class="px py-hero" style="padding: 28px 32px 8px;">
      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: #5B21B6; margin-bottom: 10px;">✓ Signature enregistrée</div>
      <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; color: #18181B; margin: 0 0 14px;">Merci {{ params.first_name }} !</h1>
      <div style="font-size: 14.5px; line-height: 1.6; color: #52525B;">Votre signature a bien été enregistrée le <strong style="color: #18181B;">{{ params.signed_at }}</strong>. Le PDF signé est joint à cet email et également disponible dans votre espace.</div>
    </td>
  </tr>
  <tr>
    <td class="px" style="padding: 6px 32px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #F4F4F5; border-radius: 12px;">

        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; border-bottom: 1px solid #E4E4E7;">Document</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; border-bottom: 1px solid #E4E4E7;">{{ params.doc_title }}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; border-bottom: 1px solid #E4E4E7;">Signé le</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; border-bottom: 1px solid #E4E4E7;">{{ params.signed_at }}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; ">Valeur juridique</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; ">eIDAS · niveau avancé</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td class="px" style="padding: 6px 32px 18px;">
      <div style="background: #DCFCE7; color: #166534; padding: 12px 16px; border-radius: 10px; font-size: 13px; line-height: 1.55;">Pièce jointe : {{ params.doc_title }}_signé.pdf</div>
    </td>
  </tr>
  <tr>
    <td class="px" align="left" style="padding: 18px 32px 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="btn" style="background: #7C3AED; border-radius: 8px;">
            <a href="{{ params.portal_url }}" class="btn" style="display: inline-block; padding: 14px 22px; font-size: 14.5px; font-weight: 600; color: #ffffff; text-decoration: none; font-family: -apple-system, 'Inter', Arial, sans-serif; letter-spacing: -0.005em;">Voir dans mon espace &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

        <!-- FOOTER -->
        <tr>
          <td class="px" align="center" style="padding: 20px 32px 28px; border-top: 1px solid #F0F0F2; color: #A1A1AA; font-size: 11.5px; line-height: 1.55;">
            <strong style="color: #52525B;">Propul'SEO</strong> &nbsp;&middot;&nbsp; 5 av. des Arrouturous, 64320 Idron<br>
            <a href="mailto:contact@propulseo-site.com" style="color: #5B21B6;">contact@propulseo-site.com</a> &nbsp;&middot;&nbsp; SIRET 981 086 093 000 11<br>

            <div style="margin-top: 10px; color: #A1A1AA; font-size: 10.5px;">© 2026 Propul'SEO · Hébergé en France 🇫🇷</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`,

  'new-deliverable': `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!-- SOURCE OF TRUTH: supabase/functions/_shared/email-templates/index.ts -->
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Nouveau livrable : {{ params.doc_title }}</title>
<style>
  @media only screen and (max-width: 620px) {
    .container { width: 100% !important; }
    .px { padding-left: 20px !important; padding-right: 20px !important; }
    .py-hero { padding-top: 32px !important; padding-bottom: 32px !important; }
  }
  a { color: #5B21B6; text-decoration: underline; }
  .btn { background: #7C3AED !important; color: #ffffff !important; text-decoration: none !important; }
  .btn:hover { background: #6D28D9 !important; }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif; color: #18181B;">
<!-- Preheader -->
<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">Nouveau livrable : {{ params.doc_title }}</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FAFAFA;">
  <tr>
    <td align="center" style="padding: 32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="container" width="600" style="width: 600px; max-width: 600px; background: #FFFFFF; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;">

        <!-- HEADER : brand pill -->
        <tr>
          <td class="px" align="left" style="padding: 24px 32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); border-radius: 8px; padding: 6px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">✦ Propul'SEO</td>
              </tr>
            </table>
          </td>
        </tr>


  <tr>
    <td class="px py-hero" style="padding: 28px 32px 8px;">
      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: #5B21B6; margin-bottom: 10px;">Nouveau document</div>
      <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; color: #18181B; margin: 0 0 14px;">Bonjour {{ params.first_name }},</h1>
      <div style="font-size: 14.5px; line-height: 1.6; color: #52525B;">Un nouveau document est disponible dans votre espace pour le projet <strong style="color: #18181B;">{{ params.project_name }}</strong>.</div>
    </td>
  </tr>
  <tr>
    <td class="px" style="padding: 6px 32px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #F4F4F5; border-radius: 12px;">

        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; border-bottom: 1px solid #E4E4E7;">Document</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; border-bottom: 1px solid #E4E4E7;">{{ params.doc_title }}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; border-bottom: 1px solid #E4E4E7;">Type</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; border-bottom: 1px solid #E4E4E7;">{{ params.doc_type }}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; color: #52525B; ">Projet</td>
          <td align="right" style="padding: 12px 16px; font-size: 13.5px; color: #18181B; font-weight: 600; ">{{ params.project_name }}</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td class="px" align="left" style="padding: 18px 32px 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="btn" style="background: #7C3AED; border-radius: 8px;">
            <a href="{{ params.download_url }}" class="btn" style="display: inline-block; padding: 14px 22px; font-size: 14.5px; font-weight: 600; color: #ffffff; text-decoration: none; font-family: -apple-system, 'Inter', Arial, sans-serif; letter-spacing: -0.005em;">Voir le document &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

        <!-- FOOTER -->
        <tr>
          <td class="px" align="center" style="padding: 20px 32px 28px; border-top: 1px solid #F0F0F2; color: #A1A1AA; font-size: 11.5px; line-height: 1.55;">
            <strong style="color: #52525B;">Propul'SEO</strong> &nbsp;&middot;&nbsp; 5 av. des Arrouturous, 64320 Idron<br>
            <a href="mailto:contact@propulseo-site.com" style="color: #5B21B6;">contact@propulseo-site.com</a> &nbsp;&middot;&nbsp; SIRET 981 086 093 000 11<br>

            <div style="margin-top: 10px; color: #A1A1AA; font-size: 10.5px;">© 2026 Propul'SEO · Hébergé en France 🇫🇷</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`,
};

// Extrait le <title>...</title> du HTML (utilisé comme subject)
export function extractSubject(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return (match?.[1] ?? '').trim();
}
