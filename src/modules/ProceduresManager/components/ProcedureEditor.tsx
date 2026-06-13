import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { ArrowLeft, Save, X, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { buildExtensions } from '../lib/tiptap-extensions'
import { ProcedureToolbar } from './ProcedureToolbar'
import { TagInput } from './TagInput'
import { Prose } from './views/shared/Prose'
import { useProcedureCategories } from '../hooks/useProcedureCategories'
import { useProcedures } from '../hooks/useProcedures'
import { useResolvedContent } from '../hooks/useResolvedContent'
import { NEW_PROCEDURE_TEMPLATE } from '../lib/procedure-template'
import { applyDocTransforms } from '../lib/transform-doc'
import type { Procedure, TipTapDoc } from '../types'

interface ProcedureEditorProps {
  /** null = création, sinon édition */
  procedure: Procedure | null
  onBack: () => void
  onSaved: (p: Procedure) => void
  allTags: string[]
}

export function ProcedureEditor({ procedure, onBack, onSaved, allTags }: ProcedureEditorProps) {
  const { categories } = useProcedureCategories()
  const { create, update } = useProcedures()

  const [title, setTitle] = useState(procedure?.title ?? '')
  const [summary, setSummary] = useState(procedure?.summary ?? '')
  const [categoryId, setCategoryId] = useState<string | null>(procedure?.category_id ?? null)
  const [tags, setTags] = useState<string[]>(procedure?.tags ?? [])
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [previewContent, setPreviewContent] = useState<TipTapDoc>(
    procedure?.content ?? NEW_PROCEDURE_TEMPLATE,
  )

  const initialContent = useMemo<TipTapDoc>(
    () => procedure?.content ?? NEW_PROCEDURE_TEMPLATE,
    [procedure?.id]
  )

  const { resolved } = useResolvedContent(initialContent)

  const editor = useEditor(
    {
      extensions: buildExtensions(),
      content: resolved,
      editorProps: {
        attributes: {
          // Mêmes classes que la vue Doc → numérotation auto h2/h3, h2 majuscules,
          // callouts colorés via blockquote[data-callout]. WYSIWYG strict.
          class:
            'procedure-prose procedure-prose-doc ' +
            'prose prose-invert max-w-none focus:outline-none min-h-[400px] ' +
            'prose-headings:text-foreground prose-headings:font-semibold prose-headings:tracking-tight ' +
            'prose-h2:mt-12 prose-h2:mb-5 ' +
            'prose-h3:text-base prose-h3:mt-8 prose-h3:mb-3 ' +
            'prose-p:text-foreground/85 prose-p:leading-[1.85] prose-p:my-4 prose-p:text-[0.95rem] ' +
            'prose-strong:text-foreground prose-strong:font-semibold ' +
            'prose-a:text-primary prose-a:no-underline hover:prose-a:underline ' +
            'prose-code:text-primary prose-code:bg-surface-3/80 prose-code:px-1.5 prose-code:py-0.5 ' +
            'prose-code:rounded prose-code:text-[0.85em] prose-code:font-mono prose-code:font-normal ' +
            'prose-code:before:content-none prose-code:after:content-none ' +
            'prose-li:text-foreground/85 prose-li:my-2 prose-li:leading-[1.85] ' +
            'prose-ul:my-4 prose-ol:my-4 ' +
            'prose-blockquote:border-l-primary/60 prose-blockquote:my-6 ' +
            'prose-pre:my-5 prose-img:rounded-md prose-img:my-8 ' +
            'prose-hr:my-10 prose-hr:border-border/60',
        },
      },
    },
    [procedure?.id, resolved]
  )

  useEffect(() => () => { editor?.destroy() }, [editor])

  // Container de l'éditeur pour appliquer les transforms Doc (callouts, anchors)
  const editorContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor) return
    const sync = () => setPreviewContent(editor.getJSON() as TipTapDoc)
    // Re-applique les transforms (callouts, ids) sur le DOM rendu de l'éditeur
    // à chaque update — décalé en RAF pour laisser ProseMirror finir sa render.
    let raf: number | null = null
    const applyTransforms = () => {
      if (raf !== null) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const root = editorContainerRef.current
        if (root) applyDocTransforms(root, 'docs')
      })
    }
    sync()
    applyTransforms()
    editor.on('update', () => { sync(); applyTransforms() })
    editor.on('create', () => { sync(); applyTransforms() })
    return () => {
      if (raf !== null) cancelAnimationFrame(raf)
      editor.off('update', sync)
      editor.off('create', sync)
    }
  }, [editor])

  const previewKey = useMemo(() => {
    return `${procedure?.id ?? 'new'}-${previewMode ? 'on' : 'off'}`
  }, [procedure?.id, previewMode])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Le titre est obligatoire')
      return
    }
    if (!editor) return
    setSaving(true)
    const content = editor.getJSON() as TipTapDoc
    const payload = {
      title: title.trim(),
      summary: summary.trim() || null,
      category_id: categoryId,
      tags,
      content,
    }
    const result = procedure
      ? await update(procedure.id, payload)
      : await create(payload)
    setSaving(false)
    if (result) {
      toast.success(procedure ? 'Fiche mise à jour' : 'Fiche créée')
      onSaved(result)
    } else {
      toast.error('Erreur à la sauvegarde')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 bg-surface-1">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-semibold text-foreground">
            {procedure ? 'Éditer la fiche' : 'Nouvelle fiche'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm transition-colors',
              previewMode
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-surface-2',
            )}
            title={previewMode ? 'Masquer l\u2019aperçu' : 'Afficher l\u2019aperçu'}
          >
            {previewMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            Aperçu
          </button>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-muted-foreground hover:bg-surface-2 text-sm"
          >
            <X className="h-3.5 w-3.5" />
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded-md hover:bg-primary/90 text-sm font-medium',
              saving && 'opacity-60 cursor-not-allowed'
            )}
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-border/40 bg-surface-1 space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Titre *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. Acheter un nom de domaine sur Namecheap"
            className="w-full px-3 py-2 bg-surface-2 border border-border rounded-md text-foreground text-base font-medium focus:outline-none focus:border-primary/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Résumé</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="1-2 lignes décrivant la procédure…"
            rows={2}
            className="w-full px-3 py-2 bg-surface-2 border border-border rounded-md text-foreground text-sm focus:outline-none focus:border-primary/50 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Catégorie</label>
            <select
              value={categoryId ?? ''}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="w-full px-3 py-2 bg-surface-2 border border-border rounded-md text-foreground text-sm focus:outline-none focus:border-primary/50"
            >
              <option value="">— Sans catégorie —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Tags</label>
            <TagInput value={tags} onChange={setTags} suggestions={allTags} />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-surface-1 flex min-h-0">
        <div className={cn('flex flex-col min-w-0', previewMode ? 'w-1/2 border-r border-border/40' : 'w-full')}>
          <ProcedureToolbar editor={editor} procedureId={procedure?.id ?? null} />
          <div
            ref={editorContainerRef}
            className={cn('px-6 py-6 mx-auto w-full overflow-y-auto', previewMode ? 'max-w-none' : 'max-w-4xl')}
          >
            <EditorContent editor={editor} />
          </div>
        </div>

        {previewMode && (
          <div className="w-1/2 min-w-0 overflow-y-auto bg-background">
            <div className="px-8 py-8">
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary mb-3">
                Aperçu — rendu Doc
              </div>
              {title && (
                <h1 className="text-3xl font-semibold text-foreground tracking-tight leading-tight mb-3">
                  {title}
                </h1>
              )}
              {summary && (
                <p className="text-base text-muted-foreground leading-[1.7] mb-6">{summary}</p>
              )}
              <div className="h-px bg-gradient-to-r from-primary/40 via-border to-transparent mb-8" />
              <Prose
                content={previewContent}
                contentKey={previewKey}
                calloutStyle="docs"
                className={cn(
                  'procedure-prose procedure-prose-doc',
                  'prose prose-invert max-w-none',
                  'prose-headings:text-foreground prose-headings:font-semibold prose-headings:tracking-tight',
                  'prose-h2:text-[1.35rem] prose-h2:mt-12 prose-h2:mb-5 prose-h2:uppercase prose-h2:tracking-wide',
                  'prose-h3:text-base prose-h3:mt-8 prose-h3:mb-3',
                  'prose-p:text-foreground/85 prose-p:leading-[1.85] prose-p:my-4 prose-p:text-[0.95rem]',
                  'prose-strong:text-foreground prose-strong:font-semibold',
                  'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
                  'prose-code:text-primary prose-code:bg-surface-3/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.85em] prose-code:font-mono prose-code:font-normal',
                  'prose-code:before:content-none prose-code:after:content-none',
                  'prose-li:text-foreground/85 prose-li:my-2 prose-li:leading-[1.85]',
                  'prose-img:rounded-md prose-img:my-8',
                )}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
