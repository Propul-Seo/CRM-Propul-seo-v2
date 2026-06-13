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
    <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm">
      {sections.map((s, idx) => {
        const open = openIdx === idx;
        return (
          <li key={s.num}>
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : idx)}
              aria-expanded={open}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-violet-50/55"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700">
                {s.num}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-stone-950">{s.title}</span>
                <span className="block truncate text-[12px] text-stone-500">{s.summary}</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-stone-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>
            {open && (
              <dl className="grid grid-cols-1 gap-2 bg-stone-50/80 px-4 py-3 text-[12.5px] sm:grid-cols-2">
                {s.details.map(d => (
                  <div key={d.label} className="min-w-0">
                    <dt className="text-[11px] uppercase tracking-wider text-stone-400">{d.label}</dt>
                    <dd className="break-words text-stone-900">{d.value}</dd>
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
