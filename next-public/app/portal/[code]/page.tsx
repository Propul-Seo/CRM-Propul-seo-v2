import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase-server'
import { PortalView } from './PortalView'
import type { PortalData } from './PortalView'

type Props = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const supabase = createSupabaseServer()
  const now = new Date().toISOString()
  const { data } = await supabase
    .from('projects_v2')
    .select('name, client_name')
    .eq('portal_short_code', code)
    .eq('portal_enabled', true)
    .or(`portal_expires_at.is.null,portal_expires_at.gt.${now}`)
    .single()
  return {
    title: `Suivi projet — ${data?.client_name ?? data?.name ?? 'Propulseo'}`,
    robots: 'noindex, nofollow',
  }
}

export default async function PortalPage({ params }: Props) {
  const { code } = await params
  const supabase = createSupabaseServer()
  const now = new Date().toISOString()

  // 1. Projet (vérifie short_code + enabled + non expiré)
  const { data: project } = await supabase
    .from('projects_v2')
    .select('id, name, client_name, client_id, status, progress, completion_score, next_action_label, next_action_due, presta_type, start_date, end_date, budget, ai_summary, portal_expires_at')
    .eq('portal_short_code', code)
    .eq('portal_enabled', true)
    .or(`portal_expires_at.is.null,portal_expires_at.gt.${now}`)
    .single()

  if (!project) notFound()

  // 2. Checklist (tâches racines seulement)
  const { data: checklist } = await supabase
    .from('checklist_items_v2')
    .select('id, title, phase, status')
    .eq('project_id', project.id)
    .is('parent_task_id', null)
    .order('sort_order', { ascending: true })

  // 3. Factures (envoyées, payées, en retard)
  const { data: invoices } = await supabase
    .from('project_invoices_v2')
    .select('id, label, amount, status, date, due_date')
    .eq('project_id', project.id)
    .in('status', ['sent', 'paid', 'overdue'])
    .order('date', { ascending: false })

  // 4. Documents partagés (maquettes / livrables / contrats uniquement)
  const { data: documents } = await supabase
    .from('project_documents_v2')
    .select('id, name, category, file_url, file_size, mime_type, created_at')
    .eq('project_id', project.id)
    .in('category', ['mockup', 'deliverable', 'contract'])
    .order('created_at', { ascending: false })

  const portalData: PortalData = {
    project,
    checklist: checklist ?? [],
    invoices: invoices ?? [],
    documents: documents ?? [],
  }

  return <PortalView data={portalData} />
}
