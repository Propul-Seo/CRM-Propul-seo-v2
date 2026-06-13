// src/modules/ClientBrief/ClientBriefInvitePage.tsx
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Send, Loader2, Building2 } from 'lucide-react'
import { useBriefInvitation } from '@/modules/ProjectsManagerV2/hooks/useBriefInvitation'

const LOGO_URL = 'https://lh3.googleusercontent.com/pw/AP1GczN1Fx4MCRF05ZyLZ8eE7yq6l3O04S9H5NUlRQng3NGehC4bVTl4SA0EdX8yJ4cEgMGjbPkELigm1WxcMBR8QCh4QSMgDVikjqv8mizSPn2r-zv-pKbMK10JVMTK4Fo1kd4VUXASX_owtWiT6X6cRao=w590-h423-s-no-gm?authuser=0'

interface FieldDef {
  key: string
  label: string
  placeholder: string
  required?: boolean
  rows: number
}

const FIELDS: FieldDef[] = [
  { key: 'objective',         label: 'Objectif du projet',                placeholder: "Quel est l'objectif principal du projet ?",        required: true, rows: 4 },
  { key: 'target_audience',   label: 'Cible / utilisateurs',              placeholder: 'Qui sont les utilisateurs cibles ?',                rows: 3 },
  { key: 'pages',             label: 'Pages / Fonctionnalités attendues', placeholder: 'Listez les pages ou fonctionnalités souhaitées…',   rows: 4 },
  { key: 'techno',            label: 'Technologie / stack',               placeholder: 'Stack technique ou préférences technologiques…',    rows: 2 },
  { key: 'design_references', label: 'Références design',                 placeholder: 'URLs, inspirations visuelles, exemples de sites…', rows: 3 },
  { key: 'notes',             label: 'Notes complémentaires',             placeholder: "Toute information utile pour l'équipe…",           rows: 3 },
]

const RECAP_LABELS: Record<string, string> = {
  objective: 'Objectif du projet',
  target_audience: 'Cible / utilisateurs',
  pages: 'Pages / Fonctionnalités attendues',
  techno: 'Technologie / stack',
  design_references: 'Références design',
  notes: 'Notes complémentaires',
}

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

/* ── Orbes décoratifs ── */
function Orb({ style }: { style: React.CSSProperties }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', ...style }} />
}

