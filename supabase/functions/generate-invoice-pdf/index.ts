// generate-invoice-pdf — Génère le PDF d'une facture Propul'Space (conforme FR),
// l'upload dans le bucket Storage propulspace-documents, et stocke le chemin + le
// hash SHA-256 dans propulspace.invoices.
//
// Appelée en best-effort (non bloquant) après l'envoi d'une facture :
//   supabase.functions.invoke('generate-invoice-pdf', { body: { invoice_id } })
//
// Règle d'accès aux données :
//   - LECTURE de la facture avec le JWT admin (vue propulspace_invoices_v2, filtrée
//     par is_admin() OR portal_project_id() — le service_role NE satisfait PAS is_admin()).
//   - UPLOAD Storage avec le service_role uniquement.
//   - ÉCRITURE pdf_url / pdf_hash via la RPC admin_set_invoice_pdf (JWT admin).
//
// Dégradation gracieuse : si le service PDF n'est pas configuré (secrets manquants)
// ou si la génération échoue, on renvoie HTTP 200 { ok: true, pdf: false } pour ne
// jamais faire échouer l'envoi d'une facture à cause du PDF.
//
// JWT verify : ACTIVÉ (l'edge re-vérifie is_admin via le JWT transmis).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s: number) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const PDF_API_KEY = Deno.env.get('PDF_API_KEY') ?? '';
const PDF_INVOICE_TEMPLATE_ID = Deno.env.get('PDF_INVOICE_TEMPLATE_ID') ?? '';
const BUCKET = 'propulspace-documents';

const PDF_API_URL = 'https://api.pdfmonkey.io/api/v1/documents';

// Bloc légal émetteur — mentions FR obligatoires (raison sociale, SIRET, micro-entreprise).
// Valeurs réelles reprises de _shared/email-templates/index.ts.
const AGENCY = {
  name: "Propul'SEO",
  address: '5 av. des Arrouturous, 64320 Idron',
  email: 'contact@propulseo-site.com',
  siret: '981 086 093 000 11',
  vat_mention: 'TVA non applicable, art. 293 B du CGI',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Auth requise' }, 401);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'JWT invalide' }, 401);
  const { data: isAdmin } = await userClient.rpc('is_admin');
  if (!isAdmin) return json({ error: 'Admin requis' }, 403);

  const { invoice_id } = await req.json().catch(() => ({}));
  if (!invoice_id) return json({ error: 'invoice_id requis' }, 400);

  // Lecture via le JWT admin (le service_role ne traverse pas la vue _v2).
  const { data: inv, error: invErr } = await userClient.from('propulspace_invoices_v2').select('*').eq('id', invoice_id).maybeSingle();
  if (invErr || !inv) return json({ error: 'Facture introuvable' }, 404);

  // Dégradation gracieuse : secrets PDF absents → on n'échoue pas l'envoi.
  if (!PDF_API_KEY || !PDF_INVOICE_TEMPLATE_ID) {
    return json({ ok: true, pdf: false, reason: 'PDF service non configuré' }, 200);
  }

  const pdfBytes = await generateInvoicePdf(inv);
  if (!pdfBytes) return json({ ok: true, pdf: false, reason: 'génération échouée' }, 200);

  // Upload Storage avec le service_role uniquement.
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const path = `${inv.project_id}/invoices/${String(inv.invoice_number).replace(/\s+/g, '_')}.pdf`;
  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, pdfBytes, { contentType: 'application/pdf', upsert: true });
  if (upErr) return json({ error: `upload: ${upErr.message}` }, 500);

  const hashBuf = await crypto.subtle.digest('SHA-256', pdfBytes);
  const hash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');

  // Écriture pdf_url/hash via la RPC admin (JWT admin).
  const { error: updErr } = await userClient.rpc('admin_set_invoice_pdf', { p_invoice_id: invoice_id, p_url: path, p_hash: hash });
  if (updErr) return json({ error: `update: ${updErr.message}` }, 500);

  return json({ ok: true, pdf: true, path }, 200);
});

/**
 * Génère le PDF de la facture via PDFMonkey (create → poll → download).
 * Reprise de la logique generatePDF de generate-quote-pdf, adaptée :
 *   - document_template_id = PDF_INVOICE_TEMPLATE_ID
 *   - payload = { invoice, agency } avec les mentions légales FR
 *   - retourne Uint8Array | null (null sur toute erreur → dégradation gracieuse)
 */
async function generateInvoicePdf(inv: Record<string, unknown>): Promise<Uint8Array | null> {
  try {
    const createResponse = await fetch(PDF_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PDF_API_KEY}`,
      },
      body: JSON.stringify({
        document: {
          document_template_id: PDF_INVOICE_TEMPLATE_ID,
          payload: {
            // La vue renvoie une ligne non typée : invoice_number (séquentiel),
            // client_snapshot (figé), totaux, line_items, dates, etc.
            invoice: inv,
            agency: AGENCY,
          },
          status: 'pending',
        },
      }),
    });

    if (!createResponse.ok) {
      console.error('generate-invoice-pdf: création document échouée', await createResponse.text().catch(() => ''));
      return null;
    }

    const documentData = await createResponse.json();
    const documentId = documentData?.document?.id;
    if (!documentId) return null;

    // Polling jusqu'à génération (max ~20s).
    let documentStatus = 'pending';
    const maxAttempts = 10;
    let attempts = 0;

    while (documentStatus === 'pending' && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusResponse = await fetch(`${PDF_API_URL}/${documentId}`, {
        headers: { 'Authorization': `Bearer ${PDF_API_KEY}` },
      });
      if (!statusResponse.ok) {
        console.error('generate-invoice-pdf: statut document échoué', statusResponse.statusText);
        return null;
      }

      const statusData = await statusResponse.json();
      documentStatus = statusData?.document?.status;
      attempts++;
    }

    if (documentStatus !== 'success') {
      console.error('generate-invoice-pdf: génération non aboutie, statut =', documentStatus);
      return null;
    }

    const downloadResponse = await fetch(`${PDF_API_URL}/${documentId}/download`, {
      headers: { 'Authorization': `Bearer ${PDF_API_KEY}` },
    });
    if (!downloadResponse.ok) {
      console.error('generate-invoice-pdf: téléchargement échoué', downloadResponse.statusText);
      return null;
    }

    return new Uint8Array(await downloadResponse.arrayBuffer());
  } catch (error) {
    console.error('generate-invoice-pdf: erreur génération PDF', error);
    return null;
  }
}
