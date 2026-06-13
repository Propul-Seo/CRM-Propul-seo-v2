import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { AnimatedNumber } from './AnimatedNumber';
import { itemVariants } from '../lib/animations';

interface RevenueCardProps {
  currentYear: number;
  currentYearRevenue: number;
  accountingLoading: boolean;
  isPrivacyMode: boolean;
  isMobile: boolean;
  onClick: () => void;
}

export function RevenueCard({ currentYear, currentYearRevenue, accountingLoading, isPrivacyMode, isMobile, onClick }: RevenueCardProps) {
  return (
    <motion.div variants={itemVariants} className={cn(isMobile ? "col-span-2" : "col-span-12 lg:col-span-7")}>
      <div
        onClick={onClick}
        className={cn(
          "group relative h-full cursor-pointer overflow-hidden rounded-2xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(17,26,26,0.78),rgba(7,7,13,0.88))] shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl transition-all duration-300 hover:border-emerald-300/35 hover:shadow-[0_22px_70px_rgba(16,185,129,0.08)]",
          isMobile ? "min-h-[190px] p-4" : "min-h-[260px] p-4 lg:p-5"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(52,211,153,0.14),transparent_34%)]" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-emerald-400/[0.055] to-transparent" />

        <div className="relative z-10 h-full flex flex-col">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                <TrendingUp className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Chiffre d'affaires</h3>
                <p className="text-xs text-violet-100/48">Annee {currentYear}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5">
              <ArrowUpRight className="h-4 w-4 text-emerald-300" />
              <span className="text-xs font-bold text-emerald-300">+12.5%</span>
            </div>
          </div>

          <div className="flex flex-1 items-end gap-5">
            <div className="flex-1">
              <div className={cn(isMobile ? "mb-2" : "mb-4")}>
                {isPrivacyMode ? (
                  <div className={cn("font-mono font-bold text-violet-100/40", isMobile ? "text-3xl" : "text-5xl lg:text-6xl")}>
                    *******
                  </div>
                ) : (
                  <div className={cn("font-black tracking-tight text-emerald-300", isMobile ? "text-3xl" : "text-5xl lg:text-6xl")}>
                    <AnimatedNumber value={currentYearRevenue} suffix={'\u20AC'} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-300" />
                  <span className="text-sm text-violet-100/48">
                    {accountingLoading ? 'Chargement...' : 'Données temps réel'}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-violet-100/42 transition-all group-hover:translate-x-1 group-hover:text-emerald-300" />
              </div>
            </div>

            <div className="hidden h-24 w-48 opacity-70 transition-opacity group-hover:opacity-90 lg:block">
              <svg viewBox="0 0 200 80" className="w-full h-full">
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,60 Q30,50 50,55 T100,40 T150,45 T200,20" fill="none" stroke="#34d399" strokeWidth="3" className="drop-shadow-[0_0_10px_rgba(52,211,153,0.35)]" />
                <path d="M0,60 Q30,50 50,55 T100,40 T150,45 T200,20 V80 H0 Z" fill="url(#chartGradient)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
