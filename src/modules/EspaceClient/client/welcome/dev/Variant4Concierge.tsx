// Variante 4 — Conciergerie chaleureuse (warm hospitality).
// Terracotta + signature manuscrite + carte AE personnelle.
export function Variant4Concierge() {
  const checklist = [
    'Coordonnées confirmées',
    'Préférences enregistrées',
    'Espace prêt à l\'emploi',
    'AE assigné · Lyes Triki',
  ];
  return (
    <div className="relative flex h-[520px] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#fef3e2] via-[#fde2c6] to-[#e8a87c] px-8">
      {/* Texture papier discrete via gradient répété */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 4px)',
        }}
      />

      <div className="relative grid w-full max-w-[640px] grid-cols-[auto_1fr] items-center gap-6">
        {/* Avatar AE grande taille */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-700 text-[28px] font-bold text-white shadow-2xl shadow-orange-900/30 ring-4 ring-white/60">
          LT
        </div>

        {/* Message + checklist */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-900/70">
            Votre Account Executive
          </p>
          <p
            className="mt-1 text-[28px] font-medium leading-tight text-stone-900"
            style={{ fontFamily: 'Caveat, "Homemade Apple", cursive' }}
          >
            « Bienvenue Lyes, je m'occupe personnellement de votre projet. »
          </p>
          <p
            className="mt-1 text-right text-[18px] text-orange-950/70"
            style={{ fontFamily: 'Caveat, cursive' }}
          >
            — Lyes Triki
          </p>
        </div>
      </div>

      {/* Checklist en bas */}
      <div className="absolute bottom-8 left-1/2 w-full max-w-[480px] -translate-x-1/2 rounded-xl border border-orange-200/60 bg-white/70 p-4 backdrop-blur">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-900/70">
          Votre dossier
        </p>
        <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
          {checklist.map(item => (
            <li key={item} className="flex items-center gap-2 text-[12.5px] text-stone-700">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
