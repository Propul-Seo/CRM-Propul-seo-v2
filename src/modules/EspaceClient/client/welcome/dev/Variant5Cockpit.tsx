// Variante 5 — Cockpit / lancement (futuriste sobre).
// Noir profond + grille perspective + HUD stats + neon glow.
export function Variant5Cockpit() {
  return (
    <div className="relative flex h-[520px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#04040a]"
      style={{ fontFamily: 'JetBrains Mono, SF Mono, Menlo, monospace' }}
    >
      {/* Grille perspective Tron-like */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] opacity-40"
        style={{
          background:
            'linear-gradient(transparent, #7c3aed 50%, transparent), repeating-linear-gradient(90deg, transparent 0, transparent 39px, #7c3aed 39px, #7c3aed 40px), repeating-linear-gradient(0deg, transparent 0, transparent 39px, #7c3aed 39px, #7c3aed 40px)',
          maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 80%, transparent)',
          transform: 'perspective(400px) rotateX(60deg)',
          transformOrigin: 'top',
        }}
      />

      {/* Glow violet ambiant */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent 60%)' }}
      />

      {/* Stats HUD en haut */}
      <div className="absolute inset-x-8 top-6 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-violet-300/80">
        <span>PROJET · 001</span>
        <span className="text-emerald-400 animate-pulse">● SYSTÈME OK</span>
        <span>ENV · PROD</span>
      </div>

      {/* Contenu central */}
      <div className="relative z-10 text-center">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.4em] text-violet-400">
          ──── Initialisation ────
        </p>

        <p className="text-[12px] uppercase tracking-[0.3em] text-violet-300/70">
          Système prêt.
        </p>
        <h1
          className="mt-3 text-[64px] font-bold leading-none tracking-tight text-white max-sm:text-[40px]"
          style={{
            fontFamily: 'Berkeley Mono, JetBrains Mono, monospace',
            textShadow:
              '0 0 20px rgba(124,58,237,0.8), 0 0 40px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.2)',
          }}
        >
          MISSION
          <br />
          <span className="text-violet-400">VALIDÉE.</span>
        </h1>
        <p className="mt-4 text-[12px] uppercase tracking-[0.25em] text-violet-300/60">
          Opérateur · Lyes Triki
        </p>

        <button className="ps-tap mx-auto mt-6 inline-flex items-center gap-2 rounded-md border border-violet-500/60 bg-violet-950/40 px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-violet-200 backdrop-blur transition-all hover:border-violet-400 hover:bg-violet-900/60"
          style={{ boxShadow: '0 0 20px rgba(124,58,237,0.4), inset 0 0 12px rgba(124,58,237,0.2)' }}
        >
          ▸ Accéder à mon espace
        </button>
      </div>

      {/* Stats HUD en bas */}
      <div className="absolute inset-x-8 bottom-6 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-violet-300/60">
        <span>UPTIME · 100%</span>
        <span>LAT · 12ms</span>
        <span>STATUS · READY</span>
      </div>
    </div>
  );
}
