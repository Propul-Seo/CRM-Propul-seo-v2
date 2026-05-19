import type { ReactNode } from 'react';
import { ArrowRight, ArrowLeft, X } from 'lucide-react';

// Shell partagé pour les 5 étapes Sky Aurora.
// Reproduit le wizard complet (header + progress + content + footer) avec
// le fond aurora diagonal. Chaque étape passe son numéro + contenu.

export function SkyShell({
  step, children, isLast = false, isFirst = false,
}: { step: number; children: ReactNode; isLast?: boolean; isFirst?: boolean }) {
  return (
    <div className="relative flex h-[620px] w-full flex-col overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #fff7ed 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Auroras diagonales partagées */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[10%] top-[5%] h-[400px] w-[600px] -rotate-12 rounded-full opacity-45 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #7dd3fc 0%, transparent 60%)' }} />
        <div className="absolute right-[5%] top-[20%] h-[400px] w-[500px] rotate-12 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #c4b5fd 0%, transparent 60%)' }} />
        <div className="absolute left-[30%] bottom-[0%] h-[300px] w-[500px] rounded-full opacity-45 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #fed7aa 0%, transparent 60%)' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/40 bg-white/50 px-6 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-7 items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 px-3 text-[11px] font-bold text-white shadow-sm">
            ✨ Propul'SEO
          </div>
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-stone-600 ring-1 ring-stone-200/60">
            Onboarding <span className="font-mono tabular-nums text-stone-900">{step}</span>
            <span className="opacity-40">/</span><span className="font-mono opacity-60">5</span>
          </span>
        </div>
        <button className="inline-flex h-8 items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 text-[12px] font-medium text-stone-600 hover:bg-stone-50">
          <X className="h-3.5 w-3.5" />Terminer plus tard
        </button>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 flex items-center gap-1.5 bg-white/30 px-6 py-2 backdrop-blur-sm">
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} className="relative h-[5px] flex-1 overflow-hidden rounded-full bg-white/60">
            <div className={
              n < step ? 'absolute inset-0 bg-violet-500' :
              n === step ? 'absolute inset-0 bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500' :
              'absolute inset-0'
            } />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-5">
        {children}
      </div>

      {/* Footer */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/40 bg-white/50 px-6 py-2.5 backdrop-blur-md">
        {!isFirst ? (
          <button className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-stone-900">
            <ArrowLeft className="h-3.5 w-3.5" />Précédent
          </button>
        ) : <span />}
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/80 px-2 py-0.5 font-mono text-[10px] tabular-nums text-stone-500">~ 1 min</span>
          {isLast ? (
            <button className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-5 py-1.5 text-[12.5px] font-semibold text-white shadow-lg hover:bg-stone-800">
              Accéder à mon espace <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 px-5 py-1.5 text-[12.5px] font-semibold text-white shadow-lg shadow-violet-500/30">
              Suivant <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
