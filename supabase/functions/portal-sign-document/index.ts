// portal-sign-document — Signature électronique maison (SES, Niveau 1)
// Le client signe DANS le portail. Cette fonction :
//   1. vérifie que l'appelant est bien le client du projet,
//   2. calcule l'empreinte SHA-256 du PDF source,
//   3. génère le PDF signé (signature apposée + page de preuve) via pdf-lib,
//   4. enregistre le journal de preuve (IP, user-agent, horodatage, empreinte…),
//   5. envoie l'email de confirmation (best-effort).
//
// Body : { signature_id: string, signature_image: dataURL PNG, signed_name: string, consent: true }
// Retour : { ok: true, signed_pdf_url } ou { ok: false, error }
//
// JWT verify : ACTIVÉ (session client portail).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1'
import { sendTransactional } from '../_shared/brevo.ts'

const BUCKET = 'propulspace-documents'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// IP de l'appelant — best-effort. On prend la DERNIÈRE entrée de x-forwarded-for
// (ajoutée par l'infra de confiance ; un client ne peut que PRÉFIXER des valeurs),
// et on la valide : la colonne signer_ip est de type INET → une valeur malformée
// ferait échouer tout l'enregistrement de la signature.
function isIp(s: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(s) || (s.includes(':') && /^[0-9a-fA-F:.]+$/.test(s))
}
function clientIp(req: Request): string | null {
  const chain = (req.headers.get('x-forwarded-for') ?? '').split(',').map(s => s.trim()).filter(Boolean)
  for (let i = chain.length - 1; i >= 0; i--) if (isIp(chain[i])) return chain[i]
  const direct = (req.headers.get('cf-connecting-ip') ?? req.headers.get('x-real-ip') ?? '').trim()
  return isIp(direct) ? direct : null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Méthode non autorisée' }, 405)

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !serviceKey || !anonKey) return json({ ok: false, error: 'Config serveur manquante' }, 500)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ ok: false, error: 'Authentification requise' }, 401)

  let body: { signature_id?: string; signature_image?: string; signed_name?: string; consent?: boolean }
  try { body = await req.json() } catch { return json({ ok: false, error: 'Body JSON invalide' }, 400) }

  const { signature_id, signature_image, signed_name } = body
  if (!signature_id || !signature_image || !signed_name?.trim() || body.consent !== true) {
    return json({ ok: false, error: 'Paramètres manquants ou consentement absent' }, 400)
  }

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1. Identité de l'appelant
  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user?.email) return json({ ok: false, error: 'Non authentifié' }, 401)
  const callerEmail = user.email.toLowerCase()

  // 2. Signature + projet + contrôle d'accès
  const { data: sig } = await admin.schema('propulspace').from('signatures')
    .select('id, project_id, document_id, name, signature_type, status').eq('id', signature_id).single()
  if (!sig) return json({ ok: false, error: 'Signature introuvable' }, 404)
  if (sig.status !== 'pending') return json({ ok: false, error: 'Document déjà traité' }, 409)
  if (!sig.document_id) return json({ ok: false, error: 'Aucun document source à signer' }, 422)

  const { data: project } = await admin.from('projects_v2')
    .select('portal_client_email, name').eq('id', sig.project_id).single()
  if (!project || (project.portal_client_email ?? '').toLowerCase() !== callerEmail) {
    return json({ ok: false, error: 'Accès refusé' }, 403)
  }

  // 3. PDF source + empreinte
  const { data: doc } = await admin.schema('propulspace').from('documents')
    .select('file_url, name').eq('id', sig.document_id).single()
  if (!doc?.file_url) return json({ ok: false, error: 'Document source indisponible' }, 422)

  const dl = await admin.storage.from(BUCKET).download(doc.file_url)
  if (dl.error || !dl.data) return json({ ok: false, error: 'Téléchargement du document échoué' }, 502)
  const srcBytes = new Uint8Array(await dl.data.arrayBuffer())
  const documentSha256 = await sha256Hex(srcBytes)

  // 4. Génère le PDF signé : signature apposée + page de preuve
  const signerIp = clientIp(req)
  const userAgent = req.headers.get('user-agent') ?? null
  const signedAtIso = new Date().toISOString()
  const signedAtFr = new Date(signedAtIso).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })

  let pdfBytes: Uint8Array
  try {
    const pdf = await PDFDocument.load(srcBytes)
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
    const png = await pdf.embedPng(dataUrlToBytes(signature_image))

    // Signature en bas de la dernière page
    const pages = pdf.getPages()
    const last = pages[pages.length - 1]
    const sigW = 170
    const sigH = Math.min(70, sigW * (png.height / png.width))
    last.drawText('Signé électroniquement', { x: 40, y: 40 + sigH + 6, size: 8, font, color: rgb(0.4, 0.4, 0.45) })
    last.drawImage(png, { x: 40, y: 40, width: sigW, height: sigH })

    // Page de preuve
    const proof = pdf.addPage()
    const { height } = proof.getSize()
    let y = height - 60
    const line = (label: string, value: string) => {
      proof.drawText(label, { x: 50, y, size: 11, font: bold, color: rgb(0.1, 0.1, 0.12) })
      proof.drawText(value, { x: 200, y, size: 11, font, color: rgb(0.2, 0.2, 0.25) })
      y -= 24
    }
    proof.drawText('Preuve de signature électronique', { x: 50, y: y + 30, size: 16, font: bold, color: rgb(0.1, 0.1, 0.12) })
    line('Document', sig.name)
    line('Signé par', signed_name.trim())
    line('Email', callerEmail)
    line('Date et heure', signedAtFr)
    if (signerIp) line('Adresse IP', signerIp)
    line('Empreinte SHA-256', '')
    proof.drawText(documentSha256, { x: 50, y: y + 6, size: 8, font, color: rgb(0.3, 0.3, 0.35) })
    proof.drawText("Signature électronique simple effectuée via l'espace client Propul'SEO (eIDAS art. 25).",
      { x: 50, y: 50, size: 9, font, color: rgb(0.4, 0.4, 0.45) })

    pdfBytes = await pdf.save()
  } catch (err) {
    return json({ ok: false, error: `Génération du PDF signé échouée: ${err instanceof Error ? err.message : String(err)}` }, 500)
  }

  // 5. Upload PDF signé + image de signature
  const signedPath = `${sig.project_id}/signatures/${sig.id}-signe.pdf`
  const imgPath = `${sig.project_id}/signatures/${sig.id}-signature.png`
  const upPdf = await admin.storage.from(BUCKET).upload(signedPath, pdfBytes, { contentType: 'application/pdf', upsert: true })
  if (upPdf.error) return json({ ok: false, error: `Upload échoué: ${upPdf.error.message}` }, 502)
  await admin.storage.from(BUCKET).upload(imgPath, dataUrlToBytes(signature_image), { contentType: 'image/png', upsert: true })

  // 6. Journal de preuve + statut signé
  const { error: updErr } = await admin.schema('propulspace').from('signatures').update({
    status: 'signed',
    signed_name: signed_name.trim(),
    signer_email: callerEmail,
    signature_image: imgPath,
    signed_pdf_url: signedPath,
    document_sha256: documentSha256,
    consent_at: signedAtIso,
    signed_at: signedAtIso,
    signer_ip: signerIp,
    signer_user_agent: userAgent,
    updated_at: signedAtIso,
  }).eq('id', sig.id)
  if (updErr) return json({ ok: false, error: `Enregistrement échoué: ${updErr.message}` }, 500)

  // 7. Email de confirmation (best-effort, ne bloque pas)
  const portalBase = Deno.env.get('PORTAL_BASE_URL') ?? ''
  const params = {
    doc_title: sig.name,
    signed_at: signedAtFr,
    first_name: signed_name.trim().split(' ')[0],
    portal_url: `${portalBase}/espace-client`,
  }
  for (const to of [{ email: callerEmail }, { email: 'team@propulseo-site.com' }]) {
    try {
      await sendTransactional({ templateKey: 'signature-completed', to, params, dedupeKey: `${sig.id}-completed-${to.email}` })
    } catch (_) { /* best-effort */ }
  }

  return json({ ok: true, signed_pdf_url: signedPath })
})
