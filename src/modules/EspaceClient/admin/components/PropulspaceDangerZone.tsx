import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TypedDeleteDialog, type TypedDeleteDialogDependency } from '@/components/ui/TypedDeleteDialog'
import { usePropulspaceDeletion, type ProjectDeps } from '../hooks/usePropulspaceDeletion'

type DangerZoneProps =
  | {
      kind: 'project'
      projectId: string
      projectName: string
      onAfterDelete: () => void
      onAfterArchive: () => void
    }
  | {
      kind: 'lead'
      leadId: string
      leadName: string
      onAfterDelete: () => void
    }

/**
 * Bouton "Supprimer" + dialog typé pour projets ou leads qualif Propul'Space.
 * - Projet : inspecte les dépendances → propose archive si factures/signatures, sinon delete direct.
 * - Lead : delete simple (refus côté DB si déjà converti).
 */
export function PropulspaceDangerZone(props: DangerZoneProps) {
  const { busy, inspectProject, archiveProject, deleteProject, deleteQualifLead } = usePropulspaceDeletion()
  const [open, setOpen] = useState(false)
  const [projectDeps, setProjectDeps] = useState<ProjectDeps | null>(null)

  const openProjectDialog = async () => {
    if (props.kind !== 'project') return
    const deps = await inspectProject(props.projectId)
    if (!deps) {
      toast.error('Impossible d\'inspecter ce projet')
      return
    }
    setProjectDeps(deps)
    setOpen(true)
  }

  const openLeadDialog = () => setOpen(true)

  const renderProjectDialog = () => {
    if (props.kind !== 'project' || !projectDeps) return null
    const hasLegalData = projectDeps.invoices_count > 0 || projectDeps.signatures_count > 0
    const dependencies: TypedDeleteDialogDependency[] = [
      { label: 'facture(s)', count: projectDeps.invoices_count, severity: 'high' },
      { label: 'signature(s)', count: projectDeps.signatures_count, severity: 'high' },
      { label: 'document(s)', count: projectDeps.documents_count, severity: 'medium' },
    ]
    return (
      <TypedDeleteDialog
        open={open}
        onOpenChange={setOpen}
        entityLabel="le projet"
        entityName={props.projectName}
        dependencies={dependencies}
        description={hasLegalData
          ? 'Ce projet contient des factures ou signatures à valeur légale. Archive recommandé. Suppression définitive possible uniquement si tu as sauvegardé ces données ailleurs.'
          : 'Action irréversible. Tape le nom exact pour confirmer.'}
        archiveCta={hasLegalData ? {
          label: 'Archiver à la place',
          onConfirm: async () => {
            const res = await archiveProject(props.projectId)
            if (res.success) { toast.success('Projet archivé'); props.onAfterArchive() }
            else toast.error(res.error ?? 'Erreur')
          },
        } : undefined}
        deleteCta={{
          label: hasLegalData ? 'Supprimer définitivement' : 'Supprimer',
          onConfirm: async () => {
            const res = await deleteProject(props.projectId, hasLegalData)
            if (res.success) {
              const cleanup = res.storageCleanup
              const msg = cleanup && cleanup.deleted > 0
                ? `Projet supprimé (${cleanup.deleted} fichier${cleanup.deleted > 1 ? 's' : ''} Storage nettoyé${cleanup.deleted > 1 ? 's' : ''})`
                : 'Projet supprimé'
              toast.success(msg)
              props.onAfterDelete()
            } else toast.error(res.error ?? 'Erreur')
          },
        }}
      />
    )
  }

  const renderLeadDialog = () => {
    if (props.kind !== 'lead') return null
    return (
      <TypedDeleteDialog
        open={open}
        onOpenChange={setOpen}
        entityLabel="le lead"
        entityName={props.leadName}
        description="Suppression définitive du lead et de ses fichiers uploads. Action irréversible."
        deleteCta={{
          label: 'Supprimer définitivement',
          onConfirm: async () => {
            const res = await deleteQualifLead(props.leadId)
            if (res.success) { toast.success('Lead supprimé'); props.onAfterDelete() }
            else toast.error(res.error ?? 'Erreur')
          },
        }}
      />
    )
  }

  const trigger = props.kind === 'project' ? openProjectDialog : openLeadDialog

  return (
    <>
      <Button variant="destructive" size="sm" onClick={trigger} disabled={busy}>
        <Trash2 className="mr-2 h-4 w-4" />
        Supprimer
      </Button>
      {renderProjectDialog()}
      {renderLeadDialog()}
    </>
  )
}
