'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Send, Loader2, Building2, CheckCircle2 } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { Logo } from '@/components/Logo'
import { submitBriefInvite } from './actions'

const FIELDS = [
  { key: 'objective',         label: 'Objectif du projet',                placeholder: "Quel est l'objectif principal du projet ?",        required: true, rows: 4 },
  { key: 'target_audience',   label: 'Cible / utilisateurs',              placeholder: 'Qui sont les utilisateurs cibles ?',                rows: 3 },
  { key: 'pages',             label: 'Pages / Fonctionnalités attendues', placeholder: 'Listez les pages ou fonctionnalités souhaitées…',   rows: 4 },
  { key: 'techno',            label: 'Technologie / stack',               placeholder: 'Stack technique ou préférences technologiques…',    rows: 2 },
  { key: 'design_references', label: 'Références design',                 placeholder: 'URLs, inspirations visuelles, exemples de sites…', rows: 3 },
  { key: 'notes',             label: 'Notes complémentaires',             placeholder: "Toute information utile pour l'équipe…",           rows: 3 },
] as const

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

function FieldCard({
  field, index, value, onChange,
}: {
  field: typeof FIELDS[number]; index: number; value: string; onChange: (v: string) => void
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
        <AnimatePresence mode="wait">
          {filled ? (
            <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <CheckCircle2 size={14} style={{ color: '#6ee7b7' }} />
            </motion.div>
          ) : (
            <motion.div key="dot" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
            </motion.div>
          )}
        </AnimatePresence>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
          {field.label}
          {'required' in field && field.required && <span style={{ color: '#f87171', marginLeft: 4 }}>*</span>}
        </label>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={field.placeholder}
        rows={field.rows}
        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: 14, lineHeight: 1.6, resize: 'none', fontFamily: 'inherit' }}
      />
    </motion.div>
  )
}

export function BriefInviteForm({ code, companyName }: { code: string; companyName: string }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map(f => [f.key, '']))
  )
  const [companyInput, setCompanyInput] = useState(companyName)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!values.objective.trim()) { setError("L'objectif du projet est requis."); return }
    setSubmitting(true); setError(null)
    const result = await submitBriefInvite(code, companyInput || companyName, values)
    if (result.ok) setSubmitted(true)
    else setError('Une erreur est survenue. Veuillez réessayer.')
    setSubmitting(false)
  }, [code, companyInput, companyName, values])

  if (submitted) {
    return (
      <PageShell>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24, padding: 24 }}
        >
          <Logo size={56} />
          <CheckCircle2 size={48} style={{ color: '#6ee7b7' }} />
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, textAlign: 'center' }}>Brief envoyé avec succès !</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', maxWidth: 320 }}>
            L&apos;équipe Propulseo a bien reçu votre brief.<br />
            Nous reviendrons vers vous très prochainement.
          </p>
        </motion.div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <Logo size={56} />
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, textAlign: 'center' }}>Brief de projet</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center' }}>
            Décrivez votre projet pour que notre équipe puisse vous préparer une proposition adaptée.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Building2 size={16} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
          <input
            value={companyInput}
            onChange={e => setCompanyInput(e.target.value)}
            placeholder="Nom de votre entreprise"
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: 14, width: '100%', fontFamily: 'inherit' }}
          />
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FIELDS.map((field, i) => (
            <FieldCard key={field.key} field={field} index={i}
              value={values[field.key]} onChange={v => setValues(prev => ({ ...prev, [field.key]: v }))} />
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, color: '#f87171', fontSize: 13 }}>
              <AlertCircle size={14} />{error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          onClick={handleSubmit} disabled={submitting}
          style={{ marginTop: 24, width: '100%', padding: '14px 24px', background: submitting ? 'rgba(167,139,250,0.4)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}
        >
          {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
          {submitting ? 'Envoi en cours…' : 'Envoyer le brief'}
        </motion.button>
      </div>
    </PageShell>
  )
}
