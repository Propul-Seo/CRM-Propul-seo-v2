import { useDashboardData } from '../Dashboard/hooks/useDashboardData'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { PreviewSwitcher } from './PreviewSwitcher'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const dayOfYear = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / 86400000)
}

export function Variant4Editorial() {
  const d = useDashboardData()
  const conversionRate = d.leadsCount && d.leadsCount > 0 ? Math.round((d.activeProjectsCount / d.leadsCount) * 100) : 0
  const issue = String(Math.floor(dayOfYear() / 7)).padStart(2, '0')

  return (
    <div className="min-h-screen bg-[#020205] text-[#ede9fe]">
      <PreviewSwitcher />

      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="border-y-2 border-[#8B5CF6] py-5 text-center mb-12">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[#9ca3af] mb-2">
            {d.formattedDate} · n°{issue}
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-[#ede9fe] tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Propul'SEO Briefing
          </h1>
          <div className="text-[10px] uppercase tracking-[0.4em] text-[#9ca3af] mt-2">
            Édition agence · Données live
          </div>
        </div>

        <section className="mb-16">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#8B5CF6] mb-3">À la une</div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#ede9fe] leading-tight mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Le chiffre d'affaires atteint <span className="text-[#8B5CF6]">{fmtEur(d.currentYearRevenue)}</span>, en hausse de 12,5%
          </h2>
          <p className="text-sm text-[#9ca3af] leading-relaxed max-w-2xl">
            Sur l'année {d.currentYear}, l'agence a généré {fmtEur(d.currentYearRevenue)} de revenus. Le portefeuille
            compte {fmt(d.contactsCount || 0)} contacts, dont {fmt(d.leadsCount || 0)} leads actifs et {d.activeProjectsCount} projets en production.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-y border-[rgba(139,92,246,0.18)] py-8 mb-16">
          <div className="md:border-r md:border-[rgba(139,92,246,0.18)] md:pr-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#9ca3af] mb-2">Contacts</div>
            <div className="font-serif text-5xl font-bold text-[#ede9fe] tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>{fmt(d.contactsCount || 0)}</div>
          </div>
          <div className="md:border-r md:border-[rgba(139,92,246,0.18)] md:pr-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#9ca3af] mb-2">Projets</div>
            <div className="font-serif text-5xl font-bold text-[#ede9fe] tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>{fmt(d.projectsCount || 0)}</div>
            <div className="text-[10px] text-[#9ca3af] mt-1">dont {d.activeProjectsCount} actifs</div>
          </div>
          <div className="md:border-r md:border-[rgba(139,92,246,0.18)] md:pr-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#9ca3af] mb-2">Tâches</div>
            <div className="font-serif text-5xl font-bold text-[#ede9fe] tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>{fmt(d.pendingTasks.length)}</div>
            <div className="text-[10px] text-[#9ca3af] mt-1">en cours · {d.urgentTasks.length} urgent(s)</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#9ca3af] mb-2">Conversion</div>
            <div className="font-serif text-5xl font-bold text-emerald-400 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>{conversionRate}%</div>
          </div>
        </div>

        <section className="mb-16">
          <div className="flex items-baseline gap-4 mb-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#8B5CF6]">Marché interne</div>
            <div className="flex-1 h-px bg-[rgba(139,92,246,0.18)]" />
          </div>
          <h3 className="font-serif text-3xl font-bold text-[#ede9fe] mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            Évolution du chiffre d'affaires
          </h3>
          <div className="rounded-xl bg-[#070512] border border-[rgba(139,92,246,0.18)] p-6">
            <div className="h-80">
              {d.accountingLoading ? (
                <div className="h-full flex items-center justify-center text-[#9ca3af] text-xs">Chargement…</div>
              ) : (
                <RevenueChart isPrivacyMode={false} />
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-baseline gap-4 mb-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#8B5CF6]">Objectifs</div>
            <div className="flex-1 h-px bg-[rgba(139,92,246,0.18)]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {d.objectives.slice(0, 3).map((obj) => {
              const pct = obj.target > 0 ? Math.min(100, Math.round((obj.current / obj.target) * 100)) : 0
              return (
                <div key={obj.id} className="border-l-2 border-[#8B5CF6] pl-4">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-[#9ca3af] mb-2">{obj.label}</div>
                  <div className="font-serif text-3xl font-bold text-[#ede9fe] tabular-nums mb-1" style={{ fontFamily: 'Georgia, serif' }}>{pct}%</div>
                  <div className="text-xs text-[#9ca3af] font-mono">{fmt(obj.current)} / {fmt(obj.target)}</div>
                </div>
              )
            })}
          </div>
        </section>

        <div className="text-center mt-16 pt-8 border-t border-[rgba(139,92,246,0.18)]">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[#9ca3af]">— Fin de l'édition —</div>
        </div>
      </div>
    </div>
  )
}
