import { cn } from '@/lib/utils';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import type { UseWelcomeWizardResult } from '../useWelcomeWizard';

interface Step5DoneProps { wizard: UseWelcomeWizardResult }

// Final festif monochrome (DA Aurora : un seul accent violet) — un halo
// pulsant derrière le titre (.ps-halo) + des sparks violets qui montent en
// boucle (.ps-spark). La profondeur passe par la taille et l'opacité des
// dots, plus par la teinte. Positions/délais en classes littérales (JIT).
const SPARKS: ReadonlyArray<string> = [
  'left-[16%] top-[30%] h-2 w-2 opacity-50',
  'left-[28%] top-[68%] h-1.5 w-1.5 opacity-40 [animation-delay:0.6s]',
  'left-[50%] top-[78%] h-2.5 w-2.5 opacity-30 [animation-delay:1.4s]',
  'left-[72%] top-[64%] h-1.5 w-1.5 opacity-45 [animation-delay:0.9s]',
  'left-[84%] top-[26%] h-2 w-2 opacity-40 [animation-delay:1.8s]',
];

export function Step5Done({ wizard }: Step5DoneProps) {
  const { project } = usePortal();
  const firstName = wizard.row?.welcome_first_name
    ?? project.client_name?.split(' ')[0]
    ?? 'là';

  return (
    <div className="relative flex h-[340px] flex-col items-center justify-center overflow-hidden text-center">
      {/* Halo violet pulsant derrière le titre */}
      <div
        aria-hidden
        className="ps-halo pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full"
      />

      {/* Sparks violets en arrière-plan */}
      {SPARKS.map(pos => (
        <span
          key={pos}
          aria-hidden
          className={cn('ps-spark pointer-events-none absolute rounded-full bg-[var(--ps-primary)]', pos)}
        />
      ))}

      <div className="relative space-y-3">
        <p className="ps-eyebrow">C'est parti</p>

        <h1 className="text-[44px] font-extralight leading-[1] tracking-tight text-[var(--ps-fg)] [font-family:var(--ps-font-display)] max-sm:text-[32px]">
          Bienvenue à bord,
        </h1>
        <h1 className="text-[44px] font-semibold italic leading-[1] tracking-tight text-[var(--ps-primary-text)] [font-family:var(--ps-font-display)] max-sm:text-[32px]">
          {firstName}.
        </h1>

        <p className="mx-auto mt-4 max-w-[400px] text-[14px] leading-relaxed text-[var(--ps-fg-secondary)]">
          Votre espace vous attend. Une dernière étape avant de démarrer la production :
          remplir la configuration projet — depuis le tableau de bord.
        </p>

        <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-[var(--ps-bg-elevated)] px-4 py-1.5 ring-1 ring-[var(--ps-border)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--ps-success)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--ps-success)]" />
          </span>
          <span className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">Tout est prêt</span>
        </div>
      </div>
    </div>
  );
}
