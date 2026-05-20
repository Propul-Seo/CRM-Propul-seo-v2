import { useState } from 'react'
import { Mail, Phone, Calendar, ArrowRight, Archive, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RecapAccordion } from '@/modules/EspaceClient/qualification/components/RecapAccordion'
import type { QualificationDraft } from '@/modules/EspaceClient/qualification/schema'
import type { QualificationLead } from '../hooks/useLeadsV3Qualification'
import { useConvertQualifLead } from '../hooks/useConvertQualifLead'
import { useArchiveQualifLead } from '../hooks/useArchiveQualifLead'

interface Props {
  lead: QualificationLead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onActionComplete?: () => void
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

export function QualificationLeadDetailsSheet({ lead, open, onOpenChange, onActionComplete }: Props) {
  const navigate = useNavigate()
  const { convert, converting } = useConvertQualifLead()
  const { archive, archiving } = useArchiveQualifLead()
  const [confirmConvert, setConfirmConvert] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [activatePortal, setActivatePortal] = useState(true)
  const [archiveReason, setArchiveReason] = useState('')

  if (!lead) return null
  const draft = lead.raw as QualificationDraft

  const handleConvert = async () => {
    const res = await convert(lead, activatePortal)
    setConfirmConvert(false)
    if (res.success && res.projectId) {
      toast.success(
        res.portalInvited
          ? 'Projet créé + portail activé ✓'
          : activatePortal ? 'Projet créé (portail à activer manuellement)' : 'Projet créé ✓',
        { action: { label: 'Ouvrir le projet', onClick: () => navigate(`/projets-v3-preview/${res.projectId}`) } },
      )
      onOpenChange(false)
      onActionComplete?.()
    } else {
      toast.error(`Conversion échouée : ${res.error ?? 'erreur inconnue'}`)
    }
  }

  const handleArchive = async () => {
    const res = await archive(lead.id, archiveReason || null)
    setConfirmArchive(false)
    if (res.success) {
      toast.success('Lead archivé ✓')
      setArchiveReason('')
      onOpenChange(false)
      onActionComplete?.()
    } else {
      toast.error(`Archivage échoué : ${res.error ?? 'erreur inconnue'}`)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col overflow-hidden border-l border-[#1f1830] bg-[#0a0814] text-[#ede9fe] sm:max-w-xl">
          <SheetHeader className="space-y-2 pb-4 text-left">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
              📋 Questionnaire complété
            </div>
            <SheetTitle className="text-[20px] font-bold text-[#ede9fe]">
              {lead.full_name ?? lead.email}
            </SheetTitle>
            <SheetDescription className="text-[13px] text-[#9ca3af]">
              {lead.company_name ?? 'Entreprise non renseignée'}
            </SheetDescription>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[12px] text-[#9ca3af]">
              <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{lead.email}</span>
              {lead.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{lead.phone}</span>}
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Soumis le {formatDate(lead.submitted_at)}</span>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-2">
            <RecapAccordion draft={draft} />
          </div>

          <div className="border-t border-[#1f1830] bg-[#0f0a1f] px-1 py-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => setConfirmConvert(true)} disabled={converting || archiving}
                className="h-11 flex-1 gap-1.5 bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 font-semibold text-white shadow-md hover:shadow-lg">
                {converting ? <><Loader2 className="h-4 w-4 animate-spin" />Conversion…</> : <>Convertir en projet<ArrowRight className="h-4 w-4" /></>}
              </Button>
              <Button onClick={() => setConfirmArchive(true)} disabled={converting || archiving}
                variant="outline" className="h-11 gap-1.5 border-[#2a1f3d] bg-transparent text-[#ede9fe] hover:bg-[#1f1830]">
                <Archive className="h-4 w-4" />Archiver
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmConvert} onOpenChange={setConfirmConvert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir ce lead en projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Un nouveau projet sera créé dans le CRM avec les infos du questionnaire.
              Le lead sera marqué comme converti et disparaîtra de la colonne « Questionnaire complété ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex items-start gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-[13px] text-stone-700">
            <Checkbox checked={activatePortal} onCheckedChange={(v) => setActivatePortal(v === true)} className="mt-0.5" />
            <span>
              <span className="font-semibold">Activer le portail client</span>
              <span className="mt-0.5 block text-[12px] text-stone-500">Envoie l'invitation à {lead.email} pour qu'il accède à son espace.</span>
            </span>
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={converting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvert} disabled={converting}
              className="bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500">
              {converting ? 'Conversion…' : 'Convertir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver ce lead ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le lead passera en statut « non qualifié » et disparaîtra de la colonne. Il reste accessible dans la base pour les statistiques.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea placeholder="Raison (optionnel) : ex. hors budget, faux contact, projet annulé…"
            value={archiveReason} onChange={e => setArchiveReason(e.target.value)} className="min-h-[80px]" maxLength={500} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={archiving}
              className="bg-amber-600 hover:bg-amber-700">
              {archiving ? 'Archivage…' : 'Archiver'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
