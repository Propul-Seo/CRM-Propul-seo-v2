import { Sparkles, ArrowRight, Gem } from 'lucide-react';

// B4 — Soft Spotlight.
// Fond blanc pur, un seul gros spotlight radial violet/cyan au centre.
// Très épuré, minimaliste. Vibe : Apple keynote, focus absolu sur le contenu.
export function WizardVariantB4Spotlight() {
  return (
    <div className="relative flex h-[600px] w-full items-center justify-center overflow-hidden rounded-2xl bg-white"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Spotlight radial unique */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-100"
          style={{
            background:
              'radial-gradient(circle, rgba(196,181,253,0.4) 0%, rgba(244,114,182,0.18) 30%, rgba(125,211,252,0.12) 50%, transparent 75%)',
          }}
        />
      </div>

      {/* Lignes décoratives très subtiles */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 grid w-full max-w-[820px] grid-cols-2 gap-5 px-6">
        <div className="rounded-3xl bg-white/95 p-7 ring-1 ring-violet-100"
          style={{ boxShadow: '0 30px 80px -20px rgba(124,58,237,0.18), 0 4px 12px -2px rgba(0,0,0,0.05)' }}
        >
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500"
            style={{ boxShadow: '0 12px 30px -6px rgba(168,85,247,0.55)' }}
          >
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-6 text-[48px] font-extralight leading-[0.95] tracking-tight text-stone-900"
            style={{ fontFamily: 'Cabinet Grotesk, Inter, sans-serif', fontWeight: 200 }}
          >
            Bonjour,
          </h1>
          <h1 className="text-[48px] font-semibold leading-[0.95] tracking-tight"
            style={{ fontFamily: 'Cabinet Grotesk, Inter, sans-serif' }}
          >
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              Lyes.
            </span>
          </h1>
          <p className="mt-5 text-[14px] leading-relaxed text-stone-600">
            On démarre <span className="font-semibold text-stone-900">Test Propulspace</span> ensemble.
            Quelques étapes pour personnaliser votre espace.
          </p>
          <div className="mt-7 inline-flex items-center gap-2 text-[11.5px]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-medium text-stone-700">Votre AE est en ligne</span>
          </div>
        </div>

        <div className="rounded-3xl bg-white/95 p-7 ring-1 ring-fuchsia-100"
          style={{ boxShadow: '0 30px 80px -20px rgba(192,38,211,0.15), 0 4px 12px -2px rgba(0,0,0,0.05)' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-violet-600">Votre projet</p>
          <h2 className="mt-3 text-[26px] font-semibold leading-tight text-stone-900"
            style={{ fontFamily: 'Cabinet Grotesk, Inter, sans-serif' }}>
            Précieuse Joaillerie
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-stone-500">
            <Gem className="h-3 w-3" />Joaillerie · Paris
          </p>

          <div className="mt-6 divide-y divide-stone-100">
            {[
              { k: 'Objectif',  v: 'E-shop premium' },
              { k: 'Budget',    v: '15 — 20 k€' },
              { k: 'Délai',     v: 'Q3 2026' },
              { k: 'Modules',   v: '6 à construire' },
            ].map(r => (
              <div key={r.k} className="flex items-center justify-between py-2.5">
                <span className="text-[11.5px] uppercase tracking-wider text-stone-400">{r.k}</span>
                <span className="text-[13.5px] font-semibold text-stone-900">{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-6 bottom-6 z-10 flex items-center justify-between">
        <span className="text-[10px] font-mono tabular-nums text-stone-400">01 / 05</span>
        <button className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-5 py-2 text-[12.5px] font-semibold text-white shadow-xl shadow-stone-900/20 hover:bg-stone-800">
          Suivant <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
