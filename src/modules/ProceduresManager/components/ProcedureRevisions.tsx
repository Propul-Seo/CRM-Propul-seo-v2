import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { buildExtensions } from '../lib/tiptap-extensions'
import { useProcedureRevisions } from '../hooks/useProcedureRevisions'
import { useProcedures } from '../hooks/useProcedures'
import { useResolvedContent } from '../hooks/useResolvedContent'
import type { Procedure, TipTapDoc } from '../types'

const EMPTY_DOC: TipTapDoc = { type: 'doc', content: [] }

interface ProcedureRevisionsProps {
  procedure: Procedure
  onBack: () => void
  onRestored: (p: Procedure) => void
}

export function ProcedureRevisions({ procedure, onBack, onRestored }: ProcedureRevisionsProps) {
  const { revisions, loading } = useProcedureRevisions(procedure.id)
  const { update } = useProcedures()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)

  const selected = revisions.find((r) => r.id === selectedId) ?? revisions[0] ?? null

  const { resolved } = useResolvedContent(selected?.content ?? EMPTY_DOC)

  const editor = useEditor(
    {
      editable: false,
      extensions: buildExtensions({ editable: false }),
      content: resolved,
    },
    [selected?.id, resolved]
  )

  useEffect(() => () => { editor?.destroy() }, [editor])

  const handleRestore = async () => {
    if (!selected) return
    if (!confirm(`Restaurer la version du ${new Date(selected.edited_at).toLocaleString('fr-FR')} ?`)) return
    setRestoring(true)
    const result = await update(procedure.id, {
      title: selected.title,
      summary: selected.summary,
      content: selected.content,
    })
    setRestoring(false)
    if (result) {
      toast.success('Version restaurée')
      onRestored(result)
    } else {
      toast.error('Erreur de restauration')
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Historique : {procedure.title}</h1>
          <p className="text-xs text-muted-foreground">
            {revisions.length} version{revisions.length !== 1 ? 's' : ''} précédente
            {revisions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Chargement…</div>}

      {!loading && revisions.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border/60 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Aucune version antérieure — la fiche n'a pas encore été modifiée.
          </p>
        </div>
      )}

      {!loading && revisions.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-72 shrink-0">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Versions
            </h2>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {revisions.map((r) => {
                const active = (selected?.id ?? revisions[0]?.id) === r.id
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md border transition-colors',
                      active
                        ? 'bg-primary/10 border-primary/40 text-foreground'
                        : 'bg-surface-2 border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <div className="text-sm font-medium truncate">{r.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(r.edited_at).toLocaleString('fr-FR')}
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {selected && (
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-foreground font-medium">{selected.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(selected.edited_at).toLocaleString('fr-FR')}
                  </div>
                </div>
                <button
                  onClick={handleRestore}
                  disabled={restoring}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary/90 text-sm font-medium',
                    restoring && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restaurer
                </button>
              </div>
            )}
            <article
              className={cn(
                'prose prose-invert prose-sm max-w-none border border-border/40 rounded-lg p-4 bg-surface-1',
                'prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground',
                'prose-strong:text-foreground prose-a:text-primary prose-blockquote:border-l-primary/60',
                'prose-img:rounded-md'
              )}
            >
              <EditorContent editor={editor} />
            </article>
          </div>
        </div>
      )}
    </div>
  )
}
