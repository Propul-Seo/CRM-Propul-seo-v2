import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { buildExtensions } from '../../../lib/tiptap-extensions'
import { useResolvedContent } from '../../../hooks/useResolvedContent'
import { applyDocTransforms, type CalloutStyle } from '../../../lib/transform-doc'
import type { TipTapDoc } from '../../../types'

interface ProseProps {
  content: TipTapDoc
  contentKey: string
  className?: string
  calloutStyle?: CalloutStyle
}

export function Prose({ content, contentKey, className, calloutStyle = 'docs' }: ProseProps) {
  const { resolved } = useResolvedContent(content)
  const containerRef = useRef<HTMLDivElement>(null)
  const editor = useEditor(
    {
      editable: false,
      extensions: buildExtensions({ editable: false }),
      content: resolved,
    },
    [contentKey, resolved],
  )

  useEffect(() => {
    if (!editor) return
    const apply = () => {
      const root = containerRef.current
      if (!root) return
      applyDocTransforms(root, calloutStyle)
    }
    let raf = requestAnimationFrame(apply)
    const onUpdate = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(apply)
    }
    editor.on('create', onUpdate)
    editor.on('update', onUpdate)
    return () => {
      cancelAnimationFrame(raf)
      editor.off('create', onUpdate)
      editor.off('update', onUpdate)
    }
  }, [editor, resolved, calloutStyle])

  return (
    <div ref={containerRef} className={cn(className)}>
      <EditorContent editor={editor} />
    </div>
  )
}
