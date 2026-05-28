import { useMemo, useState } from 'react';
import { Inbox, PhoneCall, CheckCircle2, XCircle, Briefcase, Filter } from 'lucide-react';
import { Hero, KpiTile, EmptyState } from '@/modules/EspaceClient/shared/components';
import { LeadCard } from './components/LeadCard';
import { LeadDetailSheet } from './components/LeadDetailSheet';
import { useQualificationLeads, type LeadStatusFilter, type QualificationLeadRow } from './hooks/useQualificationLeads';

const FILTERS: Array<{ value: LeadStatusFilter; label: string }> = [
  { value: 'all',          label: 'Tous' },
  { value: 'submitted',    label: 'Nouveaux' },
  { value: 'contacted',    label: 'Contactés' },
  { value: 'qualified',    label: 'Qualifiés' },
  { value: 'unqualified',  label: 'Disqualifiés' },
  { value: 'converted',    label: 'Convertis' },
];

export function LeadsQualifiesPage() {
  const [filter, setFilter] = useState<LeadStatusFilter>('all');
  const { leads, loading, error, updateStatus } = useQualificationLeads(filter);
  const [selected, setSelected] = useState<QualificationLeadRow | null>(null);

  const stats = useMemo(() => {
    const by = (s: string) => leads.filter(l => l.status === s).length;
    return { total: leads.length, sub: by('submitted'), cont: by('contacted'), qual: by('qualified'), conv: by('converted') };
  }, [leads]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <Hero
        eyebrow="Admin Propul'Space"
        title="Leads qualifiés"
        subtitle="Tous les diagnostics reçus, en file d'attente jusqu'à conversion."
      />

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <KpiTile eyebrow="Nouveaux"    value={String(stats.sub)}  icon={Inbox}        tint="violet" />
        <KpiTile eyebrow="Contactés"   value={String(stats.cont)} icon={PhoneCall}    tint="blue" />
        <KpiTile eyebrow="Qualifiés"   value={String(stats.qual)} icon={CheckCircle2} tint="green" />
        <KpiTile eyebrow="Convertis"   value={String(stats.conv)} icon={Briefcase}    tint="orange" />
      </section>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--ps-fg-muted)]" />
          {FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                filter === f.value
                  ? 'bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)]'
                  : 'bg-[var(--ps-bg-subtle)] text-[var(--ps-fg-secondary)] hover:bg-[var(--ps-bg-elevated)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
        )}
        {loading && (
          <p className="text-[13px] text-[var(--ps-fg-muted)]">Chargement…</p>
        )}
        {!loading && leads.length === 0 && (
          <EmptyState
            icon={Inbox}
            title="Aucun lead"
            body={filter === 'all' ? 'Les leads soumis via /diagnostic apparaîtront ici.' : 'Aucun lead dans cette catégorie.'}
          />
        )}
        {!loading && leads.length > 0 && (
          <div className="grid gap-3">
            {leads.map(l => (
              <LeadCard key={l.id} lead={l} onClick={() => setSelected(l)} />
            ))}
          </div>
        )}
      </section>

      <LeadDetailSheet
        lead={selected}
        open={!!selected}
        onOpenChange={open => { if (!open) setSelected(null); }}
        onAction={updateStatus}
      />
    </main>
  );
}
