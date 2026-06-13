import { Logo } from '@/components/Logo'
import { PortalShell } from '@/components/portal/PortalShell'
import { PortalHero } from '@/components/portal/PortalHero'
import { PortalTimeline } from '@/components/portal/PortalTimeline'
import { PortalDocuments, type PortalDocument } from '@/components/portal/PortalDocuments'
import { PortalInvoices, type PortalInvoice } from '@/components/portal/PortalInvoices'

export interface PortalData {
  project: {
    id: string
    name: string
    client_name: string | null
    client_id: string | null
    status: string | null
    progress: number | null
    completion_score: number | null
    next_action_label: string | null
    next_action_due: string | null
    presta_type: string | null
    start_date: string | null
    end_date: string | null
    budget: number | null
    ai_summary: string | null
    portal_expires_at: string | null
  }
  checklist: { id: string; title: string; phase: string | null; status: string }[]
  invoices: PortalInvoice[]
  documents: PortalDocument[]
}

export function PortalView({ data }: { data: PortalData }) {
  const { project, checklist, invoices, documents } = data

  return (
    <PortalShell>
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '32px 20px 64px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <Logo size={40} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PortalHero
            projectName={project.name}
            clientName={project.client_name}
            prestaType={project.presta_type}
            progress={project.progress ?? 0}
            nextActionLabel={project.next_action_label}
            nextActionDue={project.next_action_due}
          />

          <PortalTimeline items={checklist} />

          <PortalDocuments documents={documents} />

          <PortalInvoices invoices={invoices} />
        </div>

        <footer style={{ textAlign: 'center', marginTop: 48, color: '#9ca3af', fontSize: 11 }}>
          <p>
            Mis à jour en temps réel par votre équipe Propul&apos;SEO.
          </p>
        </footer>
      </div>
    </PortalShell>
  )
}
