// Variante 1 — Aurore boréale (organique, contemplatif).
// Gradient mesh animé + serif italique XL + 3 mini-stats sobres.
export function Variant1Aurora() {
  return (
    <div className="propulspace-portal relative flex h-[520px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#0b0a14]">
      {/* Aurore multi-couches en mix-blend-screen */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-[20%] top-[10%] h-[400px] w-[600px] rounded-full opacity-60 mix-blend-screen blur-3xl"
          style={{
            background: 'radial-gradient(ellipse, #7c3aed 0%, transparent 60%)',
            animation: 'v1-drift-a 18s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -right-[10%] top-[30%] h-[420px] w-[520px] rounded-full opacity-55 mix-blend-screen blur-3xl"
          style={{
            background: 'radial-gradient(ellipse, #06b6d4 0%, transparent 60%)',
            animation: 'v1-drift-b 22s ease-in-out infinite',
          }}
        />
        <div
          className="absolute left-[30%] bottom-[5%] h-[300px] w-[500px] rounded-full opacity-50 mix-blend-screen blur-3xl"
          style={{
            background: 'radial-gradient(ellipse, #ec4899 0%, transparent 60%)',
            animation: 'v1-drift-c 26s ease-in-out infinite',
          }}
        />
      </div>

      {/* Contenu */}
      <div className="relative z-10 space-y-6 px-8 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">
          Projet · 001
        </p>
        <h1
          className="text-[64px] font-light leading-[1.05] tracking-tight text-white max-sm:text-[40px]"
          style={{ fontFamily: 'Fraunces, Cormorant Garamond, Georgia, serif' }}
        >
          Bienvenue,
          <br />
          <span className="italic">Lyes.</span>
        </h1>
        <p className="mx-auto max-w-[400px] text-[14px] leading-relaxed text-white/70">
          Votre espace vous attend. Tout est en place pour démarrer.
        </p>
        <div className="mx-auto flex max-w-[420px] justify-between gap-6 border-t border-white/10 pt-6 text-center">
          {[
            { k: 'Modules',  v: '6' },
            { k: 'Délai',    v: '12 sem.' },
            { k: 'Votre AE', v: 'En ligne' },
          ].map(s => (
            <div key={s.k} className="flex-1">
              <p className="text-[10px] uppercase tracking-widest text-white/40">{s.k}</p>
              <p className="mt-1 text-[14px] font-semibold text-white">{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes v1-drift-a { 0%,100% { transform: translate(0,0); } 50% { transform: translate(40px,-30px); } }
        @keyframes v1-drift-b { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-50px,40px); } }
        @keyframes v1-drift-c { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,-50px); } }
      `}</style>
    </div>
  );
}
