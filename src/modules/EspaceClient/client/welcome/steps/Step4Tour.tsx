import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, FolderKanban, FileText, Receipt, PenLine, UserCircle, HelpCircle, Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UseWelcomeWizardResult } from '../useWelcomeWizard';
import { TabPreviewPlaceholder } from './TabPreviewPlaceholder';

interface Section {
  key: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}

const SECTIONS: Section[] = [
  { key: 'dashboard',  icon: LayoutDashboard, title: 'Tableau de bord', desc: 'Vue d\'ensemble · KPI, actions, dernière activité.' },
  { key: 'project',    icon: FolderKanban,    title: 'Mon projet',      desc: 'Timeline des 8 phases et avancement détaillé.' },
  { key: 'documents',  icon: FileText,        title: 'Documents',       desc: 'Livrables, briefs, ressources partagées.' },
  { key: 'invoices',   icon: Receipt,         title: 'Factures',        desc: 'Suivi des paiements et acomptes.' },
  { key: 'signatures', icon: PenLine,         title: 'Signatures',      desc: 'Documents à signer électroniquement.' },
  { key: 'profile',    icon: UserCircle,      title: 'Profil',          desc: 'Vos infos, préférences et accès.' },
  { key: 'help',       icon: HelpCircle,      title: 'Aide',            desc: 'Questions fréquentes et contact direct.' },
];

const SWIPE_THRESHOLD = 60; // px de drag pour valider un swipe

interface Step4TourProps {
  wizard: UseWelcomeWizardResult;
}

export function Step4Tour({ wizard: _wizard }: Step4TourProps) {
  const [active, setActive] = useState(0);
  const total = SECTIONS.length;

  const goNext = () => setActive(i => (i + 1) % total);
  const goPrev = () => setActive(i => (i - 1 + total) % total);

  const current = SECTIONS[active];
  const prev    = SECTIONS[(active - 1 + total) % total];
  const next    = SECTIONS[(active + 1) % total];

  return (
    <div className="mx-auto max-w-[640px] space-y-4">
      {/* Scène du carrousel : peeking gauche + featured + peeking droite */}
      <div
        role="region"
        aria-roledescription="carrousel"
        aria-label="Tour des sections du portail"
        className="relative flex h-[340px] items-center justify-center overflow-hidden"
      >
        {/* Peeking gauche — caché sur mobile (max-sm) */}
        <div
          onClick={goPrev}
          className="ps-tap absolute left-0 hidden h-[280px] w-[140px] cursor-pointer items-center sm:flex"
        >
          <div className="ps-lift group w-full scale-[0.92] rounded-2xl border border-[var(--ps-border)] bg-white p-4 opacity-55 shadow-sm transition-all duration-[var(--ps-dur-base)] hover:scale-[0.96] hover:opacity-85">
            <FeaturedHeader section={prev} index={(active - 1 + total) % total} total={total} compact />
          </div>
        </div>

        {/* Featured (centre) — drag horizontal pour swipe */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -SWIPE_THRESHOLD) goNext();
              else if (info.offset.x > SWIPE_THRESHOLD) goPrev();
            }}
            className="ps-tap ps-shadow-floating ps-glow-violet-soft relative z-10 mx-auto w-[80%] max-w-[420px] cursor-grab rounded-2xl border border-[var(--ps-border)] bg-white p-5 active:cursor-grabbing"
            aria-current="true"
          >
            <FeaturedHeader section={current} index={active} total={total} />
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--ps-fg-secondary)]">{current.desc}</p>
            <div className="mt-4">
              <TabPreviewPlaceholder icon={current.icon} label={current.title} />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Peeking droite */}
        <div
          onClick={goNext}
          className="ps-tap absolute right-0 hidden h-[280px] w-[140px] cursor-pointer items-center justify-end sm:flex"
        >
          <div className="ps-lift group w-full scale-[0.92] rounded-2xl border border-[var(--ps-border)] bg-white p-4 opacity-55 shadow-sm transition-all duration-[var(--ps-dur-base)] hover:scale-[0.96] hover:opacity-85">
            <FeaturedHeader section={next} index={(active + 1) % total} total={total} compact />
          </div>
        </div>
      </div>

      {/* Indicator dots */}
      <div className="flex items-center justify-center gap-1.5">
        {SECTIONS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Aller à la section ${s.title}`}
            className={cn(
              'ps-tap h-1.5 rounded-full transition-all duration-200',
              i === active
                ? 'ps-glow-violet-soft w-[18px] bg-[var(--ps-primary)]'
                : 'w-1.5 bg-[var(--ps-border)] hover:bg-[var(--ps-fg-muted)]',
            )}
          />
        ))}
      </div>

      {/* Hint contact bandeau — dégradé subtil primary-subtle → bg-subtle */}
      <div className="flex items-center gap-2 rounded-lg bg-[linear-gradient(to_right,var(--ps-primary-subtle),var(--ps-bg-subtle))] px-3.5 py-2.5 text-[12px] text-[var(--ps-primary-text)]">
        <Phone className="ps-pulse h-3.5 w-3.5 shrink-0" />
        <span>
          Bouton bleu en bas à droite de chaque page : votre raccourci pour nous contacter, n'importe quand.
        </span>
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
        'flex shrink-0 items-center justify-center rounded-lg bg-[var(--ps-primary-subtle)] ring-1 ring-inset ring-[var(--ps-primary)]/15',
        !compact && 'ps-glow-violet-soft',
        compact ? 'h-9 w-9' : 'h-11 w-11',
      )}>
        <Icon className={cn(compact ? 'h-4 w-4' : 'h-5 w-5', 'text-[var(--ps-primary-text)]')} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn(
          'font-bold text-[var(--ps-fg)]',
          compact ? 'text-[13.5px]' : 'text-[17px]',
        )}>
          {section.title}
        </p>
      </div>
      <span className="ps-num text-[10.5px] font-medium text-[var(--ps-fg-muted)]">
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  );
}
