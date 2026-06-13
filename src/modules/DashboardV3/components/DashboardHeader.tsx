import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { StatusDot } from './StatusDot';

interface DashboardHeaderProps {
  mounted: boolean;
  formattedDate: string;
  isPrivacyMode: boolean;
  onTogglePrivacy: () => void;
}

export function DashboardHeader({ mounted, formattedDate, isPrivacyMode, onTogglePrivacy }: DashboardHeaderProps) {
  return (
    <motion.header
      className="mb-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : -20 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5">
            <StatusDot status="active" />
            <span className="text-xs font-semibold text-emerald-300">Opérationnel</span>
          </div>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs font-semibold capitalize text-violet-100/72">
            {formattedDate}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onTogglePrivacy}
          className={`
            flex items-center gap-2 rounded-xl px-4 py-2 transition-all duration-200
            ${isPrivacyMode
              ? 'border border-rose-400/20 bg-rose-400/10 text-rose-300 hover:bg-rose-400/15'
              : 'border border-white/[0.08] bg-white/[0.035] text-violet-100/66 hover:bg-white/[0.07] hover:text-white'
            }
          `}
        >
          {isPrivacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span className="text-sm">{isPrivacyMode ? 'Masqué' : 'Masquer'}</span>
        </Button>
      </div>
    </motion.header>
  );
}
