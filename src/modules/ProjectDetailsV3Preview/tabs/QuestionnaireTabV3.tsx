import { useEffect, useState } from 'react'
import { Sparkles, Loader2, Calendar, Mail, Phone, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { RecapAccordion } from '@/modules/EspaceClient/qualification/components/RecapAccordion'
import type { QualificationDraft } from '@/modules/EspaceClient/qualification/schema'
import type { ProjectV2 } from '@/types/project-v2'

interface Props {
  project: ProjectV2
}

interface QualifMeta {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  company_name: string | null
  submitted_at: string | null
  source: string | null
  project_type: string | null
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  site:     '🌐 Site web',
  site_erp: '🧩 Site + ERP',
  erp:      '⚙️ ERP / Outil métier',
}

function formatLong(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

/**
 * Onglet Questionnaire : affiche les réponses du questionnaire de qualification
 * qui a abouti à la création de ce projet. Source : qualification_leads_v2 lié
 * via converted_to_project_id. Si le projet n'a pas été créé par conversion,
 * affiche un état vide.
 */
export function QuestionnaireTabV3({ project }: Props) {
  const [meta, setMeta] = useState<QualifMeta | null>(null)
  const [draft, setDraft] = useState<QualificationDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      const { data, error: err } = await supabase
        .from('qualification_leads_v2')
        .select('*')
        .eq('converted_to_project_id', project.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (cancelled) return
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      if (!data) {
        setMeta(null); setDraft(null)
      } else {
        setMeta({
          id: data.id, full_name: data.full_name, email: data.email, phone: data.phone,
          company_name: data.company_name, submitted_at: data.submitted_at,
          source: data.source, project_type: data.project_type,
        })
        setDraft(data as unknown as QualificationDraft)
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [project.id])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[#9ca3af]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Chargement du questionnaire…
      </div>
    )
  }

  if (error) {
    return <div className="m-6 rounded-md bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">{error}</div>
  }

  if (!meta || !draft) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <Sparkles className="h-10 w-10 text-[#9ca3af] opacity-40" />
        <p className="text-sm font-medium text-[#ede9fe]">Aucun questionnaire lié</p>
        <p className="max-w-md text-xs text-[#9ca3af]">
          Ce projet n'a pas été créé via la conversion d'un lead qualifié. Le questionnaire
          s'affiche uniquement pour les projets issus du formulaire <code>/diagnostic</code>.
        </p>
      </div>
    )
  }

  const typeLabel = meta.project_type ? PROJECT_TYPE_LABELS[meta.project_type] ?? meta.project_type : null

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      <section className="rounded-xl border border-[rgba(139,92,246,0.25)] bg-gradient-to-br from-[rgba(139,92,246,0.08)] to-transparent px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[#A78BFA]" />
          <h2 className="text-[14px] font-bold text-[#ede9fe]">Questionnaire complété</h2>
          {typeLabel && (
            <span className="ml-auto text-[11px] font-medium text-[#A78BFA]">{typeLabel}</span>
          )}
        </div>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Row icon={Mail}     label="Email"      value={meta.email} />
          <Row icon={Phone}    label="Téléphone"  value={meta.phone} />
          <Row icon={Building2} label="Entreprise" value={meta.company_name} />
          <Row icon={Calendar} label="Soumis le"  value={formatLong(meta.submitted_at)} />
        </dl>
      </section>

      <section>
        <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#9ca3af]">
          Récapitulatif détaillé
        </h3>
        <div className="[&_ul]:!border-[#1f1b3a] [&_ul]:!bg-transparent [&_li]:!border-[#1f1b3a] [&_button[aria-expanded]]:!bg-[#0f0a1f]/60 [&_button[aria-expanded]]:!text-[#ede9fe] [&_button[aria-expanded]:hover]:!bg-[#1a1233]/80 [&_dl]:!bg-[#0a0814]/60 [&_dt]:!text-[#a78bfa]/70 [&_dd]:!text-[#ede9fe]">
          <RecapAccordion draft={draft} />
        </div>
      </section>
    </div>
  )
}

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9ca3af]" />
      <div className="min-w-0 flex-1">
        <dt className="text-[10px] uppercase tracking-wider text-[#9ca3af]">{label}</dt>
        <dd className="mt-0.5 truncate text-[13px] font-medium text-[#ede9fe]">{value ?? '—'}</dd>
      </div>
    </div>
  )
}
