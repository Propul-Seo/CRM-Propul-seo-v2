import { Sparkles, ArrowRight, Target, Wallet, Calendar, Shapes } from 'lucide-react';

// Direction A — Notion / Linear (dark warm dense, productivity-grade).
// Palette : graphite + amber accents. Typo : Inter display + Source Serif.
// Ambiance : sobre, données denses, "logiciel pro qui respire".
export function WizardVariantA() {
  return (
    <div className="relative flex h-[600px] w-full overflow-hidden rounded-2xl bg-[#1a1715] text-[#e7e5e4]"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Header strip */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Propul'SEO</span>
          <span className="text-[10px] text-white/30">·</span>
          <span className="text-[10px] text-white/50">Onboarding</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono tabular-nums text-white/60">01 / 05</span>
        </div>
      </div>

      {/* Split content */}
      <div className="grid w-full grid-cols-[1fr_1fr] gap-px bg-white/5 pt-12">
        {/* Left — salutation dense */}
        <div className="flex flex-col justify-between bg-[#1a1715] p-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">Bienvenue</p>
            <h1 className="mt-2 text-[40px] font-bold leading-[1.05] tracking-tight text-white"
              style={{ fontFamily: 'Source Serif Pro, Georgia, serif' }}>
              Lyes.
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-white/60">
              Votre espace <span className="text-white">Test Propulspace</span> est prêt.
              Quelques minutes pour caler les détails.
            </p>
          </div>
          <div className="space-y-1.5 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/40">Account Executive</span>
              <span className="font-semibold text-white">Lyes Triki</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/40">Délai de réponse</span>
              <span className="font-semibold text-white">≤ 1 h ouvrée</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/40">Statut</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-400">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />En ligne
              </span>
            </div>
          </div>
        </div>

        {/* Right — recap dense */}
        <div className="bg-[#1a1715] p-8">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">Récap projet</p>
            <span className="rounded-sm bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">✓ PRÉ-REMPLI</span>
          </div>
          <h2 className="mt-3 text-[20px] font-bold text-white"
            style={{ fontFamily: 'Source Serif Pro, Georgia, serif' }}>
            Précieuse Joaillerie
          </h2>
          <p className="text-[11px] text-white/40">Joaillerie & bijouterie · Paris 8e</p>

          <div className="mt-5 grid grid-cols-2 gap-px bg-white/5">
            {[
              { i: Target,  k: 'Objectif', v: 'E-shop premium' },
              { i: Wallet,  k: 'Budget',   v: '15 — 20 k€' },
              { i: Calendar,k: 'Délai',    v: 'Q3 2026' },
              { i: Shapes,  k: 'Modules',  v: '6 à construire' },
            ].map(c => {
              const Icon = c.i;
              return (
                <div key={c.k} className="bg-[#1a1715] p-3">
                  <Icon className="h-3.5 w-3.5 text-amber-400/70" />
                  <p className="mt-2 text-[9.5px] uppercase tracking-wider text-white/40">{c.k}</p>
                  <p className="mt-0.5 text-[12.5px] font-semibold text-white">{c.v}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/5 bg-[#1a1715] px-6 py-3">
        <button className="text-[12px] text-white/50 hover:text-white">Terminer plus tard</button>
        <button className="inline-flex items-center gap-1.5 rounded-md bg-amber-400 px-4 py-1.5 text-[12px] font-bold text-[#1a1715] hover:bg-amber-300">
          Suivant <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Icon glow */}
      <div className="absolute right-6 top-12 flex h-9 w-9 items-center justify-center rounded-md bg-amber-400/10 ring-1 ring-amber-400/30">
        <Sparkles className="h-4 w-4 text-amber-400" />
      </div>
    </div>
  );
}
