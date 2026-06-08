import { Check } from 'lucide-react';
import type { PortalSignature } from '../hooks/usePortalData';

// Frise verticale Envoyé → Ouvert → Signé → Terminé dérivée du statut DocuSeal.
// On ne stocke pas l'étape « Ouvert » côté données : on la considère atteinte
// dès qu'un lien de signature existe (pending = ouvert/en attente).

type StepState = 'done' | 'active' | 'todo';

interface Step {
  label: string;
  state: StepState;
}

function buildSteps(sig: PortalSignature): Step[] {
  const { status } = sig;
  const isSigned = status === 'signed';
  const isClosed = status === 'declined' || status === 'expired';

  const sent: StepState = sig.sent_at || status !== 'pending' ? 'done' : 'active';
  const opened: StepState = isSigned ? 'done' : isClosed ? 'todo' : 'active';
  const signedState: StepState = isSigned ? 'done' : 'todo';
  const doneState: StepState = isSigned ? 'done' : 'todo';

  return [
    { label: 'Envoyé', state: sent },
    { label: 'Ouvert', state: opened },
    { label: 'Signé', state: signedState },
    { label: 'Terminé', state: doneState },
  ];
}

const DOT_STYLE: Record<StepState, string> = {
  done: 'border-[var(--ps-success)] bg-[var(--ps-success-subtle)] text-[var(--ps-success-text)]',
  active: 'border-[var(--ps-primary)] bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)]',
  todo: 'border-[var(--ps-border-strong)] bg-[var(--ps-bg-elevated)] text-[var(--ps-fg-muted)]',
};

const LABEL_STYLE: Record<StepState, string> = {
  done: 'text-[var(--ps-success-text)]',
  active: 'text-[var(--ps-primary-text)]',
  todo: 'text-[var(--ps-fg-muted)]',
};

export function SignatureStepper({ signature }: { signature: PortalSignature }) {
  const steps = buildSteps(signature);

  return (
    <ol className="space-y-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const connectorDone = step.state === 'done' && steps[i + 1]?.state === 'done';
        return (
          <li key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`ps-num flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold ${DOT_STYLE[step.state]}`}
              >
                {step.state === 'done' ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              {!isLast && (
                <span
                  className={`my-0.5 w-0.5 flex-1 ${connectorDone ? 'bg-[var(--ps-success)]' : 'bg-[var(--ps-border-strong)]'}`}
                />
              )}
            </div>
            <span className={`pb-4 text-[12.5px] font-medium ${LABEL_STYLE[step.state]} ${isLast ? 'pb-0' : ''}`}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
