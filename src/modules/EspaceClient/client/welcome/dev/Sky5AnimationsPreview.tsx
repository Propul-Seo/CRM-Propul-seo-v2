import type { ReactNode } from 'react';
import { SkyShell } from './sky/SkyShell';

// 5 variantes d'animation pour Step 5 Sky Aurora.
// Toutes gardent le contenu central identique — seule l'animation change.

function StepContent({ children }: { children?: ReactNode }) {
  return (
    <div className="relative w-full max-w-[600px] text-center">
      {children}
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
          Votre espace vous attend. Une dernière étape avant de démarrer la production —
          remplir la configuration projet depuis le tableau de bord.
        </p>
      </div>
    </div>
  );
}

// A — Sparks ascendants colorés (baseline, déjà implémenté).
function AnimA() {
  return (
    <SkyShell step={5} isLast>
      <StepContent>
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
              left: s.l, background: s.c, boxShadow: `0 0 6px ${s.c}`,
              animation: 'a-spark 2.8s ease-out infinite', animationDelay: s.d,
            }}
          />
        ))}
        <style>{`@keyframes a-spark {0%{opacity:0;transform:translateY(0) scale(.6)}20%{opacity:1}100%{opacity:0;transform:translateY(-200px) scale(1.2)}}`}</style>
      </StepContent>
    </SkyShell>
  );
}

// B — Confetti rain doux depuis le haut.
function AnimB() {
  const confetti = Array.from({ length: 24 }, (_, i) => ({
    left: `${(i * 4.2) % 100}%`,
    delay: `${(i * 0.13) % 3}s`,
    duration: `${3 + (i % 3)}s`,
    color: ['#7dd3fc', '#c4b5fd', '#f0abfc', '#fdba74', '#a78bfa', '#fb923c'][i % 6],
    rotate: i % 2 ? '45deg' : '0deg',
  }));
  return (
    <SkyShell step={5} isLast>
      <StepContent>
        {confetti.map((c, i) => (
          <span key={i} aria-hidden
            className="pointer-events-none absolute -top-4 h-2 w-1 rounded-sm"
            style={{
              left: c.left, background: c.color, transform: `rotate(${c.rotate})`,
              animation: `b-fall ${c.duration} ease-in infinite`, animationDelay: c.delay,
            }}
          />
        ))}
        <style>{`@keyframes b-fall {0%{opacity:0;transform:translateY(-20px) rotate(0deg)}10%{opacity:1}100%{opacity:0;transform:translateY(500px) rotate(720deg)}}`}</style>
      </StepContent>
    </SkyShell>
  );
}

// C — Halo radial qui respire (breathing pulse, doux).
function AnimC() {
  return (
    <SkyShell step={5} isLast>
      <StepContent>
        <div aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(196,181,253,0.55) 0%, rgba(244,114,182,0.25) 30%, rgba(125,211,252,0.18) 55%, transparent 75%)',
            animation: 'c-breathe 4s ease-in-out infinite',
          }}
        />
        <div aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(196,181,253,0.20) 0%, transparent 60%)',
            animation: 'c-breathe 4s ease-in-out infinite 0.5s',
          }}
        />
        <style>{`@keyframes c-breathe {0%,100%{transform:translate(-50%,-50%) scale(.85);opacity:.6}50%{transform:translate(-50%,-50%) scale(1.15);opacity:1}}`}</style>
      </StepContent>
    </SkyShell>
  );
}

