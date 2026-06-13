import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ActionDef } from './types'

interface Props<T extends string> {
  open: boolean
  onClose: () => void
  onSubmit: (type: T, content: string) => Promise<void>
  actions: ActionDef<T>[]
  defaultType: T
  initialContent?: string
  mode?: 'create' | 'edit'
}

export function ActivityModal<T extends string>({
  open,
  onClose,
  onSubmit,
  actions,
  defaultType,
  initialContent = '',
  mode = 'create',
}: Props<T>) {
  const [type, setType] = useState<T>(defaultType)
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (open) {
      setType(defaultType)
      setContent(initialContent)
    }
  }, [open, defaultType, initialContent])

  // À l'ouverture (ou quand le contenu initial change), focus le textarea
  // et place le curseur à la fin du texte prérempli pour permettre de
  // compléter directement (ex : "Première décision projet — pack pro").
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      const end = el.value.length
      el.setSelectionRange(end, end)
    })
    return () => cancelAnimationFrame(id)
  }, [open, initialContent])

  const handleSubmit = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      await onSubmit(type, content.trim())
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? "Modifier l'activité" : 'Nouvelle activité'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as T)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {actions.map((a) => (
                  <SelectItem key={a.type} value={a.type}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Contenu</Label>
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Détails de l'activité..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={saving || !content.trim()}>
            {saving ? 'Enregistrement...' : mode === 'edit' ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
