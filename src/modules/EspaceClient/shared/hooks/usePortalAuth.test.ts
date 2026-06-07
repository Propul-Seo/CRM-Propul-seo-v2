import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Régression R-009 (SP1) : usePortalAuth ne doit plus planter quand deux
// projets partagent le même portal_client_email (pas de UNIQUE — ADR-004/005).
// Le fix : `.limit(1).maybeSingle()` borne à 1 ligne avant le singularize, donc
// plus de PGRST116 « multiple rows » ; et `.maybeSingle()` (≠ `.single()`)
// renvoie data=null sans throw quand l'email n'a aucun projet.
//
// On mocke entièrement le client portail (@/lib/supabase → portalSupabase).
// `getSession` (fallback au mount) suffit à déclencher loadAuthState, on n'a
// donc pas besoin de piloter l'event onAuthStateChange.
// ---------------------------------------------------------------------------

// Résultat injectable de la requête projects_v2 (data/error renvoyés par maybeSingle).
type QueryResult = { data: unknown; error: unknown }

// `vi.hoisted` : ces variables sont remontées AVEC la factory vi.mock (hoistée
// en tête de fichier), ce qui évite le « Cannot access before initialization ».
const h = vi.hoisted(() => {
  const state = { result: { data: null, error: null } as QueryResult }
  return {
    state,
    limitSpy: vi.fn(),
    maybeSingleSpy: vi.fn(async () => state.result),
    fakeSession: { user: { email: 'client@example.com' } } as unknown,
  }
})

vi.mock('@/lib/supabase', () => {
  // Chaîne fluide : from → select → eq → limit → maybeSingle.
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    limit: vi.fn((n: number) => {
      h.limitSpy(n)
      return builder
    }),
    maybeSingle: h.maybeSingleSpy,
  }
  return {
    portalSupabase: {
      from: vi.fn(() => builder),
      auth: {
        getSession: vi.fn(async () => ({ data: { session: h.fakeSession } })),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
    },
  }
})

// Importé APRÈS le mock pour que le hook consomme le client mocké.
import { usePortalAuth } from './usePortalAuth'

beforeEach(() => {
  h.state.result = { data: null, error: null }
  h.limitSpy.mockClear()
  h.maybeSingleSpy.mockClear()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('usePortalAuth — régression R-009 (collision portal_client_email)', () => {
  it('collision d\'email (2 projets) : ne throw plus et retourne 1 projet', async () => {
    // Avec `.limit(1)`, PostgREST ne renvoie jamais l'erreur PGRST116
    // « multiple rows » : on simule donc la 1re ligne déjà bornée.
    h.state.result = {
      data: {
        id: 'project-1',
        name: 'Projet A',
        client_name: 'Client',
        status: 'active',
        portal_client_email: 'client@example.com',
      },
      error: null,
    }

    const { result } = renderHook(() => usePortalAuth())

    await waitFor(() => {
      expect(result.current.state.status).toBe('ready')
    })

    const state = result.current.state
    expect(state.status).toBe('ready')
    if (state.status === 'ready') {
      expect(state.project.id).toBe('project-1')
      expect(state.email).toBe('client@example.com')
    }

    // Garde-fou : la requête doit avoir été bornée à 1 ligne (le coeur du fix).
    expect(h.limitSpy).toHaveBeenCalledWith(1)
  })

  it('email sans projet : résultat no-project (null), sans throw', async () => {
    // `.maybeSingle()` renvoie data=null/error=null quand 0 ligne — pas un throw
    // (ce que ferait `.single()` via PGRST116). On vérifie l'absence de crash.
    h.state.result = { data: null, error: null }

    const { result } = renderHook(() => usePortalAuth())

    await waitFor(() => {
      expect(result.current.state.status).toBe('no-project')
    })

    const state = result.current.state
    expect(state.status).toBe('no-project')
    if (state.status === 'no-project') {
      expect(state.email).toBe('client@example.com')
    }
  })
})
