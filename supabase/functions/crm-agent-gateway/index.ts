// supabase/functions/crm-agent-gateway/index.ts
// =============================================================================
// Passerelle CRM des agents (Paperclip).
//
// L'agent n'a AUCUNE clé Supabase. Il présente une clé d'appel opaque dans
// l'en-tête `x-agent-key` (une par company : AGE/PRO/BON), vérifiée ici en
// constant-time contre le SHA-256 stocké dans public.agent_api_keys.
//
// La fonction tourne en service_role (côté serveur). Elle n'expose QUE des
// opérations NOMMÉES à périmètre figé : aucune ne prend une table ni une requête
// en paramètre. Ajouter une capacité = ajouter une action, jamais élargir une
// action existante.
//
// Déployée avec verify_jwt=false : la SEULE authentification est la clé d'appel.
//
// Note company : le code company (AGE/PRO/BON) sert à l'ATTRIBUTION et à la
// RÉVOCATION indépendante des clés, PAS au cloisonnement des données — le pool de
// leads est partagé (pas de colonne de tenant sur contacts/crmerp_leads). Si un
// jour l'isolation par company devient un besoin, il faudra une colonne tenant +
// un filtre .eq('company_code', ctx.company) sur TOUTES les opérations + RLS.
//
// Règles dures :
//   - `list_prospectables` lit les VUES *_prospectables (WHERE opt_out=false figé
//     dans la vue) : STRUCTURELLEMENT incapable de renvoyer un désinscrit.
//   - `create_lead` hérite l'opt-out d'une identité déjà désinscrite (email/tél) :
//     un agent ne peut pas ressusciter un opt-out en recréant la fiche.
//   - Aucun envoi d'e-mail : Paperclip prépare, un humain envoie.
//   - Chaque appel AUTHENTIFIÉ est journalisé (company, action, nb de lignes) sans
//     PII. Les échecs d'AUTH ne sont PAS journalisés en base (sinon un non-authen-
//     tifié piloterait des écritures illimitées) : ils vont dans les logs Edge.
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-agent-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PIPELINES = ['site', 'erp'] as const
const CONTACT_STATUS = ['prospect', 'meeting_booke', 'presentation_envoyee', 'offre_envoyee', 'en_attente', 'signe', 'perdu']
const ERP_STATUS = ['leads_contactes', 'rendez_vous_effectues', 'en_attente', 'signes']
const ACTIVITY_TYPE = ['call', 'email', 'meeting', 'note', 'task']
const ACTIVITY_STATUS = ['scheduled', 'completed', 'cancelled']
const MAX_LIMIT = 500

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

async function sha256hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Comparaison constant-time de deux chaînes hex de même longueur (64 pour SHA-256).
function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

const service = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

type Ctx = { keyId: string; company: string }

// Journalise un appel AUTHENTIFIÉ (jamais de PII). Ne fait jamais échouer le métier.
async function logCall(
  ctx: Ctx,
  action: string,
  ok: boolean,
  rowCount: number | null,
  targetId: string | null,
  error: string | null,
) {
  try {
    await service.from('agent_call_log').insert({
      api_key_id: ctx.keyId,
      company_code: ctx.company,
      action,
      ok,
      row_count: rowCount,
      target_id: targetId,
      error,
    })
  } catch (e) {
    console.error('[crm-agent-gateway] echec journalisation:', String(e))
  }
}

// Rejet AUTHENTIFIÉ : journalise (post-auth, borné aux détenteurs de clé) puis répond.
async function reject(ctx: Ctx, action: string, status: number, reason: string, targetId: string | null = null) {
  await logCall(ctx, action, false, null, targetId, reason)
  return json(status, { error: reason })
}

