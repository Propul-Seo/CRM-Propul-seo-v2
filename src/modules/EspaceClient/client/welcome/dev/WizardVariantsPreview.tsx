import { WizardVariantA } from './WizardVariantA';
import { WizardVariantB } from './WizardVariantB';
import { WizardVariantC } from './WizardVariantC';
import { WizardVariantD } from './WizardVariantD';
import { WizardVariantE } from './WizardVariantE';

// Page DEV qui empile les 5 directions wizard-wide proposées.
// Chaque direction est appliquée sur Step 1 (l'étape qui donne le ton).
// Une fois choisie, elle est déclinée sur les 4 autres étapes.

const VARIANTS = [
  { id: 'A', name: 'Notion / Linear',     tag: 'dark warm · données denses',   palette: 'graphite + amber',   typo: 'Inter + Source Serif', vibe: 'productivity-grade',  Cmp: WizardVariantA },
  { id: 'B', name: 'Velvet Aurora',       tag: 'glassmorphism · aurora',       palette: 'violet + cyan + rose', typo: 'Cabinet Grotesk + Inter', vibe: 'Apple Vision Pro',  Cmp: WizardVariantB },
  { id: 'C', name: 'Editorial Atelier',   tag: 'magazine confidentiel',        palette: 'crème + noir + violet', typo: 'Playfair + Lora',     vibe: 'Aesop · COS',         Cmp: WizardVariantC },
  { id: 'D', name: 'Concierge Hospitality', tag: 'hôtel boutique 5★',           palette: 'terracotta + sable',    typo: 'Söhne + Caveat',       vibe: 'attention personnelle', Cmp: WizardVariantD },
  { id: 'E', name: 'Mission Control',     tag: 'cockpit · HUD',                palette: 'noir + violet électrique', typo: 'Berkeley Mono + Inter', vibe: 'Linear · Stripe',  Cmp: WizardVariantE },
] as const;

export function WizardVariantsPreview() {
  return (
    <div className="min-h-screen bg-stone-100 px-6 py-12">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="text-[34px] font-bold tracking-tight text-stone-900">
          Welcome Wizard — 5 directions de design
        </h1>
        <p className="mt-2 max-w-[680px] text-[14px] text-stone-600">
          Chaque variante montre <strong>Step 1 (Bienvenue)</strong> qui donne le ton du wizard
          entier. Une fois choisie, je décline aux 4 autres étapes (Coordonnées, Préférences,
          Tour, Done) en conservant la même palette, typo et composition.
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
                      <strong>Palette</strong> {v.palette} · <strong>Typo</strong> {v.typo} · <strong>Vibe</strong> {v.vibe}
                    </p>
                  </div>
                </header>
                <Cmp />
              </section>
            );
          })}
        </div>

        <p className="mt-14 text-center text-[12px] text-stone-500">
          Choisis une direction (A · B · C · D · E), je décline aux 5 étapes du wizard.
        </p>
      </div>
    </div>
  );
}
