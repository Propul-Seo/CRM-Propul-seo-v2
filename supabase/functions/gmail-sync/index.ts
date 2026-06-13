import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_ID     = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const v2 = supabase.schema('v2')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Token refresh ─────────────────────────────────────────────────────────────

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expiry: Date }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     GOOGLE_ID,
      client_secret: GOOGLE_SECRET,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Token refresh failed: ' + JSON.stringify(data))
  return {
    access_token: data.access_token,
    expiry: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
  }
}

// ─── Gmail API helpers ─────────────────────────────────────────────────────────

async function gmailGet(path: string, token: string) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Gmail API error ${res.status}: ${await res.text()}`)
  return res.json()
}

// ─── MIME tree traversal ───────────────────────────────────────────────────────

interface MimePart {
  mimeType: string
  body?: { data?: string; attachmentId?: string; size?: number }
  parts?: MimePart[]
  filename?: string
  headers?: { name: string; value: string }[]
}

function findParts(part: MimePart, targetMime: string): MimePart[] {
  const results: MimePart[] = []
  if (part.mimeType === targetMime) results.push(part)
  if (part.parts) {
    for (const child of part.parts) results.push(...findParts(child, targetMime))
  }
  return results
}

function findTextPart(part: MimePart): string {
  // Prefer text/plain, fall back to text/html
  const plain = findParts(part, 'text/plain')
  if (plain.length > 0 && plain[0].body?.data) return decodeBase64(plain[0].body.data)
  const html = findParts(part, 'text/html')
  if (html.length > 0 && html[0].body?.data) return stripHtml(decodeBase64(html[0].body.data))
  if (part.body?.data) return decodeBase64(part.body.data)
  return ''
}

function decodeBase64(data: string): string {
  try {
    return atob(data.replace(/-/g, '+').replace(/_/g, '/'))
  } catch {
    return ''
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function collectAttachments(part: MimePart): Array<{ filename: string; mimeType: string; attachmentId: string; size: number }> {
  const results: Array<{ filename: string; mimeType: string; attachmentId: string; size: number }> = []
  if (part.filename && part.body?.attachmentId) {
    results.push({
      filename:     part.filename,
      mimeType:     part.mimeType,
      attachmentId: part.body.attachmentId,
      size:         part.body.size ?? 0,
    })
  }
  if (part.parts) {
    for (const child of part.parts) results.push(...collectAttachments(child))
  }
  return results
}

// ─── ICS parser ───────────────────────────────────────────────────────────────

interface MeetingMeta {
  title: string
  start?: string
  end?: string
  location?: string
  attendees: string[]
  description?: string
}

function parseIcs(icsText: string): MeetingMeta | null {
  const lines = icsText.replace(/\r\n /g, '').replace(/\r\n\t/g, '').split(/\r\n|\n/)
  let inEvent = false
  const meta: MeetingMeta = { title: '', attendees: [] }

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { inEvent = true; continue }
    if (line === 'END:VEVENT')   { inEvent = false; continue }
    if (!inEvent) continue

    const sep = line.indexOf(':')
    if (sep === -1) continue
    const key = line.substring(0, sep).split(';')[0].toUpperCase()
    const val = line.substring(sep + 1).trim()

    switch (key) {
      case 'SUMMARY':     meta.title = val; break
      case 'DTSTART':     meta.start = parseIcsDate(val); break
      case 'DTEND':       meta.end   = parseIcsDate(val); break
      case 'LOCATION':    meta.location = val; break
      case 'DESCRIPTION': meta.description = val.replace(/\\n/g, '\n').replace(/\\,/g, ','); break
      case 'ATTENDEE': {
        const emailMatch = line.match(/mailto:([^\s;]+)/i)
        if (emailMatch) meta.attendees.push(emailMatch[1])
        break
      }
    }
  }

  return meta.title ? meta : null
}

function parseIcsDate(val: string): string {
  // Format: 20260407T070000Z or 20260407T090000 (local)
  const m = val.replace(/[^0-9TZ]/g, '').match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)/)
  if (!m) return val
  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7] === 'Z' ? 'Z' : ''}`
  return iso
}