// L'identité (email OU téléphone) est-elle déjà désinscrite dans l'un des pipelines ?
async function identityOptedOut(email?: string, phone?: string): Promise<boolean> {
  const probes: Promise<{ data: unknown[] | null }>[] = []
  if (email) {
    const e = email.replace(/[%_\\]/g, '\\$&') // neutralise les jokers ilike
    probes.push(service.from('contacts').select('id').eq('opt_out', true).ilike('email', e).limit(1))
    probes.push(service.from('crmerp_leads').select('id').eq('opt_out', true).ilike('email', e).limit(1))
  }
  if (phone) {
    probes.push(service.from('contacts').select('id').eq('opt_out', true).eq('phone', phone).limit(1))
    probes.push(service.from('crmerp_leads').select('id').eq('opt_out', true).eq('phone', phone).limit(1))
  }
  if (probes.length === 0) return false
  const results = await Promise.all(probes)
  return results.some((r) => (r.data?.length ?? 0) > 0)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method Not Allowed' })

  // --- 1. Authentification par clé d'appel (constant-time) -------------------
  // Les échecs ne sont PAS journalisés en base (anti-DoS) : logs Edge uniquement.
  const presented = req.headers.get('x-agent-key') ?? ''
  if (!presented) {
    console.error('[crm-agent-gateway] auth: cle absente')
    return json(401, { error: 'Clé d\'appel manquante (en-tête x-agent-key).' })
  }

  const presentedHash = await sha256hex(presented)
  const { data: keys, error: keysErr } = await service
    .from('agent_api_keys')
    .select('id, company_code, key_hash')
    .is('revoked_at', null)

  if (keysErr) {
    console.error('[crm-agent-gateway] lecture cles:', keysErr.message)
    return json(500, { error: 'Erreur interne (auth).' })
  }

  // On compare contre TOUTES les clés actives sans court-circuit (pas d'early-exit).
  let ctx: Ctx | null = null
  for (const k of keys ?? []) {
    if (constantTimeEqualHex(presentedHash, k.key_hash)) {
      ctx = { keyId: k.id, company: k.company_code }
    }
  }
  if (!ctx) {
    console.error('[crm-agent-gateway] auth: cle inconnue ou revoquee')
    return json(401, { error: 'Clé d\'appel invalide.' })
  }

  // --- 2. Corps + dispatch d'une action NOMMÉE -------------------------------
  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return reject(ctx, 'bad_request', 400, 'Corps JSON invalide.')
  }

  const action = String(payload.action ?? '')

  try {
    switch (action) {
      // --- Lister les prospectables (opt_out=false garanti par la vue) -------
      case 'list_prospectables': {
        const pipeline = String(payload.pipeline ?? '')
        if (!PIPELINES.includes(pipeline as typeof PIPELINES[number]))
          return reject(ctx, action, 400, `pipeline requis parmi ${PIPELINES.join('|')}.`)

        let limit = Number.isFinite(payload.limit) ? Number(payload.limit) : 100
        limit = Math.max(1, Math.min(MAX_LIMIT, limit))
        let offset = Number.isFinite(payload.offset) ? Number(payload.offset) : 0
        offset = Math.max(0, offset)

        const view = pipeline === 'site' ? 'contacts_prospectables' : 'crmerp_leads_prospectables'
        const cols = pipeline === 'site'
          ? 'id, name, email, phone, company, sector, website, source, status'
          : 'id, company_name, contact_name, email, phone, source, status'

        const { data, count, error } = await service
          .from(view)
          .select(cols, { count: 'exact' })
          .order('id', { ascending: true })
          .range(offset, offset + limit - 1)
        if (error) throw error

        await logCall(ctx, action, true, data?.length ?? 0, null, null)
        return json(200, { data, count, limit, offset })
      }

      // --- Créer un lead (hérite l'opt-out d'une identité déjà désinscrite) ---
      case 'create_lead': {
        const pipeline = String(payload.pipeline ?? '')
        if (!PIPELINES.includes(pipeline as typeof PIPELINES[number]))
          return reject(ctx, action, 400, `pipeline requis parmi ${PIPELINES.join('|')}.`)

        const emailIn = payload.email != null ? String(payload.email).trim() : ''
        const phoneIn = payload.phone != null ? String(payload.phone).trim() : ''
        // Anti-résurrection : si l'identité est déjà opt-out, la nouvelle fiche naît opt-out.
        const suppressed = await identityOptedOut(emailIn || undefined, phoneIn || undefined)
        const optOutFields = suppressed
          ? { opt_out: true, opt_out_at: new Date().toISOString(), opt_out_source: 'herite:opt-out anterieur' }
          : {}

        if (pipeline === 'site') {
          const name = payload.name != null ? String(payload.name).trim() : ''
          if (!name || !emailIn) return reject(ctx, action, 400, 'name et email sont requis (pipeline site).')
          if (payload.status != null && !CONTACT_STATUS.includes(String(payload.status)))
            return reject(ctx, action, 400, `status invalide. Autorisés : ${CONTACT_STATUS.join(', ')}.`)

          const row: Record<string, unknown> = { name, email: emailIn, ...optOutFields }
          if (phoneIn) row.phone = phoneIn
          if (payload.company != null) row.company = String(payload.company)
          if (payload.sector != null) row.sector = String(payload.sector)
          if (payload.website != null) row.website = String(payload.website)
          if (payload.source != null) row.source = String(payload.source)
          if (payload.status != null) row.status = String(payload.status)

          const { data, error } = await service.from('contacts').insert(row).select('id').single()
          if (error) throw error
          await logCall(ctx, action, true, 1, data.id, suppressed ? 'cree opt-out (herite)' : null)
          return json(201, { id: data.id, opt_out: suppressed })
        } else {
          const row: Record<string, unknown> = { ...optOutFields }
          if (payload.company_name != null) row.company_name = String(payload.company_name)
          if (payload.contact_name != null) row.contact_name = String(payload.contact_name)
          if (emailIn) row.email = emailIn
          if (phoneIn) row.phone = phoneIn
          if (payload.source != null) row.source = String(payload.source)
          if (payload.status != null) {
            if (!ERP_STATUS.includes(String(payload.status)))
              return reject(ctx, action, 400, `status invalide. Autorisés : ${ERP_STATUS.join(', ')}.`)
            row.status = String(payload.status)
          }
          if (!row.company_name && !row.contact_name && !row.email)
            return reject(ctx, action, 400, 'Au moins un de company_name, contact_name ou email est requis (pipeline erp).')

          const { data, error } = await service.from('crmerp_leads').insert(row).select('id').single()
          if (error) throw error
          await logCall(ctx, action, true, 1, data.id, suppressed ? 'cree opt-out (herite)' : null)
          return json(201, { id: data.id, opt_out: suppressed })
        }
      }

      // --- Mettre à jour le statut d'un lead ---------------------------------
      case 'update_lead_status': {
        const pipeline = String(payload.pipeline ?? '')
        if (!PIPELINES.includes(pipeline as typeof PIPELINES[number]))
          return reject(ctx, action, 400, `pipeline requis parmi ${PIPELINES.join('|')}.`)
        const id = String(payload.id ?? '')
        const status = String(payload.status ?? '')
        if (!id) return reject(ctx, action, 400, 'id requis.')

        const allowed = pipeline === 'site' ? CONTACT_STATUS : ERP_STATUS
        if (!allowed.includes(status)) return reject(ctx, action, 400, `status invalide. Autorisés : ${allowed.join(', ')}.`, id)

        const table = pipeline === 'site' ? 'contacts' : 'crmerp_leads'
        const { data, error } = await service.from(table).update({ status }).eq('id', id).select('id')
        if (error) throw error
        if (!data || data.length === 0) return reject(ctx, action, 404, 'Lead introuvable.', id)
        await logCall(ctx, action, true, data.length, id, null)
        return json(200, { id, status })
      }

      // --- Journaliser une activité de contact -------------------------------
      case 'log_contact_activity': {
        const contact_id = String(payload.contact_id ?? '')
        const type = String(payload.type ?? '')
        const title = payload.title != null ? String(payload.title).trim() : ''
        if (!contact_id) return reject(ctx, action, 400, 'contact_id requis.')
        if (!ACTIVITY_TYPE.includes(type)) return reject(ctx, action, 400, `type invalide. Autorisés : ${ACTIVITY_TYPE.join(', ')}.`, contact_id)
        if (!title) return reject(ctx, action, 400, 'title requis.', contact_id)
        if (payload.status != null && !ACTIVITY_STATUS.includes(String(payload.status)))
          return reject(ctx, action, 400, `status invalide. Autorisés : ${ACTIVITY_STATUS.join(', ')}.`, contact_id)

        const row: Record<string, unknown> = {
          contact_id,
          type,
          title,
          activity_date: payload.activity_date != null ? String(payload.activity_date) : new Date().toISOString(),
        }
        if (payload.description != null) row.description = String(payload.description)
        if (payload.status != null) row.status = String(payload.status)
        if (payload.outcome != null) row.outcome = String(payload.outcome)
        if (payload.next_action != null) row.next_action = String(payload.next_action)
        if (Number.isFinite(payload.duration_minutes)) row.duration_minutes = Number(payload.duration_minutes)

        const { data, error } = await service.from('contact_activities').insert(row).select('id').single()
        if (error) throw error
        await logCall(ctx, action, true, 1, contact_id, null)
        return json(201, { id: data.id })
      }

      // --- Poser un opt-out (le chemin d'alimentation manquant) --------------
      // Écriture que le rôle `prospection` ne peut PAS faire : elle passe par la
      // passerelle service_role. opt_out_at et opt_out_source sont obligatoires
      // (preuve CNIL ; le CHECK de la table l'impose de toute façon).
      case 'set_opt_out': {
        const pipeline = String(payload.pipeline ?? '')
        if (!PIPELINES.includes(pipeline as typeof PIPELINES[number]))
          return reject(ctx, action, 400, `pipeline requis parmi ${PIPELINES.join('|')}.`)
        const id = String(payload.id ?? '')
        const source = payload.source != null ? String(payload.source).trim() : ''
        if (!id) return reject(ctx, action, 400, 'id requis.')
        if (!source) return reject(ctx, action, 400, 'source requis (canal du retrait : lien, STOP, manuel...).', id)

        const table = pipeline === 'site' ? 'contacts' : 'crmerp_leads'
        const { data, error } = await service
          .from(table)
          .update({ opt_out: true, opt_out_at: new Date().toISOString(), opt_out_source: source })
          .eq('id', id)
          .select('id')
        if (error) throw error
        if (!data || data.length === 0) return reject(ctx, action, 404, 'Lead introuvable.', id)
        await logCall(ctx, action, true, data.length, id, null)
        return json(200, { id, opt_out: true })
      }

      default:
        return reject(ctx, 'unknown_action', 400, `Action inconnue : ${action || '(vide)'}.`)
    }
  } catch (err) {
    // On ne renvoie JAMAIS le message d'erreur brut (fuite de structure interne) :
    // détail en logs serveur, corrélation renvoyée au client.
    const msg = err instanceof Error ? err.message : String(err)
    const correlationId = crypto.randomUUID()
    console.error(`[crm-agent-gateway] correlation=${correlationId} action=${action}:`, msg)
    await logCall(ctx, action || 'error', false, null, null, msg)
    return json(500, { error: 'Erreur interne.', correlation_id: correlationId })
  }
})
