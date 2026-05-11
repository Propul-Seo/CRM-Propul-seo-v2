import { useNavigate, useParams } from 'react-router-dom'
import { Sparkles, Loader2 } from 'lucide-react'
import { useUsers } from '@/hooks/useUsers'
import { useProjectV3 } from './hooks/useProjectV3'
import { ProjectV3LeftSidebar } from './components/ProjectV3LeftSidebar'
import { ProjectV3RightSidebar } from './components/ProjectV3RightSidebar'
import { ProjectV3Tabs } from './components/ProjectV3Tabs'

export function ProjectDetailsV3Preview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { project, loading, error } = useProjectV3(id ?? '')
  const { users } = useUsers()

  const teamUsers = users.map((u) => ({ id: u.id, name: u.name, email: u.email }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#020205]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6] mx-auto mb-2" />
          <p className="text-sm text-[#9ca3af]">Chargement du projet…</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#020205]">
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
    <div className="flex flex-col h-screen bg-[#020205] overflow-hidden">
      {/* Breadcrumb / preview banner */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#070512] border-b border-[rgba(139,92,246,0.18)] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-[#ede9fe] transition-colors"
          >
            ← Retour
          </button>
          <span className="text-[rgba(139,92,246,0.3)]">/</span>
          <span className="text-xs font-medium text-[#ede9fe] truncate">{project.name}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#8B5CF6]/15 to-[#EC4899]/15 border border-[rgba(139,92,246,0.3)]">
          <Sparkles className="h-3 w-3 text-[#A78BFA]" />
          <span className="text-[10px] font-semibold text-[#A78BFA] uppercase tracking-widest">V3 Preview</span>
        </div>
      </div>

      {/* 3 colonnes */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar gauche */}
        <div className="w-[300px] shrink-0 border-r border-[rgba(139,92,246,0.18)] overflow-y-auto bg-[#070512]">
          <ProjectV3LeftSidebar
            project={project}
            users={teamUsers}
            onEdit={() => { /* TODO Sprint 5 : modal édition */ }}
            onAssign={() => { /* TODO Sprint 5 : assignation responsable */ }}
          />
        </div>

        {/* Contenu central — onglets */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ProjectV3Tabs project={project} />
        </div>

        {/* Sidebar droite */}
        <div className="w-[280px] shrink-0 border-l border-[rgba(139,92,246,0.18)] overflow-y-auto bg-[#070512]">
          <ProjectV3RightSidebar project={project} users={teamUsers} />
        </div>
      </div>
    </div>
  )
}
