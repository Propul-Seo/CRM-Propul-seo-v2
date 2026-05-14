import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: string
  valueColor?: string
  sub?: React.ReactNode
  hint?: string
  isEmpty?: boolean
  emptyAction?: string
  onEmptyClick?: () => void
  onValueClick?: () => void
}

export function MetricCard({
  label,
  value,
  valueColor,
  sub,
  hint,
  isEmpty,
  emptyAction,
  onEmptyClick,
  onValueClick,
}: Props) {
  const cardCls =
    'bg-[#0f0b1e] border border-[rgba(139,92,246,0.18)] rounded-xl px-4 py-3.5 text-left'
  const interactiveCls =
    'hover:border-[rgba(139,92,246,0.45)] hover:bg-[#150f25] transition-colors'

  const content = (
    <>
      {isEmpty && emptyAction && onEmptyClick ? (
        <button
          type="button"
          onClick={onEmptyClick}
          className="text-sm font-semibold text-[#8B5CF6] hover:text-[#A78BFA] transition-colors text-left"
        >
          + {emptyAction}
        </button>
      ) : (
        <p className={cn('text-2xl font-bold', valueColor ?? 'text-[#ede9fe]')}>{value}</p>
      )}
      <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mt-1">{label}</p>
      {hint && <p className="text-[10px] text-[#6b7280] mt-0.5">{hint}</p>}
      {sub && <div className="mt-1.5">{sub}</div>}
    </>
  )

  if (onValueClick && !(isEmpty && emptyAction)) {
    return (
      <button
        type="button"
        onClick={onValueClick}
        className={cn(cardCls, interactiveCls, 'w-full')}
        title="Modifier le projet"
      >
        {content}
      </button>
    )
  }

  return <div className={cardCls}>{content}</div>
}
