// Variante 3 — Editorial magazine (minimal raffiné).
// The Atlantic / Esquire vibe. Crème, serif XL, marges éditoriales.
export function Variant3Editorial() {
  const steps = [
    'Profil',
    'Coordonnées',
    'Préférences',
    'Tour',
    'Bienvenue',
  ];
  return (
    <div className="relative flex h-[520px] w-full items-center overflow-hidden rounded-2xl bg-[#faf7f2] px-12">
      {/* Liseré décoratif vertical */}
      <span className="absolute left-8 top-12 h-[calc(100%-6rem)] w-px bg-stone-300" />

      <div className="grid w-full grid-cols-12 gap-8">
        {/* Numéro de page éditorial */}
        <div className="col-span-2 flex flex-col justify-between py-12">
          <p className="text-[11px] uppercase tracking-[0.3em] text-stone-500">
            Chapitre
          </p>
          <p
            className="text-[64px] font-light leading-none text-stone-300"
            style={{ fontFamily: 'Playfair Display, Cormorant, Georgia, serif' }}
          >
            V
          </p>
          <p className="text-[11px] uppercase tracking-[0.3em] text-stone-500">
            05 / 05
          </p>
        </div>

        {/* Titre + accroche */}
        <div className="col-span-7 py-12">
          <h1
            className="text-[80px] font-bold leading-[0.95] tracking-tight text-stone-900 max-sm:text-[40px]"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            Bienvenue
            <br />
            <span className="italic font-normal text-stone-700">à bord, Lyes.</span>
          </h1>
          <p
            className="mt-8 max-w-[340px] text-[15px] leading-relaxed text-stone-600"
            style={{ fontFamily: 'Lora, Georgia, serif' }}
          >
            Votre espace vous attend. Une dernière étape avant de démarrer
            la production — la configuration projet, depuis le tableau de bord.
          </p>
          <p className="mt-10 text-[11px] uppercase tracking-[0.3em] text-stone-500">
            ───── Continuer
          </p>
        </div>

        {/* Sommaire latéral */}
        <div className="col-span-3 flex flex-col justify-center gap-2 py-12 text-right">
          <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-stone-500">
            Sommaire
          </p>
          {steps.map((s, i) => (
            <div key={s} className="flex items-center justify-end gap-2 text-[12px]">
              <span className="text-stone-400">{String(i + 1).padStart(2, '0')}.</span>
              <span className={i === 4 ? 'font-semibold text-stone-900' : 'text-stone-600'}>
                {s}
              </span>
              {i < 4 && <span className="text-emerald-700">✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
