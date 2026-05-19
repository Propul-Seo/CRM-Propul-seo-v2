// Direction E — Mission Control / Cockpit (futuriste sobre).
// Palette : noir profond + violet électrique + chartreuse accents.
// Typo : Berkeley Mono + Inter. Vibes Linear/Stripe/Vercel sci-fi.
export function WizardVariantE() {
  return (
    <div className="relative flex h-[600px] w-full overflow-hidden rounded-2xl bg-[#03030a] text-white"
      style={{ fontFamily: '"Berkeley Mono", "JetBrains Mono", monospace' }}
    >
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(124,58,237,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
        }}
      />

      {/* HUD strip top */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-violet-500/30 bg-black/40 px-6 py-2.5 backdrop-blur">
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-violet-300">
          <span>● SYS ONLINE</span>
          <span className="text-white/30">|</span>
          <span>PROJET · 001</span>
          <span className="text-white/30">|</span>
          <span>ENV · PROD</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-violet-300">
          <span className="text-emerald-400">STEP 01 / 05</span>
        </div>
      </div>

      {/* Content split */}
      <div className="grid w-full grid-cols-[1fr_1fr] gap-px bg-violet-500/10 px-px pt-12 pb-16">
        {/* Left panel */}
        <div className="bg-[#03030a] p-7">
          <p className="text-[10px] uppercase tracking-[0.3em] text-violet-400">
            ▸ Initialisation client
          </p>
          <h1 className="mt-4 text-[36px] font-bold leading-[1] text-white"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            Identité vérifiée.
          </h1>
          <p className="mt-3 text-[15px] font-bold text-violet-300">▸ LYES TRIKI</p>

          <div className="mt-6 space-y-1.5 border-l-2 border-violet-500/40 pl-3 text-[11px] text-white/70">
            <p>· session.id ··· 4f9a2b1c</p>
            <p>· auth ··· OK · supabase</p>
            <p>· workspace ··· test-propulspace</p>
            <p>· role ··· client-owner</p>
            <p>· latency ··· 12ms</p>
          </div>

          <p className="mt-6 text-[11px] uppercase tracking-widest text-emerald-400">
            ▸ Système prêt pour configuration
          </p>
        </div>

        {/* Right panel */}
        <div className="bg-[#03030a] p-7">
          <p className="text-[10px] uppercase tracking-[0.3em] text-violet-400">
            ▸ Mission briefing
          </p>
          <h2 className="mt-4 text-[20px] font-bold text-white"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Précieuse Joaillerie
          </h2>
          <p className="text-[11px] uppercase tracking-widest text-white/40">
            sector · luxury · ecom
          </p>

          <div className="mt-5 space-y-2">
            {[
              { k: 'OBJ',    v: 'E-shop premium',  c: 'text-emerald-400' },
              { k: 'BUDGET', v: '15-20K · EUR',    c: 'text-amber-300' },
              { k: 'ETA',    v: 'Q3-2026',         c: 'text-cyan-300' },
              { k: 'MODULES',v: '06 · stack',      c: 'text-violet-300' },
            ].map(r => (
              <div key={r.k} className="grid grid-cols-[60px_1fr] items-center gap-3 border-b border-violet-500/10 py-1.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">{r.k}</span>
                <span className={`font-mono text-[12.5px] font-bold ${r.c}`}>{r.v}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 inline-block rounded-sm bg-violet-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-violet-300 ring-1 ring-violet-500/30">
            ▸ READY TO LAUNCH
          </div>
        </div>
      </div>

      {/* Footer HUD */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-violet-500/30 bg-black/40 px-6 py-2.5 backdrop-blur">
        <button className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white">
          [ESC] Quitter
        </button>
        <button className="ps-tap inline-flex items-center gap-2 rounded-sm border border-violet-400 bg-violet-500/20 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-violet-200 hover:bg-violet-500/40"
          style={{ boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
        >
          [ENTER] Continuer ▸
        </button>
      </div>
    </div>
  );
}
