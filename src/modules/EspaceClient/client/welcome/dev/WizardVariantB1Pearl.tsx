import { Sparkles, ArrowRight, Gem } from 'lucide-react';

// B1 — Pearl Aurora.
// Fond perle crème + aurores pastel très douces (violet/peach/sky).
// Glass cards blanches subtiles. Vibe : intérieur galerie d'art.
export function WizardVariantB1Pearl() {
  return (
    <div className="relative flex h-[600px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#fbf9f5]"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Aurora pastel */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[15%] top-[15%] h-[450px] w-[550px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #c4b5fd 0%, transparent 60%)' }} />
        <div className="absolute -right-[10%] top-[25%] h-[420px] w-[500px] rounded-full opacity-45 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #fbcfe8 0%, transparent 60%)' }} />
        <div className="absolute left-[35%] bottom-[5%] h-[350px] w-[500px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #bae6fd 0%, transparent 60%)' }} />
      </div>

      <div className="relative z-10 grid w-full max-w-[820px] grid-cols-2 gap-4 px-6">
        <div className="rounded-3xl border border-white/60 bg-white/70 p-7 backdrop-blur-xl"
          style={{ boxShadow: '0 20px 60px -10px rgba(124,58,237,0.18), inset 0 1px 0 rgba(255,255,255,0.9)' }}
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-400 shadow-lg shadow-violet-300/50">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="mt-5 text-[44px] font-light leading-[1] tracking-tight text-stone-900"
            style={{ fontFamily: 'Cabinet Grotesk, Inter, sans-serif', fontWeight: 300 }}
          >
            Bonjour,
            <br />
            <span className="font-semibold text-violet-700">Lyes.</span>
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

        <div className="rounded-3xl border border-white/60 bg-white/70 p-7 backdrop-blur-xl"
          style={{ boxShadow: '0 20px 60px -10px rgba(190,24,93,0.15), inset 0 1px 0 rgba(255,255,255,0.9)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-violet-600">Votre projet</p>
          <h2 className="mt-2 text-[24px] font-semibold leading-tight text-stone-900"
            style={{ fontFamily: 'Cabinet Grotesk, Inter, sans-serif' }}>
            Précieuse Joaillerie
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-stone-500">
            <Gem className="h-3 w-3" />Joaillerie · Paris
          </p>

          <div className="mt-5 space-y-2">
            {[
              { k: 'Objectif',  v: 'E-shop premium', dot: '#a78bfa' },
              { k: 'Budget',    v: '15 — 20 k€',     dot: '#f472b6' },
              { k: 'Délai',     v: 'Q3 2026',        dot: '#7dd3fc' },
              { k: 'Modules',   v: '6 à construire', dot: '#fcd34d' },
            ].map(r => (
              <div key={r.k} className="flex items-center justify-between rounded-xl border border-white/80 bg-white/60 px-3 py-2 backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.dot, boxShadow: `0 0 6px ${r.dot}` }} />
                  <span className="text-[11px] text-stone-500">{r.k}</span>
                </div>
                <span className="text-[12.5px] font-semibold text-stone-900">{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-6 bottom-6 z-10 flex items-center justify-between rounded-full border border-white/60 bg-white/70 px-5 py-2 backdrop-blur-xl shadow-sm">
        <span className="text-[10px] font-mono tabular-nums text-stone-500">01 / 05</span>
        <button className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-1 text-[12px] font-semibold text-white shadow-md hover:bg-violet-700">
          Suivant <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
