import { useEffect, useState } from 'react'
import { LogOut, Loader2, KeyRound, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Hero, SectionHead, StatusBadge } from '@/modules/EspaceClient/shared/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext'
import { useNavigate } from 'react-router-dom'
import { usePortalProjectDetails } from '../hooks/usePortalProjectDetails'
import { usePortalProfileMutations } from '../hooks/usePortalProfileMutations'

export function ProfilePage() {
  const { email, project, signOut } = usePortal()
  const navigate = useNavigate()
  const { details, refresh } = usePortalProjectDetails()
  const { updateProfile, changePassword, savingProfile, changingPwd } = usePortalProfileMutations()

  const [form, setForm] = useState({ first_name: '', phone: '', company: '' })
  const [pwd, setPwd] = useState({ next: '', confirm: '' })

  useEffect(() => {
    if (details) {
      setForm({
        first_name: details.client_first_name ?? '',
        phone:      details.client_phone ?? '',
        company:    details.client_company ?? '',
      })
    }
  }, [details])

  async function handleSaveProfile() {
    const res = await updateProfile({
      client_first_name: form.first_name.trim() || null,
      client_phone:      form.phone.trim() || null,
      client_company:    form.company.trim() || null,
    })
    if (res.success) { toast.success('Profil mis à jour'); await refresh() }
    else toast.error(res.error ?? 'Erreur lors de la mise à jour')
  }

  async function handleChangePassword() {
    if (pwd.next !== pwd.confirm) { toast.error('Les deux mots de passe ne correspondent pas'); return }
    const res = await changePassword(pwd.next)
    if (res.success) { toast.success('Mot de passe modifié'); setPwd({ next: '', confirm: '' }) }
    else toast.error(res.error ?? 'Erreur lors du changement')
  }

  async function handleLogout() {
    await signOut()
    navigate('/espace-client/login', { replace: true })
  }

  return (
    <div className="ps-fade-in space-y-6">
      <Hero
        eyebrow="Profil"
        title="Mon profil"
        subtitle="Vos informations de compte et préférences."
      />

      <section className="ps-surface overflow-hidden">
        <SectionHead title="Mes coordonnées" />
        <div className="grid grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-2">
          <Field label="Prénom">
            <Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="Ex. Marie" />
          </Field>
          <Field label="Téléphone">
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="06 12 34 56 78" type="tel" />
          </Field>
          <Field label="Entreprise">
            <Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Ma société" />
          </Field>
          <Field label="Email de connexion (non modifiable)">
            <Input value={email} disabled />
          </Field>
        </div>
        <div className="border-t border-[var(--ps-border-soft)] px-6 py-3 flex justify-end">
          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </section>

      <section className="ps-surface overflow-hidden">
        <SectionHead title="Projet" />
        <dl className="grid grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-2">
          <div>
            <dt className="ps-eyebrow ps-eyebrow-muted">Nom</dt>
            <dd className="mt-1 text-[13.5px] font-medium text-[var(--ps-fg)]">{project.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="ps-eyebrow ps-eyebrow-muted">Statut</dt>
            <dd className="mt-1.5">
              {project.status ? <StatusBadge status={project.status} /> : <span className="text-[13.5px] font-medium text-[var(--ps-fg)]">—</span>}
            </dd>
          </div>
        </dl>
      </section>

      <section className="ps-surface overflow-hidden">
        <SectionHead title="Sécurité" />
        <div className="grid grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-2">
          <Field label="Nouveau mot de passe">
            <Input type="password" value={pwd.next} onChange={e => setPwd({ ...pwd, next: e.target.value })} autoComplete="new-password" placeholder="8 caractères minimum" />
          </Field>
          <Field label="Confirmer">
            <Input type="password" value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} autoComplete="new-password" />
          </Field>
        </div>
        <div className="border-t border-[var(--ps-border-soft)] px-6 py-3 flex justify-end">
          <Button variant="outline" onClick={handleChangePassword} disabled={changingPwd || !pwd.next || !pwd.confirm}>
            {changingPwd ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
            Changer le mot de passe
          </Button>
        </div>
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
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="ps-eyebrow ps-eyebrow-muted mb-1.5 block">{label}</Label>
      {children}
    </div>
  )
}
