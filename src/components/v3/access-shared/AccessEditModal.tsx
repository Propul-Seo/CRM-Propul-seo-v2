import { useState, type FormEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import type { AccessRecord, AccessFormValues, CategoryConfig, AccessStatusShared } from './types'
import { STATUS_LABELS, STATUS_ORDER } from './types'

interface Props {
  access: AccessRecord | null
  categories: CategoryConfig[]
  title?: string
  onClose: () => void
  onSubmit: (values: AccessFormValues) => Promise<void>
}

const inputCls = 'w-full bg-[#0f0b1e] border border-[rgba(139,92,246,0.2)] rounded-md px-3 py-1.5 text-sm text-[#ede9fe] placeholder:text-[#6b7280] focus:outline-none focus:border-[#8B5CF6]'

export function AccessEditModal({ access, categories, title, onClose, onSubmit }: Props) {
  const isEdit = access !== null
  const defaultCategory = categories[0]?.value ?? ''
  const [form, setForm] = useState({
    category: access?.category ?? defaultCategory,
    label: access?.label ?? '',
    url: access?.url ?? '',
    login: access?.login ?? '',
    password: access?.password ?? '',
    notes: access?.notes ?? '',
    status: (access?.status ?? 'active') as AccessStatusShared,
    provided_by: access?.provided_by ?? '',
    expires_at: access?.expires_at ? access.expires_at.slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.label.trim()) {
      toast.error('Le label est obligatoire')
      return
    }
    setSaving(true)
    try {
      const secretValue = (current: string, original: string | null | undefined): string | null => {
        if (isEdit && original && current === '') return ''
        if (current === '') return null
        return current
      }
      await onSubmit({
        id: access?.id ?? null,
        category: form.category,
        label: form.label.trim(),
        url: form.url.trim() || null,
        login: secretValue(form.login, access?.login),
        password: secretValue(form.password, access?.password),
        notes: secretValue(form.notes.trim(), access?.notes),
        status: form.status,
        provided_by: form.provided_by.trim() || null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      })
      toast.success(isEdit ? 'Accès mis à jour' : 'Accès créé')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#070512] border border-[rgba(139,92,246,0.25)] rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[#ede9fe]">
            {title ?? (isEdit ? 'Modifier l\'accès' : 'Nouvel accès')}
          </h3>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center text-[#9ca3af] hover:text-[#ede9fe] hover:bg-[rgba(139,92,246,0.15)] transition-colors rounded-full">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Label *">
            <input
              autoFocus
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="ex: GitHub, Notion Team, OVH..."
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Catégorie">
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className={inputCls}
              >
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Statut">
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as AccessStatusShared }))}
                className={inputCls}
              >
                {STATUS_ORDER.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="URL">
            <input
              type="url"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://..."
              className={inputCls}
            />
          </Field>

          <Field label="Login">
            <input
              type="text"
              autoComplete="off"
              value={form.login}
              onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
              className={inputCls}
            />
          </Field>

          <Field label="Mot de passe">
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className={inputCls}
            />
          </Field>

          <Field label="Notes">
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fourni par">
              <input
                type="text"
                value={form.provided_by}
                onChange={e => setForm(f => ({ ...f, provided_by: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="Expire le">
              <input
                type="date"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-md text-sm text-[#9ca3af] bg-[#0f0b1e] border border-[rgba(139,92,246,0.2)] hover:bg-[#1a1430] transition-colors disabled:opacity-40"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-white bg-[#8B5CF6] hover:bg-[#7c3aed] transition-colors disabled:opacity-50"
            >
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#9ca3af] mb-1">{label}</label>
      {children}
    </div>
  )
}
