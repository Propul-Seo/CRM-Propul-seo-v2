import { Orb } from './Orb'

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0118',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      <Orb style={{ width: 500, height: 500, top: -100, left: -150, background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)' }} />
      <Orb style={{ width: 400, height: 400, bottom: -80, right: -100, background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)' }} />
      <Orb style={{ width: 300, height: 300, top: '40%', left: '60%', background: 'radial-gradient(circle, rgba(236,72,153,0.10) 0%, transparent 70%)' }} />
      {children}
    </div>
  )
}
