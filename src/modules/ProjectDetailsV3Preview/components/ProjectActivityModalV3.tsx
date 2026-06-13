import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PROJECT_V3_ACTIONS } from '../activityConfig'
import type { ActivityType } from '@/types/project-v2'

export interface ProjectActivityDraft {
  type: ActivityType
  content: string
  realizedAt: string
  nextActions: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (draft: ProjectActivityDraft) => Promise<void>
  /** Type pré-sélectionné (boutons de l'état vide). */
  defaultType?: ActivityType
  /** Contenu pré-rempli (boutons de l'état vide). */
  initialContent?: string
}

/** Date du jour au format YYYY-MM-DD (pour l'input date). */
function todayISODate(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Modal d'ajout d'activité enrichi (Synthèse projet) : type, date de réalisation,
 * actions réalisées (= content) et prochaines actions (= metadata.next_actions).
 */
export function ProjectActivityModalV3({ open, onClose, onSubmit, defaultType, initialContent = '' }: Props) {
  const [type, setType] = useState<ActivityType>(defaultType ?? PROJECT_V3_ACTIONS[0].type)
  const [realizedAt, setRealizedAt] = useState(todayISODate())
  const [content, setContent] = useState(initialContent)
  const [nextActions, setNextActions] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setType(defaultType ?? PROJECT_V3_ACTIONS[0].type)
      setRealizedAt(todayISODate())
      setContent(initialContent)
      setNextActions('')
    }
  }, [open, defaultType, initialContent])

  const handleSubmit = async () => {
    if (!content.trim() || !realizedAt) return
    setSaving(true)
    try {
      await onSubmit({
        type,
        content: content.trim(),
        realizedAt,
        nextActions: nextActions.trim() || null,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter une activité</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_V3_ACTIONS.map((a) => (
                    <SelectItem key={a.type} value={a.type}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date de réalisation</Label>
              <Input type="date" value={realizedAt} onChange={(e) => setRealizedAt(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Actions réalisées</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ce qui a été fait…"
              rows={4}
              autoFocus
            />
          </div>
          <div>
            <Label>Prochaines actions <span className="text-[#9ca3af] font-normal">(optionnel)</span></Label>
            <Textarea
              value={nextActions}
              onChange={(e) => setNextActions(e.target.value)}
              placeholder="Ce qui reste à faire…"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={saving || !content.trim() || !realizedAt}>
            {saving ? 'Enregistrement…' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
