import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react';

export type AlertVariant = 'danger' | 'warning' | 'success' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}

const ICONS: Record<AlertVariant, LucideIcon> = {
  danger: XCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

const WRAP: Record<AlertVariant, string> = {
  danger:  'bg-[var(--ps-danger-subtle)] text-[var(--ps-danger-text)]',
  warning: 'bg-[var(--ps-warning-subtle)] text-[var(--ps-warning-text)]',
  success: 'bg-[var(--ps-success-subtle)] text-[var(--ps-success-text)]',
  info:    'bg-[var(--ps-info-subtle)] text-[var(--ps-info-text)]',
};

// Bandeau d'état unifié (tokens sémantiques + icône Lucide). Remplace les
// `bg-red-50` ad-hoc du portail et de l'admin. Theme-aware (clair/sombre).
export function Alert({ variant = 'info', title, children, action }: AlertProps) {
  const Icon = ICONS[variant];
  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-[var(--ps-radius-input)] px-3.5 py-2.5 text-[13px] ${WRAP[variant]}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} />
      <div className="min-w-0 flex-1 leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
