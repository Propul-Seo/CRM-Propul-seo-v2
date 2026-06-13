import { PageShell } from '@/components/PageShell'
import { Logo } from '@/components/Logo'

export default function NotFound() {
  return (
    <PageShell>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24, padding: 24 }}>
        <Logo size={56} />
        <h1 style={{ color: 'white', fontSize: 20, fontWeight: 600, textAlign: 'center' }}>
          Lien invalide ou expiré
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', maxWidth: 320 }}>
          Ce lien n&apos;existe pas ou a déjà été utilisé.<br />
          Contactez votre chargé de projet Propulseo.
        </p>
      </div>
    </PageShell>
  )
}
