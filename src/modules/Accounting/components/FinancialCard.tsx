import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';
import { Sparkline } from './Sparkline';

export function FinancialCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  trendValue,
  color,
  sparklineData,
  delay = 0
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'emerald' | 'rose' | 'cyan' | 'amber' | 'violet';
  sparklineData?: number[];
  delay?: number;
}) {
  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      glow: 'hover:shadow-emerald-500/10',
      gradient: 'from-emerald-500/10',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      glow: 'hover:shadow-rose-500/10',
      gradient: 'from-rose-500/10',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
      glow: 'hover:shadow-cyan-500/10',
      gradient: 'from-cyan-500/10',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      glow: 'hover:shadow-amber-500/10',
      gradient: 'from-amber-500/10',
    },
    violet: {
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
      text: 'text-violet-400',
      glow: 'hover:shadow-violet-500/10',
      gradient: 'from-violet-500/10',
    },
  };

  const c = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-surface-2 to-surface-2/50
        border border-border/50 p-5
        transition-all duration-300 hover:border-border hover:shadow-xl ${c.glow}
      `}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${c.gradient} to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`inline-flex p-2.5 rounded-xl ${c.bg} ${c.border} border`}>
            <Icon className={`h-5 w-5 ${c.text}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-muted-foreground'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> :
               trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> : null}
              {trendValue}
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className={`text-2xl font-bold ${c.text}`}>
          <AnimatedCounter value={value} suffix="€" />
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}

        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-3 h-10">
            <Sparkline data={sparklineData} color={color} height={40} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
