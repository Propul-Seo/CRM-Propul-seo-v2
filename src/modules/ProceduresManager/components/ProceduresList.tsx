import { useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProcedures } from '../hooks/useProcedures'
import { useProcedureCategories } from '../hooks/useProcedureCategories'
import { useProcedureSearch } from '../hooks/useProcedureSearch'
import { useIsProceduresAdmin } from '../hooks/useIsProceduresAdmin'
import { CategoryChips } from './CategoryChips'
import { CategoryFolder } from './CategoryFolder'
import { ProcedureCard } from './ProcedureCard'
import type { Procedure } from '../types'

interface ProceduresListProps {
  onOpen: (procedure: Procedure) => void
  onCreate: () => void
}

export function ProceduresList({ onOpen, onCreate }: ProceduresListProps) {
  const { procedures, loading } = useProcedures()
  const { categories, create: createCategory, remove: removeCategory } = useProcedureCategories()
  const { isAdmin } = useIsProceduresAdmin()

  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const { results: searchResults, loading: searching } = useProcedureSearch(query)

  const base = searchResults ?? procedures

  // Vue "dossiers" par défaut : pas de recherche, pas de catégorie, pas de tag
  const isFolderView = !selectedCategory && !query && !selectedTag

  const filtered = useMemo(() => {
    return base.filter((p) => {
      if (selectedCategory && p.category_id !== selectedCategory) return false
      if (selectedTag && !p.tags.includes(selectedTag)) return false
      return true
    })
  }, [base, selectedCategory, selectedTag])

  const pinned = filtered.filter((p) => p.is_pinned)
  const others = filtered.filter((p) => !p.is_pinned)

  const allTags = useMemo(() => {
    const s = new Set<string>()
    procedures.forEach((p) => p.tags.forEach((t) => s.add(t)))
    return Array.from(s).sort()
  }, [procedures])

  const catById = useMemo(() => {
    const m = new Map(categories.map((c) => [c.id, c]))
    return m
  }, [categories])

  // Procédures groupées par catégorie (pour la vue dossiers)
  const procsByCategory = useMemo(() => {
    const map = new Map<string, Procedure[]>()
    for (const cat of categories) map.set(cat.id, [])
    const orphans: Procedure[] = []
    for (const p of procedures) {
      if (p.is_archived) continue
      if (p.category_id && map.has(p.category_id)) {
        map.get(p.category_id)!.push(p)
      } else {
        orphans.push(p)
      }
    }
    // Tri : épinglées d'abord, puis plus récent
    const sortFn = (a: Procedure, b: Procedure) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    }
    for (const [, list] of map) list.sort(sortFn)
    orphans.sort(sortFn)
    return { map, orphans }
  }, [categories, procedures])

  const pinnedAll = useMemo(
    () => procedures.filter((p) => p.is_pinned && !p.is_archived),
    [procedures]
  )

  const selectedCat = selectedCategory ? catById.get(selectedCategory) ?? null : null

  return (
    <div className="min-h-screen p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {!isFolderView && (
            <button
              onClick={() => {
                setSelectedCategory(null)
                setSelectedTag(null)
                setQuery('')
              }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors shrink-0"
              title="Retour aux catégories"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground truncate">
                {selectedCat ? selectedCat.name : 'Procédures'}
              </h1>
              {isFolderView && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium border border-primary/30">
                  Wiki interne
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isFolderView
                ? `${procedures.length} fiche${procedures.length !== 1 ? 's' : ''} · ${categories.length} catégorie${categories.length !== 1 ? 's' : ''}`
                : query
                  ? `Recherche : "${query}" · ${filtered.length} résultat${filtered.length !== 1 ? 's' : ''}`
                  : selectedCat
                    ? `${filtered.length} fiche${filtered.length !== 1 ? 's' : ''}`
                    : `${filtered.length} fiche${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={onCreate}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shrink-0"
          >
            <Plus className="h-4 w-4" />
            Nouvelle fiche
          </button>
        )}
      </div>

      {/* Barre de recherche (toujours visible) */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher dans toutes les procédures…"
          className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">…</span>
        )}
      </div>

      {/* Chips catégories : seulement en mode non-folder pour changer vite de catégorie */}
      {!isFolderView && (
        <CategoryChips
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          isAdmin={isAdmin}
          onCreate={createCategory}
          onDelete={removeCategory}
        />
      )}

      {/* Tags : en mode non-folder uniquement */}
      {!isFolderView && allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Tags :</span>
          {allTags.slice(0, 20).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={
                selectedTag === tag
                  ? 'text-[11px] bg-primary/20 text-primary px-2 py-0.5 rounded'
                  : 'text-[11px] text-muted-foreground hover:text-primary px-2 py-0.5 rounded hover:bg-primary/10 transition-colors'
              }
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-muted-foreground text-sm">Chargement…</div>
      )}

      {/* === Vue DOSSIERS (accueil) === */}
      {!loading && isFolderView && (
        <div className="space-y-6">
          {/* Épinglées globales, en avant */}
          {pinnedAll.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                📌 Épinglées
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {pinnedAll.map((p) => (
                  <ProcedureCard
                    key={p.id}
                    procedure={p}
                    category={p.category_id ? catById.get(p.category_id) ?? null : null}
                    onClick={() => onOpen(p)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Grille des catégories */}
          <div className="space-y-2">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Catégories
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <CategoryFolder
                  key={cat.id}
                  category={cat}
                  procedures={procsByCategory.map.get(cat.id) ?? []}
                  onClick={() => setSelectedCategory(cat.id)}
                />
              ))}
              {procsByCategory.orphans.length > 0 && (
                <CategoryFolder
                  category={null}
                  procedures={procsByCategory.orphans}
                  onClick={() => {
                    // vue "sans catégorie" = filtre tag vide + category null mais on veut les orphelins
                    // Hack simple : on passe par un tag inexistant ? Non, mieux : on laisse le user chercher.
                    // Pour V1 : on affiche juste que les orphelins via un tag fictif côté state.
                    setSelectedCategory('__orphans__')
                  }}
                />
              )}
            </div>
          </div>

          {categories.length === 0 && pinnedAll.length === 0 && (
            <div className="text-center py-12 border border-dashed border-border/60 rounded-lg">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Aucune catégorie pour le moment.</p>
              {isAdmin && (
                <button
                  onClick={onCreate}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  Créer la première fiche
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* === Vue FICHES (catégorie sélectionnée OU recherche OU tag) === */}
      {!loading && !isFolderView && (
        <>
          {filtered.length === 0 && selectedCategory !== '__orphans__' && (
            <div className="text-center py-12 border border-dashed border-border/60 rounded-lg">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Aucune fiche ne correspond aux filtres.
              </p>
            </div>
          )}

          {/* Cas spécial : vue orphelins */}
          {selectedCategory === '__orphans__' && (
            <div className="space-y-2">
              <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Sans catégorie
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {procsByCategory.orphans.map((p) => (
                  <ProcedureCard
                    key={p.id}
                    procedure={p}
                    category={null}
                    onClick={() => onOpen(p)}
                  />
                ))}
              </div>
            </div>
          )}

          {selectedCategory !== '__orphans__' && pinned.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                📌 Épinglées
              </h2>
              <div
                className={cn(
                  'grid gap-3',
                  'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                )}
              >
                {pinned.map((p) => (
                  <ProcedureCard
                    key={p.id}
                    procedure={p}
                    category={p.category_id ? catById.get(p.category_id) ?? null : null}
                    onClick={() => onOpen(p)}
                  />
                ))}
              </div>
            </div>
          )}

          {selectedCategory !== '__orphans__' && others.length > 0 && (
            <div className="space-y-2">
              {pinned.length > 0 && (
                <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Toutes les fiches
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {others.map((p) => (
                  <ProcedureCard
                    key={p.id}
                    procedure={p}
                    category={p.category_id ? catById.get(p.category_id) ?? null : null}
                    onClick={() => onOpen(p)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
