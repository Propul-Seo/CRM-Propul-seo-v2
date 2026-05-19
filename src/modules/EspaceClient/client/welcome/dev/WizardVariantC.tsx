// Direction C — Editorial Atelier (magazine raffiné minimal).
// Palette : crème + noir + violet accent unique. Typo : Playfair Display + Lora.
// Vibes : Aesop, COS, magazine confidentiel.
export function WizardVariantC() {
  return (
    <div className="relative flex h-[600px] w-full overflow-hidden rounded-2xl bg-[#f5f0e8]"
      style={{ fontFamily: 'Lora, Georgia, serif' }}
    >
      {/* Liseré décoratif vertical */}
      <span className="absolute left-12 top-12 h-[calc(100%-6rem)] w-px bg-stone-300" />
      <span className="absolute right-12 top-12 h-[calc(100%-6rem)] w-px bg-stone-300" />

      {/* Header sobre */}
      <div className="absolute inset-x-12 top-6 flex items-center justify-between border-b border-stone-300 pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-600">
          Propul'SEO — Espace Client
        </p>
        <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">
          Vol. I · Chapitre 01
        </p>
      </div>

      {/* Grid éditorial 12 cols */}
      <div className="grid w-full grid-cols-12 gap-8 px-16 pb-20 pt-20">
        {/* Numéro de chapitre */}
        <div className="col-span-2 flex flex-col items-center justify-center">
          <p className="text-[9px] uppercase tracking-[0.3em] text-stone-500">Chapitre</p>
          <p className="mt-2 text-[80px] font-light leading-none text-stone-300"
            style={{ fontFamily: 'Playfair Display, Cormorant, serif' }}>
            I
          </p>
          <p className="mt-2 text-[9px] uppercase tracking-[0.3em] text-stone-500">Bienvenue</p>
        </div>

        {/* Titre + corps */}
        <div className="col-span-7 flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-violet-700">Précieuse Joaillerie</p>
          <h1 className="mt-3 text-[64px] font-bold leading-[0.95] tracking-tight text-stone-900"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            Bienvenue,
            <span className="italic font-normal text-stone-700"> Lyes.</span>
          </h1>
          <p className="mt-6 max-w-[400px] text-[15px] leading-relaxed text-stone-700">
            Votre espace est prêt. Avant de plonger dans le projet,
            <span className="italic"> quelques minutes</span> pour vérifier nos informations
            et caler vos préférences de travail.
          </p>
          <div className="mt-8 flex items-center gap-3 text-[12px] uppercase tracking-[0.3em] text-stone-600">
            <span>—</span>
            <span>Continuer la lecture</span>
            <span className="text-violet-700">→</span>
          </div>
        </div>

        {/* Sommaire */}
        <div className="col-span-3 flex flex-col justify-center">
          <p className="text-[9px] uppercase tracking-[0.3em] text-stone-500">Sommaire</p>
          <ol className="mt-3 space-y-2 text-[11.5px]">
            {[
              'Présentation',
              'Vos coordonnées',
              'Vos préférences',
              'Tour des sections',
              'Bienvenue à bord',
            ].map((s, i) => (
              <li key={s} className="flex items-baseline gap-3">
                <span className="font-mono text-stone-400">{String(i + 1).padStart(2, '0')}.</span>
                <span className={i === 0 ? 'font-semibold text-stone-900' : 'text-stone-500'}>
                  {s}
                </span>
                {i === 0 && <span className="ml-auto text-violet-700">●</span>}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Footer éditorial */}
      <div className="absolute inset-x-12 bottom-6 flex items-center justify-between border-t border-stone-300 pt-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Édition 2026</p>
        <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Page 01</p>
      </div>
    </div>
  );
}
