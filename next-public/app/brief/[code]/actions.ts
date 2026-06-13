'use server'

import { createSupabaseServer } from '@/lib/supabase-server'

interface BriefFields {
  objective: string
  target_audience: string
  pages: string
  techno: string
  design_references: string
  notes: string
}

export async function submitBrief(
  projectId: string,
  briefId: string | null,
  projectName: string,
  fields: BriefFields
): Promise<{ ok: boolean }> {
  const supabase = createSupabaseServer()
  const payload = { ...fields, submitted_at: new Date().toISOString() }

  let dbError: unknown
  if (briefId) {
    const result = await supabase.from('project_briefs_v2').update(payload).eq('id', briefId)
    dbError = result.error
  } else {
    const result = await supabase.from('project_briefs_v2').insert({ ...payload, project_id: projectId })
    dbError = result.error
  }
  if (dbError) return { ok: false }

  // Notification email best-effort (silencieux)
  fetch(`${process.env.SUPABASE_URL}/functions/v1/send-brief-notification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': process.env.SUPABASE_ANON_KEY! },
    body: JSON.stringify({ projectName, fields }),
  }).catch(() => {})

  return { ok: true }
}
