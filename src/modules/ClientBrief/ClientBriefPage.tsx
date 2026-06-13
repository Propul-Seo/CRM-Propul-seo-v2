// src/modules/ClientBrief/ClientBriefPage.tsx
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Send, Loader2 } from 'lucide-react'
import { useBriefByToken } from '@/modules/ProjectsManagerV2/hooks/useBriefV2'
import type { BriefFields } from '@/modules/ProjectsManagerV2/hooks/useBriefV2'

const LOGO_URL = 'https://lh3.googleusercontent.com/pw/AP1GczN1Fx4MCRF05ZyLZ8eE7yq6l3O04S9H5NUlRQng3NGehC4bVTl4SA0EdX8yJ4cEgMGjbPkELigm1WxcMBR8QCh4QSMgDVikjqv8mizSPn2r-zv-pKbMK10JVMTK4Fo1kd4VUXASX_owtWiT6X6cRao=w590-h423-s-no-gm?authuser=0'

interface FieldDef {
  key: keyof BriefFields
  label: string
  placeholder: string
  required?: boolean
  rows: number
}

const FIELDS: FieldDef[] = [
  { key: 'objective',         label: 'Objectif du projet',                 placeholder: "Quel est l'objectif principal du projet ?",        required: true, rows: 4 },
  { key: 'target_audience',   label: 'Cible / utilisateurs',               placeholder: 'Qui sont les utilisateurs cibles ?',                rows: 3 },
  { key: 'pages',             label: 'Pages / Fonctionnalités attendues',  placeholder: 'Listez les pages ou fonctionnalités souhaitées…',   rows: 4 },
  { key: 'techno',            label: 'Technologie / stack',                placeholder: 'Stack technique ou préférences technologiques…',    rows: 2 },
  { key: 'design_references', label: 'Références design',                  placeholder: 'URLs, inspirations visuelles, exemples de sites…', rows: 3 },
  { key: 'notes',             label: 'Notes complémentaires',              placeholder: "Toute information utile pour l'équipe…",           rows: 3 },
]

function useAutoResize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return ref
}

interface FieldCardProps {
  field: FieldDef
  index: number
  value: string
  onChange: (v: string) => void
}

function FieldCard({ field, index, value, onChange }: FieldCardProps) {
  const [focused, setFocused] = useState(false)
  const ref = useAutoResize(value)
  const filled = value.trim().length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'rgba(255,255,255,0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1.5px solid ${focused ? '#a5b4fc' : filled ? 'rgba(167,243,208,0.8)' : 'rgba(255,255,255,0.95)'}`,
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: focused
          ? '0 6px 24px rgba(99,102,241,0.18)'
          : filled
          ? '0 2px 12px rgba(34,197,94,0.08)'
          : '0 2px 16px rgba(99,102,241,0.07)',
        transition: 'all 0.25s ease',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <AnimatePresence mode="wait">
        {filled ? (
          <motion.div
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              width: 24, height: 24, borderRadius: 8, flexShrink: 0, marginTop: 1,
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 11, fontWeight: 800,
            }}
          >
            ✓
          </motion.div>
        ) : (
          <motion.div
            key="num"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              width: 24, height: 24, borderRadius: 8, flexShrink: 0, marginTop: 1,
              background: 'linear-gradient(135deg,#6366f1,#a855f7)',
              boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 10, fontWeight: 800,
            }}
          >
            {index + 1}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flex: 1 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4c1d95', marginBottom: 6 }}>
          {field.label}
          {field.required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
        </label>
        <textarea
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={field.placeholder}
          rows={field.rows}
          style={{
            width: '100%', fontSize: 11, color: '#374151',
            lineHeight: 1.7, resize: 'none', outline: 'none',
            background: 'transparent', border: 'none', fontFamily: 'inherit',
          }}
        />
      </div>
    </motion.div>
  )
}

interface ClientBriefPageProps {
  token: string
}

