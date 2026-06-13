import { useState } from 'react'
import { Mail, Phone, Calendar, ArrowRight, Archive, Loader2, Sparkles, Building2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RecapAccordion } from '@/modules/EspaceClient/qualification/components/RecapAccordion'
import type { QualificationDraft } from '@/modules/EspaceClient/qualification/schema'
import type { QualificationLead } from '../hooks/useLeadsV3Qualification'
import { useConvertQualifLead } from '../hooks/useConvertQualifLead'
import { useArchiveQualifLead } from '../hooks/useArchiveQualifLead'
import { PropulspaceDangerZone } from '@/modules/EspaceClient/admin/components/PropulspaceDangerZone'

interface Props {
  lead: QualificationLead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onActionComplete?: () => void
}

function initialsOf(name: string | null, email: string): string {
  const src = name?.trim() || email
  return src.split(/[\s.@]/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '?'
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

// Override styling RecapAccordion (consommateur côté admin dark) via descendants selectors.
const RECAP_DARK = '[&_ul]:!border-[#1f1b3a] [&_ul]:!bg-transparent [&_li]:!border-[#1f1b3a] [&_button[aria-expanded]]:!bg-[#0f0a1f]/60 [&_button[aria-expanded]]:!text-[#ede9fe] [&_button[aria-expanded]:hover]:!bg-[#1a1233]/80 [&_dl]:!bg-[#0a0814]/60 [&_dt]:!text-[#a78bfa]/70 [&_dd]:!text-[#ede9fe] [&_span.text-\\[var\\(--ps-fg\\)\\]]:!text-[#ede9fe] [&_span.text-\\[var\\(--ps-fg-muted\\)\\]]:!text-[#9ca3af] [&_.bg-\\[var\\(--ps-primary-subtle\\)\\]]:!bg-violet-500/20 [&_.text-\\[var\\(--ps-primary-text\\)\\]]:!text-violet-300 [&_.divide-\\[var\\(--ps-border-soft\\)\\]>:not\\(\\[hidden\\]\\)~:not\\(\\[hidden\\]\\)]:!border-[#1f1b3a]'

export function QualificationLeadDetailsSheet({ lead, open, onOpenChange, onActionComplete }: Props) {
  const navigate = useNavigate()
  const { convert, converting } = useConvertQualifLead()
  const { archive, archiving } = useArchiveQualifLead()
  const [confirmConvert, setConfirmConvert] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [archiveReason, setArchiveReason] = useState('')

  if (!lead) return null
  const draft = lead.raw as QualificationDraft
  const busy = converting || archiving

  const handleConvert = async () => {
    const res = await convert(lead)
    setConfirmConvert(false)
    if (res.success && res.projectId) {
      toast.success('Projet créé ✓', {
        action: { label: 'Ouvrir le projet', onClick: () => navigate(`/projets-v3-preview/${res.projectId}`) },
      })
      onOpenChange(false); onActionComplete?.()
    } else toast.error(`Conversion échouée : ${res.error ?? 'erreur inconnue'}`)
  }

  const handleArchive = async () => {
    const res = await archive(lead.id, archiveReason || null)
    setConfirmArchive(false)
    if (res.success) {
      toast.success('Lead archivé ✓'); setArchiveReason(''); onOpenChange(false); onActionComplete?.()
    } else toast.error(`Archivage échoué : ${res.error ?? 'erreur inconnue'}`)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col overflow-hidden border-l border-[#1f1b3a] bg-[#0a0814] p-0 text-[#ede9fe] sm:max-w-xl [&>button]:hidden">
          <div className="h-[3px] w-full shrink-0 bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500" />

          {/* Aurora ambient */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-[15%] top-[8%] h-[400px] w-[400px] rounded-full opacity-[0.10] blur-3xl"
              style={{ background: 'radial-gradient(circle, #38bdf8 0%, transparent 70%)' }} />
            <div className="absolute -right-[10%] top-[35%] h-[380px] w-[380px] rounded-full opacity-[0.12] blur-3xl"
              style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }} />
            <div className="absolute left-[15%] bottom-[5%] h-[320px] w-[450px] rounded-full opacity-[0.08] blur-3xl"
              style={{ background: 'radial-gradient(circle, #f472b6 0%, transparent 70%)' }} />
          </div>

          <button onClick={() => onOpenChange(false)} aria-label="Fermer"
            className="absolute right-5 top-5 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-[#1f1b3a] bg-[#0f0a1f]/70 text-[#9ca3af] backdrop-blur-sm transition hover:border-[#a78bfa]/40 hover:text-[#ede9fe]">
            <X className="h-4 w-4" />
          </button>

          <SheetHeader className="relative space-y-5 px-7 pb-6 pt-8 text-left">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-sky-300 shadow-[0_0_24px_-4px_rgba(56,189,248,0.3)]">
              <Sparkles className="h-3 w-3" /> Questionnaire complété
            </div>

            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-500 via-violet-600 to-pink-500 blur-lg opacity-50" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-violet-600 to-pink-500 text-[17px] font-bold text-white shadow-lg ring-1 ring-white/20">
                  {initialsOf(lead.full_name, lead.email)}
                </div>
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <SheetTitle className="text-[22px] font-bold leading-tight tracking-tight text-[#ede9fe]">
                  {lead.full_name ?? lead.email}
                </SheetTitle>
                <SheetDescription className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-[#a78bfa]">
                  <Building2 className="h-3.5 w-3.5" />
                  {lead.company_name ?? 'Entreprise non renseignée'}
                </SheetDescription>
              </div>
            </div>

            <div className="grid gap-2.5 rounded-xl border border-[#1f1b3a] bg-[#0f0a1f]/60 p-3.5 text-[12.5px] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-sm">
              <span className="inline-flex items-center gap-2.5">
                <Mail className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                <span className="text-[#9ca3af]">Email</span>
                <span className="ml-auto truncate font-medium text-[#ede9fe]">{lead.email}</span>
              </span>
              {lead.phone && (
                <span className="inline-flex items-center gap-2.5">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                  <span className="text-[#9ca3af]">Téléphone</span>
                  <span className="ml-auto font-medium text-[#ede9fe]">{lead.phone}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-2.5">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-pink-400" />
                <span className="text-[#9ca3af]">Soumis le</span>
                <span className="ml-auto font-medium text-[#ede9fe]">{formatDate(lead.submitted_at)}</span>
              </span>
            </div>
          </SheetHeader>

          <div className={`relative flex-1 overflow-y-auto px-7 pb-5 ${RECAP_DARK}`}>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a78bfa]/80">
              Récapitulatif détaillé
            </p>
            <RecapAccordion draft={draft} />
          </div>

          <div className="relative border-t border-[#1f1b3a] bg-[#0a0814]/85 px-7 py-4 backdrop-blur-md">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => setConfirmConvert(true)} disabled={busy}
                className="group h-11 flex-1 gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 text-[13.5px] font-bold text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.55)] transition-all hover:shadow-[0_12px_32px_-8px_rgba(139,92,246,0.75)] hover:brightness-110">
                {converting ? <><Loader2 className="h-4 w-4 animate-spin" />Conversion…</>
                  : <>Convertir en projet<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
              </Button>
              <Button onClick={() => setConfirmArchive(true)} disabled={busy} variant="outline"
                className="h-11 gap-1.5 rounded-xl border-[#2a1f3d] bg-transparent text-[#a78bfa] hover:border-[#a78bfa]/50 hover:bg-[#1a1233] hover:text-[#ede9fe]">
                <Archive className="h-4 w-4" />Archiver
              </Button>
            </div>
            <div className="mt-2 flex justify-end">
              <PropulspaceDangerZone
                kind="lead"
                leadId={lead.id}
                leadName={lead.full_name || lead.email}
                onAfterDelete={() => { onOpenChange(false); onActionComplete?.() }}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmConvert} onOpenChange={setConfirmConvert}>
        <AlertDialogContent className="border-[#1f1b3a] bg-[#0a0814] text-[#ede9fe]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#ede9fe]">Convertir ce lead en projet ?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#a78bfa]">
              Un nouveau projet sera créé avec les infos du questionnaire. Le lead sera marqué comme converti.
              L'activation du portail client se gère séparément depuis l'espace Propul'Space du projet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={converting} className="border-[#1f1b3a] bg-transparent text-[#ede9fe] hover:bg-[#1a1233]">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvert} disabled={converting}
              className="bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 text-white hover:brightness-110">
              {converting ? 'Conversion…' : 'Convertir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent className="border-[#1f1b3a] bg-[#0a0814] text-[#ede9fe]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#ede9fe]">Archiver ce lead ?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#a78bfa]">
              Le lead passera en « non qualifié » et disparaîtra de la colonne. Il reste en base pour les stats.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea placeholder="Raison (optionnel) : ex. hors budget, faux contact…" value={archiveReason}
            onChange={e => setArchiveReason(e.target.value)} maxLength={500}
            className="min-h-[80px] border-[#1f1b3a] bg-[#0f0a1f]/60 text-[#ede9fe] placeholder:text-[#6b7280]" />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving} className="border-[#1f1b3a] bg-transparent text-[#ede9fe] hover:bg-[#1a1233]">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={archiving} className="bg-amber-600 text-white hover:bg-amber-700">
              {archiving ? 'Archivage…' : 'Archiver'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
