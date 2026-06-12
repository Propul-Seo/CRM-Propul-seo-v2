/**
 * BANC D'ESSAI JETABLE — comparaison des variantes V3 du portail client.
 * Route dev-only /portail-preview (cf. App.tsx). À SUPPRIMER après arbitrage.
 */
import { useState } from 'react';
import '@/modules/EspaceClient/shared/layouts/portal-theme.css';
import { useForceLightTheme } from '@/modules/EspaceClient/shared/hooks/useForceLightTheme';
import { BENCH_DATA } from './fixtures';
import { AccueilA } from './variants/a/Accueil';
import { ProjetA } from './variants/a/Projet';
import { FacturesA } from './variants/a/Factures';
import { AccueilB } from './variants/b/Accueil';
import { ProjetB } from './variants/b/Projet';
import { FacturesB } from './variants/b/Factures';
import { AccueilC } from './variants/c/Accueil';
import { ProjetC } from './variants/c/Projet';
import { FacturesC } from './variants/c/Factures';

type Screen = 'accueil' | 'projet' | 'factures';
type Variant = 'a' | 'b' | 'c';

const SCREENS: Array<{ key: Screen; label: string }> = [
  { key: 'accueil', label: 'Accueil' },
  { key: 'projet', label: 'Projet' },
  { key: 'factures', label: 'Factures' },
];

const VARIANTS: Array<{ key: Variant; label: string }> = [
  { key: 'a', label: 'A — Éditorial calme' },
  { key: 'b', label: 'B — Matière & panneaux' },
  { key: 'c', label: 'C — Récit vertical' },
];

const REGISTRY: Record<Screen, Record<Variant, React.ComponentType<{ data: typeof BENCH_DATA }>>> = {
  accueil: { a: AccueilA, b: AccueilB, c: AccueilC },
  projet: { a: ProjetA, b: ProjetB, c: ProjetC },
  factures: { a: FacturesA, b: FacturesB, c: FacturesC },
};

export default function PreviewBench() {
  useForceLightTheme();
  const [screen, setScreen] = useState<Screen>('accueil');
  const [variant, setVariant] = useState<Variant>('a');
  const Current = REGISTRY[screen][variant];

  return (
    <div className="propulspace-portal min-h-screen bg-[var(--ps-bg)]">
      <Current data={BENCH_DATA} />

      {/* Barre de pilotage du banc (hors design comparé) */}
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[var(--ps-border)] bg-[var(--ps-bg-elevated)] px-2 py-1.5 shadow-[var(--ps-shadow-floating)]">
        {SCREENS.map(s => (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              screen === s.key
                ? 'bg-[var(--ps-primary)] text-white'
                : 'text-[var(--ps-fg-secondary)] hover:bg-[var(--ps-bg-subtle)]'
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-[var(--ps-border)]" />
        {VARIANTS.map(v => (
          <button
            key={v.key}
            type="button"
            onClick={() => setVariant(v.key)}
            title={v.label}
            className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold uppercase transition-colors ${
              variant === v.key
                ? 'bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)]'
                : 'text-[var(--ps-fg-secondary)] hover:bg-[var(--ps-bg-subtle)]'
            }`}
          >
            {v.key}
          </button>
        ))}
      </div>
    </div>
  );
}
