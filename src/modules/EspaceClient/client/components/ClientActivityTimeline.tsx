import {
  Phone, Mail, Users, FileText, CheckCircle2, MessageSquare, Sparkles, type LucideIcon,
} from 'lucide-react';
import { EmptyState, Skeleton } from '@/modules/EspaceClient/shared/components';
import type { BadgeTone } from '@/modules/EspaceClient/shared/components';
import type { PortalActivity } from '../hooks/usePortalData';

interface ClientActivityTimelineProps {
  activities: PortalActivity[];
  loading: boolean;
}

// Mappe un type d'activité → icône Lucide + tonalité. Fallback neutre pour les
// types inconnus (le portail ne doit jamais casser sur une nouvelle valeur).
const TYPE_META: Record<string, { icon: LucideIcon; tone: BadgeTone }> = {
  call:      { icon: Phone,         tone: 'blue' },
  email:     { icon: Mail,          tone: 'violet' },
  meeting:   { icon: Users,         tone: 'amber' },
  file:      { icon: FileText,      tone: 'violet' },
  document:  { icon: FileText,      tone: 'violet' },
  milestone: { icon: CheckCircle2,  tone: 'green' },
  note:      { icon: MessageSquare, tone: 'gray' },
  system:    { icon: Sparkles,      tone: 'gray' },
};

const TINTS: Record<BadgeTone, string> = {
  violet: 'bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)]',
  green:  'bg-[var(--ps-success-subtle)] text-[var(--ps-success-text)]',
  amber:  'bg-[var(--ps-warning-subtle)] text-[var(--ps-warning-text)]',
  red:    'bg-[var(--ps-danger-subtle)] text-[var(--ps-danger-text)]',
  blue:   'bg-[var(--ps-info-subtle)] text-[var(--ps-info-text)]',
  gray:   'bg-[var(--ps-bg-subtle)] text-[var(--ps-fg-secondary)]',
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function ClientActivityTimeline({ activities, loading }: ClientActivityTimelineProps) {
  return (
    <div className="ps-surface overflow-hidden">
      <header className="flex items-center justify-between border-b border-[var(--ps-border-soft)] px-6 py-4">
        <h3 className="ps-h3 text-[var(--ps-fg)]">Activité de l'équipe</h3>
      </header>

      {loading ? (
        <div className="space-y-4 p-6">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/3 rounded-md" />
                <Skeleton className="h-3 w-1/3 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={MessageSquare}
            title="Pas encore d'activité"
            body="Les actions de votre équipe sur le projet apparaîtront ici."
          />
        </div>
      ) : (
        <ol className="divide-y divide-[var(--ps-border-soft)]">
          {activities.map(a => {
            const meta = TYPE_META[a.type] ?? { icon: MessageSquare, tone: 'gray' as BadgeTone };
            const Icon = meta.icon;
            return (
              <li key={a.id} className="flex gap-4 px-6 py-4">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TINTS[meta.tone]}`}>
                  <Icon className="h-[15px] w-[15px]" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] leading-relaxed text-[var(--ps-fg)] whitespace-pre-wrap">
                    {a.content}
                  </p>
                  <p className="mt-1 text-[11.5px] text-[var(--ps-fg-muted)]">
                    {a.author_name && <span className="font-medium text-[var(--ps-fg-secondary)]">{a.author_name}</span>}
                    {a.author_name && ' · '}
                    {formatDate(a.realized_at ?? a.created_at)}
                  </p>
                  {a.next_actions && (
                    <div className="mt-2.5 rounded-lg border border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] px-3 py-2">
                      <p className="ps-eyebrow ps-eyebrow-muted">Prochaines étapes</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--ps-fg-secondary)] whitespace-pre-wrap">
                        {a.next_actions}
                      </p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
