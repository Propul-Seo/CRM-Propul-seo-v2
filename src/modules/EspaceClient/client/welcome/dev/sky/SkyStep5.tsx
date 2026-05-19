import { SkyShell } from './SkyShell';

// Step 5 Sky Aurora — Done (halo doux + typo display + invitation).
export function SkyStep5() {
  return (
    <SkyShell step={5} isLast>
      <div className="relative w-full max-w-[600px] text-center">
        {/* Halo radial doux supplémentaire spécifique Step 5 */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-90"
          style={{
            background:
              'radial-gradient(circle, rgba(196,181,253,0.45) 0%, rgba(244,114,182,0.20) 30%, rgba(125,211,252,0.15) 55%, transparent 75%)',
          }}
        />

        {/* Sparks ascendants subtils */}
        {[
          { l: '20%', d: '0s',   c: '#7dd3fc' },
          { l: '35%', d: '0.4s', c: '#c4b5fd' },
          { l: '50%', d: '0.8s', c: '#f0abfc' },
          { l: '65%', d: '1.2s', c: '#fdba74' },
          { l: '80%', d: '1.6s', c: '#a78bfa' },
        ].map((s, i) => (
          <span key={i} aria-hidden
            className="pointer-events-none absolute bottom-0 h-1 w-1 rounded-full"
            style={{
              left: s.l, background: s.c,
              boxShadow: `0 0 6px ${s.c}`,
              animation: `sky-spark-rise 2.8s ease-out infinite`,
              animationDelay: s.d,
            }}
          />
        ))}

        <div className="relative space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-violet-600">C'est parti</p>

          <h1 className="text-[44px] font-extralight leading-[1] tracking-tight text-stone-900"
            style={{ fontFamily: 'Cabinet Grotesk, Inter, sans-serif', fontWeight: 200 }}
          >
            Bienvenue à bord,
          </h1>
          <h1 className="text-[44px] font-semibold leading-[1] tracking-tight"
            style={{ fontFamily: 'Cabinet Grotesk, Inter, sans-serif' }}
          >
            <span className="bg-gradient-to-r from-sky-600 via-violet-600 to-pink-600 bg-clip-text text-transparent italic">
              Lyes.
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
          @keyframes sky-spark-rise {
            0%   { opacity: 0; transform: translateY(0) scale(0.6); }
            20%  { opacity: 1; }
            100% { opacity: 0; transform: translateY(-200px) scale(1.2); }
          }
        `}</style>
      </div>
    </SkyShell>
  );
}
