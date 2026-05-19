import { LayoutDashboard, FolderKanban, FileText, Receipt, PenLine, UserCircle, HelpCircle, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import { SkyShell } from './SkyShell';

// Step 4 Sky Aurora — Carrousel tour propriétaire 7 sections.
export function SkyStep4() {
  const sections = [
    { icon: FolderKanban,  title: 'Mon projet',     desc: 'Timeline des 8 phases.', compact: true },
    { icon: LayoutDashboard, title: 'Tableau de bord', desc: 'Vue d\'ensemble · KPI, actions, dernière activité.', compact: false },
    { icon: FileText,      title: 'Documents',      desc: 'Livrables, briefs, ressources partagées.', compact: true },
  ];
  return (
    <SkyShell step={4}>
      <div className="w-full max-w-[640px] space-y-3">
        <div className="relative flex h-[300px] items-center justify-center">
          {/* Flèches */}
          <button className="absolute left-1 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-md hover:scale-105">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="absolute right-1 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-md hover:scale-105">
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Peeking gauche */}
          <div className="absolute left-0 hidden h-[240px] w-[130px] scale-90 items-center opacity-50 sm:flex">
            <div className="w-full rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                  <FolderKanban className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <p className="text-[12px] font-bold text-stone-700">Mon projet</p>
              </div>
            </div>
          </div>

          {/* Featured center */}
          <div className="relative z-10 w-[78%] max-w-[400px] rounded-2xl bg-white p-5"
            style={{ boxShadow: '0 30px 60px -15px rgba(139,92,246,0.30), 0 0 0 1px rgba(139,92,246,0.06)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 via-violet-100 to-pink-100 ring-1 ring-inset ring-violet-200">
                <LayoutDashboard className="h-5 w-5 text-violet-700" />
              </div>
              <span className="font-mono text-[10.5px] font-medium tabular-nums text-stone-400">01 / 07</span>
            </div>
            <p className="mt-3 text-[17px] font-bold text-stone-900">Tableau de bord</p>
            <p className="mt-1 text-[13px] text-stone-600">Vue d'ensemble · KPI, actions, dernière activité.</p>

            <div className="mt-3 flex h-[100px] items-center justify-center rounded-lg bg-gradient-to-br from-sky-50 via-violet-50 to-pink-50 ring-1 ring-violet-100"
              style={{ boxShadow: 'inset 0 1px 2px rgba(139,92,246,0.08)' }}
            >
              <div className="flex flex-col items-center gap-1.5 text-violet-400">
                <LayoutDashboard className="h-7 w-7" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Aperçu</span>
              </div>
            </div>
          </div>

          {/* Peeking droite */}
          <div className="absolute right-0 hidden h-[240px] w-[130px] scale-90 items-center justify-end opacity-50 sm:flex">
            <div className="w-full rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100">
                  <FileText className="h-3.5 w-3.5 text-pink-600" />
                </div>
                <p className="text-[12px] font-bold text-stone-700">Documents</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <span key={i} className={
              i === 0
                ? 'h-1.5 w-[18px] rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 shadow-sm'
                : 'h-1.5 w-1.5 rounded-full bg-stone-300'
            } />
          ))}
        </div>

        {/* Hint */}
        <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-50 via-violet-50 to-pink-50 px-3.5 py-2.5 text-[12px] text-violet-700 ring-1 ring-violet-100">
          <Phone className="h-3.5 w-3.5 shrink-0 animate-pulse" />
          <span>Bouton bleu en bas à droite de chaque page : votre raccourci pour nous contacter, n'importe quand.</span>
        </div>
      </div>
    </SkyShell>
  );
}
