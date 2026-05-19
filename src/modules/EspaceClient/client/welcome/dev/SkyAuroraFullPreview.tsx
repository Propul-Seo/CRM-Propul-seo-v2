import { SkyStep1 } from './sky/SkyStep1';
import { SkyStep2 } from './sky/SkyStep2';
import { SkyStep3 } from './sky/SkyStep3';
import { SkyStep4 } from './sky/SkyStep4';
import { SkyStep5 } from './sky/SkyStep5';

// Page DEV — Wizard Sky Aurora complet (5 étapes) pour validation finale.

const STEPS = [
  { num: 1, name: 'Bienvenue',     Cmp: SkyStep1 },
  { num: 2, name: 'Coordonnées',   Cmp: SkyStep2 },
  { num: 3, name: 'Préférences',   Cmp: SkyStep3 },
  { num: 4, name: 'Tour',          Cmp: SkyStep4 },
  { num: 5, name: 'Tout est prêt', Cmp: SkyStep5 },
] as const;

export function SkyAuroraFullPreview() {
  return (
    <div className="min-h-screen bg-stone-100 px-6 py-12">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="text-[34px] font-bold tracking-tight text-stone-900">
          Sky Aurora · Wizard complet
        </h1>
        <p className="mt-2 max-w-[680px] text-[14px] text-stone-600">
          La direction B3 (Sky Aurora) déclinée sur les 5 étapes : Bienvenue · Coordonnées
          · Préférences · Tour · Done. Toutes les étapes partagent le même fond gradient
          sky/lavande/peach, les auroras diagonales, le gradient text sky→violet→pink
          et les cards blanches.
        </p>

        <div className="mt-10 space-y-12">
          {STEPS.map(s => {
            const Cmp = s.Cmp;
            return (
              <section key={s.num} id={`step-${s.num}`}>
                <header className="mb-4 flex items-baseline gap-3">
                  <span className="font-mono text-[24px] font-bold text-stone-300">
                    {String(s.num).padStart(2, '0')}.
                  </span>
                  <h2 className="text-[22px] font-bold tracking-tight text-stone-900">{s.name}</h2>
                </header>
                <Cmp />
              </section>
            );
          })}
        </div>

        <p className="mt-12 text-center text-[12px] text-stone-500">
          Si OK je remplace les 5 vrais composants Step1-5 par cette DA + branche au wizard.
        </p>
      </div>
    </div>
  );
}
