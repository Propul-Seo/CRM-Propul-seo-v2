import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { TaskList, TaskItem } from '@tiptap/extension-list'

// Image étendue avec `storagePath` pour persister le chemin Supabase Storage
// à côté du `src` (URL signée temporaire). Voir lib/image-content.ts.
const StorageImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      storagePath: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-storage-path'),
        renderHTML: (attrs) =>
          attrs.storagePath ? { 'data-storage-path': attrs.storagePath } : {},
      },
    }
  },
})

export function buildExtensions(opts: { placeholder?: string; editable?: boolean } = {}) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      codeBlock: { HTMLAttributes: { class: 'rounded-md bg-surface-3 p-3 text-xs' } },
      blockquote: { HTMLAttributes: { class: 'border-l-2 border-primary/60 pl-3 italic text-muted-foreground' } },
    }),
    StorageImage.configure({
      HTMLAttributes: { class: 'rounded-md max-w-full my-3' },
      allowBase64: false,
    }),
    Link.configure({
      openOnClick: true,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        class: 'text-primary underline underline-offset-2 hover:text-primary/80',
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),
    Placeholder.configure({
      placeholder: opts.placeholder ?? 'Commencez à rédiger la procédure…',
    }),
    Typography,
    TaskList.configure({
      HTMLAttributes: { class: 'procedure-tasklist' },
    }),
    TaskItem.configure({
      HTMLAttributes: { class: 'procedure-taskitem' },
      nested: true,
    }),
  ]
}
