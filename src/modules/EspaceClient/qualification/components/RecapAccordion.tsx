import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { QualificationDraft } from '../schema';
import { buildSections } from './recapSections';

interface RecapAccordionProps {
  draft: QualificationDraft;
}

export function RecapAccordion({ draft }: RecapAccordionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const sections = buildSections(draft);

  return (
    <ul className="divide-y divide-[var(--ps-border-soft)] overflow-hidden rounded-xl border border-[var(--ps-border-soft)] bg-white">
      {sections.map((s, idx) => {
        const open = openIdx === idx;
        return (
          <li key={s.num}>
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : idx)}
              aria-expanded={open}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--ps-bg-subtle)]"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] text-[11px] font-bold text-[var(--ps-primary-text)]">
                {s.num}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-[var(--ps-fg)]">{s.title}</span>
                <span className="block truncate text-[12px] text-[var(--ps-fg-muted)]">{s.summary}</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[var(--ps-fg-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>
            {open && (
              <dl className="grid grid-cols-1 gap-2 bg-[var(--ps-bg-subtle)] px-4 py-3 text-[12.5px] sm:grid-cols-2">
                {s.details.map(d => (
                  <div key={d.label} className="min-w-0">
                    <dt className="text-[11px] uppercase tracking-wider text-[var(--ps-fg-muted)]">{d.label}</dt>
                    <dd className="break-words text-[var(--ps-fg)]">{d.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        );
      })}
    </ul>
  );
}
