import { User, Mail, Phone, Building2, Pencil, Lock, CheckCircle2 } from 'lucide-react';
import { SkyShell } from './SkyShell';

// Step 2 Sky Aurora — Carte d'identité éditable.
export function SkyStep2() {
  const rows = [
    { icon: User,       label: 'Prénom',    value: 'Lyes',                  editable: true },
    { icon: User,       label: 'Nom',       value: 'Triki',                 editable: true },
    { icon: Mail,       label: 'Email',     value: 'lyestriki@gmail.com',   editable: false },
    { icon: Phone,      label: 'Téléphone', value: '+33 6 20 20 20 20',     editable: true },
    { icon: Building2,  label: 'Société',   value: 'Précieuse Joaillerie',  editable: true },
  ];
  return (
    <SkyShell step={2}>
      <div className="w-full max-w-[600px]">
        <div className="overflow-hidden rounded-3xl bg-white"
          style={{ boxShadow: '0 30px 60px -15px rgba(139,92,246,0.20), 0 0 0 1px rgba(139,92,246,0.06)' }}
        >
          {/* Liseré top */}
          <div className="h-[2px] bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500" />

          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-br from-sky-50/50 via-violet-50/50 to-pink-50/30 px-5 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-violet-600 to-pink-500 text-[14px] font-bold tracking-wider text-white"
              style={{ boxShadow: '0 10px 25px -5px rgba(139,92,246,0.5)' }}
            >
              LT
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-bold text-stone-900">Lyes Triki</p>
              <p className="truncate text-[12.5px] text-stone-500">Précieuse Joaillerie</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-3 w-3" />Pré-rempli
            </span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-stone-100">
            {rows.map(r => {
              const Icon = r.icon;
              return (
                <div key={r.label} className="grid grid-cols-[26px_110px_1fr_24px] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-sky-50/30">
                  <Icon className="h-4 w-4 text-stone-400" />
                  <span className="text-[12.5px] text-stone-500">{r.label}</span>
                  <span className="truncate text-[13.5px] font-semibold tabular-nums text-stone-900">
                    {r.value}
                    {!r.editable && <span className="ml-2 rounded-full bg-stone-100 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-stone-500 ring-1 ring-stone-200">Login</span>}
                  </span>
                  {r.editable
                    ? <Pencil className="h-3.5 w-3.5 text-stone-400" />
                    : <Lock className="h-3.5 w-3.5 text-stone-400" />}
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-3 px-1 text-[11.5px] text-stone-500">
          Email non modifiable — c'est votre identifiant de connexion. Pour le changer, contactez votre AE.
        </p>
      </div>
    </SkyShell>
  );
}
