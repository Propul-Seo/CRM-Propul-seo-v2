// Direction D — Concierge Hospitality (hôtel boutique, warm humain).
// Palette : terracotta + sable + bois clair. Typo : Söhne + Caveat manuscrite.
// Vibes : conciergerie 5★, attention personnelle, intime.
export function WizardVariantD() {
  return (
    <div className="relative flex h-[600px] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#fef3e2] via-[#fde2c6] to-[#f5b890]"
      style={{ fontFamily: '"Söhne", "SF Pro Display", -apple-system, sans-serif' }}
    >
      {/* Texture papier */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 4px)' }}
      />

      {/* Header conciergerie */}
      <div className="absolute inset-x-8 top-6 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-950">
          ☼ Propul'SEO Concierge
        </p>
        <p className="text-[11px] uppercase tracking-[0.2em] text-orange-900/60">
          Suite 01 — Bienvenue
        </p>
      </div>

      {/* Contenu : lettre + carte */}
      <div className="grid w-full grid-cols-[1fr_320px] gap-8 px-12 pt-20">
        {/* Lettre manuscrite */}
        <div className="relative rounded-3xl bg-white/70 p-7 shadow-xl shadow-orange-900/10 backdrop-blur-sm"
          style={{ boxShadow: '0 20px 60px -10px rgba(146,64,14,0.15), inset 0 1px 0 rgba(255,255,255,0.6)' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-700">
            Lettre de bienvenue
          </p>
          <p className="mt-3 text-[28px] font-medium leading-[1.2] text-stone-900"
            style={{ fontFamily: '"Caveat", "Homemade Apple", cursive' }}>
            Cher Lyes,
          </p>
          <p className="mt-3 text-[24px] leading-[1.3] text-stone-900"
            style={{ fontFamily: '"Caveat", cursive' }}>
            Bienvenue dans votre espace Propul'Space. Je m'occupe
            personnellement de votre projet — du devis à la mise en ligne.
            <br /><br />
            Si tout est en ordre, suivez-moi pour quelques réglages rapides.
          </p>
          <p className="mt-4 text-right text-[22px] text-orange-950/70"
            style={{ fontFamily: '"Caveat", cursive' }}>
            — Lyes Triki, votre AE
          </p>

          {/* Cachet décoratif */}
          <div className="absolute -bottom-4 -right-4 flex h-16 w-16 rotate-12 items-center justify-center rounded-full border-2 border-orange-700/40 bg-orange-100/80 text-center text-[8px] font-bold uppercase tracking-widest text-orange-800">
            Votre AE<br/>2026
          </div>
        </div>

        {/* Carte présentation */}
        <div className="flex flex-col justify-between rounded-3xl bg-stone-900 p-6 text-white shadow-xl">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-[16px] font-bold ring-2 ring-orange-200/30">
              LT
            </div>
            <p className="mt-4 text-[11px] uppercase tracking-[0.25em] text-orange-300">
              Account Executive
            </p>
            <p className="mt-1 text-[18px] font-semibold">Lyes Triki</p>
            <p className="text-[12px] text-white/60">Suit votre dossier depuis le devis</p>

            <div className="mt-4 space-y-1 text-[11.5px] text-white/70">
              <p>● Disponible · répond &lt; 1 h</p>
              <p>📍 Paris · Propul'SEO HQ</p>
              <p>✉ direct line via votre espace</p>
            </div>
          </div>

          <button className="mt-6 rounded-xl bg-orange-500 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-orange-400">
            Commencer la visite →
          </button>
        </div>
      </div>
    </div>
  );
}
