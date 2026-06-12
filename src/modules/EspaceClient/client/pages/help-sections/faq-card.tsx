import { useMemo, useState } from 'react'
import { ChevronDown, HelpCircle, Search, SearchX, X } from 'lucide-react'
import { Badge, EmptyState } from '@/modules/EspaceClient/shared/components'
import { Input } from '@/components/ui/input'
import { FAQ } from './faq-data'

/**
 * FAQ en carte unique dense — même forme que la carte jalons du projet
 * (header px-5 py-3.5, lignes divide-y, accordéons compacts).
 */
export function FaqCard() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return FAQ
    return FAQ.filter(item =>
      item.q.toLowerCase().includes(q) ||
      item.a.toLowerCase().includes(q) ||
      item.tags.some(t => t.includes(q))
    )
  }, [search])

  return (
    <section className="ps-surface overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--ps-border-soft)] px-5 py-3.5">
        <h2 className="ps-h3 text-[var(--ps-fg)]">Questions fréquentes</h2>
        <Badge tone="gray" dot={false}>
          <span className="ps-num">
            {filtered.length !== FAQ.length ? `${filtered.length} sur ${FAQ.length}` : `${FAQ.length} questions`}
          </span>
        </Badge>
      </header>

      <div className="border-b border-[var(--ps-border-soft)] px-5 py-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ps-fg-muted)]" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher dans la FAQ…"
            className="pl-8 pr-8"
          />
          {search && (
            <button
              type="button"
              aria-label="Effacer"
              onClick={() => setSearch('')}
              className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[var(--ps-fg-muted)] transition-colors hover:text-[var(--ps-fg)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={SearchX}
            title="Aucune réponse trouvée"
            body="Aucune question ne correspond à votre recherche. Essayez d'autres mots-clés ou contactez-nous directement."
          />
        </div>
      ) : (
        <ul className="divide-y divide-[var(--ps-border-soft)]">
          {filtered.map((item, idx) => {
            const open = openIdx === idx
            return (
              <li key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : idx)}
                  aria-expanded={open}
                  className="flex min-h-[44px] w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[var(--ps-bg-subtle)]"
                >
                  <HelpCircle className="h-4 w-4 shrink-0 text-[var(--ps-primary-text)]" />
                  <span className="flex-1 text-[13.5px] font-medium leading-5 text-[var(--ps-fg)]">{item.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--ps-fg-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <p className="px-5 pb-3 pl-12 text-[13px] leading-relaxed text-[var(--ps-fg-secondary)]">
                    {item.a}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
