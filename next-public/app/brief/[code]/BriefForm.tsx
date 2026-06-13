'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Send, Loader2, CheckCircle2, Eye } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { Logo } from '@/components/Logo'
import { submitBrief } from './actions'

const FIELDS = [
  { key: 'objective' as const,         label: 'Objectif du projet',                placeholder: "Quel est l'objectif principal du projet ?",        required: true, rows: 4 },
  { key: 'target_audience' as const,   label: 'Cible / utilisateurs',              placeholder: 'Qui sont les utilisateurs cibles ?',                rows: 3 },
  { key: 'pages' as const,             label: 'Pages / Fonctionnalités attendues', placeholder: 'Listez les pages ou fonctionnalités souhaitées…',   rows: 4 },
  { key: 'techno' as const,            label: 'Technologie / stack',               placeholder: 'Stack technique ou préférences technologiques…',    rows: 2 },
  { key: 'design_references' as const, label: 'Références design',                 placeholder: 'URLs, inspirations visuelles, exemples de sites…', rows: 3 },
  { key: 'notes' as const,             label: 'Notes complémentaires',             placeholder: "Toute information utile pour l'équipe…",           rows: 3 },
] as const

type BriefData = {
  id: string
  objective?: string | null
  target_audience?: string | null
  pages?: string | null
  techno?: string | null
  design_references?: string | null
  notes?: string | null
  submitted_at?: string | null
} | null

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

function FieldCard({ field, index, value, onChange, readOnly }: {
  field: typeof FIELDS[number]; index: number; value: string; onChange: (v: string) => void; readOnly: boolean
}) {
  const [focused, setFocused] = useState(false)
  const ref = useAutoResize(value)
  const filled = value.trim().length > 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1.5px solid ${focused ? 'rgba(167,139,250,0.6)' : filled ? 'rgba(167,243,208,0.5)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 16,
        padding: '14px 16px',
        transition: 'all 0.25s ease',
      }}
    >
      <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
        {filled ? <CheckCircle2 size={14} style={{ color: '#6ee7b7' }} /> : <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />}
        <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
          {field.label}
          {'required' in field && field.required && !readOnly && <span style={{ color: '#f87171', marginLeft: 4 }}>*</span>}
        </label>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={readOnly ? '—' : field.placeholder}
        rows={field.rows}
        readOnly={readOnly}
        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: readOnly ? 'rgba(255,255,255,0.7)' : 'white', fontSize: 14, lineHeight: 1.6, resize: 'none', fontFamily: 'inherit', cursor: readOnly ? 'default' : 'text' }}
      />
    </motion.div>
  )
}

export function BriefForm({ code: _code, projectName, projectId, brief, alreadySubmitted }: {
  code: string; projectName: string; projectId: string; brief: BriefData; alreadySubmitted: boolean
}) {
  const [values, setValues] = useState({
    objective: brief?.objective ?? '',
    target_audience: brief?.target_audience ?? '',
    pages: brief?.pages ?? '',
    techno: brief?.techno ?? '',
    design_references: brief?.design_references ?? '',
    notes: brief?.notes ?? '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isReadOnly = alreadySubmitted

  const handleSubmit = useCallback(async () => {
    if (!values.objective.trim()) { setError("L'objectif est requis."); return }
    setSubmitting(true); setError(null)
    const result = await submitBrief(projectId, brief?.id ?? null, projectName, values)
    if (result.ok) setSubmitted(true)
    else setError('Une erreur est survenue. Veuillez réessayer.')
    setSubmitting(false)
  }, [projectId, brief, projectName, values])

  return (
    <PageShell>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <Logo size={56} />
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, textAlign: 'center' }}>
            {isReadOnly ? 'Votre brief' : `Brief — ${projectName}`}
          </h1>
          {isReadOnly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6ee7b7', fontSize: 13 }}>
              <Eye size={14} /> Brief soumis — lecture seule
            </div>
          )}
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FIELDS.map((field, i) => (
            <FieldCard key={field.key} field={field} index={i}
              value={values[field.key]} onChange={v => setValues(prev => ({ ...prev, [field.key]: v }))}
              readOnly={isReadOnly} />
          ))}
        </div>

        {!isReadOnly && (
          <>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, color: '#f87171', fontSize: 13 }}>
                  <AlertCircle size={14} />{error}
                </motion.div>
              )}
            </AnimatePresence>
            {submitted ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, color: '#6ee7b7', fontSize: 14, justifyContent: 'center' }}>
                <CheckCircle2 size={18} /> Brief envoyé avec succès !
              </motion.div>
            ) : (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                onClick={handleSubmit} disabled={submitting}
                style={{ marginTop: 24, width: '100%', padding: '14px 24px', background: submitting ? 'rgba(167,139,250,0.4)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                {submitting ? <Loader2 size={18} /> : <Send size={18} />}
                {submitting ? 'Envoi…' : 'Envoyer le brief'}
              </motion.button>
            )}
          </>
        )}
      </div>
    </PageShell>
  )
}
