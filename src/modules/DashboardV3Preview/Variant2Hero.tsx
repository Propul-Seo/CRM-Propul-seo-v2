import { useDashboardData } from '../Dashboard/hooks/useDashboardData'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { PreviewSwitcher } from './PreviewSwitcher'
import { TrendingUp, Users, Briefcase, CheckSquare } from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export function Variant2Hero() {
  const d = useDashboardData()
  const conversionRate = d.leadsCount && d.leadsCount > 0 ? Math.round((d.activeProjectsCount / d.leadsCount) * 100) : 0

  return (
    <div className="min-h-screen bg-[#020205] text-[#ede9fe]">
      <PreviewSwitcher />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#9ca3af]">
            {d.formattedDate}
          </span>
        </div>

        <div className="text-center mt-12 mb-16">
          <p className="text-xs uppercase tracking-[0.25em] text-[#9ca3af] mb-6">
            Chiffre d'affaires {d.currentYear}
          </p>
          <div className="text-6xl md:text-8xl font-bold text-[#ede9fe] tabular-nums tracking-tight mb-4">
            {fmtEur(d.currentYearRevenue)}
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-mono text-emerald-400">+12.5% vs N-1</span>
          </div>
        </div>

        <div className="border-t border-[rgba(139,92,246,0.18)] pt-12 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div onClick={d.handleNavigateToCRM} className="cursor-pointer group">
              <Users className="h-4 w-4 text-[#8B5CF6] mx-auto mb-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="text-3xl font-semibold text-[#ede9fe] tabular-nums">{fmt(d.contactsCount || 0)}</div>
              <div className="text-xs text-[#9ca3af] mt-1">Contacts</div>
            </div>
            <div onClick={d.handleNavigateToProjects} className="cursor-pointer group">
              <Briefcase className="h-4 w-4 text-[#8B5CF6] mx-auto mb-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="text-3xl font-semibold text-[#ede9fe] tabular-nums">{fmt(d.projectsCount || 0)}</div>
              <div className="text-xs text-[#9ca3af] mt-1">Projets ({d.activeProjectsCount} actifs)</div>
            </div>
            <div onClick={d.handleNavigateToTasks} className="cursor-pointer group">
              <CheckSquare className="h-4 w-4 text-[#8B5CF6] mx-auto mb-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="text-3xl font-semibold text-[#ede9fe] tabular-nums">{fmt(d.pendingTasks.length)}</div>
              <div className="text-xs text-[#9ca3af] mt-1">Tâches en cours</div>
            </div>
            <div>
              <TrendingUp className="h-4 w-4 text-[#8B5CF6] mx-auto mb-3 opacity-60" />
              <div className="text-3xl font-semibold text-[#ede9fe] tabular-nums">{conversionRate}%</div>
              <div className="text-xs text-[#9ca3af] mt-1">Conversion</div>
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(139,92,246,0.18)] pt-12">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-[#9ca3af]">Évolution annuelle</p>
          </div>
          <div className="rounded-2xl bg-[#070512] border border-[rgba(139,92,246,0.18)] p-8">
            <div className="h-80">
              {d.accountingLoading ? (
                <div className="h-full flex items-center justify-center text-[#9ca3af] text-xs">Chargement…</div>
              ) : (
                <RevenueChart isPrivacyMode={false} />
              )}
            </div>
          </div>
        </div>

        {d.urgentTasks.length > 0 && (
          <div className="mt-12 pt-12 border-t border-[rgba(139,92,246,0.18)] text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-rose-400 mb-2">Attention requise</p>
            <button onClick={d.handleNavigateToTasks} className="text-[#ede9fe] hover:text-[#8B5CF6] transition-colors">
              <span className="text-2xl font-semibold">{d.urgentTasks.length}</span>
              <span className="text-sm text-[#9ca3af] ml-2">tâche(s) urgente(s)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
