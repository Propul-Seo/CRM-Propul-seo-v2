import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Users, Video } from 'lucide-react'
import { format, parseISO, isAfter, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { v2 } from '../../../lib/supabase'
import { cn } from '../../../lib/utils'
import { itemVariants } from '../lib/animations'

interface Meeting {
  id: string
  content: string
  project_id: string | null
  metadata: {
    start?: string
    end?: string
    location?: string
    attendees?: string[]
    description?: string
  }
}

interface UpcomingMeetingsCardProps {
  isMobile: boolean
}

export function UpcomingMeetingsCard({ isMobile }: UpcomingMeetingsCardProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])

  useEffect(() => {
    v2
      .from('project_activities')
      .select('id, content, project_id, metadata')
      .eq('type', 'meeting')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!data) return
        const now = startOfDay(new Date())
        const upcoming = (data as Meeting[])
          .filter(m => m.metadata?.start && isAfter(parseISO(m.metadata.start), now))
          .sort((a, b) =>
            parseISO(a.metadata.start!).getTime() - parseISO(b.metadata.start!).getTime()
          )
          .slice(0, 5)
        setMeetings(upcoming)
      })
  }, [])

  if (meetings.length === 0) return null

  return (
    <motion.div
      variants={itemVariants}
      className={cn(isMobile ? 'col-span-2' : 'col-span-12 lg:col-span-6')}
    >
      <div className="h-full rounded-3xl bg-gradient-to-br from-surface-2 to-surface-2/50 border border-border/50 overflow-hidden p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Calendar className="h-5 w-5 text-violet-400" />
          </div>
          <h3 className="font-semibold text-white">Prochains rendez-vous</h3>
          <span className="ml-auto text-xs text-muted-foreground">{meetings.length} à venir</span>
        </div>

        <div className="space-y-3">
          {meetings.map(meeting => {
            const start = meeting.metadata.start ? parseISO(meeting.metadata.start) : null
            const end = meeting.metadata.end ? parseISO(meeting.metadata.end) : null
            const isGoogleMeet = meeting.metadata.location?.includes('meet.google')
            const attendeesCount = meeting.metadata.attendees?.length ?? 0

            return (
              <div
                key={meeting.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-surface-1/50 border border-border/30"
              >
                <div className="shrink-0 text-center min-w-[40px]">
                  {start && (
                    <>
                      <p className="text-xs text-muted-foreground uppercase">
                        {format(start, 'EEE', { locale: fr })}
                      </p>
                      <p className="text-lg font-bold text-white leading-none">
                        {format(start, 'd')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(start, 'MMM', { locale: fr })}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{meeting.content}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {start && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(start, 'HH:mm')}
                        {end && ` – ${format(end, 'HH:mm')}`}
                      </span>
                    )}
                    {attendeesCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {attendeesCount}
                      </span>
                    )}
                    {isGoogleMeet && (
                      <span className="flex items-center gap-1 text-xs text-blue-400">
                        <Video className="h-3 w-3" />
                        Meet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