/* ── Carte champ ── */
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
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: focused
          ? 'rgba(124,58,237,0.08)'
          : filled
          ? 'rgba(34,197,94,0.04)'
          : 'rgba(255,255,255,0.02)',
        border: `1.5px solid ${
          focused
            ? 'rgba(139,92,246,0.5)'
            : filled
            ? 'rgba(34,197,94,0.25)'
            : 'rgba(255,255,255,0.07)'
        }`,
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: focused
          ? '0 0 28px rgba(124,58,237,0.18), inset 0 1px 0 rgba(255,255,255,0.04)'
          : filled
          ? '0 0 12px rgba(34,197,94,0.06)'
          : 'none',
        transition: 'all 0.25s ease',
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Numéro / check */}
        <AnimatePresence mode="wait">
          {filled ? (
            <motion.div key="check"
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.18 }}
              style={{
                width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
                background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 900, color: '#fff',
                boxShadow: '0 2px 10px rgba(34,197,94,0.35)',
              }}
            >✓</motion.div>
          ) : (
            <motion.div key="num"
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.18 }}
              style={{
                width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
                background: focused
                  ? 'linear-gradient(135deg,#7c3aed,#a855f7)'
                  : 'rgba(124,58,237,0.18)',
                border: focused ? 'none' : '1px solid rgba(139,92,246,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 800,
                color: focused ? '#fff' : '#a78bfa',
                boxShadow: focused ? '0 2px 10px rgba(124,58,237,0.4)' : 'none',
              }}
            >{index + 1}</motion.div>
          )}
        </AnimatePresence>

        {/* Contenu */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, marginBottom: 6,
            color: filled ? '#86efac' : focused ? '#c4b5fd' : '#94a3b8',
            textTransform: 'uppercase', letterSpacing: '1.2px',
            transition: 'color 0.2s',
          }}>
            {field.label}{field.required && <span style={{ color: '#f472b6', marginLeft: 3 }}>*</span>}
          </div>
          <textarea
            ref={ref}
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={field.placeholder}
            rows={field.rows}
            style={{
              fontSize: 12, color: filled ? '#e2e8f0' : '#475569',
              width: '100%', resize: 'none', outline: 'none',
              background: 'transparent', border: 'none', lineHeight: 1.7,
              fontFamily: 'inherit',
            }}
          />
          {/* Glow line bas si focus */}
          {focused && (
            <div style={{
              height: 1, marginTop: 6,
              background: 'linear-gradient(to right, transparent, rgba(139,92,246,0.7), transparent)',
            }} />
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ── Styles globaux ── */
const PAGE_BG: React.CSSProperties = {
  background: 'linear-gradient(180deg,#0a0118 0%,#0d0520 55%,#0a0118 100%)',
  backgroundAttachment: 'fixed',
  minHeight: '100vh',
  position: 'relative',
  overflowX: 'hidden',
}

// Injecte la couleur de fond sur <html> pour l'overscroll
if (typeof document !== 'undefined') {
  document.documentElement.style.backgroundColor = '#0a0118'
  document.documentElement.style.overflowX = 'hidden'
}

/* ── Composant principal ── */
interface ClientBriefInvitePageProps {
  token: string
}

export function ClientBriefInvitePage({ token }: ClientBriefInvitePageProps) {
  const { data, loading, error, submitInvitation, alreadySubmitted } = useBriefInvitation(token)
  const [companyName, setCompanyName] = useState('')
  const [companyFocused, setCompanyFocused] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map(f => [f.key, '']))
  )
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (data?.company_name) setCompanyName(data.company_name)
  }, [data])

  const filledCount = FIELDS.filter(f => values[f.key]?.trim()).length
  const companyFilled = companyName.trim().length > 0

  const handleSubmit = useCallback(async () => {
    if (!companyFilled) return
    setSubmitting(true)
    const ok = await submitInvitation(companyName.trim(), values)
    setSubmitting(false)
    if (ok) setSubmitted(true)
  }, [companyName, companyFilled, values, submitInvitation])

  /* ── Header ── */
  const Header = () => (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      background: 'rgba(10,1,24,0.85)',
      borderBottom: '1px solid rgba(139,92,246,0.12)',
      height: 58, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 14px rgba(139,92,246,0.55)',
          overflow: 'hidden',
        }}>
          <img src={LOGO_URL} alt="" style={{ width: 28, height: 28, objectFit: 'cover' }} />
        </div>
        <span style={{
          fontSize: 13, fontWeight: 800, letterSpacing: '0.3px',
          background: 'linear-gradient(135deg,#c4b5fd,#e879f9)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Propul'SEO</span>
      </div>
      <div style={{
        fontSize: 10, fontWeight: 700, color: '#a78bfa',
        background: 'rgba(139,92,246,0.12)',
        border: '1px solid rgba(139,92,246,0.25)',
        padding: '3px 10px', borderRadius: 20, letterSpacing: '0.5px',
      }}>BRIEF</div>
    </div>
  )

  /* ── Footer ── */
  const Footer = () => (
    <div style={{
      padding: '14px 18px 22px', textAlign: 'center',
      fontSize: 10, color: 'rgba(139,92,246,0.35)',
      fontWeight: 600, letterSpacing: '0.3px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    }}>
      <span>🔒</span>
      <span>Lien unique sécurisé</span>
      <span style={{ opacity: 0.4 }}>·</span>
      <span>Propul'SEO</span>
    </div>
  )

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ ...PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Orb style={{ top: '-10%', right: '-10%', width: 300, height: 300, background: 'radial-gradient(circle,rgba(139,92,246,0.25) 0%,transparent 70%)' }} />
        <Orb style={{ bottom: '10%', left: '-10%', width: 250, height: 250, background: 'radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%)' }} />
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Loader2 style={{ width: 36, height: 36, color: '#a78bfa' }} />
        </motion.div>
      </div>
    )
  }

  /* ── Erreur ── */
  if (error) {
    return (
      <div style={PAGE_BG}>
        <Orb style={{ top: '-10%', right: '-10%', width: 300, height: 300, background: 'radial-gradient(circle,rgba(239,68,68,0.15) 0%,transparent 70%)' }} />
        <Header />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 58px)', gap: 14, padding: 28, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle style={{ width: 28, height: 28, color: '#f87171' }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>Lien invalide ou expiré</p>
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{error}</p>
        </div>
      </div>
    )
  }

  /* ── Déjà soumis / Succès ── */
  if (alreadySubmitted || submitted) {
    return (
      <div style={PAGE_BG}>
        <Orb style={{ top: '-5%', right: '-10%', width: 280, height: 280, background: 'radial-gradient(circle,rgba(34,197,94,0.2) 0%,transparent 70%)' }} />
        <Orb style={{ bottom: '15%', left: '-10%', width: 200, height: 200, background: 'radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)' }} />
        <Header />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ maxWidth: 480, margin: '0 auto', padding: '36px 18px' }}
        >
          {/* Icône succès */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
              style={{
                width: 64, height: 64, borderRadius: 20, margin: '0 auto 14px',
                background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, boxShadow: '0 12px 32px rgba(34,197,94,0.4), 0 0 0 8px rgba(34,197,94,0.1)',
              }}
            >✓</motion.div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
              {alreadySubmitted ? 'Brief déjà transmis !' : 'Brief transmis !'}
            </h2>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
              Votre projet a été créé dans notre CRM.<br />Notre équipe vous contactera très bientôt.
            </p>
          </div>

          {/* Récap */}
          {submitted && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>
                Vos réponses
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{
                  background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: 14, padding: '12px 16px',
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Entreprise / Projet</div>
                  <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>{companyName}</div>
                </div>
                {FIELDS.map(f => values[f.key]?.trim() ? (
                  <div key={f.key} style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 14, padding: '12px 16px',
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>{RECAP_LABELS[f.key]}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{values[f.key]}</div>
                  </div>
                ) : null)}
              </div>
            </motion.div>
          )}
        </motion.div>
        <Footer />
      </div>
    )
  }

  /* ── Formulaire principal ── */
  return (
    <div style={PAGE_BG}>
      {/* Orbes */}
      <Orb style={{ top: '-8%', right: '-15%', width: 340, height: 340, background: 'radial-gradient(circle,rgba(139,92,246,0.28) 0%,transparent 70%)' }} />
      <Orb style={{ top: '35%', left: '-15%', width: 260, height: 260, background: 'radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%)' }} />
      <Orb style={{ bottom: '10%', right: '-10%', width: 200, height: 200, background: 'radial-gradient(circle,rgba(236,72,153,0.12) 0%,transparent 70%)' }} />

      <Header />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ padding: '24px 18px 20px', position: 'relative', zIndex: 2 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#7c3aed', boxShadow: '0 0 8px #7c3aed' }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '2px' }}>Nouveau projet</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', lineHeight: 1.25, margin: '0 0 10px', letterSpacing: '-0.3px' }}>
          Parlez-nous de{' '}
          <span style={{ background: 'linear-gradient(135deg,#c4b5fd,#f0abfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            votre vision
          </span>
        </h1>
        <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.7, margin: 0 }}>
          Remplissez ce formulaire pour nous aider à bien comprendre votre besoin. Seul le nom et l'objectif sont obligatoires.
        </p>
      </motion.div>

      {/* Barre de progression */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{ padding: '0 18px 18px', position: 'relative', zIndex: 2 }}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          {FIELDS.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i < filledCount
                ? 'linear-gradient(to right,#7c3aed,#a855f7)'
                : 'rgba(139,92,246,0.12)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
        <div style={{ fontSize: 9, color: '#7c3aed', fontWeight: 700, marginTop: 5, letterSpacing: '0.5px' }}>
          {filledCount} / {FIELDS.length} champs remplis
        </div>
      </motion.div>

      {/* Champ entreprise */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{ padding: '0 16px 12px', position: 'relative', zIndex: 2 }}
      >
        <div style={{
          background: companyFocused
            ? 'linear-gradient(135deg,rgba(124,58,237,0.14),rgba(168,85,247,0.08))'
            : companyFilled
            ? 'rgba(34,197,94,0.05)'
            : 'rgba(124,58,237,0.06)',
          border: `1.5px solid ${
            companyFocused
              ? 'rgba(139,92,246,0.55)'
              : companyFilled
              ? 'rgba(34,197,94,0.3)'
              : 'rgba(139,92,246,0.25)'
          }`,
          borderRadius: 18, padding: '14px 16px',
          boxShadow: companyFocused
            ? '0 0 32px rgba(124,58,237,0.22), inset 0 1px 0 rgba(255,255,255,0.04)'
            : companyFilled
            ? '0 0 16px rgba(34,197,94,0.08)'
            : '0 0 20px rgba(124,58,237,0.1)',
          transition: 'all 0.25s ease',
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            {/* Icône */}
            <div style={{
              width: 26, height: 26, borderRadius: 8, flexShrink: 0, marginTop: 1,
              background: companyFilled
                ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                : 'linear-gradient(135deg,#7c3aed,#a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: companyFilled
                ? '0 3px 10px rgba(34,197,94,0.4)'
                : '0 3px 10px rgba(124,58,237,0.4)',
              transition: 'all 0.3s',
            }}>
              <Building2 style={{ width: 13, height: 13, color: '#fff' }} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 9, fontWeight: 700, marginBottom: 7,
                color: companyFilled ? '#86efac' : '#a78bfa',
                textTransform: 'uppercase', letterSpacing: '1.5px',
                transition: 'color 0.2s',
              }}>
                Nom de l'entreprise / projet <span style={{ color: '#f472b6' }}>*</span>
              </div>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                onFocus={() => setCompanyFocused(true)}
                onBlur={() => setCompanyFocused(false)}
                placeholder="Ex: Boulangerie Martin, SaaS RH, Refonte Site…"
                style={{
                  fontSize: 13, fontWeight: 600,
                  color: companyFilled ? '#e2e8f0' : '#475569',
                  width: '100%', outline: 'none',
                  background: 'transparent', border: 'none', lineHeight: 1.6,
                  fontFamily: 'inherit',
                }}
              />
              {/* Glow line */}
              <div style={{
                height: 1, marginTop: 8,
                background: companyFocused
                  ? 'linear-gradient(to right,transparent,rgba(139,92,246,0.8),transparent)'
                  : companyFilled
                  ? 'linear-gradient(to right,transparent,rgba(34,197,94,0.4),transparent)'
                  : 'linear-gradient(to right,transparent,rgba(139,92,246,0.2),transparent)',
                transition: 'background 0.3s',
              }} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Champs brief */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 2 }}>
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

      {/* Bouton envoyer */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ padding: '18px 16px 4px', position: 'relative', zIndex: 2 }}
      >
        <button
          onClick={handleSubmit}
          disabled={submitting || !companyFilled}
          style={{
            width: '100%',
            background: companyFilled
              ? 'linear-gradient(135deg,#7c3aed,#a855f7,#ec4899)'
              : 'rgba(124,58,237,0.2)',
            border: companyFilled ? 'none' : '1.5px solid rgba(139,92,246,0.25)',
            borderRadius: 16,
            padding: '15px 20px',
            fontSize: 13, fontWeight: 800,
            color: companyFilled ? '#fff' : '#4c4c7a',
            letterSpacing: '0.3px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: submitting || !companyFilled ? 'not-allowed' : 'pointer',
            boxShadow: companyFilled
              ? '0 8px 28px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'
              : 'none',
            transition: 'all 0.3s ease',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Shimmer */}
          {companyFilled && !submitting && (
            <div style={{
              position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)',
              transform: 'skewX(-15deg)',
              animation: 'shimmer 2.5s infinite',
            }} />
          )}
          <style>{`@keyframes shimmer { to { left: 200%; } }`}</style>

          <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            {submitting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
                <Loader2 style={{ width: 16, height: 16 }} />
              </motion.div>
            ) : (
              <Send style={{ width: 15, height: 15 }} />
            )}
            {submitting ? 'Envoi en cours…' : 'Transmettre le brief'}
          </span>
        </button>
      </motion.div>

      <Footer />
    </div>
  )
}
