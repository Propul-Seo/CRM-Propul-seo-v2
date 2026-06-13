import { cn } from '@/lib/utils'

export function PortalCard({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={cn(className)}
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(124,58,237,0.10)',
        borderRadius: 16,
        boxShadow: '0 4px 24px -8px rgba(124,58,237,0.12)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
