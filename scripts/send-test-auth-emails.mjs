// Envoi de test des 3 emails d'auth (Supabase Auth templates) vers une boîte réelle,
// via l'API transactionnelle Brevo. But : prévisualiser le rendu dans un vrai client mail.
//
// Usage : node scripts/send-test-auth-emails.mjs [destinataire]
// La clé Brevo est lue depuis .env (BREVO_API_KEY) — jamais affichée.
// Les variables Go ({{ .ConfirmationURL }}, {{ .Email }}) sont remplacées par des
// valeurs réalistes : les liens pointent vers la page de login (inoffensif, pas de token).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// --- Lecture .env (BREVO_API_KEY) sans dépendance externe ---
function readEnv(key) {
  if (process.env[key]) return process.env[key];
  try {
    const env = readFileSync(join(root, '.env'), 'utf8');
    for (const line of env.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '').trim();
    }
  } catch { /* pas de .env */ }
  return null;
}

const BREVO_API_KEY = readEnv('BREVO_API_KEY');
const SENDER_EMAIL = readEnv('BREVO_SENDER_EMAIL') || 'lyes.triki@propulseo-site.com';
const SENDER_NAME = readEnv('BREVO_SENDER_NAME') || "Propul'SEO";
const TO = process.argv[2] || 'lyestriki@gmail.com';

if (!BREVO_API_KEY) {
  console.error('❌ BREVO_API_KEY introuvable (ni en env, ni dans .env). Abandon.');
  process.exit(1);
}

const EMAILS_DIR = join(root, 'public', 'handoff-preview-v2', 'emails');
const DUMMY_URL = 'https://crm.propulseo-site.com/espace-client';

const TEMPLATES = [
  { file: '30-magic-link.supabase-auth.html',     subject: "Votre lien de connexion Propul'Space" },
  { file: '38-portal-welcome.supabase-auth.html', subject: "Bienvenue dans votre espace Propul'Space" },
  { file: '40-password-reset.supabase-auth.html', subject: "Réinitialisation de votre mot de passe Propul'Space" },
];

function render(html) {
  return html
    .replace(/\{\{\s*\.ConfirmationURL\s*\}\}/g, DUMMY_URL)
    .replace(/\{\{\s*\.Email\s*\}\}/g, TO)
    .replace(/\{\{\s*\.SiteURL\s*\}\}/g, 'https://crm.propulseo-site.com')
    .replace(/\{\{\s*\.Token\s*\}\}/g, '123456');
}

async function send({ file, subject }) {
  const htmlContent = render(readFileSync(join(EMAILS_DIR, file), 'utf8'));
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'accept': 'application/json', 'api-key': BREVO_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { email: SENDER_EMAIL, name: SENDER_NAME },
      to: [{ email: TO }],
      subject: `[TEST] ${subject}`,
      htmlContent,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`❌ ${file} → Brevo ${res.status}:`, JSON.stringify(body));
    return false;
  }
  console.log(`✅ ${file} → envoyé (messageId: ${body.messageId ?? '?'})`);
  return true;
}

console.log(`Envoi de ${TEMPLATES.length} emails de test vers ${TO} (expéditeur: ${SENDER_EMAIL})…\n`);
let ok = 0;
for (const t of TEMPLATES) { if (await send(t)) ok++; }
console.log(`\n${ok}/${TEMPLATES.length} emails envoyés.`);
process.exit(ok === TEMPLATES.length ? 0 : 1);
