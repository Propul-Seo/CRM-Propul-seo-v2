import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: string
  valueColor?: string
  sub?: React.ReactNode
}

export function MetricCard({ label, value, valueColor, sub }: Props) {
  return (
    <div className="bg-[#0f0b1e] border border-[rgba(139,92,246,0.18)] rounded-xl px-4 py-3.5">
      <p className={cn('text-2xl font-bold', valueColor ?? 'text-[#ede9fe]')}>{value}</p>
      <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mt-1">{label}</p>
      {sub && <div className="mt-1.5">{sub}</div>}
    </div>
  )
}
