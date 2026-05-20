import { Mail, Phone, Calendar } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { RecapAccordion } from '@/modules/EspaceClient/qualification/components/RecapAccordion'
import type { QualificationDraft } from '@/modules/EspaceClient/qualification/schema'
import type { QualificationLead } from '../hooks/useLeadsV3Qualification'

interface Props {
  lead: QualificationLead | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

// Drawer avec toutes les infos du lead qualif. Réutilise RecapAccordion
// (mêmes sections que le récap final du questionnaire côté client).
// Boutons d'action (Convertir / Archiver) ajoutés dans le Bloc C.
export function QualificationLeadDetailsSheet({ lead, open, onOpenChange }: Props) {
  if (!lead) return null
  const draft = lead.raw as QualificationDraft

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-white text-stone-900 sm:max-w-xl">
        <SheetHeader className="space-y-2 pb-4 text-left">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
            📋 Questionnaire complété
          </div>
          <SheetTitle className="text-[20px] font-bold text-stone-900">
            {lead.full_name ?? lead.email}
          </SheetTitle>
          <SheetDescription className="text-[13px] text-stone-500">
            {lead.company_name ?? 'Entreprise non renseignée'}
          </SheetDescription>
          <div className="flex flex-wrap items-center gap-3 pt-2 text-[12px] text-stone-600">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {lead.email}
            </span>
            {lead.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {lead.phone}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Soumis le {formatDate(lead.submitted_at)}
            </span>
          </div>
        </SheetHeader>

        <div className="mt-2">
          <RecapAccordion draft={draft} />
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-900">
          <p className="font-semibold">💡 Prochaines actions</p>
          <p className="mt-1">
            Boutons « Convertir en projet » et « Archiver » disponibles dans la prochaine itération (Bloc C).
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
