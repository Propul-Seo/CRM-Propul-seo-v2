import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventContentArg } from '@fullcalendar/core';
import { Plus, Linkedin, Instagram, Mail, Globe, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PostRow, PostType, PostStatus, PostPlatform } from '../../../types/supabase-types';

type ColorMode = 'platform' | 'responsible';

interface CalendarViewProps {
  posts: PostRow[];
  users: { id: string; name: string }[];
  onPostClick: (post: PostRow) => void;
  onDateClick?: (dateStr: string) => void;
  onUpdateSchedule?: (postId: string, newDate: string) => void;
}

// ---------------------------------------------------------------------------
// Platform identity: combines platform + type for LinkedIn split
// ---------------------------------------------------------------------------
type PlatformIdentity = 'instagram' | 'linkedin-agency' | 'linkedin-perso' | 'newsletter' | 'multi';

function getPlatformIdentity(platform: PostPlatform, type: PostType): PlatformIdentity {
  if (platform === 'linkedin') {
    return type === 'perso' ? 'linkedin-perso' : 'linkedin-agency';
  }
  if (platform === 'instagram') return 'instagram';
  if (platform === 'newsletter') return 'newsletter';
  return 'multi';
}

const platformIdentities: Record<PlatformIdentity, {
  label: string;
  icon: typeof Linkedin;
  border: string;
  bg: string;
  text: string;
  glow: string;
}> = {
  instagram:        { label: 'Instagram',       icon: Instagram, border: 'var(--cal-instagram)',        bg: 'var(--cal-instagram-bg)',        text: 'var(--cal-instagram-text)',        glow: 'var(--cal-instagram-glow)' },
  'linkedin-agency': { label: 'LinkedIn Agence', icon: Linkedin,  border: 'var(--cal-linkedin-agency)',  bg: 'var(--cal-linkedin-agency-bg)',  text: 'var(--cal-linkedin-agency-text)',  glow: 'var(--cal-linkedin-agency-glow)' },
  'linkedin-perso':  { label: 'LinkedIn Perso',  icon: Linkedin,  border: 'var(--cal-linkedin-perso)',   bg: 'var(--cal-linkedin-perso-bg)',   text: 'var(--cal-linkedin-perso-text)',   glow: 'var(--cal-linkedin-perso-glow)' },
  newsletter:       { label: 'Newsletter',      icon: Mail,      border: 'var(--cal-newsletter)',       bg: 'var(--cal-newsletter-bg)',       text: 'var(--cal-newsletter-text)',       glow: 'var(--cal-newsletter-glow)' },
  multi:            { label: 'Multi',            icon: Globe,     border: 'var(--cal-multi)',            bg: 'var(--cal-multi-bg)',            text: 'var(--cal-multi-text)',            glow: 'var(--cal-multi-glow)' },
};

// ---------------------------------------------------------------------------
// Post type pills
// ---------------------------------------------------------------------------
const typeConfig: Record<PostType, { label: string; text: string; bg: string }> = {
  agence:     { label: 'AGC', text: 'var(--cal-type-agency)',      bg: 'var(--cal-type-agency-bg)' },
  client:     { label: 'CLI', text: 'var(--cal-type-client)',      bg: 'var(--cal-type-client-bg)' },
  perso:      { label: 'PER', text: 'var(--cal-type-informative)', bg: 'var(--cal-type-informative-bg)' },
  informatif: { label: 'INF', text: 'var(--cal-type-informative)', bg: 'var(--cal-type-informative-bg)' },
};

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------
const statusConfig: Record<PostStatus, { label: string; dotClass: string; textClass: string }> = {
  idea:      { label: 'Idee',       dotClass: 'bg-amber-400',  textClass: 'text-amber-400' },
  drafting:  { label: 'Redaction',  dotClass: 'bg-blue-400',   textClass: 'text-blue-400' },
  review:    { label: 'Relecture',  dotClass: 'bg-purple-400', textClass: 'text-purple-400' },
  scheduled: { label: 'Planifie',   dotClass: 'bg-indigo-400', textClass: 'text-indigo-400' },
  published: { label: 'Publie',     dotClass: 'bg-green-400',  textClass: 'text-green-400' },
};

