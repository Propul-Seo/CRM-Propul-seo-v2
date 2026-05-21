import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface ProjectDeps {
  project_name: string
  project_status: string
  invoices_count: number
  signatures_count: number
  documents_count: number
  has_portal: boolean
  has_qualif_lead: boolean
}

interface DeleteResult {
  success: boolean
  error?: string
  storageCleanup?: { deleted: number; errors: number }
}

interface StoragePaths {
  documents_bucket_paths?: string[]
  uploads_bucket_paths?: string[]
}

interface DeleteProjectRpcResult {
  project_id: string
  project_name: string
  forced: boolean
  cascade_counts: { invoices: number; signatures: number }
  storage_paths_to_cleanup: StoragePaths
}

interface DeleteLeadRpcResult {
  lead_id: string
  lead_name: string
  storage_paths_to_cleanup: StoragePaths
}

/**
 * Hook centralisé pour les opérations destructives Propul'Space.
 * - inspectProject : appelle admin_inspect_project_deps avant l'ouverture du dialog
 * - archiveProject : soft delete (status=archived)
 * - deleteProject(force=true) : hard delete + cleanup Storage downstream
 * - deleteQualifLead : delete lead non converti + cleanup Storage
 */
export function usePropulspaceDeletion() {
  const [busy, setBusy] = useState(false)

  const inspectProject = useCallback(async (projectId: string): Promise<ProjectDeps | null> => {
    const { data, error } = await supabase.rpc('admin_inspect_project_deps', { p_project_id: projectId })
    if (error || !data || !Array.isArray(data) || data.length === 0) {
      if (error && import.meta.env.DEV) console.error('[usePropulspaceDeletion] inspect failed:', error)
      return null
    }
    return data[0] as ProjectDeps
  }, [])

  const cleanupStorage = useCallback(async (paths: StoragePaths): Promise<{ deleted: number; errors: number }> => {
    const docs = paths.documents_bucket_paths ?? []
    const ups = paths.uploads_bucket_paths ?? []
    if (docs.length === 0 && ups.length === 0) return { deleted: 0, errors: 0 }
    const { data, error } = await supabase.functions.invoke<{ deleted: number; errors: unknown[] }>(
      'admin-cleanup-storage',
      { body: paths },
    )
    if (error) {
      if (import.meta.env.DEV) console.error('[usePropulspaceDeletion] storage cleanup failed:', error)
      return { deleted: 0, errors: docs.length + ups.length }
    }
    return { deleted: data?.deleted ?? 0, errors: Array.isArray(data?.errors) ? data.errors.length : 0 }
  }, [])

  const archiveProject = useCallback(async (projectId: string): Promise<DeleteResult> => {
    setBusy(true)
    try {
      const { error } = await supabase.rpc('admin_archive_project', { p_project_id: projectId })
      if (error) return { success: false, error: error.message }
      return { success: true }
    } finally {
      setBusy(false)
    }
  }, [])

  const deleteProject = useCallback(async (projectId: string, force: boolean): Promise<DeleteResult> => {
    setBusy(true)
    try {
      const { data, error } = await supabase.rpc('admin_delete_project', {
        p_project_id: projectId, p_force: force,
      })
      if (error) return { success: false, error: error.message }
      const result = data as DeleteProjectRpcResult | null
      const cleanup = result ? await cleanupStorage(result.storage_paths_to_cleanup) : { deleted: 0, errors: 0 }
      return { success: true, storageCleanup: cleanup }
    } finally {
      setBusy(false)
    }
  }, [cleanupStorage])

  const deleteQualifLead = useCallback(async (leadId: string): Promise<DeleteResult> => {
    setBusy(true)
    try {
      const { data, error } = await supabase.rpc('admin_delete_qualif_lead', { p_lead_id: leadId })
      if (error) return { success: false, error: error.message }
      const result = data as DeleteLeadRpcResult | null
      const cleanup = result ? await cleanupStorage(result.storage_paths_to_cleanup) : { deleted: 0, errors: 0 }
      return { success: true, storageCleanup: cleanup }
    } finally {
      setBusy(false)
    }
  }, [cleanupStorage])

  return { busy, inspectProject, archiveProject, deleteProject, deleteQualifLead }
}
