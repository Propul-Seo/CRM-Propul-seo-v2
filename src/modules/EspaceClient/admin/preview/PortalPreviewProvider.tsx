import { useEffect, useState, type ReactNode } from 'react'
import { v2, supabase } from '@/lib/supabase'
import { PortalProvider } from '@/modules/EspaceClient/shared/context/PortalContext'
import type { PortalProject } from '@/modules/EspaceClient/shared/hooks/usePortalAuth'

interface Props {
  projectId: string
  onExit: () => void
  children: ReactNode
}

// Provider d'aperçu admin : fournit le PortalContext en LECTURE SEULE avec le
// client ADMIN (session CRM, droit propulspace.is_admin()) au lieu du client
// portail. Charge le projet cible par id — l'admin y a accès — et NE passe
// JAMAIS par usePortalAuth (qui résout via la session portail, absente côté
// admin). previewMode:true neutralise toutes les écritures du portail.
export function PortalPreviewProvider({ projectId, onExit, children }: Props) {
  const [project, setProject] = useState<PortalProject | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'not-found'>('loading')

  useEffect(() => {
    let alive = true
    void (async () => {
      const { data, error } = await supabase
        .from('projects_v2')
        .select('id, name, client_name, status, portal_client_email')
        .eq('id', projectId)
        .maybeSingle()
      if (!alive) return
      if (error || !data) { setState('not-found'); return }
      setProject(data as PortalProject)
      setState('ready')
    })()
    return () => { alive = false }
  }, [projectId])

  if (state === 'loading') {
    return (
      <div className="propulspace-portal flex min-h-screen items-center justify-center text-sm text-[var(--ps-fg-muted)]">
        Chargement de l'aperçu…
      </div>
    )
  }
  if (state === 'not-found' || !project) {
    return (
      <div className="propulspace-portal flex min-h-screen items-center justify-center text-sm text-[var(--ps-fg-muted)]">
        Projet introuvable.
      </div>
    )
  }

  return (
    <PortalProvider value={{
      email: project.portal_client_email ?? '',
      project,
      previewMode: true,
      signOut: async () => { onExit() },
      db: v2,
      storage: supabase,
    }}>
      {children}
    </PortalProvider>
  )
}
