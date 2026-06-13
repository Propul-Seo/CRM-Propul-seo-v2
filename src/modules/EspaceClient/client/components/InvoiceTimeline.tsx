import type { CSSProperties } from 'react';
import { Check, Clock, FileText, Wallet } from 'lucide-react';
import type { PortalInstallment } from '../hooks/usePortalData';

// « Ligne de vie du paiement » (maquette Variante C). On reconstruit une frise
// horizontale depuis : l'émission (toujours faite), puis chaque échéance
// (acompte / solde) avec son statut, et — s'il n'y a pas d'échéances — un
// unique nœud « Paiement » dérivé du statut de la facture.

type NodeState = 'done' | 'active' | 'pending';

interface TimelineNode {
  key: string;
  icon: typeof Check;
  state: NodeState;
  label: string;
  sub: string;
}

interface InvoiceTimelineProps {
  issueDate: string;
  installments: PortalInstallment[];
  invoiceStatus: string;
  paidAt: string | null;
  formatDate: (iso: string | null) => string;
  formatMoney: (amount: string | number) => string;
}

function installmentState(status: string): NodeState {
  if (status === 'paid') return 'done';
  if (status === 'overdue' || status === 'pending') return 'active';
  return 'pending';
}

export function InvoiceTimeline({
  issueDate, installments, invoiceStatus, paidAt, formatDate, formatMoney,
}: InvoiceTimelineProps) {
  const nodes: TimelineNode[] = [
    {
      key: 'issue',
      icon: FileText,
      state: 'done',
      label: 'Émission',
      sub: formatDate(issueDate),
    },
  ];

  if (installments.length > 0) {
    let firstActiveSeen = false;
    installments.forEach(inst => {
      let state = installmentState(inst.status);
      // Un seul nœud « active » (le premier dû) ; les suivants restent pending.
      if (state === 'active') {
        if (firstActiveSeen) state = 'pending';
        else firstActiveSeen = true;
      }
      const amount = formatMoney(inst.amount);
      nodes.push({
        key: inst.id,
        icon: state === 'done' ? Check : state === 'active' ? Wallet : Clock,
        state,
        label: inst.label || `Échéance ${inst.installment_number}`,
        sub: state === 'done' && inst.paid_at
          ? `${formatDate(inst.paid_at)} · ${amount}`
          : `Éch. ${formatDate(inst.due_date)} · ${amount}`,
      });
    });
  } else {
    const paid = invoiceStatus === 'paid';
    nodes.push({
      key: 'payment',
      icon: paid ? Check : Wallet,
      state: paid ? 'done' : invoiceStatus === 'cancelled' ? 'pending' : 'active',
      label: paid ? 'Payée' : 'Paiement',
      sub: paid && paidAt ? formatDate(paidAt) : 'En attente',
    });
  }

  // Largeur du trait de progression : jusqu'au dernier nœud « done ».
  const lastDone = nodes.reduce((acc, n, i) => (n.state === 'done' ? i : acc), 0);
  const fillPct = nodes.length > 1 ? (lastDone / (nodes.length - 1)) * 100 : 0;

  return (
    <div className="relative">
      {/* Rail de fond + remplissage violet */}
      <div className="absolute left-[14px] right-[14px] top-[14px] h-0.5 bg-[var(--ps-border-strong)]" />
      <div
        className="ps-progress-fill absolute left-[14px] top-[14px] h-0.5 rounded-full bg-[var(--ps-primary)]"
        style={{ '--ps-bar-w': `calc((100% - 28px) * ${fillPct / 100})` } as CSSProperties}
      />

      <ol className="relative flex items-start">
        {nodes.map(node => {
          const Icon = node.icon;
          const nodeCls =
            node.state === 'done'
              ? 'border-[var(--ps-primary)] bg-[var(--ps-primary)] text-white'
              : node.state === 'active'
                ? 'border-[var(--ps-warning)] bg-[var(--ps-bg-elevated)] text-[var(--ps-warning)] ring-4 ring-[var(--ps-warning-subtle)]'
                : 'border-[var(--ps-border-strong)] bg-[var(--ps-bg-elevated)] text-[var(--ps-fg-muted)]';
          const labelCls =
            node.state === 'done'
              ? 'text-[var(--ps-primary-text)]'
              : node.state === 'active'
                ? 'text-[var(--ps-warning-text)]'
                : 'text-[var(--ps-fg-muted)]';
          return (
            <li key={node.key} className="relative z-10 flex flex-1 flex-col items-center text-center">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${nodeCls}`}>
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              <span className={`mt-2.5 px-1 text-[11.5px] font-semibold leading-tight ${labelCls}`}>
                {node.label}
              </span>
              <span className="ps-num mt-0.5 text-[11px] text-[var(--ps-fg-muted)]">{node.sub}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
