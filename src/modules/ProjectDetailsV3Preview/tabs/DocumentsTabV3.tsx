import { useState, useRef, useEffect, useMemo } from 'react'
import { FileText, Upload, Search } from 'lucide-react'
import { toast } from 'sonner'
import { v2, supabase } from '@/lib/supabase'
import { DocumentFolder } from './documents/DocumentFolder'
import {
  CATEGORIES, CATEGORY_ORDER, inferCategory, BUCKET, type Doc,
} from './documents/constants'
import type { ProjectV2, DocumentCategory } from '@/types/project-v2'

type SortKey = 'date' | 'name' | 'size'

interface Props {
  project: ProjectV2
}

export function DocumentsTabV3({ project }: Props) {
  const projectId = project.id
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [openFolders, setOpenFolders] = useState<Set<DocumentCategory>>(new Set(CATEGORY_ORDER))
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocs = async () => {
    const { data } = await v2
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setDocs((data as Doc[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchDocs() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [projectId])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return docs
      .filter((d) => !q || d.name.toLowerCase().includes(q) || (d.uploader_name ?? '').toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortKey === 'name') return a.name.localeCompare(b.name)
        if (sortKey === 'size') return (b.file_size ?? 0) - (a.file_size ?? 0)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [docs, search, sortKey])

  const grouped = useMemo(() => {
    const map = new Map<DocumentCategory, Doc[]>()
    for (const cat of CATEGORY_ORDER) map.set(cat, [])
    for (const doc of filtered) {
      const cat = doc.category in CATEGORIES ? doc.category : 'other'
      map.get(cat as DocumentCategory)!.push(doc)
    }
    return map
  }, [filtered])

  const toggleFolder = (cat: DocumentCategory) => {
    setOpenFolders((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const existingVersions = docs
      .filter((d) => d.name.toLowerCase() === file.name.toLowerCase())
      .map((d) => parseInt(d.version ?? '1'))
    const version = String(existingVersions.length > 0 ? Math.max(...existingVersions) + 1 : 1)

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${projectId}/${Date.now()}_v${version}_${safeName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      toast.error(`Erreur upload : ${uploadError.message}`)
      e.target.value = ''
      return
    }

    const { error: insertError } = await v2.from('project_documents').insert({
      project_id: projectId,
      name: file.name,
      category: inferCategory(file.name, file.type),
      version,
      file_path: path,
      file_size: file.size,
      mime_type: file.type || null,
      uploader_name: 'Admin',
    })

    if (insertError) {
      await supabase.storage.from(BUCKET).remove([path])
      toast.error(`Erreur métadonnées : ${insertError.message}`)
    } else {
      toast.success(`"${file.name}" ajouté`)
      fetchDocs()
    }
    e.target.value = ''
  }

  const handleDelete = async (doc: Doc) => {
    if (doc.file_path) await supabase.storage.from(BUCKET).remove([doc.file_path])
    await v2.from('project_documents').delete().eq('id', doc.id)
    setDocs((prev) => prev.filter((d) => d.id !== doc.id))
    setConfirmDeleteId(null)
    toast.success('Document supprimé')
  }

  const handleDownload = async (doc: Doc) => {
    if (!doc.file_path) { toast.info('Fichier non disponible'); return }
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.file_path, 60)
    if (error || !data?.signedUrl) {
      toast.error('Erreur génération lien')
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Documents</h3>
          <span className="text-xs text-muted-foreground">
            {docs.length} fichier{docs.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Upload className="h-4 w-4" />
          Uploader
        </button>
      </div>

      {/* Barre recherche + tri */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un document…"
            className="w-full pl-8 pr-3 py-1.5 bg-surface-2 border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="bg-surface-2 border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none"
        >
          <option value="date">Plus récent</option>
          <option value="name">Nom</option>
          <option value="size">Taille</option>
        </select>
      </div>

      {/* Dossiers GED */}
      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
          <FileText className="h-10 w-10 opacity-30" />
          <p className="text-sm">Aucun document pour ce projet.</p>
          <p className="text-xs opacity-60">Les PJ des emails apparaissent ici après une sync Gmail.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {CATEGORY_ORDER.map((cat) => {
            const catDocs = grouped.get(cat) ?? []
            if (catDocs.length === 0) return null
            return (
              <DocumentFolder
                key={cat}
                category={cat}
                docs={catDocs}
                isOpen={openFolders.has(cat)}
                confirmDeleteId={confirmDeleteId}
                onToggle={() => toggleFolder(cat)}
                onAskDelete={setConfirmDeleteId}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onDelete={handleDelete}
                onDownload={handleDownload}
              />
            )
          })}

          {filtered.length === 0 && search && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Aucun document pour "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
