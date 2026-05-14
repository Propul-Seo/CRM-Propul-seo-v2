import { useDashboardData } from '../Dashboard/hooks/useDashboardData'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { PreviewSwitcher } from './PreviewSwitcher'
import { ArrowUpRight, Users, Briefcase, CheckSquare, TrendingUp, AlertCircle } from 'lucide-react'
import type { ReactNode, MouseEventHandler } from 'react'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

type TileProps = {
  className?: string
  children: ReactNode
  onClick?: MouseEventHandler<HTMLDivElement>
  accent?: 'violet' | 'emerald' | 'amber' | 'rose'
}

function Tile({ className = '', children, onClick, accent }: TileProps) {
  const accents: Record<string, string> = {
    violet: 'hover:border-[#8B5CF6]',
    emerald: 'hover:border-emerald-500/50',
    amber: 'hover:border-amber-500/50',
    rose: 'hover:border-rose-500/50',
  }
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-[#070512] border border-[rgba(139,92,246,0.18)] p-5 transition-all ${onClick ? 'cursor-pointer hover:bg-[#0d0a1c]' : ''} ${accent ? accents[accent] : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function Variant3Bento() {
  const d = useDashboardData()
  const conversionRate = d.leadsCount && d.leadsCount > 0 ? Math.round((d.activeProjectsCount / d.leadsCount) * 100) : 0

  return (
    <div className="min-h-screen bg-[#020205] text-[#ede9fe]">
      <PreviewSwitcher />

      <div className="px-5 py-6">
        <div className="flex items-baseline justify-between mb-5">
          <h1 className="text-xl font-semibold text-[#ede9fe]">Bonjour <span className="text-[#8B5CF6]">Lyes</span></h1>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9ca3af]">{d.formattedDate}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 auto-rows-[140px] gap-3">
          <Tile className="md:col-span-2 lg:col-span-3 lg:row-span-2 flex flex-col justify-between bg-gradient-to-br from-[#1a1238] via-[#070512] to-[#070512]" onClick={d.handleNavigateToAccounting} accent="violet">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[#9ca3af] mb-3">Chiffre d'affaires {d.currentYear}</div>
              <div className="text-5xl font-semibold text-[#ede9fe] tabular-nums">{fmtEur(d.currentYearRevenue)}</div>
              <div className="inline-flex items-center gap-1 mt-3 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono">
                <TrendingUp className="h-3 w-3" /> +12.5%
              </div>
            </div>
            <div className="h-24 -mx-2">
              {!d.accountingLoading && <RevenueChart isPrivacyMode={false} />}
            </div>
          </Tile>

          <Tile className="md:col-span-1 lg:col-span-3" onClick={d.handleNavigateToCRM} accent="violet">
            <div className="flex items-start justify-between mb-2">
              <Users className="h-4 w-4 text-[#8B5CF6]" />
              <ArrowUpRight className="h-3.5 w-3.5 text-[#9ca3af]" />
            </div>
            <div className="text-4xl font-semibold text-[#ede9fe] tabular-nums">{fmt(d.contactsCount || 0)}</div>
            <div className="text-xs text-[#9ca3af] mt-1">Contacts CRM</div>
          </Tile>

          <Tile onClick={d.handleNavigateToProjects} accent="violet">
            <div className="flex items-start justify-between mb-2">
              <Briefcase className="h-4 w-4 text-[#8B5CF6]" />
              <ArrowUpRight className="h-3.5 w-3.5 text-[#9ca3af]" />
            </div>
            <div className="text-3xl font-semibold text-[#ede9fe] tabular-nums">{fmt(d.projectsCount || 0)}</div>
            <div className="text-xs text-[#9ca3af] mt-1">{d.activeProjectsCount} actifs</div>
          </Tile>

          <Tile onClick={d.handleNavigateToTasks} accent="amber">
            <div className="flex items-start justify-between mb-2">
              <CheckSquare className="h-4 w-4 text-amber-400" />
              <ArrowUpRight className="h-3.5 w-3.5 text-[#9ca3af]" />
            </div>
            <div className="text-3xl font-semibold text-[#ede9fe] tabular-nums">{fmt(d.pendingTasks.length)}</div>
            <div className="text-xs text-[#9ca3af] mt-1">Tâches en cours</div>
          </Tile>

          <Tile accent="emerald">
            <div className="flex items-start justify-between mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-semibold text-emerald-400 tabular-nums">{conversionRate}%</div>
            <div className="text-xs text-[#9ca3af] mt-1">Conversion</div>
          </Tile>

          {d.urgentTasks.length > 0 && (
            <Tile className="md:col-span-3 lg:col-span-6" onClick={d.handleNavigateToTasks} accent="rose">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-[#ede9fe]">
                    <span className="font-semibold">{d.urgentTasks.length}</span> tâche(s) urgente(s) à traiter
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-rose-400" />
              </div>
            </Tile>
          )}

          {d.objectives.slice(0, 3).map((obj) => {
            const pct = obj.target > 0 ? Math.min(100, Math.round((obj.current / obj.target) * 100)) : 0
            return (
              <Tile key={obj.id} className="md:col-span-1 lg:col-span-2" accent="violet">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#9ca3af] mb-2">{obj.label}</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-semibold text-[#ede9fe] tabular-nums">{pct}%</span>
                  <span className="text-[10px] font-mono text-[#9ca3af]">{fmt(obj.current)}/{fmt(obj.target)}</span>
                </div>
                <div className="h-1 rounded-full bg-[rgba(139,92,246,0.15)] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA]" style={{ width: `${pct}%` }} />
                </div>
              </Tile>
            )
          })}
        </div>
      </div>
    </div>
  )
}
