import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Hook unique pour les 3 actions admin du portail :
// - activatePortal(projectId, email) : appelle admin-portal-invite
// - resendInvite(projectId)          : appelle admin-portal-resend-invite
// - deactivatePortal(projectId, reason?) : appelle admin-portal-deactivate
//
// Chaque mutation expose son propre flag de chargement pour permettre à l'UI
// d'afficher des spinners différents selon l'action en cours.

type ActionState = 'idle' | 'loading'

interface EdgeFunctionResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface InviteData { projectId: string; email: string; projectName: string }
interface ResendData { projectId: string; email: string }
interface DeactivateData { projectId: string; previousEmail: string }

async function invokeEdgeFn<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<EdgeFunctionResponse<T>> {
  try {
    const { data, error } = await supabase.functions.invoke<EdgeFunctionResponse<T>>(name, { body })
    if (error) {
      // Sur non-2xx, supabase-js v2 ne fournit pas data — on doit lire le body
      // depuis error.context (Response). Sinon on tombe sur le message générique.
      let payloadError: string | null = null
      try {
        const ctx = (error as unknown as { context?: Response }).context
        if (ctx && typeof ctx.json === 'function') {
          const parsed = await ctx.clone().json()
          if (parsed && typeof parsed === 'object' && 'error' in parsed) {
            payloadError = String((parsed as { error: unknown }).error)
          }
        }
      } catch {
        // body non-JSON ou clone impossible — on fallback sur error.message
      }
      const payload = (data as EdgeFunctionResponse<T> | null) ?? null
      return {
        success: false,
        error: payload?.error ?? payloadError ?? error.message ?? 'Erreur inconnue',
      }
    }
    if (!data) return { success: false, error: 'Pas de réponse du serveur' }
    return data
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur réseau',
    }
  }
}

export interface UsePortalActivationResult {
  activatePortal: (projectId: string, email: string) => Promise<EdgeFunctionResponse<InviteData>>
  resendInvite: (projectId: string) => Promise<EdgeFunctionResponse<ResendData>>
  deactivatePortal: (projectId: string, reason?: string) => Promise<EdgeFunctionResponse<DeactivateData>>
  isActivating: boolean
  isResending: boolean
  isDeactivating: boolean
}

export function usePortalActivation(): UsePortalActivationResult {
  const [activatingState, setActivatingState] = useState<ActionState>('idle')
  const [resendingState, setResendingState] = useState<ActionState>('idle')
  const [deactivatingState, setDeactivatingState] = useState<ActionState>('idle')

  const activatePortal = useCallback(async (projectId: string, email: string) => {
    setActivatingState('loading')
    try {
      return await invokeEdgeFn<InviteData>('admin-portal-invite', { projectId, email })
    } finally {
      setActivatingState('idle')
    }
  }, [])

  const resendInvite = useCallback(async (projectId: string) => {
    setResendingState('loading')
    try {
      return await invokeEdgeFn<ResendData>('admin-portal-resend-invite', { projectId })
    } finally {
      setResendingState('idle')
    }
  }, [])

  const deactivatePortal = useCallback(async (projectId: string, reason?: string) => {
    setDeactivatingState('loading')
    try {
      return await invokeEdgeFn<DeactivateData>('admin-portal-deactivate', {
        projectId,
        reason: reason?.trim() || undefined,
      })
    } finally {
      setDeactivatingState('idle')
    }
  }, [])

  return {
    activatePortal,
    resendInvite,
    deactivatePortal,
    isActivating: activatingState === 'loading',
    isResending: resendingState === 'loading',
    isDeactivating: deactivatingState === 'loading',
  }
}
