// Enums ERP-spécifiques pour le questionnaire de qualification.
// Voir migration 242 — colonnes propulspace.qualification_leads.erp_*

export const ERP_CURRENT_SYSTEMS = [
  { value: 'excel',      label: 'Excel / Google Sheets', hint: 'Tableurs partagés' },
  { value: 'odoo',       label: 'Odoo',                  hint: 'ERP cloud open source' },
  { value: 'sage',       label: 'Sage',                  hint: 'Comptabilité / gestion' },
  { value: 'pennylane',  label: 'Pennylane',             hint: 'Comptabilité en ligne' },
  { value: 'notion',     label: 'Notion',                hint: 'Workspace collaboratif' },
  { value: 'papier',     label: 'Papier / classeurs',    hint: 'Tout en physique' },
  { value: 'aucun',      label: 'Aucun outil actuellement', hint: 'Création d’une base de travail structurée' },
  { value: 'autre',      label: 'Autre',                 hint: 'Précisez' },
] as const;

export const ERP_DATA_VOLUMES = [
  { value: '<1000',        label: 'Moins de 1 000 lignes', hint: 'Petite base à migrer' },
  { value: '1000_10000',   label: '1 000 à 10 000 lignes', hint: 'Volume intermédiaire' },
  { value: '>10000',       label: '> 10 000 lignes',       hint: 'Grosse migration' },
  { value: 'je_sais_pas',  label: 'Je ne sais pas',        hint: 'À évaluer ensemble' },
] as const;

export const ERP_MODULES = [
  { value: 'crm',         label: 'CRM / Clients',           hint: 'Suivi prospects et clients' },
  { value: 'facturation', label: 'Facturation / Devis',     hint: 'Création et suivi des factures' },
  { value: 'stock',       label: 'Stock / Inventaire',      hint: 'Gestion des produits et entrepôts' },
  { value: 'planning',    label: 'Planning / Agenda',       hint: 'Calendrier équipe ou clients' },
  { value: 'rh',          label: 'RH / Paie',               hint: 'Salariés, congés, contrats' },
  { value: 'achats',      label: 'Achats / Fournisseurs',   hint: 'Bons de commande, livraisons' },
  { value: 'compta',      label: 'Comptabilité',            hint: 'Saisie, rapprochement, bilans' },
  { value: 'bi',          label: 'Reporting / Tableaux de bord', hint: 'KPI, statistiques' },
  { value: 'autre',       label: 'Autre',                   hint: 'Précisez' },
] as const;

export const ERP_USERS_COUNT = [
  { value: '<5',     label: 'Moins de 5 utilisateurs', hint: 'Petite équipe' },
  { value: '5_20',   label: '5 à 20 utilisateurs',     hint: 'PME' },
  { value: '20_50',  label: '20 à 50 utilisateurs',    hint: 'Équipe moyenne' },
  { value: '>50',    label: '> 50 utilisateurs',    hint: 'Grosse structure' },
] as const;

export const ERP_SSO_TYPES = [
  { value: 'google',         label: 'Google Workspace',  hint: 'Connexion via comptes Google' },
  { value: 'microsoft',      label: 'Microsoft 365',     hint: 'Connexion via comptes Microsoft' },
  { value: 'email_password', label: 'Email + mot de passe', hint: 'Authentification classique' },
  { value: 'none',           label: 'Je ne sais pas',    hint: 'À définir ensemble' },
] as const;

export const ERP_INTEGRATIONS = [
  { value: 'compta_pennylane', label: 'Comptabilité (Pennylane / Sage / QuickBooks)', hint: 'Synchroniser la compta' },
  { value: 'paiement_stripe',  label: 'Paiement (Stripe)',           hint: 'Encaisser en ligne' },
  { value: 'email_brevo',      label: 'Email marketing (Brevo / Mailchimp)', hint: 'Campagnes automatiques' },
  { value: 'esign_docuseal',   label: 'Signature électronique', hint: 'Contrats signés en ligne' },
  { value: 'calendrier',       label: 'Calendrier (Google / Outlook)', hint: 'Sync agenda' },
  { value: 'autre',            label: 'Autre',                       hint: 'Précisez' },
] as const;
