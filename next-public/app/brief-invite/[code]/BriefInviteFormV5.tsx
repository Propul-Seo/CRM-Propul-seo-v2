'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { submitBriefInvite } from './actions'
import { Logo } from '@/components/Logo'

const BENTO_FONTS = `
  body { font-family: var(--font-outfit, var(--font-outfit, 'Outfit', sans-serif)); }
`

type FieldKey = 'objective' | 'target_audience' | 'pages' | 'techno' | 'design_references' | 'notes'

const FIELDS: Array<{
  key: FieldKey
  label: string
  number: string
  placeholder: string
  required?: boolean
  rows: number
  span: 'full' | 'two-thirds' | 'one-third'
}> = [
  {
    key: 'objective',
    label: 'Vision & Objectif',
    number: '01',
    placeholder: "Décrivez l'objectif principal de votre projet avec précision...",
    required: true,
    rows: 4,
    span: 'two-thirds',
  },
  {
    key: 'target_audience',
    label: 'Audience Cible',
    number: '02',
    placeholder: 'À qui nous adressons-nous ?',
    rows: 4,
    span: 'one-third',
  },
  {
    key: 'pages',
    label: 'Structure & Fonctionnalités',
    number: '03',
    placeholder: 'Quelles sont les pages ou fonctions clés attendues ?',
    rows: 3,
    span: 'two-thirds',
  },
  {
    key: 'techno',
    label: 'Environnement Techno',
    number: '04',
    placeholder: 'Stack technique ou préférences...',
    rows: 3,
    span: 'one-third',
  },
  {
    key: 'design_references',
    label: 'Références Visuelles',
    number: '05',
    placeholder: 'URLs, sites inspirants, moodboard...',
    rows: 2,
    span: 'one-third',
  },
  {
    key: 'notes',
    label: 'Notes Libres',
    number: '06',
    placeholder: 'Souhaitez-vous ajouter un détail important ?',
    rows: 2,
    span: 'two-thirds',
  },
]

