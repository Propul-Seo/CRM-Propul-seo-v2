import { useState } from 'react';
import { toast } from 'sonner';
import { Unlock, MoreVertical, RefreshCw, Power, Loader2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePortalState, type PortalState } from '../../hooks/usePortalState';
import { usePortalActivation } from '../../hooks/usePortalActivation';
import { ActivatePortalDialog, type ActivatePortalPayload } from '../ActivatePortalDialog';
import { DeactivatePortalDialog } from '../DeactivatePortalDialog';

// Contrôle d'accès portail COMPACT, conçu pour le header du cockpit (forme
// inline) : remplace l'ancienne carte PortalStatusSection de l'aperçu.
// État réel via usePortalState (5 états), actions via usePortalActivation.

interface Props {
  projectId: string;
  projectName: string;
  portalClientEmail: string | null;
  /** Rafraîchit les données parentes (KPI cockpit) après une action. */
  onRefresh?: () => void | Promise<void>;
}

const STATE_DISPLAY: Record<Exclude<PortalState, 'inactive'>, { label: string; dotClass: string }> = {
  active:  { label: 'Actif',          dotClass: 'bg-emerald-400' },
  invited: { label: 'Invité',         dotClass: 'bg-blue-400' },
  orphan:  { label: 'À régulariser',  dotClass: 'bg-amber-400' },
  broken:  { label: 'Compte supprimé', dotClass: 'bg-red-400' },
};

function formatRelative(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} j`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem.`;
  return `il y a ${Math.floor(days / 30)} mois`;
}

export function PortalAccessControl({ projectId, projectName, portalClientEmail, onRefresh }: Props) {
  const [activateOpen, setActivateOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const { activatePortal, resendInvite, deactivatePortal, isResending } = usePortalActivation();
  const { data: stateRow, refresh: refreshState } = usePortalState(projectId);

  const state = stateRow?.state ?? 'inactive';
  const hasEmail = state !== 'inactive';
  const canResend = state === 'active' || state === 'invited';
  const email = stateRow?.portal_client_email ?? portalClientEmail;
  const lastLogin = state === 'active' ? formatRelative(stateRow?.last_login_at) : null;

  async function refreshAll() {
    await Promise.all([onRefresh?.(), refreshState()]);
  }

  async function handleActivate(payload: ActivatePortalPayload) {
    const result = await activatePortal(projectId, payload.email);
    if (result.success) {
      toast.success('Portail activé', {
        description: `Le client recevra un email d'invitation à ${payload.email} dans quelques minutes.`,
      });
      await refreshAll();
    }
    return result;
  }

  async function handleResend() {
    if (!email) return;
    const result = await resendInvite(projectId);
    if (result.success) {
      toast.success("Lien d'accès renvoyé", { description: `Un nouveau lien a été envoyé à ${email}.` });
      await refreshAll();
    } else {
      toast.error('Impossible de renvoyer le lien', { description: result.error });
    }
  }

  async function handleDeactivate(reason?: string) {
    const result = await deactivatePortal(projectId, reason);
    if (result.success) {
      toast.success('Portail désactivé', { description: "L'accès du client expirera au prochain rafraîchissement." });
      await refreshAll();
    }
    return result;
  }

  const dialogs = (
    <>
      <ActivatePortalDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        projectName={projectName}
        defaultEmail={portalClientEmail ?? ''}
        primaryContactName={null}
        onConfirm={handleActivate}
      />
      {email && (
        <DeactivatePortalDialog
          open={deactivateOpen}
          onOpenChange={setDeactivateOpen}
          projectName={projectName}
          clientEmail={email}
          onConfirm={handleDeactivate}
        />
      )}
    </>
  );

  // Inactif → CTA d'activation.
  if (!hasEmail) {
    return (
      <>
        <button
          type="button"
          onClick={() => setActivateOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[12.5px] font-semibold text-white shadow-glow transition-colors hover:bg-primary/85"
        >
          <Unlock className="h-3.5 w-3.5" /> Activer le portail
        </button>
        {dialogs}
      </>
    );
  }

  const display = STATE_DISPLAY[state as Exclude<PortalState, 'inactive'>];

  // Actif/invité/orphan/broken → état + renvoi + menu (désactiver), inline.
  return (
    <>
      <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${display.dotClass}`} aria-hidden="true" />
        <span className="text-[12.5px] font-medium text-foreground">{display.label}</span>
        {lastLogin && <span className="hidden text-[11px] text-muted-foreground sm:inline">· vu {lastLogin}</span>}

        {canResend && (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="ml-1 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Renvoyer
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground"
              aria-label="Actions portail"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => setDeactivateOpen(true)}
              className="text-red-300 focus:bg-red-500/10 focus:text-red-300"
            >
              <Power className="mr-2 h-4 w-4" /> Désactiver le portail
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {dialogs}
    </>
  );
}
