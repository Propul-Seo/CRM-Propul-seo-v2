import { UserRound, LogOut, CheckCircle2 } from 'lucide-react';
import { Hero, SectionHead } from '@/modules/EspaceClient/shared/components';
import { Button } from '@/components/ui/button';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import { useNavigate } from 'react-router-dom';

export function ProfilePage() {
  const { userRow, project, signOut } = usePortal();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/espace-client/login', { replace: true });
  }

  return (
    <div className="ps-fade-in space-y-6">
      <Hero
        eyebrow="Profil"
        title="Mon profil"
        subtitle="Vos informations de compte et préférences."
      />

      <section className="ps-surface overflow-hidden">
        <SectionHead title="Compte" />
        <dl className="grid grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-[var(--ps-fg-muted)]">Email</dt>
            <dd className="text-[13.5px] font-medium text-[var(--ps-fg)]">{userRow.email}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-[var(--ps-fg-muted)]">Onboarding</dt>
            <dd className="inline-flex items-center gap-1 text-[13.5px] font-medium text-[var(--ps-fg)]">
              {userRow.onboarding_completed ? (
                <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Terminé</>
              ) : (
                <span className="text-amber-700">En cours</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="ps-surface overflow-hidden">
        <SectionHead title="Projet" />
        <dl className="grid grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-[var(--ps-fg-muted)]">Nom</dt>
            <dd className="text-[13.5px] font-medium text-[var(--ps-fg)]">{project.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-[var(--ps-fg-muted)]">Client</dt>
            <dd className="text-[13.5px] font-medium text-[var(--ps-fg)]">{project.client_name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-[var(--ps-fg-muted)]">Statut</dt>
            <dd className="text-[13.5px] font-medium text-[var(--ps-fg)]">{project.status ?? '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="ps-surface p-6">
        <h2 className="ps-h3">Session</h2>
        <p className="mt-1 text-[13px] text-[var(--ps-fg-secondary)]">
          Déconnectez-vous pour terminer votre session sur cet appareil.
        </p>
        <Button variant="outline" onClick={handleLogout} className="mt-3">
          <LogOut className="mr-1.5 h-4 w-4" />
          Se déconnecter
        </Button>
      </section>

      <UserRound className="hidden" aria-hidden />
    </div>
  );
}
