import { Sparkles } from 'lucide-react';
import { AGENCY_NAME } from '@/modules/EspaceClient/shared/constants';

interface BrandPillProps {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { box: 'h-7 px-2 text-[11px]',   icon: 'h-3 w-3' },
  md: { box: 'h-8 px-2.5 text-[12px]', icon: 'h-3.5 w-3.5' },
  lg: { box: 'h-10 px-3 text-[14px]',  icon: 'h-4 w-4' },
} as const;

export function BrandPill({ size = 'md' }: BrandPillProps) {
  const s = SIZES[size];
  return (
    <span
      className={`ps-brand-gradient inline-flex items-center gap-1.5 rounded-lg font-bold tracking-tight text-white shadow-[0_2px_8px_-2px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.18)] ${s.box}`}
    >
      <Sparkles className={s.icon} strokeWidth={2.4} />
      {AGENCY_NAME}
    </span>
  );
}
