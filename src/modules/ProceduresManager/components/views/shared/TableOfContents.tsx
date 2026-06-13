import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { HeadingItem } from './types'

interface TableOfContentsProps {
  items: HeadingItem[]
  variant?: 'docs' | 'github'
  className?: string
}

export function TableOfContents({ items, variant = 'docs', className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)

  useEffect(() => {
    if (items.length === 0) return
    const targets = items
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => !!el)
    if (targets.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: [0, 1] },
    )

    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  const isGithub = variant === 'github'

  return (
    <aside className={cn('shrink-0', isGithub ? 'w-52' : 'w-56', className)}>
      <div className="sticky top-6">
        <h3
          className={cn(
            'text-[11px] font-semibold uppercase tracking-wider mb-3',
            isGithub ? 'text-foreground/70' : 'text-muted-foreground',
          )}
        >
          {isGithub ? 'Sur cette page' : 'Sommaire'}
        </h3>
        <nav className="space-y-1.5 border-l border-border/40 pl-3">
          {items.map((h) => {
            const isActive = h.id === activeId
            return (
              <a
                key={h.id}
                href={`#${h.id}`}
                className={cn(
                  'block text-xs leading-snug transition-colors -ml-3 pl-3 border-l-2 -translate-x-px',
                  h.level === 3 && 'pl-6',
                  h.level >= 4 && 'pl-9',
                  isActive
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {h.text}
              </a>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