// ─── Subject-based meeting detection (fallback when no ICS) ───────────────────

const MEETING_SUBJECT_RE = /^(Invitation|Accepté|Refusé|Annulé|Mis à jour)\s*(\(.*?\))?\s*:/i

interface SubjectMeta {
  title: string
  start?: string
  end?: string
}

function parseMeetingSubject(subject: string): SubjectMeta | null {
  if (!MEETING_SUBJECT_RE.test(subject)) return null

  // Remove prefix: "Invitation (expéditeur inconnu): " or "Accepté: "
  const withoutPrefix = subject.replace(/^[^:]+:\s*/, '')

  // Pattern: "Title - day. DD MMM. YYYY HH:MM - HH:MM (UTC+X) (email@...)"
  const dateRe = /^(.+?)\s*-\s*(?:\w+\.?\s+)?(\d{1,2})\s+(\w+)\.?\s+(\d{4})\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/
  const m = withoutPrefix.match(dateRe)
  if (!m) {
    // Can't parse date, return just the title
    const title = withoutPrefix.replace(/\s*\([\w@.]+\)\s*$/, '').trim()
    return { title }
  }

  const title   = m[1].trim()
  const day     = m[2].padStart(2, '0')
  const monthFr = m[3].toLowerCase()
  const year    = m[4]
  const startT  = m[5]
  const endT    = m[6]

  const MONTHS: Record<string, string> = {
    jan: '01', fév: '02', mar: '03', avr: '04', mai: '05', juin: '06',
    juil: '07', août: '08', sep: '09', oct: '10', nov: '11', déc: '12',
    janv: '01', févr: '02', mars: '03', avril: '04', juillet: '07',
    aout: '08', sept: '09', oct2: '10', nov2: '11', dec: '12',
  }
  const month = MONTHS[monthFr] ?? '01'

  return {
    title,
    start: `${year}-${month}-${day}T${startT}:00`,
    end:   `${year}-${month}-${day}T${endT}:00`,
  }
}

