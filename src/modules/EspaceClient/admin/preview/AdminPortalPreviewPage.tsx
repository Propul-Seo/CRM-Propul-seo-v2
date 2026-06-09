import { Routes, Route, useParams, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PortalPreviewProvider } from './PortalPreviewProvider'
import { PortalShell } from '@/modules/EspaceClient/client/PortalShell'
import { DashboardPage } from '@/modules/EspaceClient/client/pages/DashboardPage'
import { ProjectPage } from '@/modules/EspaceClient/client/pages/ProjectPage'
import { DocumentsPage } from '@/modules/EspaceClient/client/pages/DocumentsPage'
import { InvoicesPage } from '@/modules/EspaceClient/client/pages/InvoicesPage'
import { SignaturesPage } from '@/modules/EspaceClient/client/pages/SignaturesPage'
import { HelpPage } from '@/modules/EspaceClient/client/pages/HelpPage'
import { ProfilePage } from '@/modules/EspaceClient/client/pages/ProfilePage'

const MARKER = '/apercu-client'

// Aperçu admin du portail client (lecture seule). Monté sous
// /<base>/clients/:projectId/apercu-client/* (route admin-gated dans
// AdminRoutesShell). Réutilise le PortalShell + les pages client réelles, mais
// alimentées par le client ADMIN via le PortalPreviewProvider.
export function AdminPortalPreviewPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  if (!projectId) return null

  // Base = chemin jusqu'à /apercu-client inclus (indépendant du point de montage
  // /portails vs /admin/propulspace). cockpitPath = base sans /apercu-client.
  const base = pathname.slice(0, pathname.lastIndexOf(MARKER) + MARKER.length)
  const cockpitPath = base.slice(0, base.length - MARKER.length)

  return (
    <PortalPreviewProvider projectId={projectId} basePath={base} onExit={() => navigate(cockpitPath)}>
      <div className="propulspace-portal min-h-screen">
        <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-500/15 px-4 py-2 text-sm text-amber-900 ring-1 ring-amber-500/30">
          <span>Mode aperçu — vous voyez le portail tel que le client le voit (lecture seule).</span>
          <button
            type="button"
            onClick={() => navigate(cockpitPath)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-amber-500/25 px-2.5 py-1 font-medium transition-colors hover:bg-amber-500/35"
          >
            <ArrowLeft className="h-4 w-4" /> Retour au cockpit
          </button>
        </div>
        <Routes>
          <Route element={<PortalShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="project" element={<ProjectPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="signatures" element={<SignaturesPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </div>
    </PortalPreviewProvider>
  )
}
