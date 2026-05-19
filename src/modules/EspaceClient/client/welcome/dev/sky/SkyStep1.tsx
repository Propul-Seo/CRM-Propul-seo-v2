import { Sparkles, Gem } from 'lucide-react';
import { SkyShell } from './SkyShell';

// Step 1 Sky Aurora — Bienvenue split (gauche : salutation, droite : récap qualif).
export function SkyStep1() {
  return (
    <SkyShell step={1} isFirst>
      <div className="grid w-full max-w-[760px] grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white p-6"
          style={{ boxShadow: '0 30px 60px -15px rgba(56,189,248,0.25), 0 0 0 1px rgba(56,189,248,0.08)' }}
        >
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-violet-500 to-pink-500"
            style={{ boxShadow: '0 10px 25px -5px rgba(139,92,246,0.5)' }}
          >
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="mt-4 text-[36px] font-light leading-[1] tracking-tight text-stone-900">
            Bonjour,
            <br />
            <span className="bg-gradient-to-r from-sky-600 via-violet-600 to-pink-600 bg-clip-text font-semibold text-transparent">
              Lyes.
            </span>
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-stone-600">
            On démarre <span className="font-semibold text-stone-900">Test Propulspace</span> ensemble.
            Quelques étapes pour personnaliser votre espace.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 ring-1 ring-emerald-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">Votre AE est en ligne</span>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6"
          style={{ boxShadow: '0 30px 60px -15px rgba(192,38,211,0.20), 0 0 0 1px rgba(192,38,211,0.06)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-600">Votre projet</p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700 ring-1 ring-emerald-200">
              ✓ PRÉ-REMPLI
            </span>
          </div>
          <h2 className="mt-2 text-[22px] font-semibold leading-tight text-stone-900">
            Précieuse Joaillerie
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-stone-500">
            <Gem className="h-3 w-3" />Joaillerie · Paris
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { k: 'Objectif',  v: 'E-shop',      bg: 'from-sky-50 to-sky-100/60',         text: 'text-sky-700' },
              { k: 'Budget',    v: '15-20 k€',    bg: 'from-violet-50 to-violet-100/60',   text: 'text-violet-700' },
              { k: 'Délai',     v: 'Q3 2026',     bg: 'from-orange-50 to-orange-100/60',   text: 'text-orange-700' },
              { k: 'Modules',   v: '6 modules',   bg: 'from-pink-50 to-pink-100/60',       text: 'text-pink-700' },
            ].map(r => (
              <div key={r.k} className={`rounded-2xl bg-gradient-to-br ${r.bg} p-2.5`}>
                <p className={`text-[9.5px] font-bold uppercase tracking-widest ${r.text}`}>{r.k}</p>
                <p className="mt-1 text-[12.5px] font-semibold text-stone-900">{r.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkyShell>
  );
}
