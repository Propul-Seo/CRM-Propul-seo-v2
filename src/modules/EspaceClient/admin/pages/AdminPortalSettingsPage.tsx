import { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp, ListChecks, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { AdminTopNav } from '../components/AdminTopNav';
import {
  DEFAULT_STEP_TEMPLATE, loadStepTemplate, saveStepTemplate, type StepTemplateItem,
} from '../lib/stepTemplate';

// Réglages du back-office Propul'Space. Unique section pour l'instant :
// le template des jalons types appliqué depuis l'onglet Jalons du cockpit.

const INPUT_CLASS =
  'w-full rounded-md border border-border bg-surface-1 px-2.5 py-1.5 text-sm text-foreground transition focus:border-primary/50 focus:outline-none disabled:opacity-50';

export function AdminPortalSettingsPage() {
  const [items, setItems] = useState<StepTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    void loadStepTemplate().then(({ items: loaded, error }) => {
      if (!alive) return;
      setItems(loaded);
      setLoadError(error);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  function update(index: number, patch: Partial<StepTemplateItem>) {
    setSaved(false);
    setItems(prev => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    setSaved(false);
    setItems(prev => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function remove(index: number) {
    setSaved(false);
    setItems(prev => prev.filter((_, i) => i !== index));
  }
  function add() {
    setSaved(false);
    setItems(prev => [...prev, { label: '', description: '' }]);
  }
  function resetDefaults() {
    setSaved(false);
    setItems(DEFAULT_STEP_TEMPLATE);
  }
  async function save() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    const { error } = await saveStepTemplate(items);
    if (error) setSaveError(error);
    else {
      setSaved(true);
      // Reflète le nettoyage (trim, lignes sans libellé écartées) dans le formulaire.
      setItems(prev => prev.map(i => ({ label: i.label.trim(), description: i.description.trim() })).filter(i => i.label !== ''));
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <AdminTopNav />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Réglages</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">Back-office Propul'Space</h1>

        <section className="mt-6 rounded-xl border border-border bg-surface-2 p-5 shadow-glow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ListChecks className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">Jalons types des nouveaux projets</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Appliqués via « Ajouter les jalons types » dans l'onglet Jalons d'un projet.
                Le premier jalon démarre « en cours », les suivants « à venir » — tout reste modifiable projet par projet.
              </p>
            </div>
          </div>

          {loadError && (
            <p className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              Réglage indisponible en base ({loadError}) — la migration 300 n'est sans doute pas appliquée.
              Les jalons par défaut sont affichés ; l'enregistrement échouera tant qu'elle n'est pas passée.
            </p>
          )}

          {loading ? (
            <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement du template…
            </p>
          ) : (
            <>
              <ol className="mt-5 space-y-2.5">
                {items.map((item, i) => (
                  <li key={i} className="rounded-lg border border-border-subtle bg-surface-1 p-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-xs font-semibold tabular-nums text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-2">
                        <input
                          type="text"
                          value={item.label}
                          disabled={saving}
                          placeholder="Libellé du jalon (ex. Mise en ligne)"
                          aria-label={`Libellé du jalon ${i + 1}`}
                          onChange={e => update(i, { label: e.target.value })}
                          className={INPUT_CLASS}
                        />
                        <input
                          type="text"
                          value={item.description}
                          disabled={saving}
                          placeholder="Description visible par le client (optionnel)"
                          aria-label={`Description du jalon ${i + 1}`}
                          onChange={e => update(i, { description: e.target.value })}
                          className={`${INPUT_CLASS} text-xs`}
                        />
                      </div>
                      <div className="flex shrink-0 flex-col items-center gap-0.5">
                        <button type="button" disabled={i === 0 || saving} onClick={() => move(i, -1)} title="Monter" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-20"><ChevronUp className="h-4 w-4" /></button>
                        <button type="button" disabled={i === items.length - 1 || saving} onClick={() => move(i, 1)} title="Descendre" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-20"><ChevronDown className="h-4 w-4" /></button>
                        <button type="button" disabled={saving || items.length <= 1} onClick={() => remove(i)} title="Supprimer" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-20"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              {saveError && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{saveError}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={add}
                  className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter une ligne
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={resetDefaults}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-1 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground disabled:opacity-60"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Revenir aux jalons par défaut
                </button>
                <span className="flex-1" />
                {saved && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                    <Check className="h-3.5 w-3.5" /> Enregistré
                  </span>
                )}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => { void save(); }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-primary/85 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Enregistrer le template
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
