import { useDashboardData } from '../Dashboard/hooks/useDashboardData'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { PreviewSwitcher } from './PreviewSwitcher'
import { ArrowUpRight, ArrowDownRight, Circle } from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

function Stat({ label, value, trend, suffix }: { label: string; value: string; trend?: number; suffix?: string }) {
  return (
    <div className="border-r border-[rgba(139,92,246,0.12)] last:border-r-0 px-5 py-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#9ca3af] mb-2">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-2xl font-semibold text-[#ede9fe] tabular-nums">{value}</span>
        {suffix && <span className="text-xs text-[#9ca3af]">{suffix}</span>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-[10px] font-mono ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  )
}

export function Variant1Cockpit() {
  const d = useDashboardData()
  const conversionRate = d.leadsCount && d.leadsCount > 0 ? Math.round((d.activeProjectsCount / d.leadsCount) * 100) : 0

  return (
    <div className="min-h-screen bg-[#020205] text-[#ede9fe]">
      <PreviewSwitcher />

      <div className="px-5 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Circle className="h-1.5 w-1.5 fill-emerald-400 text-emerald-400" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9ca3af]">
            Live · {d.formattedDate}
          </span>
        </div>

        <h1 className="font-mono text-[11px] text-[#9ca3af] uppercase tracking-[0.2em] mb-3">
          Cockpit Propul'SEO
        </h1>

        <div className="rounded-lg border border-[rgba(139,92,246,0.18)] bg-[#070512] grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-3">
          <Stat label="CA 2026" value={fmtEur(d.currentYearRevenue)} trend={12.5} />
          <Stat label="Contacts" value={fmt(d.contactsCount || 0)} />
          <Stat label="Leads" value={fmt(d.leadsCount || 0)} />
          <Stat label="Projets" value={fmt(d.projectsCount || 0)} suffix={`/ ${d.activeProjectsCount} actifs`} />
          <Stat label="Tâches" value={fmt(d.pendingTasks.length)} suffix="en cours" />
          <Stat label="Urgent" value={fmt(d.urgentTasks.length)} />
          <Stat label="Conv" value={`${conversionRate}%`} />
        </div>

        <div className="rounded-lg border border-[rgba(139,92,246,0.18)] bg-[#070512] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9ca3af]">
              Revenue 12 mois
            </div>
            <button onClick={d.handleNavigateToAccounting} className="text-[10px] text-[#8B5CF6] hover:text-[#A78BFA]">
              comptabilité →
            </button>
          </div>
          <div className="h-72">
            {d.accountingLoading ? (
              <div className="h-full flex items-center justify-center text-[#9ca3af] text-xs">Chargement…</div>
            ) : (
              <RevenueChart isPrivacyMode={false} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          {d.objectives.slice(0, 3).map((obj) => {
            const pct = obj.target > 0 ? Math.min(100, Math.round((obj.current / obj.target) * 100)) : 0
            return (
              <div key={obj.id} className="rounded-lg border border-[rgba(139,92,246,0.18)] bg-[#070512] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#9ca3af]">{obj.label}</span>
                  <span className="font-mono text-[10px] text-[#8B5CF6]">{pct}%</span>
                </div>
                <div className="h-1 rounded-full bg-[rgba(139,92,246,0.15)] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA]" style={{ width: `${pct}%` }} />
                </div>
                <div className="font-mono text-xs text-[#ede9fe] mt-2 tabular-nums">
                  {fmt(obj.current)} <span className="text-[#9ca3af]">/ {fmt(obj.target)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