// D — Étoiles scintillantes (twinkle aléatoire dispersé).
function AnimD() {
  const stars = Array.from({ length: 18 }, (_, i) => ({
    top: `${5 + (i * 37) % 80}%`,
    left: `${5 + (i * 53) % 90}%`,
    delay: `${(i * 0.27) % 4}s`,
    size: i % 3 === 0 ? 3 : 2,
    color: ['#a78bfa', '#7dd3fc', '#f0abfc', '#fdba74'][i % 4],
  }));
  return (
    <SkyShell step={5} isLast>
      <StepContent>
        {stars.map((s, i) => (
          <span key={i} aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{
              top: s.top, left: s.left, width: s.size, height: s.size,
              background: s.color, boxShadow: `0 0 ${s.size * 3}px ${s.color}`,
              animation: 'd-twinkle 2.4s ease-in-out infinite', animationDelay: s.delay,
            }}
          />
        ))}
        <style>{`@keyframes d-twinkle {0%,100%{opacity:0;transform:scale(.6)}50%{opacity:1;transform:scale(1.4)}}`}</style>
      </StepContent>
    </SkyShell>
  );
}

// E — Orbes lumineux flottants (gros particules qui dérivent doucement).
function AnimE() {
  const orbs = [
    { x: '15%', y: '20%', size: 80, color: '#a78bfa', delay: '0s'   },
    { x: '80%', y: '15%', size: 60, color: '#7dd3fc', delay: '1.2s' },
    { x: '25%', y: '75%', size: 70, color: '#f0abfc', delay: '0.6s' },
    { x: '70%', y: '70%', size: 90, color: '#fdba74', delay: '2s'   },
    { x: '50%', y: '50%', size: 100, color: '#c4b5fd', delay: '1s'  },
  ];
  return (
    <SkyShell step={5} isLast>
      <StepContent>
        {orbs.map((o, i) => (
          <span key={i} aria-hidden
            className="pointer-events-none absolute rounded-full blur-2xl"
            style={{
              left: o.x, top: o.y, width: o.size, height: o.size,
              background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
              opacity: 0.55,
              animation: 'e-float 8s ease-in-out infinite', animationDelay: o.delay,
            }}
          />
        ))}
        <style>{`@keyframes e-float {0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.15)}66%{transform:translate(-25px,15px) scale(.9)}}`}</style>
      </StepContent>
    </SkyShell>
  );
}

const VARIANTS = [
  { id: 'A', name: 'Sparks ascendants',     tag: '5 dots colorés qui montent (baseline)',   Cmp: AnimA },
  { id: 'B', name: 'Confetti rain',         tag: '24 confettis qui tombent en rotation',     Cmp: AnimB },
  { id: 'C', name: 'Halo qui respire',      tag: '2 halos pulsent en breathing pulse',       Cmp: AnimC },
  { id: 'D', name: 'Étoiles scintillantes', tag: '18 étoiles twinkle aléatoires',            Cmp: AnimD },
  { id: 'E', name: 'Orbes flottants',       tag: '5 grandes particules dérivent doucement',  Cmp: AnimE },
] as const;

export function Sky5AnimationsPreview() {
  return (
    <div className="min-h-screen bg-stone-100 px-6 py-12">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="text-[34px] font-bold tracking-tight text-stone-900">
          Sky Aurora — Step 5 · 5 variantes d'animation
        </h1>
        <p className="mt-2 max-w-[680px] text-[14px] text-stone-600">
          Même contenu, 5 ambiances d'animation différentes. Toutes respectent
          <code className="rounded bg-stone-200 px-1 text-[12px]">prefers-reduced-motion</code> côté CSS final.
        </p>
        <div className="mt-10 space-y-12">
          {VARIANTS.map(v => {
            const Cmp = v.Cmp;
            return (
              <section key={v.id} id={`anim-${v.id}`}>
                <header className="mb-4 flex items-baseline gap-3">
                  <span className="font-mono text-[24px] font-bold text-stone-300">{v.id}.</span>
                  <div>
                    <h2 className="text-[22px] font-bold tracking-tight text-stone-900">{v.name}</h2>
                    <p className="text-[12px] uppercase tracking-wider text-stone-500">{v.tag}</p>
                  </div>
                </header>
                <Cmp />
              </section>
            );
          })}
        </div>
        <p className="mt-12 text-center text-[12px] text-stone-500">
          Choisis une variante (A · B · C · D · E), je l'applique au Step 5 final.
        </p>
      </div>
    </div>
  );
}
