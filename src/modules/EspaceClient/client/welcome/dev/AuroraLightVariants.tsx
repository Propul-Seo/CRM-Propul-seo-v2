import { WizardVariantB1Pearl } from './WizardVariantB1Pearl';
import { WizardVariantB2Lavender } from './WizardVariantB2Lavender';
import { WizardVariantB3Sky } from './WizardVariantB3Sky';
import { WizardVariantB4Spotlight } from './WizardVariantB4Spotlight';

// Page DEV — 4 sous-variantes light de la direction B (Aurora glassmorphism).
// Lyes a choisi B, on lui propose 4 déclinaisons claires différentes.

const VARIANTS = [
  { id: 'B1', name: 'Pearl Aurora',     tag: 'crème · aurores pastel',   palette: 'crème + violet/peach/sky pastel', vibe: 'galerie d\'art',     Cmp: WizardVariantB1Pearl },
  { id: 'B2', name: 'Frosted Lavender', tag: 'blanc · aurore violet centrée', palette: 'blanc + violet/fuchsia',     vibe: 'matin doux chic',    Cmp: WizardVariantB2Lavender },
  { id: 'B3', name: 'Sky Aurora',       tag: 'bleu pâle · aurores diagonales', palette: 'sky + violet + peach',      vibe: 'matin clair énergique', Cmp: WizardVariantB3Sky },
  { id: 'B4', name: 'Soft Spotlight',   tag: 'blanc pur · spotlight central', palette: 'blanc + un seul gradient',  vibe: 'Apple keynote minimal', Cmp: WizardVariantB4Spotlight },
] as const;

export function AuroraLightVariants() {
  return (
    <div className="min-h-screen bg-stone-100 px-6 py-12">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="text-[34px] font-bold tracking-tight text-stone-900">
          Direction B — Aurora glassmorphism · 4 sous-variantes light
        </h1>
        <p className="mt-2 max-w-[680px] text-[14px] text-stone-600">
          4 déclinaisons claires de la direction B. Toutes gardent les glass cards
          + auroras + typo Cabinet Grotesk, mais varient la luminosité, la palette
          et l'intensité du fond.
        </p>

        <div className="mt-10 space-y-14">
          {VARIANTS.map(v => {
            const Cmp = v.Cmp;
            return (
              <section key={v.id} id={`variant-${v.id}`}>
                <header className="mb-4 grid grid-cols-[60px_1fr] items-baseline gap-4">
                  <span className="font-mono text-[24px] font-bold text-stone-300">{v.id}.</span>
                  <div>
                    <div className="flex items-baseline gap-3">
                      <h2 className="text-[22px] font-bold tracking-tight text-stone-900">{v.name}</h2>
                      <p className="text-[12px] uppercase tracking-wider text-stone-500">{v.tag}</p>
                    </div>
                    <p className="mt-1 text-[12px] text-stone-600">
                      <strong>Palette</strong> {v.palette} · <strong>Vibe</strong> {v.vibe}
                    </p>
                  </div>
                </header>
                <Cmp />
              </section>
            );
          })}
        </div>

        <p className="mt-14 text-center text-[12px] text-stone-500">
          Choisis une sous-variante (B1 · B2 · B3 · B4), je décline aux 5 étapes du wizard.
        </p>
      </div>
    </div>
  );
}
