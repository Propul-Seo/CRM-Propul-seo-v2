import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase-server'
import { Logo } from '@/components/Logo'
import { BriefInviteFormV5 } from './BriefInviteFormV5'

type Props = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const supabase = createSupabaseServer()
  const { data } = await supabase
    .from('brief_invitations')
    .select('company_name')
    .eq('short_code', code)
    .single()
  return {
    title: `Brief projet — ${data?.company_name ?? 'Propulseo'}`,
    description: 'Complétez votre brief projet en quelques minutes.',
    robots: 'noindex, nofollow',
  }
}

export default async function BriefInvitePage({ params }: Props) {
  const { code } = await params
  const supabase = createSupabaseServer()

  const { data: invitation } = await supabase
    .from('brief_invitations')
    .select('id, short_code, company_name, status')
    .eq('short_code', code)
    .single()

  if (!invitation) notFound()

  if (invitation.status === 'submitted') {
    return (
      <div style={{ minHeight: '100vh', background: '#0e0b1e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}>
        <div style={{
          maxWidth: 480, width: '100%', textAlign: 'center',
          background: '#16122e', borderRadius: 32, padding: 64,
          border: '1px solid #2d2654', boxShadow: '0 20px 60px rgba(99,102,241,0.15)',
        }}>
          <div style={{ marginBottom: 28 }}>
            <Logo size={140} />
          </div>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #6366f1, #9333ea)',
            borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <p style={{ fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)", fontSize: 10, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: 12 }}>
            Brief reçu
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#ede9fe', letterSpacing: '-0.03em', margin: '0 0 16px' }}>
            DÉJÀ TRANSMIS.
          </h1>
          <p style={{ color: '#6b5fa0', lineHeight: 1.7, fontSize: 16, margin: 0 }}>
            Votre brief a bien été reçu par l&apos;équipe Propulseo.<br />
            Nous reviendrons vers vous très prochainement.
          </p>
          <p style={{ marginTop: 40, fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)", fontSize: 9, color: '#3d3168', textTransform: 'uppercase', letterSpacing: '0.4em' }}>
            Propulseo Studio · Excellence Digitale
          </p>
        </div>
      </div>
    )
  }

  return (
    <BriefInviteFormV5
      code={code}
      companyName={invitation.company_name ?? ''}
    />
  )
}