// ─── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // 1. Load Gmail connection
    const { data: conn, error: connErr } = await supabase
      .from('gmail_connections')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (connErr || !conn) {
      return new Response(JSON.stringify({ error: 'No Gmail connection' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
    }

    // 2. Refresh token if expired
    let accessToken = conn.access_token
    if (!conn.token_expiry || new Date(conn.token_expiry) <= new Date(Date.now() + 60_000)) {
      const refreshed = await refreshAccessToken(conn.refresh_token)
      accessToken = refreshed.access_token
      await supabase.from('gmail_connections').update({
        access_token: refreshed.access_token,
        token_expiry: refreshed.expiry.toISOString(),
        updated_at:   new Date().toISOString(),
      }).eq('id', conn.id)
    }

    // 3. Load all project email rules
    const { data: rules } = await supabase
      .from('project_email_rules')
      .select('project_id, client_email')

    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ message: 'No email rules configured' }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
    }

    // Build map: email → [project_ids]
    const emailToProjects: Record<string, string[]> = {}
    for (const rule of rules) {
      const email = rule.client_email.toLowerCase()
      if (!emailToProjects[email]) emailToProjects[email] = []
      emailToProjects[email].push(rule.project_id)
    }

    // 4. Fetch Gmail messages since last sync
    const since = conn.last_sync_at
      ? Math.floor(new Date(conn.last_sync_at).getTime() / 1000)
      : Math.floor(Date.now() / 1000) - 30 * 24 * 3600 // 30 days back

    const allEmails = Object.keys(emailToProjects)
    const query = allEmails.map(e => `from:${e}`).join(' OR ')
    const listData = await gmailGet(
      `/users/me/messages?q=${encodeURIComponent(query + ` after:${since}`)}&maxResults=50`,
      accessToken
    )

    const messages: Array<{ id: string }> = listData.messages ?? []

    let synced = 0
    let skipped = 0

    for (const msg of messages) {
      const full = await gmailGet(`/users/me/messages/${msg.id}?format=full`, accessToken)

      // Extract headers
      const headers: Record<string, string> = {}
      for (const h of (full.payload?.headers ?? [])) {
        headers[h.name.toLowerCase()] = h.value
      }
      const subject = headers['subject'] ?? '(Sans objet)'
      const from    = headers['from']    ?? ''
      const date    = headers['date']    ?? ''

      // Match sender to projects
      const senderEmail = (from.match(/<(.+?)>/) ?? from.match(/([^\s]+@[^\s]+)/))?.[1]?.toLowerCase()
        ?? from.toLowerCase()

      const matchedProjects = emailToProjects[senderEmail] ?? []
      if (matchedProjects.length === 0) { skipped++; continue }

      // Check for already-synced message
      const { count } = await v2
        .from('project_activities')
        .select('id', { count: 'exact', head: true })
        .eq('metadata->gmail_message_id', msg.id)

      if ((count ?? 0) > 0) { skipped++; continue }

      // ── Try ICS detection ──────────────────────────────────────────────────

      let meetingMeta: MeetingMeta | null = null

      // a) Look for text/calendar MIME part (inline ICS)
      const calParts = findParts(full.payload, 'text/calendar')
      if (calParts.length > 0 && calParts[0].body?.data) {
        const icsText = decodeBase64(calParts[0].body.data)
        meetingMeta = parseIcs(icsText)
      }

      // b) Look for .ics file attachment
      if (!meetingMeta) {
        const attachments = collectAttachments(full.payload)
        const icsAtt = attachments.find(a =>
          a.mimeType === 'application/ics' ||
          a.mimeType === 'text/calendar' ||
          a.filename?.endsWith('.ics')
        )
        if (icsAtt?.attachmentId) {
          try {
            const attData = await gmailGet(
              `/users/me/messages/${msg.id}/attachments/${icsAtt.attachmentId}`,
              accessToken
            )
            if (attData.data) {
              meetingMeta = parseIcs(decodeBase64(attData.data))
            }
          } catch { /* ignore */ }
        }
      }

      // c) Fallback: detect by subject pattern
      if (!meetingMeta) {
        const parsed = parseMeetingSubject(subject)
        if (parsed) {
          meetingMeta = { title: parsed.title, start: parsed.start, end: parsed.end, attendees: [] }
        }
      }

      // ── Build activity ────────────────────────────────────────────────────

      const body        = findTextPart(full.payload)
      const attachments = collectAttachments(full.payload)

      if (meetingMeta) {
        // Meeting activity
        const metadata: Record<string, unknown> = {
          gmail_message_id: msg.id,
          from, date, subject,
          start:       meetingMeta.start,
          end:         meetingMeta.end,
          attendees:   meetingMeta.attendees.length > 0 ? meetingMeta.attendees : [senderEmail],
          description: meetingMeta.description ?? body.substring(0, 500),
        }
        if (meetingMeta.location) metadata.location = meetingMeta.location

        for (const projectId of matchedProjects) {
          await v2.from('project_activities').insert({
            project_id:  projectId,
            type:        'meeting',
            title:       meetingMeta.title || subject,
            is_auto:     true,
            metadata,
          })
        }
      } else {
        // Regular email activity
        const isUnread = Array.isArray(full.labelIds) && full.labelIds.includes('UNREAD')
        const metadata: Record<string, unknown> = {
          gmail_message_id: msg.id,
          from, date, subject,
          body:        body.substring(0, 2000),
          attachments: attachments.filter(a => !a.filename?.endsWith('.ics')),
          is_unread:   isUnread,
          is_replied:  false,
        }

        for (const projectId of matchedProjects) {
          await v2.from('project_activities').insert({
            project_id:  projectId,
            type:        'email',
            title:       `Email reçu : ${subject}`,
            is_auto:     true,
            metadata,
          })
        }
      }

      synced++
    }

    // 5. Update last_sync_at
    await supabase.from('gmail_connections').update({
      last_sync_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    }).eq('id', conn.id)

    return new Response(
      JSON.stringify({ success: true, synced, skipped, total: messages.length }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('gmail-sync error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
