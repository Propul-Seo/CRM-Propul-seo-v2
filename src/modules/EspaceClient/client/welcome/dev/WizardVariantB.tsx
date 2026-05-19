import { Sparkles, ArrowRight, Gem } from 'lucide-react';

// Direction B — Apple Vision / Velvet Aurora (glassmorphism premium).
// Palette : violet profond + cyan + rose, transparence + glow.
// Typo : Cabinet Grotesk-like display + Inter body. Vibes futuriste élégant.
export function WizardVariantB() {
  return (
    <div className="relative flex h-[600px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#0a0518]"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[20%] top-[10%] h-[500px] w-[600px] rounded-full opacity-60 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #7c3aed 0%, transparent 60%)' }} />
        <div className="absolute -right-[10%] top-[20%] h-[450px] w-[550px] rounded-full opacity-55 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #06b6d4 0%, transparent 60%)' }} />
        <div className="absolute left-[40%] bottom-[5%] h-[350px] w-[500px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #ec4899 0%, transparent 60%)' }} />
      </div>

      {/* Glass card centrale */}
      <div className="relative z-10 grid w-full max-w-[820px] grid-cols-2 gap-4 px-6">
        {/* Left glass */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-2xl"
          style={{ boxShadow: '0 20px 60px -10px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' }}
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-500 shadow-lg shadow-violet-500/50">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="mt-5 text-[44px] font-light leading-[1] tracking-tight text-white"
            style={{ fontFamily: 'Cabinet Grotesk, Inter, sans-serif', fontWeight: 300 }}
          >
            Bonjour,
            <br />
            <span className="font-semibold">Lyes.</span>
          </h1>
          <p className="mt-4 text-[13.5px] leading-relaxed text-white/70">
            On démarre <span className="text-white">Test Propulspace</span> ensemble.
            Quelques étapes pour personnaliser votre espace.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium text-white/80">Votre AE est en ligne</span>
          </div>
        </div>

        {/* Right glass */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-2xl"
          style={{ boxShadow: '0 20px 60px -10px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-300">Votre projet</p>
          <h2 className="mt-2 text-[24px] font-semibold leading-tight text-white"
            style={{ fontFamily: 'Cabinet Grotesk, Inter, sans-serif' }}>
            Précieuse Joaillerie
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-white/60">
            <Gem className="h-3 w-3" />Joaillerie · Paris
          </p>

          <div className="mt-5 space-y-2">
            {[
              { k: 'Objectif',  v: 'E-shop premium', dot: '#a78bfa' },
              { k: 'Budget',    v: '15 — 20 k€',     dot: '#22d3ee' },
              { k: 'Délai',     v: 'Q3 2026',        dot: '#f472b6' },
              { k: 'Modules',   v: '6 à construire', dot: '#fbbf24' },
            ].map(r => (
              <div key={r.k} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.dot, boxShadow: `0 0 8px ${r.dot}` }} />
                  <span className="text-[11px] text-white/60">{r.k}</span>
                </div>
                <span className="text-[12.5px] font-semibold text-white">{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom nav glass */}
      <div className="absolute inset-x-6 bottom-6 z-10 flex items-center justify-between rounded-full border border-white/10 bg-white/[0.06] px-5 py-2 backdrop-blur-xl">
        <span className="text-[10px] font-mono tabular-nums text-white/50">01 / 05</span>
        <button className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1 text-[12px] font-semibold text-violet-900 shadow-lg">
          Suivant <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