function FieldCard({
  field,
  index,
  value,
  onChange,
}: {
  field: typeof FIELDS[number]
  index: number
  value: string
  onChange: (v: string) => void
}) {
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  const filled = value.trim().length > 0

  const spanClass =
    field.span === 'full'
      ? 'bento-col-full'
      : field.span === 'two-thirds'
      ? 'bento-col-2'
      : 'bento-col-1'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className={`bento-card ${spanClass}${focused ? ' bento-focused' : ''}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <span className="bento-label">
          {field.number} — {field.label}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {field.required && (
            <span style={{
              fontSize: 10,
              background: focused ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.2)',
              color: focused ? '#fff' : '#a78bfa',
              padding: '3px 8px',
              borderRadius: 4,
              fontWeight: 700,
              textTransform: 'uppercase' as const,
              fontFamily: "var(--font-mono, var(--font-mono, 'IBM Plex Mono', monospace))",
              border: focused ? 'none' : '1px solid rgba(99,102,241,0.4)',
            }}>
              Requis
            </span>
          )}
          {filled && !focused && <CheckCircle2 size={14} color="#10b981" />}
        </div>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={field.placeholder}
        rows={field.rows}
        className="bento-textarea"
      />
    </motion.div>
  )
}

export function BriefInviteFormV5({ code, companyName }: { code: string; companyName: string }) {
  const [values, setValues] = useState<Record<FieldKey, string>>({
    objective: '', target_audience: '', pages: '', techno: '', design_references: '', notes: '',
  })
  const [companyInput, setCompanyInput] = useState(companyName)
  const [companyFocused, setCompanyFocused] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filledCount = FIELDS.filter(f => values[f.key]?.trim()).length
  const progress = Math.round((filledCount / FIELDS.length) * 100)

  const handleSubmit = useCallback(async () => {
    if (!values.objective.trim()) { setError("L'objectif est requis."); return }
    setSubmitting(true); setError(null)
    const result = await submitBriefInvite(code, companyInput || companyName, values)
    if (result.ok) setSubmitted(true)
    else setError('Une erreur est survenue. Veuillez réessayer.')
    setSubmitting(false)
  }, [code, companyInput, companyName, values])

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0e0b1e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, fontFamily: "var(--font-outfit, var(--font-outfit, 'Outfit', sans-serif))" }}>
        <style>{BENTO_FONTS}</style>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ maxWidth: 480, textAlign: 'center', background: '#16122e', borderRadius: 32, padding: 64, border: '1px solid #2d2654', boxShadow: '0 20px 60px rgba(99,102,241,0.12)' }}
        >
          <div style={{ marginBottom: 28 }}>
            <Logo size={140} />
          </div>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <CheckCircle2 size={32} color="#fff" />
          </div>
          <p style={{ fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)", fontSize: 10, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: 12 }}>
            Brief reçu
          </p>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#ede9fe', letterSpacing: '-0.03em', marginBottom: 16 }}>
            MERCI !
          </h2>
          <p style={{ color: '#6b5fa0', lineHeight: 1.7, fontSize: 16 }}>
            Votre brief est entre les mains de nos experts.<br />
            Nous vous recontactons sous <strong style={{ color: '#ede9fe' }}>24h</strong>.
          </p>
          <p style={{ marginTop: 40, fontFamily: "var(--font-mono, var(--font-mono, 'IBM Plex Mono', monospace))", fontSize: 9, color: '#3d3168', textTransform: 'uppercase', letterSpacing: '0.4em' }}>
            Propulseo Studio · Excellence Digitale
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0e0b1e', color: '#ede9fe', padding: '48px 24px', fontFamily: "var(--font-outfit, var(--font-outfit, 'Outfit', sans-serif))" }}>
      <style>{BENTO_FONTS}</style>
      <style>{`
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .bento-col-full  { grid-column: span 3 / span 3; }
        .bento-col-2     { grid-column: span 2 / span 2; }
        .bento-col-1     { grid-column: span 1 / span 1; }
        .bento-card {
          background: #16122e;
          border: 1px solid #2d2654;
          border-radius: 24px;
          padding: 28px;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
        }
        .bento-card:hover:not(.bento-focused) {
          transform: translateY(-3px);
          box-shadow: 0 20px 25px -5px rgba(124,58,237,0.2);
          border-color: #7c3aed;
        }
        .bento-focused {
          background: #6366f1 !important;
          border-color: #6366f1 !important;
          box-shadow: 0 20px 25px -5px rgba(99,102,241,0.4) !important;
        }
        .bento-label {
          font-family: var(--font-mono, 'IBM Plex Mono', monospace);
          font-size: 10px;
          font-weight: 600;
          color: #6b5fa0;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }
        .bento-focused .bento-label { color: rgba(255,255,255,0.6); }
        .bento-textarea {
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          color: #ede9fe;
          font-size: 17px;
          font-family: var(--font-outfit, 'Outfit', sans-serif);
          font-weight: 500;
          resize: none;
          flex: 1;
          line-height: 1.6;
          margin-top: 8px;
        }
        .bento-focused .bento-textarea { color: #fff; }
        .bento-textarea::placeholder { color: #3d3168; }
        .bento-focused .bento-textarea::placeholder { color: rgba(255,255,255,0.35); }
        @media (max-width: 768px) {
          .bento-grid { grid-template-columns: 1fr; }
          .bento-col-full, .bento-col-2, .bento-col-1 { grid-column: span 1 / span 1; }
        }
      `}</style>

      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, borderBottom: '2px solid #2d2654', paddingBottom: 40, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ marginBottom: 12 }}>
              <Logo size={120} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)", fontSize: 10, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Briefing System v3.0</span>
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0, color: '#ede9fe' }}>
              PARLONS DE VOTRE{' '}
              <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                PROJET.
              </span>
            </h1>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: "var(--font-mono, var(--font-mono, 'IBM Plex Mono', monospace))", fontSize: 10, fontWeight: 600, color: '#6b5fa0', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
              Complétion : <span style={{ color: '#a78bfa' }}>{progress}%</span>
            </div>
            <div style={{ width: 200, height: 10, background: '#16122e', border: '1px solid #2d2654', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #a855f7)', borderRadius: 99 }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </header>

        {/* Carte Entreprise — full width */}
        <div style={{ marginBottom: 16 }}>
          <div
            className={`bento-card${companyFocused ? ' bento-focused' : ''}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}
          >
            <div style={{
              width: 56, height: 56, flexShrink: 0,
              background: companyFocused ? 'rgba(255,255,255,0.2)' : 'rgba(124,58,237,0.2)',
              borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={companyFocused ? '#fff' : '#a78bfa'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <span className="bento-label">Votre Maison / Entreprise</span>
              <input
                value={companyInput}
                onChange={e => setCompanyInput(e.target.value)}
                onFocus={() => setCompanyFocused(true)}
                onBlur={() => setCompanyFocused(false)}
                placeholder="Comment se nomme votre structure ?"
                style={{
                  display: 'block', width: '100%', background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 22, fontWeight: 700, color: companyFocused ? '#fff' : '#ede9fe',
                  fontFamily: "var(--font-outfit, var(--font-outfit, 'Outfit', sans-serif))", marginTop: 6,
                }}
              />
            </div>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="bento-grid">
          {FIELDS.map((field, i) => (
            <FieldCard
              key={field.key}
              field={field}
              index={i}
              value={values[field.key]}
              onChange={v => setValues(prev => ({ ...prev, [field.key]: v }))}
            />
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
            width: '100%', marginTop: 40, padding: '28px 40px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            color: '#fff', border: 'none', borderRadius: 28,
            fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            transition: 'all 0.3s',
            fontFamily: "var(--font-outfit, var(--font-outfit, 'Outfit', sans-serif))",
          }}
          onMouseOver={e => { if (!submitting) { e.currentTarget.style.transform = 'scale(1.015)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(99,102,241,0.4)' } }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          {submitting ? 'TRAITEMENT EN COURS...' : 'TRANSMETTRE LE BRIEF'}
          {!submitting && <ArrowRight size={24} />}
        </button>

        {error && (
          <p style={{ color: '#ef4444', marginTop: 16, fontWeight: 600, fontSize: 14, textAlign: 'center' }}>{error}</p>
        )}

        <footer style={{ marginTop: 64, textAlign: 'center', fontFamily: "var(--font-mono, var(--font-mono, 'IBM Plex Mono', monospace))", fontSize: 9, color: '#3d3168', textTransform: 'uppercase', letterSpacing: '0.4em' }}>
          Propulseo Studio · Excellence Digitale
        </footer>
      </div>
    </div>
  )
}
