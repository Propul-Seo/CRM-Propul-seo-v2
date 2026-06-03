import type { ReactNode } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/modules/EspaceClient/shared/components';

interface ScaffoldAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  disabledReason?: string;
}

interface AdminTabScaffoldProps {
  title: string;
  action?: ScaffoldAction;
  loading: boolean;
  error: string | null;
  actionError?: string | null;
  isEmpty: boolean;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyBody?: string;
  children: ReactNode;
}

export function AdminTabScaffold({
  title, action, loading, error, actionError, isEmpty, emptyIcon, emptyTitle, emptyBody, children,
}: AdminTabScaffoldProps) {
  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        {action && (
          <Button
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.disabled ? action.disabledReason : undefined}
          >
            {action.icon && <action.icon className="mr-1 h-4 w-4" />} {action.label}
          </Button>
        )}
      </div>
      {loading && (
        <div className="py-6 text-sm text-gray-500"><Loader2 className="inline h-4 w-4 animate-spin" /> Chargement…</div>
      )}
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {actionError && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}
      {!loading && !error && isEmpty && <EmptyState icon={emptyIcon} title={emptyTitle} body={emptyBody} />}
      {!loading && !isEmpty && children}
    </div>
  );
}
