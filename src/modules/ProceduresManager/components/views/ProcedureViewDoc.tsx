import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Prose } from './shared/Prose'
import { TableOfContents } from './shared/TableOfContents'
import { extractHeadings, readingTime } from './shared/headings'
import type { ProcedureViewProps } from './shared/types'

export function ProcedureViewDoc({
  procedure,
  category,
  authorName,
}: ProcedureViewProps) {
  const headings = useMemo(
    () => extractHeadings(procedure.content.content),
    [procedure.content],
  )
  const minutes = useMemo(() => readingTime(procedure.content_text), [procedure.content_text])
  const date = useMemo(
    () =>
      new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(new Date(procedure.updated_at)),
    [procedure.updated_at],
  )

  return (
    <div className="flex flex-col lg:flex-row gap-16">
      <div className="flex-1 min-w-0">
        <header className="mb-12">
          {category && (
            <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary mb-6">
              {category.name} \\ Note de procédure
            </div>
          )}

          <h1 className="text-[2.5rem] font-semibold text-foreground tracking-tight leading-[1.15] mb-5">
            {procedure.title}
          </h1>

          {procedure.summary && (
            <p className="text-lg text-muted-foreground leading-[1.7] max-w-[640px]">
              {procedure.summary}
            </p>
          )}

          <div className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-xs max-w-md">
            <span className="text-muted-foreground uppercase tracking-wider">Auteur</span>
            <span className="text-foreground/90 font-medium">{authorName ?? 'Équipe Propul\u2019SEO'}</span>
            <span className="text-muted-foreground uppercase tracking-wider">Date</span>
            <span className="text-foreground/90 font-medium">{date}</span>
            <span className="text-muted-foreground uppercase tracking-wider">Lecture</span>
            <span className="text-foreground/90 font-medium">{minutes} minutes</span>
            {procedure.tags.length > 0 && (
              <>
                <span className="text-muted-foreground uppercase tracking-wider">Mots-clés</span>
                <span className="text-foreground/90 font-medium">{procedure.tags.join(' \u00b7 ')}</span>
              </>
            )}
          </div>

          <div className="mt-8 h-px bg-gradient-to-r from-primary/40 via-border to-transparent" />
        </header>

        <Prose
          content={procedure.content}
          contentKey={procedure.id}
          calloutStyle="docs"
          className={cn(
            'procedure-prose procedure-prose-doc',
            'prose prose-invert max-w-none',
            'prose-headings:text-foreground prose-headings:font-semibold prose-headings:tracking-tight',
            'prose-h2:text-[1.35rem] prose-h2:mt-12 prose-h2:mb-5 prose-h2:uppercase prose-h2:tracking-wide prose-h2:text-foreground',
            'prose-h3:text-base prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-foreground/90',
            'prose-p:text-foreground/85 prose-p:leading-[1.85] prose-p:my-4 prose-p:text-[0.95rem]',
            'prose-strong:text-foreground prose-strong:font-semibold',
            'prose-a:text-primary prose-a:no-underline prose-a:font-medium hover:prose-a:underline prose-a:underline-offset-4',
            'prose-code:text-primary prose-code:bg-surface-3/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.85em] prose-code:font-mono prose-code:font-normal',
            'prose-code:before:content-none prose-code:after:content-none',
            'prose-pre:bg-surface-3 prose-pre:border prose-pre:border-border/40 prose-pre:rounded-md prose-pre:my-6',
            'prose-li:text-foreground/85 prose-li:my-2 prose-li:leading-[1.85]',
            'prose-ol:my-5 prose-ul:my-5 prose-ol:space-y-1.5 prose-ul:space-y-1.5',
            'prose-img:rounded-md prose-img:border prose-img:border-border/40 prose-img:my-8',
            'prose-hr:my-12 prose-hr:border-border/40',
          )}
        />

        <footer className="mt-16 pt-6 border-t border-border/40 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>Propul\u2019SEO \u00b7 Document interne</span>
          <span>{date}</span>
        </footer>
      </div>

      <TableOfContents items={headings} variant="docs" className="hidden lg:block" />
    </div>
  )
}
