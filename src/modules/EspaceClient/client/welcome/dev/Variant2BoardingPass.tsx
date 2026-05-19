// Variante 2 — Boarding pass premium (skeuomorphic exclusif).
// Carte d'embarquement Air France La Première / Concorde vibe.
export function Variant2BoardingPass() {
  return (
    <div className="relative flex h-[520px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#0a1230] p-8">
      {/* Étoiles subtiles */}
      <div className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, white 0.5px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />
      <div className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent, #0a1230 80%)' }}
      />

      {/* Boarding pass */}
      <div className="relative flex w-full max-w-[560px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#fef9c3] to-[#fde68a] shadow-2xl"
        style={{ fontFamily: 'JetBrains Mono, SF Mono, Menlo, monospace' }}
      >
        {/* Liseré perforé décoratif */}
        <div className="absolute left-0 top-0 h-full w-1 bg-amber-600/40" />
        <div className="absolute left-2 top-0 flex h-full w-2 flex-col justify-around">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className="h-1 w-1 rounded-full bg-amber-900/30" />
          ))}
        </div>

        <div className="flex-1 px-8 py-6">
          <div className="flex items-center justify-between border-b border-amber-900/20 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-900">
              Boarding pass · Propul'SEO
            </p>
            <p className="text-[10px] font-bold text-amber-900">001 / 2026</p>
          </div>

          <p className="mt-5 text-[9px] uppercase tracking-widest text-amber-900/60">Passenger</p>
          <p style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
             className="text-[32px] font-bold leading-tight text-amber-950">
            Lyes Triki
          </p>

          <div className="mt-5 grid grid-cols-3 gap-4 text-amber-950">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-amber-900/60">From</p>
              <p className="mt-1 text-[18px] font-bold">DEVIS</p>
              <p className="text-[10px] text-amber-900/70">Signature</p>
            </div>
            <div className="flex items-end justify-center pb-1">
              <span className="text-[18px] text-amber-700">———▸</span>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest text-amber-900/60">To</p>
              <p className="mt-1 text-[18px] font-bold">PROD</p>
              <p className="text-[10px] text-amber-900/70">Propul'Space</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4 border-t border-amber-900/20 pt-3 text-amber-950">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-amber-900/60">Seat</p>
              <p className="text-[14px] font-bold">01A</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-amber-900/60">Gate</p>
              <p className="text-[14px] font-bold">B12</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest text-amber-900/60">Status</p>
              <p className="text-[14px] font-bold text-emerald-700">BOARDING</p>
            </div>
          </div>
        </div>

        {/* Stub à droite */}
        <div className="flex w-32 flex-col items-center justify-between border-l-2 border-dashed border-amber-900/30 bg-amber-100/60 px-3 py-6">
          <p className="text-[9px] font-bold uppercase tracking-widest text-amber-900">P/S</p>
          <p className="text-center text-[24px] font-bold leading-none text-amber-950"
             style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            LYES • 01A
          </p>
          <p className="text-[9px] font-bold uppercase text-amber-900">2026</p>
        </div>
      </div>
    </div>
  );
}
