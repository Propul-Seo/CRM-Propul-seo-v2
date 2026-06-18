import { useEffect, useState } from 'react'
import { Loader2, Play, Rocket } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ProjectAssigneeButtons } from '@/modules/ProjectsV3/components/ProjectAssigneeButtons'

interface AssigneeOption {
  id: string
  name: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadName: string
  assignees: AssigneeOption[]
  converting: boolean
  /** Confirme la conversion. `assignedToId` = null → « À attribuer ». */
  onConfirm: (assignedToId: string | null) => void
}

/**
 * Modal de transition CRM → projet actif. On choisit le responsable, puis le
 * lead est converti en projet créé directement en « En cours » (in_progress).
 */
export function ConvertLeadModal({ open, onOpenChange, leadName, assignees, converting, onConfirm }: Props) {
  const [assignee, setAssignee] = useState('')

  // Reset du choix à chaque ouverture.
  useEffect(() => { if (open) setAssignee('') }, [open])

  return (
    <Dialog open={open} onOpenChange={(o) => !converting && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-[#8B5CF6]" />
            <DialogTitle>Passer en projet actif</DialogTitle>
          </div>
          <DialogDescription>
            « {leadName} » deviendra un projet. Choisis le responsable, le projet sera créé en
            {' '}<span className="inline-flex items-center gap-1 font-medium text-[#10b981]"><Play className="h-3 w-3" />En cours</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b7280]">Responsable</p>
          <ProjectAssigneeButtons
            users={assignees}
            value={assignee}
            onChange={setAssignee}
            allowToggleOff
            layout="cards"
          />
          <p className="text-[11px] text-[#6b7280]">
            Laisse vide pour mettre le projet dans « À attribuer ».
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={converting}>
            Annuler
          </Button>
          <Button
            onClick={() => onConfirm(assignee || null)}
            disabled={converting}
            className="bg-[#8B5CF6] hover:bg-[#7c3aed] text-white"
          >
            {converting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Passer en projet actif
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
