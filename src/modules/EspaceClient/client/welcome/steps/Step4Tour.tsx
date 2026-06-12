import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, FolderKanban, FileText, Receipt, PenLine, UserCircle, HelpCircle, Phone,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UseWelcomeWizardResult } from '../useWelcomeWizard';
import { TabPreviewPlaceholder } from './TabPreviewPlaceholder';

interface Section { key: string; icon: LucideIcon; title: string; desc: string }
const SECTIONS: Section[] = [
  { key: 'dashboard',  icon: LayoutDashboard, title: 'Tableau de bord', desc: 'Vue d\'ensemble · KPI, actions, dernière activité.' },
  { key: 'project',    icon: FolderKanban,    title: 'Mon projet',      desc: 'Timeline des 8 phases et avancement détaillé.' },
  { key: 'documents',  icon: FileText,        title: 'Documents',       desc: 'Livrables, briefs, ressources partagées.' },
  { key: 'invoices',   icon: Receipt,         title: 'Factures',        desc: 'Suivi des paiements et acomptes.' },
  { key: 'signatures', icon: PenLine,         title: 'Signatures',      desc: 'Documents à signer électroniquement.' },
  { key: 'profile',    icon: UserCircle,      title: 'Profil',          desc: 'Vos infos, préférences et accès.' },
  { key: 'help',       icon: HelpCircle,      title: 'Aide',            desc: 'Questions fréquentes et contact direct.' },
];

const SWIPE_THRESHOLD = 60;
const WHEEL_THRESHOLD = 30;
const WHEEL_COOLDOWN = 500;

interface Step4TourProps { wizard: UseWelcomeWizardResult }

export function Step4Tour({ wizard: _wizard }: Step4TourProps) {
  const [active, setActive] = useState(0);
  const total = SECTIONS.length;
  const wheelCooldownRef = useRef<number>(0);

  const goNext = () => setActive(i => (i + 1) % total);
  const goPrev = () => setActive(i => (i - 1 + total) % total);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    if (Math.abs(e.deltaX) < WHEEL_THRESHOLD) return;
    const now = Date.now();
    if (now - wheelCooldownRef.current < WHEEL_COOLDOWN) return;
    wheelCooldownRef.current = now;
    if (e.deltaX > 0) goNext(); else goPrev();
  };

  const current = SECTIONS[active];
  const prev = SECTIONS[(active - 1 + total) % total];
  const next = SECTIONS[(active + 1) % total];

  return (
    <div className="mx-auto w-full max-w-[640px] space-y-3">
      <div role="region" aria-roledescription="carrousel" aria-label="Tour des sections du portail"
        onWheel={handleWheel}
        className="relative flex h-[300px] items-center justify-center overflow-hidden"
      >
        <button type="button" onClick={goPrev} aria-label="Section précédente"
          className="absolute left-1 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--ps-border)] bg-[var(--ps-bg-elevated)] text-[var(--ps-fg-secondary)] shadow-md hover:scale-105 sm:flex"
        ><ChevronLeft className="h-4 w-4" /></button>
        <button type="button" onClick={goNext} aria-label="Section suivante"
          className="absolute right-1 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--ps-border)] bg-[var(--ps-bg-elevated)] text-[var(--ps-fg-secondary)] shadow-md hover:scale-105 sm:flex"
        ><ChevronRight className="h-4 w-4" /></button>

        <div onClick={goPrev}
          className="absolute left-0 hidden h-[240px] w-[130px] cursor-pointer items-center sm:flex"
        >
          <div className="w-full scale-90 rounded-2xl border border-[var(--ps-border-soft)] bg-[var(--ps-bg-elevated)] p-3 opacity-55 shadow-sm transition-all hover:scale-95 hover:opacity-85">
            <FeaturedHeader section={prev} index={(active - 1 + total) % total} total={total} compact />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -SWIPE_THRESHOLD) goNext();
              else if (info.offset.x > SWIPE_THRESHOLD) goPrev();
            }}
            className="relative z-10 mx-auto w-[78%] max-w-[400px] cursor-grab rounded-2xl border border-[var(--ps-border-soft)] bg-[var(--ps-bg-elevated)] p-5 shadow-[var(--ps-shadow-floating)] active:cursor-grabbing"
            aria-current="true"
          >
            <FeaturedHeader section={current} index={active} total={total} />
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--ps-fg-secondary)]">{current.desc}</p>
            <div className="mt-3">
              <TabPreviewPlaceholder icon={current.icon} label={current.title} />
            </div>
          </motion.div>
        </AnimatePresence>

        <div onClick={goNext}
          className="absolute right-0 hidden h-[240px] w-[130px] cursor-pointer items-center justify-end sm:flex"
        >
          <div className="w-full scale-90 rounded-2xl border border-[var(--ps-border-soft)] bg-[var(--ps-bg-elevated)] p-3 opacity-55 shadow-sm transition-all hover:scale-95 hover:opacity-85">
            <FeaturedHeader section={next} index={(active + 1) % total} total={total} compact />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {SECTIONS.map((s, i) => (
          <button key={s.key} type="button" onClick={() => setActive(i)}
            aria-label={`Aller à la section ${s.title}`}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === active
                ? 'ps-brand-gradient w-[18px] shadow-sm'
                : 'w-1.5 bg-[var(--ps-border-strong)] hover:bg-[var(--ps-fg-muted)]',
            )}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-[var(--ps-primary-subtle)] px-3.5 py-2.5 text-[12px] text-[var(--ps-primary-text)]">
        <Phone className="h-3.5 w-3.5 shrink-0 animate-pulse" />
        <span>Le bouton flottant en bas à droite de chaque page : votre raccourci pour nous contacter, n'importe quand.</span>
      </div>
    </div>
  );
}

function FeaturedHeader({ section, index, total, compact = false }: {
  section: Section; index: number; total: number; compact?: boolean;
}) {
  const Icon = section.icon;
  return (
    <div className="flex items-start justify-between gap-3">
      <div className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-[var(--ps-primary-subtle)] ring-1 ring-inset ring-[var(--ps-border-soft)]',
        compact ? 'h-8 w-8' : 'h-11 w-11',
      )}>
        <Icon className={cn(compact ? 'h-3.5 w-3.5' : 'h-5 w-5', 'text-[var(--ps-primary-text)]')} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('font-bold text-[var(--ps-fg)]', compact ? 'text-[12.5px]' : 'text-[17px]')}>
          {section.title}
        </p>
      </div>
      <span className="text-[10.5px] font-medium tabular-nums text-[var(--ps-fg-muted)]">
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  );
}
