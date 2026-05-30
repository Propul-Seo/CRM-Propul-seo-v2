import { motion } from 'framer-motion';
import { Target, Settings, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import { itemVariants } from '../lib/animations';

interface Objective {
  label: string;
  current: number;
  target: number;
  unit: string;
  type: string;
}

interface ObjectivesSectionProps {
  objectives: Objective[];
  isPrivacyMode: boolean;
  isMobile: boolean;
  onOpenModal: () => void;
}

export function ObjectivesSection({ objectives, isPrivacyMode, isMobile, onOpenModal }: ObjectivesSectionProps) {
  const colorNames = ['emerald', 'neon', 'amber', 'violet'];
  const colorClasses: Record<string, { text: string; bg: string; ring: string }> = {
    emerald: { text: 'text-emerald-300', bg: 'bg-emerald-400', ring: 'from-emerald-400 to-cyan-300' },
    neon: { text: 'text-cyan-300', bg: 'bg-cyan-400', ring: 'from-cyan-400 to-violet-400' },
    amber: { text: 'text-amber-300', bg: 'bg-amber-300', ring: 'from-amber-300 to-emerald-300' },
    violet: { text: 'text-violet-200', bg: 'bg-violet-400', ring: 'from-violet-400 to-fuchsia-300' },
  };

  return (
    <motion.div variants={itemVariants} className={cn(isMobile ? "col-span-2" : "col-span-12 lg:col-span-4")}>
      <div className={cn(
        "h-full rounded-2xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(20,18,27,0.82),rgba(7,7,13,0.88))] shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl",
        isMobile ? "p-4" : "p-5"
      )}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-400/20 bg-violet-400/10">
              <Target className="h-5 w-5 text-violet-200" />
            </div>
            <h3 className="font-semibold text-white">Objectifs</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenModal}
            className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-2 text-violet-100/62 hover:bg-white/[0.07] hover:text-white"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {objectives.map((objective, index) => {
            const progress = Math.min((objective.current / objective.target) * 100, 100);
            const color = colorNames[index % 4];

            return (
              <div key={index} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-violet-50">{objective.label}</span>
                  <span className={`text-sm font-semibold ${colorClasses[color].text}`}>
                    {isPrivacyMode ? '\u2022\u2022%' : `${Math.round(progress)}%`}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${colorClasses[color].ring} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: isPrivacyMode ? '0%' : `${progress}%` }}
                    transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                  />
                </div>
                <div className="flex justify-between text-xs text-violet-100/45">
                  <span>
                    {isPrivacyMode ? '\u2022\u2022\u2022' : objective.current.toLocaleString()}{objective.unit}
                  </span>
                  <span>
                    {isPrivacyMode ? '\u2022\u2022\u2022' : objective.target.toLocaleString()}{objective.unit}
                  </span>
                </div>
                {progress >= 100 && !isPrivacyMode && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Objectif atteint !</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