export function ClientBriefPage({ token }: ClientBriefPageProps) {
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = 'light'
    document.body.style.background = '#ffffff'
    return () => {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
      document.body.style.background = ''
    }
  }, [])

  const { data, loading, error, submitBrief } = useBriefByToken(token)
  const [fields, setFields] = useState<Record<keyof BriefFields, string>>({
    objective: '', target_audience: '', pages: '', techno: '', design_references: '', notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const alreadySubmitted = data?.brief?.submitted_at != null

  const filledCount = Object.values(fields).filter(v => v.trim().length > 0).length

  const handleChange = useCallback((key: keyof BriefFields, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fields.objective.trim()) {
      setValidationError('Le champ "Objectif du projet" est obligatoire.')
      return
    }
    setValidationError(null)
    setSubmitting(true)
    const ok = await submitBrief({
      objective:         fields.objective.trim()         || null,
      target_audience:   fields.target_audience.trim()   || null,
      pages:             fields.pages.trim()             || null,
      techno:            fields.techno.trim()            || null,
      design_references: fields.design_references.trim() || null,
      notes:             fields.notes.trim()             || null,
    })
    setSubmitting(false)
    if (ok) setSubmitted(true)
    else setValidationError('Une erreur est survenue. Veuillez réessayer.')
  }

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #ede9fe 0%, #f0f9ff 50%, #fdf4ff 100%)',
    backgroundAttachment: 'fixed',
  }

  const headerStyle: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 20,
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.9)',
    height: 60, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '0 20px',
  }

  const Header = (
    <header style={headerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src={LOGO_URL} alt="Propul'SEO" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 8 }} />
        <span style={{
          fontSize: 13, fontWeight: 800,
          background: 'linear-gradient(135deg,#6366f1,#a855f7)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Propul'SEO
        </span>
      </div>
      {data && (
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e1b4b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.projectName}
        </span>
      )}
    </header>
  )

  const Footer = (
    <footer style={{ textAlign: 'center', padding: '12px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 10, color: '#94a3b8' }}>
      <img src={LOGO_URL} alt="" style={{ width: 14, height: 14, objectFit: 'contain', borderRadius: 3, opacity: 0.6 }} />
      <span style={{ color: '#6366f1', fontWeight: 700 }}>Propul'SEO</span>
      <span>·</span>
      <span>🔒 Accès par lien unique</span>
    </footer>
  )

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', flexDirection: 'column' }}>
        {Header}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 style={{ width: 28, height: 28, margin: '0 auto 10px', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 13 }}>Chargement du formulaire…</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ ...pageStyle, display: 'flex', flexDirection: 'column' }}>
        {Header}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 320 }}>
            <AlertCircle style={{ width: 48, height: 48, color: '#f87171', margin: '0 auto 16px' }} />
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#1e1b4b', marginBottom: 8 }}>Lien invalide</h1>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{error ?? 'Ce lien est invalide ou a été désactivé.'}</p>
          </div>
        </div>
      </div>
    )
  }

  if (submitted || alreadySubmitted) {
    const submittedDate = data.brief?.submitted_at
      ? new Date(data.brief.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : null

    return (
      <div style={pageStyle}>
        {Header}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px 40px' }}
        >
          <div style={{ textAlign: 'center', padding: '28px 0 20px', borderBottom: '1px solid rgba(255,255,255,0.5)' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, margin: '0 auto 12px',
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: '#fff', boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
            }}>✓</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e1b4b', marginBottom: 4 }}>
              {alreadySubmitted && !submitted ? 'Brief déjà transmis' : 'Brief transmis !'}
            </h1>
            <p style={{ fontSize: 11, color: '#64748b' }}>
              {alreadySubmitted && !submitted
                ? `Transmis${submittedDate ? ` le ${submittedDate}` : ''}. L'équipe Propul'SEO l'a bien reçu.`
                : 'Voici un récapitulatif de vos réponses'}
            </p>
          </div>

          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 9, fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Vos réponses</p>
            {FIELDS.map(f => {
              const val = submitted
                ? fields[f.key]
                : (data.brief?.[f.key as keyof typeof data.brief] as string | null | undefined)
              if (!val?.trim()) return null
              return (
                <div key={f.key} style={{
                  background: 'rgba(255,255,255,0.65)',
                  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                  border: '1.5px solid rgba(167,243,208,0.8)',
                  borderRadius: 12, padding: '10px 14px',
                }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                    {f.label}
                  </p>
                  <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{val}</p>
                </div>
              )
            })}
          </div>
        </motion.div>
        {Footer}
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {Header}

      <div style={{ padding: '12px 20px 0', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {FIELDS.map((_, i) => (
            <div key={i} style={{
              height: 4, flex: 1, borderRadius: 4,
              background: i < filledCount
                ? 'linear-gradient(to right,#6366f1,#a855f7)'
                : 'rgba(99,102,241,0.12)',
              opacity: i === filledCount && filledCount < FIELDS.length ? 0.35 : 1,
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
        <p style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, marginTop: 6, letterSpacing: 0.3 }}>
          {filledCount} / {FIELDS.length} champs remplis
        </p>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 20px 16px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e1b4b', marginBottom: 5, lineHeight: 1.2 }}>
          {data.projectName}
        </h2>
        <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
          Merci de remplir ce formulaire pour nous aider à bien comprendre votre projet. Seul le champ Objectif est obligatoire.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FIELDS.map((field, i) => (
            <FieldCard
              key={field.key}
              field={field}
              index={i}
              value={fields[field.key]}
              onChange={v => handleChange(field.key, v)}
            />
          ))}
        </div>

        {validationError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: 12, color: '#ef4444',
              background: 'rgba(254,242,242,0.9)', border: '1px solid #fecaca',
              borderRadius: 12, padding: '10px 14px', marginTop: 10,
            }}
          >
            {validationError}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%', marginTop: 14,
            background: submitting ? 'rgba(99,102,241,0.6)' : 'linear-gradient(135deg,#6366f1,#a855f7)',
            color: '#fff', border: 'none', borderRadius: 14, padding: 14,
            fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: '0 6px 20px rgba(99,102,241,0.38)',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
        >
          {submitting
            ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Envoi en cours…</>
            : <><Send style={{ width: 14, height: 14 }} /> Envoyer le brief</>
          }
        </button>
      </form>

      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        {Footer}
      </div>
    </div>
  )
}
