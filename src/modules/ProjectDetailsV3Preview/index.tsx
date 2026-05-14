import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Sparkles, Loader2, Maximize2, Minimize2 } from 'lucide-react'
import { useUsers } from '@/hooks/useUsers'
import { useProjectUpdateV3 } from './hooks/useProjectUpdateV3'
import { useStore } from '@/store'
import { routes } from '@/lib/routes'
import type { PrestaType, ProjectV2, ProjectStatusV2 } from '@/types/project-v2'
import { useProjectV3 } from './hooks/useProjectV3'
import { useChecklistV3 } from './hooks/useChecklistV3'
import { ProjectV3LeftSidebar } from './components/ProjectV3LeftSidebar'
import { ProjectV3RightSidebar } from './components/ProjectV3RightSidebar'
import { ProjectV3Tabs } from './components/ProjectV3Tabs'
import { ProjectEditModalV3 } from './components/ProjectEditModalV3'

function getProjectListContext(presta: PrestaType[] | null | undefined): { label: string; path: string } {
  const types = presta ?? []
  if (types.includes('site_web') || types.includes('web')) return { label: 'Site Web', path: routes.siteWeb }
  if (types.includes('erp') || types.includes('erp_v2') || types.includes('saas')) return { label: 'ERP', path: routes.erp }
  if (types.includes('communication')) return { label: 'Communication', path: routes.communication }
  return { label: 'Projets', path: routes.projects }
}

export function ProjectDetailsV3Preview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { project, loading: loadingProject, error, refetch } = useProjectV3(id ?? '')
  const { users, loading: loadingUsers } = useUsers()
  const { updateProject } = useProjectUpdateV3()
  // Source de vérité unique pour la progression : hissé ici pour que sidebar et tabs
  // partagent la même instance (un seul SELECT, un seul state, pas de drift possible).
  const checklist = useChecklistV3(id ?? '')
  const setSidebarCollapsed = useStore((s) => s.setSidebarCollapsed)
  const [focusMode, setFocusMode] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const handleSaveProject = async (updates: Partial<ProjectV2>) => {
    if (!project) return
    const res = await updateProject(project.id, updates)
    if (!res.success) throw new Error(res.error ?? 'Échec de la sauvegarde du projet')
    await refetch()
  }

  const handleAssign = async (userId: string | null) => {
    if (!project) return
    const assignedUser = userId ? users.find((u) => u.id === userId) : null
    const res = await updateProject(project.id, {
      assigned_to: userId,
      assigned_name: assignedUser?.name ?? null,
    })
    if (res.success) await refetch()
  }

  const handleStatusChange = async (status: ProjectStatusV2) => {
    if (!project || status === project.status) return
    const res = await updateProject(project.id, { status })
    if (res.success) await refetch()
  }

  // Loading global coordonné : on n'affiche les 3 colonnes qu'une fois projet + équipe prêts.
  const loading = loadingProject || loadingUsers

  // Sur la page V3, on collapse la sidebar app au mount pour laisser de la place aux 3 colonnes.
  // Restaure l'état précédent au démontage.
  useEffect(() => {
    const previous = useStore.getState().sidebarCollapsed
    if (!previous) setSidebarCollapsed(true)
    return () => {
      if (!previous) setSidebarCollapsed(false)
    }
  }, [setSidebarCollapsed])

  // Raccourci F : toggle mode focus (désactivé pendant la saisie et si un modal est ouvert).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target
      if (target instanceof HTMLElement) {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
        if (target.isContentEditable) return
      }
      if (document.querySelector('[role="dialog"][data-state="open"]')) return
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        setFocusMode((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const teamUsers = users.map((u) => ({ id: u.id, name: u.name, email: u.email }))
  const listContext = getProjectListContext(project?.presta_type)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#020205]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6] mx-auto mb-2" />
          <p className="text-sm text-[#9ca3af]">Chargement du projet…</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-full bg-[#020205]">
        <div className="text-center max-w-md">
          <p className="text-sm text-[#ede9fe] mb-2">{error ?? 'Projet introuvable'}</p>
          <button
            onClick={() => navigate('/projets')}
            className="text-xs text-[#8B5CF6] hover:text-[#A78BFA] transition-colors"
          >
            ← Retour à la liste des projets
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#020205] overflow-hidden">
      {/* Breadcrumb / preview banner */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#070512] border-b border-[rgba(139,92,246,0.18)] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(listContext.path)}
            className="flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-[#ede9fe] transition-colors"
          >
            ← {listContext.label}
          </button>
          <span className="text-[rgba(139,92,246,0.3)]">/</span>
          <span className="text-xs font-medium text-[#ede9fe] truncate">{project.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFocusMode((v) => !v)}
            title={focusMode ? 'Quitter le mode focus (F)' : 'Mode focus — masquer les colonnes latérales (F)'}
            className="flex items-center justify-center h-7 w-7 rounded-full text-[#9ca3af] hover:text-[#ede9fe] hover:bg-[rgba(139,92,246,0.15)] transition-colors"
          >
            {focusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#8B5CF6]/15 to-[#EC4899]/15 border border-[rgba(139,92,246,0.3)]">
            <Sparkles className="h-3 w-3 text-[#A78BFA]" />
            <span className="text-[10px] font-semibold text-[#A78BFA] uppercase tracking-widest">V3 Preview</span>
          </div>
        </div>
      </div>

      {/* 3 colonnes (ou 1 en mode focus) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar gauche */}
        {!focusMode && (
          <div className="w-[300px] shrink-0 border-r border-[rgba(139,92,246,0.18)] overflow-hidden bg-[#070512]">
            <ProjectV3LeftSidebar
              project={project}
              checklistProgress={checklist.progress}
              onEdit={() => setEditOpen(true)}
            />
          </div>
        )}

        {/* Contenu central — onglets */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ProjectV3Tabs
            project={project}
            checklist={checklist}
            onEdit={() => setEditOpen(true)}
            onRefresh={refetch}
          />
        </div>

        {/* Sidebar droite */}
        {!focusMode && (
          <div className="w-[280px] shrink-0 border-l border-[rgba(139,92,246,0.18)] overflow-hidden bg-[#070512]">
            <ProjectV3RightSidebar
              project={project}
              users={teamUsers}
              onContactSaved={refetch}
              onAssign={handleAssign}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}
      </div>

      {/* Modal édition projet */}
      {editOpen && (
        <ProjectEditModalV3
          project={project}
          users={teamUsers}
          onSave={handleSaveProject}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  )
}
