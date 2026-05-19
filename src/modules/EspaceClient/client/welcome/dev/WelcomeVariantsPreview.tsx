import { Variant1Aurora } from './Variant1Aurora';
import { Variant2BoardingPass } from './Variant2BoardingPass';
import { Variant3Editorial } from './Variant3Editorial';
import { Variant4Concierge } from './Variant4Concierge';
import { Variant5Cockpit } from './Variant5Cockpit';

// Page DEV qui empile les 5 variantes proposées pour la Step 5 Done.
// Accessible via /dev/welcome-variants (route ajoutée à App.tsx).
// Aucune logique — pur visuel pour arbitrage par le PM.
// À supprimer une fois la variante choisie + implémentée dans Step5Done.tsx.

const VARIANTS = [
  { num: 1, name: 'Aurore boréale',  tag: 'organique · contemplatif',     component: Variant1Aurora       },
  { num: 2, name: 'Boarding pass',   tag: 'voyage exclusif · skeuomorphic', component: Variant2BoardingPass },
  { num: 3, name: 'Editorial magazine', tag: 'minimal raffiné',           component: Variant3Editorial    },
  { num: 4, name: 'Conciergerie',    tag: 'warm hospitality · personnel', component: Variant4Concierge    },
  { num: 5, name: 'Cockpit / lancement', tag: 'futuriste · HUD',          component: Variant5Cockpit      },
] as const;

export function WelcomeVariantsPreview() {
  return (
    <div className="min-h-screen bg-stone-100 px-6 py-12">
      <div className="mx-auto max-w-[900px]">
        <h1 className="text-[32px] font-bold tracking-tight text-stone-900">
          Welcome Wizard · Step 5 Done — 5 variantes
        </h1>
        <p className="mt-2 text-[14px] text-stone-600">
          Prototypes visuels. Chaque carte mesure 520px de haut.
          Une fois choisie, la variante remplace `Step5Done.tsx` (la logique
          existante — wizard hook, redirect, toast — reste identique).
        </p>

        <div className="mt-10 space-y-12">
          {VARIANTS.map(v => {
            const Cmp = v.component;
            return (
              <section key={v.num} id={`variant-${v.num}`}>
                <header className="mb-3 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-stone-500">
                      Variante {String(v.num).padStart(2, '0')}
                    </span>
                    <h2 className="text-[20px] font-bold tracking-tight text-stone-900">
                      {v.name}
                    </h2>
                  </div>
                  <p className="text-[12px] uppercase tracking-wider text-stone-500">{v.tag}</p>
                </header>
                <Cmp />
              </section>
            );
          })}
        </div>

        <p className="mt-12 text-center text-[12px] text-stone-500">
          Choisis la variante, je l'intègre proprement dans Step5Done.tsx.
        </p>
      </div>
    </div>
  );
}
