import { Sparkles, ArrowRight, Gem } from 'lucide-react';

// B2 — Frosted Lavender.
// Fond blanc + grande aurore violet douce centrée. Glass cards laiteuses,
// très lumineux, contrast doux. Vibe : matin doux, féminin chic.
export function WizardVariantB2Lavender() {
  return (
    <div className="relative flex h-[600px] w-full items-center justify-center overflow-hidden rounded-2xl bg-white"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Aurore violet centrée majeure */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #ddd6fe 0%, #fae8ff 35%, transparent 70%)' }} />
        <div className="absolute left-[10%] top-[10%] h-[300px] w-[400px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #c4b5fd 0%, transparent 60%)' }} />
        <div className="absolute right-[10%] bottom-[10%] h-[300px] w-[400px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #f0abfc 0%, transparent 60%)' }} />
      </div>

      <div className="relative z-10 grid w-full max-w-[820px] grid-cols-2 gap-4 px-6">
        <div className="rounded-[28px] border border-violet-100/80 bg-white/80 p-7 backdrop-blur-2xl"
          style={{ boxShadow: '0 30px 80px -20px rgba(124,58,237,0.25), 0 0 0 1px rgba(255,255,255,0.6) inset' }}
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600"
            style={{ boxShadow: '0 8px 20px -4px rgba(139,92,246,0.5)' }}
          >
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="mt-5 text-[44px] font-light leading-[1] tracking-tight text-stone-900"
            style={{ fontFamily: 'Cabinet Grotesk, Inter, sans-serif', fontWeight: 300 }}
          >
            Bonjour,
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text font-semibold text-transparent">
              Lyes.
            </span>
          </h1>
          <p className="mt-4 text-[13.5px] leading-relaxed text-stone-600">
            On démarre <span className="font-semibold text-stone-900">Test Propulspace</span> ensemble.
            Quelques étapes pour personnaliser votre espace.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 ring-1 ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">Votre AE est en ligne</span>
          </div>
        </div>

        <div className="rounded-[28px] border border-fuchsia-100/80 bg-white/80 p-7 backdrop-blur-2xl"
          style={{ boxShadow: '0 30px 80px -20px rgba(192,38,211,0.20), 0 0 0 1px rgba(255,255,255,0.6) inset' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-fuchsia-700">Votre projet</p>
          <h2 className="mt-2 text-[24px] font-semibold leading-tight text-stone-900"
            style={{ fontFamily: 'Cabinet Grotesk, Inter, sans-serif' }}>
            Précieuse Joaillerie
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-stone-500">
            <Gem className="h-3 w-3" />Joaillerie · Paris
          </p>

          <div className="mt-5 space-y-2">
            {[
              { k: 'Objectif',  v: 'E-shop premium', dot: '#8b5cf6' },
              { k: 'Budget',    v: '15 — 20 k€',     dot: '#d946ef' },
              { k: 'Délai',     v: 'Q3 2026',        dot: '#6366f1' },
              { k: 'Modules',   v: '6 à construire', dot: '#ec4899' },
            ].map(r => (
              <div key={r.k} className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-violet-50/60 to-fuchsia-50/60 px-3 py-2 ring-1 ring-violet-100/60">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.dot }} />
                  <span className="text-[11px] text-stone-500">{r.k}</span>
                </div>
                <span className="text-[12.5px] font-semibold text-stone-900">{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-6 bottom-6 z-10 flex items-center justify-between rounded-full bg-white/80 px-5 py-2 ring-1 ring-violet-100 backdrop-blur-xl"
        style={{ boxShadow: '0 8px 30px -10px rgba(139,92,246,0.15)' }}
      >
        <span className="text-[10px] font-mono tabular-nums text-stone-500">01 / 05</span>
        <button className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-1 text-[12px] font-semibold text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50">
          Suivant <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
