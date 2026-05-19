import { Mail, Phone, MessageSquare, Check } from 'lucide-react';
import { SkyShell } from './SkyShell';

// Step 3 Sky Aurora — Préférences (canal + plages + notifs).
export function SkyStep3() {
  return (
    <SkyShell step={3}>
      <div className="w-full max-w-[600px] rounded-3xl bg-white p-7"
        style={{ boxShadow: '0 30px 60px -15px rgba(139,92,246,0.18), 0 0 0 1px rgba(139,92,246,0.05)' }}
      >
        <div className="divide-y divide-stone-100">
          {/* Canal */}
          <div className="grid grid-cols-[180px_1fr] gap-6 py-5">
            <div>
              <p className="text-[13.5px] font-semibold text-stone-900">Canal préféré</p>
              <p className="mt-0.5 text-[11.5px] text-stone-500">Comment vous prévenir en priorité.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { i: Mail,           l: 'Email',     active: true },
                { i: Phone,          l: 'Téléphone', active: false },
                { i: MessageSquare,  l: 'WhatsApp',  active: false },
              ].map(c => {
                const I = c.i;
                return (
                  <button key={c.l} className={
                    c.active
                      ? 'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-md shadow-violet-500/30'
                      : 'inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-stone-700 hover:border-violet-300'
                  }>
                    <I className="h-3.5 w-3.5" />{c.l}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plages */}
          <div className="grid grid-cols-[180px_1fr] gap-6 py-5">
            <div>
              <p className="text-[13.5px] font-semibold text-stone-900">Plages</p>
              <p className="mt-0.5 text-[11.5px] text-stone-500">Quand vous joindre.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { l: 'Matin',      h: '8 h – 12 h',  active: false },
                { l: 'Après-midi', h: '14 h – 18 h', active: true },
                { l: 'Soir',       h: '18 h – 20 h', active: false },
              ].map(s => (
                <button key={s.l} className={
                  s.active
                    ? 'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-100 via-violet-100 to-pink-100 px-3.5 py-1.5 text-[12.5px] font-medium text-violet-700 ring-1 ring-violet-200'
                    : 'inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-stone-700'
                }>
                  {s.active && <Check className="h-3.5 w-3.5" />}
                  <span>{s.l}</span>
                  <span className="text-[11px] text-stone-500">{s.h}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="grid grid-cols-[180px_1fr] gap-6 py-5">
            <div>
              <p className="text-[13.5px] font-semibold text-stone-900">Notifications</p>
              <p className="mt-0.5 text-[11.5px] text-stone-500">Par email, événements clés uniquement.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative h-6 w-11 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 shadow-inner">
                <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow" />
              </button>
              <span className="rounded-md border-l-2 border-violet-400/60 py-0.5 pl-2.5 text-[12.5px] text-stone-600">
                Activé · vous recevrez livrables, factures, signatures à effectuer
              </span>
            </div>
          </div>
        </div>
      </div>
    </SkyShell>
  );
}
