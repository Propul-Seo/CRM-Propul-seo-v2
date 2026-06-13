import type { ReactNode } from 'react'

export function PortalShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(1200px 600px at 50% -200px, rgba(124,58,237,0.10), transparent 60%), #fafaff',
        overflowX: 'hidden',
        position: 'relative',
        color: '#1a1a2e',
      }}
    >
      {children}
    </div>
  )
}
