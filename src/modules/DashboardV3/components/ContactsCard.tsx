import { motion } from 'framer-motion';
import { Users, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { AnimatedNumber } from './AnimatedNumber';
import { itemVariants } from '../lib/animations';

interface ContactsCardProps {
  contactsCount: number | undefined;
  leadsCount: number | undefined;
  isPrivacyMode: boolean;
  isMobile: boolean;
  onClick: () => void;
}

export function ContactsCard({ contactsCount, leadsCount, isPrivacyMode, isMobile, onClick }: ContactsCardProps) {
  return (
    <motion.div variants={itemVariants} className={cn(isMobile ? "col-span-1" : "col-span-12 md:col-span-6 lg:col-span-2")}>
      <div
        onClick={onClick}
        className={cn(
          "group relative h-full cursor-pointer overflow-hidden rounded-2xl border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(19,18,31,0.78),rgba(7,7,13,0.86))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:border-cyan-300/35 hover:bg-white/[0.04]",
          isMobile ? "min-h-[150px]" : "min-h-[260px]"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.12),transparent_34%)]" />

        <div className="relative z-10 h-full flex flex-col">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
              <Users className="h-5 w-5 text-cyan-300" />
            </div>
            <ChevronRight className="h-4 w-4 text-violet-100/35 transition-all group-hover:translate-x-1 group-hover:text-cyan-300" />
          </div>

          <div className="mt-auto">
            <p className="text-sm font-semibold text-violet-100/62">Contacts CRM</p>
            {isPrivacyMode ? (
              <div className="mt-3 font-mono text-4xl font-bold text-violet-100/38">****</div>
            ) : (
              <div className="mt-3 text-4xl font-black tracking-tight text-cyan-300">
                <AnimatedNumber value={contactsCount || 0} />
              </div>
            )}
            <div className="mt-3 border-t border-white/[0.08] pt-3">
              <p className="text-xs text-violet-100/46">
                {isPrivacyMode ? '**' : leadsCount || 0} leads actifs
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
