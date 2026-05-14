import { useState } from 'react'
import { Eye, EyeOff, Copy, Check, Pencil, Trash2, ExternalLink, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { AccessRecord } from './types'
import { STATUS_LABELS, STATUS_COLORS } from './types'

interface Props {
  access: AccessRecord
  isAdmin: boolean
  categoryIcon: LucideIcon
  onEdit: () => void
  onDelete: () => void
}

type SecretKind = 'login' | 'password'

export function AccessItemView({ access, isAdmin, categoryIcon: Icon, onEdit, onDelete }: Props) {
  const [showLogin, setShowLogin] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [copied, setCopied] = useState<SecretKind | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleCopy = async (value: string | null, kind: SecretKind) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      toast.success(`${kind === 'login' ? 'Login' : 'Mot de passe'} copié`)
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      toast.error('Copie impossible')
    }
  }

  const handleConfirmDelete = () => {
    onDelete()
    setConfirmDelete(false)
  }

  return (
    <div className="rounded-lg border border-[rgba(139,92,246,0.18)] bg-[#0f0b1e] p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#A78BFA] shrink-0" />
        <span className="text-sm font-medium text-[#ede9fe] flex-1 truncate">{access.label}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[access.status]}`}>
          {STATUS_LABELS[access.status]}
        </span>
        {isAdmin && (
          <>
            <button onClick={onEdit} className="text-[#9ca3af] hover:text-[#A78BFA] transition-colors" title="Modifier">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[#9ca3af] hover:text-red-400 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {access.url && (
        <a
          href={normalizeUrl(access.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-[#A78BFA] hover:text-white truncate"
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
          <span className="truncate">{access.url}</span>
        </a>
      )}

      {isAdmin && (access.login || access.password) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {access.login !== null && (
            <SecretField
              label="Login"
              value={access.login}
              masked={!showLogin}
              onToggle={() => setShowLogin(v => !v)}
              onCopy={() => handleCopy(access.login, 'login')}
              copied={copied === 'login'}
            />
          )}
          {access.password !== null && (
            <SecretField
              label="Password"
              value={access.password}
              masked={!showPwd}
              onToggle={() => setShowPwd(v => !v)}
              onCopy={() => handleCopy(access.password, 'password')}
              copied={copied === 'password'}
            />
          )}
        </div>
      )}

      {isAdmin && access.notes && (
        <p className="text-[11px] text-[#9ca3af] pt-1 whitespace-pre-wrap">{access.notes}</p>
      )}

      {(access.provided_by || access.expires_at) && (
        <div className="flex items-center gap-3 text-[10px] text-[#6b7280] pt-1">
          {access.provided_by && <span>Fourni par {access.provided_by}</span>}
          {access.expires_at && <span>Expire le {new Date(access.expires_at).toLocaleDateString('fr-FR')}</span>}
        </div>
      )}

      {confirmDelete && (
        <div className="flex items-center justify-between gap-2 mt-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded">
          <p className="text-xs text-red-300">Supprimer cet accès ?</p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmDelete}
              className="px-2.5 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
            >
              Supprimer
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2.5 py-1 border border-[rgba(139,92,246,0.2)] rounded text-xs text-[#9ca3af] hover:bg-[#1a1430] transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

interface SecretFieldProps {
  label: string
  value: string | null
  masked: boolean
  onToggle: () => void
  onCopy: () => void
  copied: boolean
}

function SecretField({ label, value, masked, onToggle, onCopy, copied }: SecretFieldProps) {
  return (
    <div className="flex items-center gap-1 bg-[#070512] border border-[rgba(139,92,246,0.15)] rounded px-2 py-1">
      <span className="text-[10px] text-[#6b7280] w-12 shrink-0">{label}</span>
      <input
        readOnly
        type={masked ? 'password' : 'text'}
        value={value ?? ''}
        className="flex-1 min-w-0 bg-transparent text-xs text-[#ede9fe] focus:outline-none"
      />
      <button onClick={onToggle} className="text-[#9ca3af] hover:text-[#A78BFA] shrink-0" title={masked ? 'Afficher' : 'Masquer'}>
        {masked ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      </button>
      <button onClick={onCopy} className="text-[#9ca3af] hover:text-[#A78BFA] shrink-0" title="Copier">
        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  )
}
