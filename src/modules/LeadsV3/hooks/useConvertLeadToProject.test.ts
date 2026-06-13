import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock du helper RPC admin (isole l'appel Supabase).
const adminRpcMock = vi.fn()
vi.mock('@/modules/EspaceClient/admin/lib/adminRpc', () => ({
  adminRpc: (...args: unknown[]) => adminRpcMock(...args),
}))

import { useConvertLeadToProject } from './useConvertLeadToProject'

describe('useConvertLeadToProject', () => {
  beforeEach(() => {
    adminRpcMock.mockReset()
  })

  it('appelle admin_convert_lead_to_project avec p_lead_type=site_web', async () => {
    adminRpcMock.mockResolvedValue({
      data: { project_id: 'proj-1', lead_type: 'site_web', documents_created: 0, contact_created: true },
      error: null,
    })
    const { result } = renderHook(() => useConvertLeadToProject())

    let res!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      res = await result.current.convert({ leadId: 'contact-1', leadType: 'site_web' })
    })

    expect(adminRpcMock).toHaveBeenCalledWith('admin_convert_lead_to_project', {
      p_lead_id: 'contact-1',
      p_lead_type: 'site_web',
    })
    expect(res).toEqual({ success: true, projectId: 'proj-1' })
  })

  it('transmet p_lead_type=erp pour un lead ERP', async () => {
    adminRpcMock.mockResolvedValue({
      data: { project_id: 'proj-2', lead_type: 'erp', documents_created: 0, contact_created: true },
      error: null,
    })
    const { result } = renderHook(() => useConvertLeadToProject())

    await act(async () => {
      await result.current.convert({ leadId: 'erp-1', leadType: 'erp' })
    })

    expect(adminRpcMock).toHaveBeenCalledWith('admin_convert_lead_to_project', {
      p_lead_id: 'erp-1',
      p_lead_type: 'erp',
    })
  })

  it('remonte l\'erreur already_converted', async () => {
    adminRpcMock.mockResolvedValue({
      data: null,
      error: { message: 'already_converted: project proj-9 (site_web)' },
    })
    const { result } = renderHook(() => useConvertLeadToProject())

    let res!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      res = await result.current.convert({ leadId: 'contact-9', leadType: 'site_web' })
    })

    expect(res.success).toBe(false)
    expect(res.error).toContain('already_converted')
  })
})
