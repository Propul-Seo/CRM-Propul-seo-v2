import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}

// État vide « de marque » des onglets admin : bulle violette + titre + CTA.
export function AdminEmptyState({ icon: Icon, title, body, action }: Props) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {body && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
