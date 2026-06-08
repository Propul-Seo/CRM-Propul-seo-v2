import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const adminRpcMock = vi.fn()
vi.mock('@/modules/EspaceClient/admin/lib/adminRpc', () => ({
  adminRpc: (...args: unknown[]) => adminRpcMock(...args),
}))

import { useConvertQualifLead } from './useConvertQualifLead'
import type { QualificationLead } from './useLeadsV3Qualification'

const lead: QualificationLead = {
  id: 'qualif-1',
  full_name: 'Jean Dupont',
  email: 'jean@acme.fr',
  phone: '0601020304',
  company_name: 'Acme',
  business_sector: null,
  business_sector_custom: null,
  project_type: 'site',
  budget_range: '2000-5000',
  desired_timeline: '1-3mois',
  main_goal: null,
  status: 'submitted',
  submitted_at: '2026-06-01T10:00:00Z',
  created_at: '2026-06-01T09:00:00Z',
  converted_to_project_id: null,
  raw: {},
}

describe('useConvertQualifLead', () => {
  beforeEach(() => {
    adminRpcMock.mockReset()
  })

  it('appelle admin_convert_lead_to_project avec p_lead_type=qualification', async () => {
    adminRpcMock.mockResolvedValue({
      data: { project_id: 'proj-1', lead_type: 'qualification', documents_created: 2, contact_created: true },
      error: null,
    })
    const { result } = renderHook(() => useConvertQualifLead())

    let res!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      res = await result.current.convert(lead)
    })

    expect(adminRpcMock).toHaveBeenCalledWith('admin_convert_lead_to_project', {
      p_lead_id: 'qualif-1',
      p_lead_type: 'qualification',
    })
    expect(res).toEqual({ success: true, projectId: 'proj-1', documentsCreated: 2 })
  })

  it('n\'appelle PAS d\'edge function portail (portail découplé)', async () => {
    adminRpcMock.mockResolvedValue({
      data: { project_id: 'proj-1', lead_type: 'qualification', documents_created: 0, contact_created: true },
      error: null,
    })
    const { result } = renderHook(() => useConvertQualifLead())

    await act(async () => {
      await result.current.convert(lead)
    })

    // Seul l'appel RPC de conversion est attendu, rien d'autre.
    expect(adminRpcMock).toHaveBeenCalledTimes(1)
  })

  it('remonte l\'erreur already_converted', async () => {
    adminRpcMock.mockResolvedValue({
      data: null,
      error: { message: 'already_converted: project proj-9 (qualification)' },
    })
    const { result } = renderHook(() => useConvertQualifLead())

    let res!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      res = await result.current.convert(lead)
    })

    expect(res.success).toBe(false)
    expect(res.error).toContain('already_converted')
  })
})