// ---------------------------------------------------------------------------
// Responsible palette
// ---------------------------------------------------------------------------
const responsiblePalette = ['#8B5CF6', '#0A66C2', '#10B981', '#F59E0B', '#E4405F', '#06B6D4', '#EC4899', '#6D28D9'];

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ===========================================================================
// Component
// ===========================================================================
export function CalendarView({ posts, users, onPostClick, onDateClick, onUpdateSchedule }: CalendarViewProps) {
  const [colorMode, setColorMode] = useState<ColorMode>('platform');

  const responsibleColorMap = useMemo(() => {
    const map: Record<string, { color: string; bg: string; glow: string }> = {};
    users.forEach((user, idx) => {
      const color = responsiblePalette[idx % responsiblePalette.length];
      map[user.id] = { color, bg: hexToRgba(color, 0.12), glow: hexToRgba(color, 0.25) };
    });
    return map;
  }, [users]);

  const dayLoad = useMemo(() => {
    const load: Record<string, number> = {};
    posts.forEach(post => {
      if (post.scheduled_at) {
        const day = post.scheduled_at.split('T')[0];
        load[day] = (load[day] || 0) + 1;
      }
    });
    return load;
  }, [posts]);

  const events = useMemo(() => {
    return posts
      .filter(post => post.scheduled_at)
      .map(post => ({
        id: post.id,
        title: post.title,
        start: post.scheduled_at!,
        allDay: false,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        classNames: ['calendar-post-event'],
        extendedProps: { post },
      }));
  }, [posts]);

  // -------------------------------------------------------------------------
  // Event renderer
  // -------------------------------------------------------------------------
  const renderEventContent = (eventInfo: EventContentArg) => {
    const post = eventInfo.event.extendedProps.post as PostRow;
    const identity = getPlatformIdentity(post.platform, post.type);
    const pConfig = platformIdentities[identity];
    const tConfig = typeConfig[post.type];
    const status = statusConfig[post.status];
    const responsible = users.find(u => u.id === post.responsible_user_id);
    const respColor = responsibleColorMap[post.responsible_user_id || ''];

    // Color encoding based on mode
    const borderColor = colorMode === 'platform' ? pConfig.border : (respColor?.color || '#6B7280');
    const bgColor = colorMode === 'platform' ? pConfig.bg : (respColor?.bg || 'rgba(107, 114, 128, 0.1)');
    const glowColor = colorMode === 'platform' ? pConfig.glow : (respColor?.glow || 'rgba(107, 114, 128, 0.15)');

    const time = post.scheduled_at
      ? new Date(post.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : null;

    const PlatformIcon = pConfig.icon;

    return (
      <div
        className="cal-event-card group"
        style={{
          '--event-border': borderColor,
          '--event-bg': bgColor,
          '--event-glow': glowColor,
        } as React.CSSProperties}
      >
        {/* Row 1: platform icon + type pill + title (always visible) */}
        <div className="flex items-center gap-1 min-w-0">
          <PlatformIcon className="w-3 h-3 shrink-0" style={{ color: pConfig.text }} />
          <span
            className="cal-type-pill shrink-0"
            style={{ '--pill-text': tConfig.text, '--pill-bg': tConfig.bg } as React.CSSProperties}
          >
            {tConfig.label}
          </span>
          {time && (
            <span className="shrink-0 text-[10px] font-medium text-muted-foreground">{time}</span>
          )}
          <span className="truncate text-xs font-semibold text-foreground">{post.title}</span>
        </div>
        {/* Row 2: status + responsible (week view only via CSS) */}
        <div className="cal-event-detail-row items-center gap-1.5 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dotClass}`} />
          <span className={`text-[9px] ${status.textClass}`}>{status.label}</span>
          {responsible && (
            <span className="text-[9px] text-muted-foreground ml-auto truncate max-w-[60px]">
              {responsible.name}
            </span>
          )}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Legend items
  // -------------------------------------------------------------------------
  const platformLegend = Object.entries(platformIdentities).map(([key, config]) => {
    const Icon = config.icon;
    return (
      <div key={key} className="flex items-center gap-1">
        <Icon className="w-3 h-3" style={{ color: config.text }} />
        <span className="text-[10px] text-muted-foreground">{config.label}</span>
      </div>
    );
  });

  const typeLegend = Object.entries(typeConfig).map(([key, config]) => (
    <div key={key} className="flex items-center gap-1">
      <span
        className="cal-type-pill"
        style={{ '--pill-text': config.text, '--pill-bg': config.bg } as React.CSSProperties}
      >
        {config.label}
      </span>
    </div>
  ));

  return (
    <div className="space-y-3">
      {/* Legend + toggle bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Platform or responsible legend */}
          <div className="flex items-center gap-3 flex-wrap">
            {colorMode === 'platform' ? platformLegend : (
              users.slice(0, 6).map(user => {
                const color = responsibleColorMap[user.id]?.color || '#6B7280';
                return (
                  <div key={user.id} className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-[10px] text-muted-foreground">{user.name}</span>
                  </div>
                );
              })
            )}
          </div>
          {/* Type legend (always shown) */}
          <div className="flex items-center gap-2 border-l border-border-subtle pl-3">
            {typeLegend}
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-0.5">
          <button
            onClick={() => setColorMode('platform')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
              colorMode === 'platform'
                ? 'bg-surface-3 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Globe className="w-3 h-3" /> Plateforme
          </button>
          <button
            onClick={() => setColorMode('responsible')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
              colorMode === 'responsible'
                ? 'bg-surface-3 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Users className="w-3 h-3" /> Responsable
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-surface-2 rounded-xl border border-border-subtle p-2 md:p-4 calendar-premium">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="fr"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek',
          }}
          events={events}
          eventContent={renderEventContent}
          eventClick={(info) => {
            info.jsEvent.stopPropagation();
            const post = info.event.extendedProps.post as PostRow;
            onPostClick(post);
          }}
          dateClick={(info) => {
            if (onDateClick) onDateClick(info.dateStr);
          }}
          editable={!!onUpdateSchedule}
          eventStartEditable={!!onUpdateSchedule}
          eventDurationEditable={false}
          eventDrop={(info) => {
            const post = info.event.extendedProps.post as PostRow;
            const newStart = info.event.start;
            if (newStart && onUpdateSchedule) {
              onUpdateSchedule(post.id, newStart.toISOString());
            }
          }}
          height="auto"
          dayMaxEvents={3}
          moreLinkContent={(args) => (
            <span className="text-xs font-semibold text-primary hover:text-primary/80">
              + {args.num} autres
            </span>
          )}
          buttonText={{
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
          }}
          hiddenDays={[0]}
          eventOrder="start,-title"
          dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
          dayCellClassNames={(arg) => {
            const day = formatDateKey(arg.date);
            const count = dayLoad[day] || 0;
            const classes = ['cursor-pointer'];
            if (count > 4) classes.push('calendar-day-overload');
            else if (count > 2) classes.push('calendar-day-busy');
            return classes;
          }}
        />

        {onDateClick && (
          <div className="flex items-center gap-1.5 mt-3 px-2 text-xs text-muted-foreground">
            <Plus className="w-3 h-3" />
            <span>Cliquez sur un jour pour ajouter un post</span>
          </div>
        )}
      </div>
    </div>
  );
}
