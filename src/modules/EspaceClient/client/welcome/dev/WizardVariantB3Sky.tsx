import { Sparkles, ArrowRight, Gem } from 'lucide-react';

// B3 — Sky Aurora.
// Fond bleu très pâle + aurores teal/peach/violet diagonales. Cards blanches
// crispées. Vibe : matin clair, énergique, hopeful. Plus tonique que B2.
export function WizardVariantB3Sky() {
  return (
    <div className="relative flex h-[600px] w-full items-center justify-center overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #fff7ed 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Aurores diagonales */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[10%] top-[5%] h-[400px] w-[600px] -rotate-12 rounded-full opacity-45 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #7dd3fc 0%, transparent 60%)' }} />
        <div className="absolute right-[5%] top-[20%] h-[400px] w-[500px] rotate-12 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #c4b5fd 0%, transparent 60%)' }} />
        <div className="absolute left-[30%] bottom-[0%] h-[300px] w-[500px] rounded-full opacity-45 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #fed7aa 0%, transparent 60%)' }} />
      </div>

      <div className="relative z-10 grid w-full max-w-[820px] grid-cols-2 gap-4 px-6">
        <div className="rounded-3xl bg-white p-7"
          style={{ boxShadow: '0 30px 60px -15px rgba(56,189,248,0.25), 0 0 0 1px rgba(56,189,248,0.08)' }}
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-violet-500 to-pink-500"
            style={{ boxShadow: '0 10px 25px -5px rgba(139,92,246,0.5)' }}
          >
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="mt-5 text-[44px] font-light leading-[1] tracking-tight text-stone-900"
            style={{ fontFamily: 'Cabinet Grotesk, Inter, sans-serif', fontWeight: 300 }}
          >
            Bonjour,
            <br />
            <span className="bg-gradient-to-r from-sky-600 via-violet-600 to-pink-600 bg-clip-text font-semibold text-transparent">
              Lyes.
            </span>
          </h1>
          <p className="mt-4 text-[13.5px] leading-relaxed text-stone-600">
            On démarre <span className="font-semibold text-stone-900">Test Propulspace</span> ensemble.
            Quelques étapes rapides pour personnaliser votre espace.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 ring-1 ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-emerald-700">Votre AE est en ligne</span>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-7"
          style={{ boxShadow: '0 30px 60px -15px rgba(192,38,211,0.20), 0 0 0 1px rgba(192,38,211,0.06)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-sky-600">Votre projet</p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700 ring-1 ring-emerald-200">
              ✓ PRÉ-REMPLI
            </span>
          </div>
          <h2 className="mt-2 text-[24px] font-semibold leading-tight text-stone-900"
            style={{ fontFamily: 'Cabinet Grotesk, Inter, sans-serif' }}>
            Précieuse Joaillerie
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-stone-500">
            <Gem className="h-3 w-3" />Joaillerie · Paris
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {[
              { k: 'Objectif',  v: 'E-shop',      bg: 'from-sky-50 to-sky-100/60',     text: 'text-sky-700' },
              { k: 'Budget',    v: '15-20 k€',    bg: 'from-violet-50 to-violet-100/60', text: 'text-violet-700' },
              { k: 'Délai',     v: 'Q3 2026',     bg: 'from-orange-50 to-orange-100/60', text: 'text-orange-700' },
              { k: 'Modules',   v: '6 modules',   bg: 'from-pink-50 to-pink-100/60',   text: 'text-pink-700' },
            ].map(r => (
              <div key={r.k} className={`rounded-2xl bg-gradient-to-br ${r.bg} p-2.5`}>
                <p className={`text-[9.5px] font-bold uppercase tracking-widest ${r.text}`}>{r.k}</p>
                <p className="mt-1 text-[13px] font-semibold text-stone-900">{r.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-6 bottom-6 z-10 flex items-center justify-between rounded-full bg-white px-5 py-2 shadow-lg shadow-violet-200/40">
        <span className="text-[10px] font-mono tabular-nums text-stone-500">01 / 05</span>
        <button className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 px-4 py-1 text-[12px] font-semibold text-white shadow-lg shadow-violet-500/40">
          Suivant <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
