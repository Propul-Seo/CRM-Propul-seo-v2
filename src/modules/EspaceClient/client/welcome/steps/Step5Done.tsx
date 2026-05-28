import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import type { UseWelcomeWizardResult } from '../useWelcomeWizard';

interface Step5DoneProps { wizard: UseWelcomeWizardResult }

// Animation E — Orbes flottants. 5 grandes particules qui dérivent doucement
// autour du contenu. Vibe organique premium, calme contemplatif.
const ORBS = [
  { x: '15%', y: '20%', size: 80,  color: '#a78bfa', delay: '0s'   },
  { x: '80%', y: '15%', size: 60,  color: '#7dd3fc', delay: '1.2s' },
  { x: '25%', y: '75%', size: 70,  color: '#f0abfc', delay: '0.6s' },
  { x: '70%', y: '70%', size: 90,  color: '#fdba74', delay: '2s'   },
  { x: '50%', y: '50%', size: 100, color: '#c4b5fd', delay: '1s'   },
] as const;

export function Step5Done({ wizard }: Step5DoneProps) {
  const { project } = usePortal();
  const firstName = wizard.row?.welcome_first_name
    ?? project.client_name?.split(' ')[0]
    ?? 'là';

  return (
    <div className="relative flex h-[340px] flex-col items-center justify-center overflow-hidden text-center">
      {/* Orbes flottants en arrière-plan */}
      {ORBS.map((o, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute rounded-full blur-2xl"
          style={{
            left: o.x,
            top: o.y,
            width: o.size,
            height: o.size,
            background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
            opacity: 0.55,
            animation: 'step5-orb-float 8s ease-in-out infinite',
            animationDelay: o.delay,
          }}
        />
      ))}

      <div className="relative space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-violet-600">C'est parti</p>

        <h1 className="text-[44px] font-extralight leading-[1] tracking-tight text-stone-900 max-sm:text-[32px]"
          style={{ fontFamily: 'Cabinet Grotesk, Inter, sans-serif', fontWeight: 200 }}
        >
          Bienvenue à bord,
        </h1>
        <h1 className="text-[44px] font-semibold leading-[1] tracking-tight max-sm:text-[32px]"
          style={{ fontFamily: 'Cabinet Grotesk, Inter, sans-serif' }}
        >
          <span className="bg-gradient-to-r from-sky-600 via-violet-600 to-pink-600 bg-clip-text text-transparent italic">
            {firstName}.
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-[400px] text-[14px] leading-relaxed text-stone-600">
          Votre espace vous attend. Une dernière étape avant de démarrer la production :
          remplir la configuration projet — depuis le tableau de bord.
        </p>

        <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-white/80 px-4 py-1.5 ring-1 ring-violet-200 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[12px] font-medium text-stone-700">Tout est prêt</span>
        </div>
      </div>

      <style>{`
        @keyframes step5-orb-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(30px, -20px) scale(1.15); }
          66%      { transform: translate(-25px, 15px) scale(0.9); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="step5-orb-float"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
