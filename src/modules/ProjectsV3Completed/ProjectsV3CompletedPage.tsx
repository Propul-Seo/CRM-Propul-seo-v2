import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Archive, Search, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCompletedProjectsV3 } from './hooks/useCompletedProjectsV3'
import { ProjectCardV3Compact } from '@/modules/ProjectsV3/components/ProjectCardV3Compact'
import { getActivePoles, type V3Pole, V3_POLE_COLORS, V3_POLE_LABELS } from '@/modules/ProjectsV3/utils/poleMapping'
import { cn } from '@/lib/utils'

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function ProjectsV3CompletedPage() {
  const navigate = useNavigate()
  const { projects, loading, error } = useCompletedProjectsV3()

  const [filterUserId, setFilterUserId] = useState('')
  const [activePoles, setActivePoles] = useState<Set<V3Pole>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounced(searchQuery, 300)
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    supabase.from('users').select('id, name').order('name').then(({ data, error: err }) => {
      if (err) {
        console.error('[ProjectsV3Completed] users fetch failed:', err)
        return
      }
      if (data) setUsers(data as { id: string; name: string }[])
    })
  }, [])

  const togglePole = (pole: V3Pole) => {
    setActivePoles(prev => {
      const next = new Set(prev)
      if (next.has(pole)) next.delete(pole)
      else next.add(pole)
      return next
    })
  }

  const filteredProjects = useMemo(() => {
    let result = projects
    if (filterUserId) {
      result = result.filter(p => p.assigned_to === filterUserId)
    }
    if (activePoles.size > 0) {
      result = result.filter(p => {
        const projectPoles = getActivePoles(p.presta_type)
        return projectPoles.some(pole => activePoles.has(pole))
      })
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.client_name ?? '').toLowerCase().includes(q),
      )
    }
    return result
  }, [projects, filterUserId, activePoles, debouncedSearch])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-[#A78BFA]" />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#0a0814] text-[#ede9fe] p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center">
            <Archive className="h-5 w-5 text-[#A78BFA]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight">Projets terminés</h1>
            <p className="text-xs text-[#9ca3af] mt-0.5">
              {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''} livré
              {filteredProjects.length > 1 ? 's' : ''} ou archivé{filteredProjects.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5 p-3 bg-[#070512] border border-[rgba(139,92,246,0.18)] rounded-xl">
        {/* Recherche */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca3af]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom de projet ou client…"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0f0b1e] border border-[rgba(139,92,246,0.2)] rounded-md text-[#ede9fe] placeholder:text-[#6b7280] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        {/* Responsable */}
        <select
          value={filterUserId}
          onChange={(e) => setFilterUserId(e.target.value)}
          className="px-3 py-1.5 text-xs bg-[#0f0b1e] border border-[rgba(139,92,246,0.2)] rounded-md text-[#ede9fe] focus:outline-none focus:border-[#8B5CF6]"
        >
          <option value="">Tous les responsables</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        {/* Pôles */}
        <div className="flex items-center gap-1.5">
          {(['comm', 'erp', 'web'] as V3Pole[]).map(pole => {
            const isActive = activePoles.has(pole)
            return (
              <button
                key={pole}
                type="button"
                onClick={() => togglePole(pole)}
                className={cn(
                  'px-2.5 py-1 text-[10px] font-semibold rounded-md border transition-colors',
                  isActive
                    ? 'text-white border-transparent'
                    : 'text-[#9ca3af] border-[rgba(139,92,246,0.2)] hover:border-[rgba(139,92,246,0.4)]',
                )}
                style={isActive ? { backgroundColor: V3_POLE_COLORS[pole] } : undefined}
              >
                {V3_POLE_LABELS[pole]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-xs text-red-300">
          Impossible de charger les projets terminés : {error}
        </div>
      )}

      {/* Liste */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 text-[#9ca3af]">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun projet terminé ne correspond aux filtres.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filteredProjects.map((project, idx) => (
            <ProjectCardV3Compact
              key={project.id}
              project={project}
              index={idx}
              onClick={() => navigate(`/projets-v3-preview/${project.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
