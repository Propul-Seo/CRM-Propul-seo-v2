import { useState, useEffect, useCallback } from 'react'
import { supabase, supabaseAnon, v2 } from '@/lib/supabase'
import { generateShortCode } from '@/lib/shortCode'
import type { ProjectBrief } from '@/types/project-v2'

// Fix 1: BriefFields exported at module scope
export type BriefFields = Pick<
  ProjectBrief,
  'objective' | 'target_audience' | 'pages' | 'techno' | 'design_references' | 'notes'
>

// Fix 5: enableBriefToken and disableBriefToken have no projectId parameter
interface UseBriefV2Return {
  brief: ProjectBrief | null
  loading: boolean
  projectName: string
  briefToken: string | null
  briefShortCode: string | null
  tokenEnabled: boolean
  saveBrief: (data: Partial<ProjectBrief>) => Promise<void>
  enableBriefToken: () => Promise<string | null>
  disableBriefToken: () => Promise<boolean>
}

export function useBriefV2(projectId: string): UseBriefV2Return {
  const [brief, setBrief] = useState<ProjectBrief | null>(null)
  const [loading, setLoading] = useState(true)
  const [projectName, setProjectName] = useState('')
  const [briefToken, setBriefToken] = useState<string | null>(null)
  const [briefShortCode, setBriefShortCode] = useState<string | null>(null)
  const [tokenEnabled, setTokenEnabled] = useState(false)

  useEffect(() => {
    // Fix 4: set loading false before returning on empty projectId
    if (!projectId) {
      setLoading(false)
      return
    }
    setLoading(true)
    v2
      .from('project_briefs')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error) setBrief(data as ProjectBrief | null)
        setLoading(false)
      })
    // Fetch token state from v2.projects
    v2
      .from('projects')
      .select('brief_token, brief_short_code, brief_token_enabled, name')
      .eq('id', projectId)
      .single()
      .then(({ data }) => {
        if (data) {
          setBriefToken(data.brief_token ?? null)
          setBriefShortCode((data as { brief_short_code?: string | null }).brief_short_code ?? null)
          setTokenEnabled(data.brief_token_enabled ?? false)
          setProjectName(data.name ?? '')
        }
      })
  }, [projectId])

  const saveBrief = useCallback(async (data: Partial<ProjectBrief>) => {
    if (brief) {
      const { data: updated, error } = await v2
        .from('project_briefs')
        .update(data)
        .eq('id', brief.id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      if (updated) setBrief(updated as ProjectBrief)
    } else {
      const { data: created, error } = await v2
        .from('project_briefs')
        .insert({ ...data, project_id: projectId })
        .select()
        .single()
      if (error) throw new Error(error.message)
      if (created) setBrief(created as ProjectBrief)
    }
  }, [brief, projectId])

  // Fix 5: no projectId parameter — uses outer projectId from closure
  const enableBriefToken = useCallback(async (): Promise<string | null> => {
    const token = crypto.randomUUID()
    const shortCode = generateShortCode()
    const { error } = await v2
      .from('projects')
      .update({ brief_token: token, brief_token_enabled: true, brief_short_code: shortCode })
      .eq('id', projectId)
    if (error) return null
    setBriefToken(token)
    setBriefShortCode(shortCode)
    setTokenEnabled(true)
    return shortCode
  }, [projectId])

  // Fix 5: no projectId parameter — uses outer projectId from closure
  const disableBriefToken = useCallback(async (): Promise<boolean> => {
    const { error } = await v2
      .from('projects')
      .update({ brief_token: null, brief_token_enabled: false })
      .eq('id', projectId)
    if (error) return false
    setBriefToken(null)
    setBriefShortCode(null)
    setTokenEnabled(false)
    return true
  }, [projectId])

  return { brief, loading, projectName, briefToken, briefShortCode, tokenEnabled, saveBrief, enableBriefToken, disableBriefToken }
}

// Hook séparé pour l'accès public (page ClientBriefPage — sans auth)

// Fix 2: BriefFormData now includes projectId
interface BriefFormData {
  projectId: string
  projectName: string
  brief: ProjectBrief | null
}

export function useBriefByToken(token: string) {
  const [data, setData] = useState<BriefFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setError(null)
    setData(null)
    setLoading(true)

    // Lecture publique via RPC SECURITY DEFINER : validation token cote serveur.
    supabaseAnon.rpc('get_brief_by_short_code', { p_short_code: token })
      .then(({ data: rawPayload, error: rpcError }) => {
        if (cancelled) return
        const payload = Array.isArray(rawPayload) ? rawPayload[0] : rawPayload
        if (rpcError || !payload || typeof payload !== 'object') {
          setError('Lien invalide ou désactivé.')
          setLoading(false)
          return
        }
        const p = payload as { error?: string; projectId?: string; projectName?: string; brief?: ProjectBrief | null }
        if (p.error || !p.projectId || !p.projectName) {
          setError('Lien invalide ou désactivé.')
          setLoading(false)
          return
        }
        setData({ projectId: p.projectId, projectName: p.projectName, brief: p.brief ?? null })
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [token])

  // Ecriture publique via RPC SECURITY DEFINER : validation token + whitelisting champs cote serveur.
  const submitBrief = useCallback(async (fields: BriefFields): Promise<boolean> => {
    if (!data) return false

    const { data: result, error: rpcError } = await supabaseAnon.rpc('upsert_brief_by_short_code', {
      p_short_code: token,
      p_fields: {
        objective: fields.objective ?? '',
        target_audience: fields.target_audience ?? '',
        pages: fields.pages ?? '',
        techno: fields.techno ?? '',
        design_references: fields.design_references ?? '',
        notes: fields.notes ?? '',
      },
    })

    const normalizedResult = Array.isArray(result) ? result[0] : result
    if (rpcError || !normalizedResult || typeof normalizedResult !== 'object') return false
    const r = normalizedResult as { ok?: boolean; error?: string }
    if (!r.ok) return false

    // Fire-and-forget — appel Edge Function pour notif email (non bloquant)
    fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-brief-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          projectName: data.projectName,
          fields: {
            objective: fields.objective,
            target_audience: fields.target_audience,
            pages: fields.pages,
            techno: fields.techno,
            design_references: fields.design_references,
            notes: fields.notes,
          },
        }),
      }
    ).catch(() => {/* silencieux — email est best-effort */})

    return true
  }, [data, token])

  return { data, loading, error, submitBrief }
}
