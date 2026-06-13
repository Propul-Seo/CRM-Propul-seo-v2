import { Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProcedureMetaProps {
  authorName: string | null
  authorAvatarUrl: string | null
  updatedAt: string
  readingMinutes: number
  className?: string
  showAvatar?: boolean
}

const FORMAT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const FORMAT_SHORT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
})

export function ProcedureMeta({
  authorName,
  authorAvatarUrl,
  updatedAt,
  readingMinutes,
  className,
  showAvatar = true,
}: ProcedureMetaProps) {
  const date = new Date(updatedAt)
  const isThisYear = date.getFullYear() === new Date().getFullYear()
  const dateStr = (isThisYear ? FORMAT_SHORT : FORMAT).format(date)

  return (
    <div className={cn('flex items-center gap-3 text-xs text-muted-foreground', className)}>
      {showAvatar && (
        <div className="flex items-center gap-2">
          {authorAvatarUrl ? (
            <img
              src={authorAvatarUrl}
              alt=""
              className="h-6 w-6 rounded-full object-cover ring-1 ring-border/40"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-surface-3 flex items-center justify-center">
              <User className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
          <span className="text-foreground/80 font-medium">{authorName ?? 'Équipe'}</span>
        </div>
      )}
      {!showAvatar && <span>{authorName ?? 'Équipe'}</span>}
      <span className="text-border">·</span>
      <span>Maj {dateStr}</span>
      <span className="text-border">·</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {readingMinutes} min
      </span>
    </div>
  )
}
