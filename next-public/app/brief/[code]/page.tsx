import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase-server'
import { BriefForm } from './BriefForm'

type Props = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const supabase = createSupabaseServer()
  const { data: project } = await supabase
    .from('projects_v2')
    .select('name')
    .eq('brief_short_code', code)
    .eq('brief_token_enabled', true)
    .single()
  return {
    title: `Brief — ${project?.name ?? 'Propulseo'}`,
    robots: 'noindex, nofollow',
  }
}

export default async function BriefPage({ params }: Props) {
  const { code } = await params
  const supabase = createSupabaseServer()

  const { data: project } = await supabase
    .from('projects_v2')
    .select('id, name')
    .eq('brief_short_code', code)
    .eq('brief_token_enabled', true)
    .single()

  if (!project) notFound()

  const { data: brief } = await supabase
    .from('project_briefs_v2')
    .select('id, objective, target_audience, pages, techno, design_references, notes, submitted_at')
    .eq('project_id', project.id)
    .maybeSingle()

  return (
    <BriefForm
      code={code}
      projectName={project.name}
      projectId={project.id}
      brief={brief ?? null}
      alreadySubmitted={!!(brief?.submitted_at)}
    />
  )
}
