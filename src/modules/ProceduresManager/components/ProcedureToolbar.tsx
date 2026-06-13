import { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Minus,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  AlertOctagon,
  Star,
  ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { uploadProcedureImage } from '../lib/upload-image'
import { buildCalloutNode, type CalloutKind } from '../lib/procedure-template'

interface ProcedureToolbarProps {
  editor: Editor | null
  procedureId: string | null
}

export function ProcedureToolbar({ editor, procedureId }: ProcedureToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  if (!editor) return null

  const btn = (active: boolean, extra = '') =>
    cn(
      'p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors',
      active && 'bg-primary/15 text-primary hover:bg-primary/20',
      extra
    )

  const handleImageClick = () => fileRef.current?.click()

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const { path, signedUrl } = await uploadProcedureImage(file, procedureId)
      editor
        .chain()
        .focus()
        .setImage({ src: signedUrl, storagePath: path } as { src: string; storagePath: string })
        .run()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur upload image')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const insertCallout = (kind: CalloutKind) => {
    editor.chain().focus().insertContent(buildCalloutNode(kind)).run()
  }

  const handleLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL du lien', previous ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-border/40 bg-surface-1/95 backdrop-blur px-3 py-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btn(editor.isActive('heading', { level: 1 }))}
        title="Titre 1"
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btn(editor.isActive('heading', { level: 2 }))}
        title="Titre 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btn(editor.isActive('heading', { level: 3 }))}
        title="Titre 3"
      >
        <Heading3 className="h-4 w-4" />
      </button>

      <div className="w-px h-5 bg-border/60 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btn(editor.isActive('bold'))}
        title="Gras"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btn(editor.isActive('italic'))}
        title="Italique"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btn(editor.isActive('strike'))}
        title="Barré"
      >
        <Strikethrough className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={btn(editor.isActive('code'))}
        title="Code inline"
      >
        <Code className="h-4 w-4" />
      </button>

      <div className="w-px h-5 bg-border/60 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btn(editor.isActive('bulletList'))}
        title="Liste"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btn(editor.isActive('orderedList'))}
        title="Liste numérotée"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={btn(editor.isActive('taskList'))}
        title="Liste de tâches (cases à cocher)"
      >
        <ListChecks className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btn(editor.isActive('blockquote'))}
        title="Citation"
      >
        <Quote className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={btn(false)}
        title="Séparateur"
      >
        <Minus className="h-4 w-4" />
      </button>

      <div className="w-px h-5 bg-border/60 mx-1" />

      <button
        type="button"
        onClick={() => insertCallout('tip')}
        className={btn(false, 'hover:!text-violet-300')}
        title="Astuce 💡"
      >
        <Lightbulb className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => insertCallout('warning')}
        className={btn(false, 'hover:!text-amber-300')}
        title="Attention ⚠️"
      >
        <AlertTriangle className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => insertCallout('success')}
        className={btn(false, 'hover:!text-emerald-300')}
        title="Validation ✅"
      >
        <CheckCircle2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => insertCallout('note')}
        className={btn(false, 'hover:!text-sky-300')}
        title="Note ℹ️"
      >
        <Info className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => insertCallout('critical')}
        className={btn(false, 'hover:!text-red-400')}
        title="Vital 🟥 (bloquant)"
      >
        <ShieldAlert className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => insertCallout('important')}
        className={btn(false, 'hover:!text-orange-400')}
        title="Important 🟧"
      >
        <AlertOctagon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => insertCallout('recommended')}
        className={btn(false, 'hover:!text-yellow-400')}
        title="Recommandé 🟨"
      >
        <Star className="h-4 w-4" />
      </button>

      <div className="w-px h-5 bg-border/60 mx-1" />

      <button type="button" onClick={handleLink} className={btn(editor.isActive('link'))} title="Lien">
        <LinkIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={handleImageClick}
        className={btn(false)}
        title="Image"
        disabled={uploading}
      >
        <ImageIcon className={cn('h-4 w-4', uploading && 'animate-pulse')} />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleImageChange}
        className="hidden"
      />

      <div className="w-px h-5 bg-border/60 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        className={btn(false)}
        title="Annuler"
        disabled={!editor.can().undo()}
      >
        <Undo2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        className={btn(false)}
        title="Rétablir"
        disabled={!editor.can().redo()}
      >
        <Redo2 className="h-4 w-4" />
      </button>
    </div>
  )
}
