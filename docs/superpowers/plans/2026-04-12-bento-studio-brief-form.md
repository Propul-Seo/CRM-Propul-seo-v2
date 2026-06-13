# Bento Studio — Intégration Formulaire Brief Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Intégrer le thème visuel "Bento Studio" (indigo/violet) dans le formulaire brief client Next.js et nettoyer les fichiers obsolètes.

**Architecture:** Réécriture de `BriefInviteFormV5.tsx` avec le thème validé (grille 3 colonnes, focus indigo, fonts Outfit + IBM Plex Mono), mise à jour de `page.tsx` pour utiliser V5 + page "déjà soumis" en Bento, puis nettoyage des fichiers temporaires et anciens.

**Tech Stack:** Next.js App Router, React 18, Framer Motion, Supabase Server Client, @react-pdf/renderer (PDF non modifié)

---

### Task 1 : Réécriture de `BriefInviteFormV5.tsx` — thème Bento Studio

**Files:**
- Modify: `next-public/app/brief-invite/[code]/BriefInviteFormV5.tsx`

- [ ] **Step 1 : Remplacer le contenu complet du fichier**

```tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { submitBriefInvite } from './actions'

const BENTO_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');
  body { font-family: 'Outfit', sans-serif; }
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
    placeholder: 'Décrivez l\'objectif principal de votre projet avec précision...',
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
              background: focused ? 'rgba(255,255,255,0.2)' : '#eef2ff',
              color: focused ? '#fff' : '#6366f1',
              padding: '3px 8px',
              borderRadius: 4,
              fontWeight: 700,
              textTransform: 'uppercase' as const,
              fontFamily: "'IBM Plex Mono', monospace",
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
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, fontFamily: "'Outfit', sans-serif" }}>
        <style>{BENTO_FONTS}</style>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ maxWidth: 480, textAlign: 'center', background: '#fff', borderRadius: 32, padding: 64, border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(99,102,241,0.12)' }}
        >
          <div style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
          }}>
            <CheckCircle2 size={36} color="#fff" />
          </div>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: 12 }}>
            Brief reçu
          </p>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 16 }}>
            MERCI !
          </h2>
          <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: 16 }}>
            Votre brief est entre les mains de nos experts.<br />
            Nous vous recontactons sous <strong>24h</strong>.
          </p>
          <p style={{ marginTop: 40, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.4em' }}>
            Propulseo Studio · Excellence Digitale
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', padding: '48px 24px', fontFamily: "'Outfit', sans-serif" }}>
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
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 28px;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
        }
        .bento-card:hover:not(.bento-focused) {
          transform: translateY(-3px);
          box-shadow: 0 20px 25px -5px rgba(99,102,241,0.1);
          border-color: #6366f1;
        }
        .bento-focused {
          background: #6366f1 !important;
          border-color: #6366f1 !important;
          box-shadow: 0 20px 25px -5px rgba(99,102,241,0.3) !important;
        }
        .bento-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }
        .bento-focused .bento-label { color: rgba(255,255,255,0.6); }
        .bento-textarea {
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          color: #0f172a;
          font-size: 17px;
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
          resize: none;
          flex: 1;
          line-height: 1.6;
          margin-top: 8px;
        }
        .bento-focused .bento-textarea { color: #fff; }
        .bento-textarea::placeholder { color: #cbd5e1; }
        .bento-focused .bento-textarea::placeholder { color: rgba(255,255,255,0.35); }
        @media (max-width: 768px) {
          .bento-grid { grid-template-columns: 1fr; }
          .bento-col-full, .bento-col-2, .bento-col-1 { grid-column: span 1 / span 1; }
        }
      `}</style>

      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, borderBottom: '2px solid #e2e8f0', paddingBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 800 }}>P</div>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Briefing System v3.0</span>
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>
              PARLONS DE VOTRE{' '}
              <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                PROJET.
              </span>
            </h1>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
              Complétion : <span style={{ color: '#6366f1' }}>{progress}%</span>
            </div>
            <div style={{ width: 200, height: 10, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
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
            className={`bento-card bento-col-full${companyFocused ? ' bento-focused' : ''}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}
          >
            <div style={{
              width: 56, height: 56, flexShrink: 0,
              background: companyFocused ? 'rgba(255,255,255,0.2)' : '#eef2ff',
              borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={companyFocused ? '#fff' : '#6366f1'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                  fontSize: 22, fontWeight: 700, color: companyFocused ? '#fff' : '#0f172a',
                  fontFamily: "'Outfit', sans-serif", marginTop: 6,
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
            fontFamily: "'Outfit', sans-serif",
          }}
          onMouseOver={e => { if (!submitting) e.currentTarget.style.transform = 'scale(1.015)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(99,102,241,0.4)' }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          {submitting ? 'TRAITEMENT EN COURS...' : 'TRANSMETTRE LE BRIEF'}
          {!submitting && <ArrowRight size={24} />}
        </button>

        {error && (
          <p style={{ color: '#ef4444', marginTop: 16, fontWeight: 600, fontSize: 14, textAlign: 'center' }}>{error}</p>
        )}

        <footer style={{ marginTop: 64, textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.4em' }}>
          Propulseo Studio · Excellence Digitale
        </footer>
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd next-public && npx tsc --noEmit
```

Expected : aucune erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add next-public/app/brief-invite/\[code\]/BriefInviteFormV5.tsx
git commit -m "feat(brief): refonte visuelle Bento Studio — formulaire indigo/violet 3 colonnes"
```

---

### Task 2 : Mise à jour de `page.tsx` — import V5 + page "déjà soumis" Bento

**Files:**
- Modify: `next-public/app/brief-invite/[code]/page.tsx`

- [ ] **Step 1 : Remplacer le contenu complet du fichier**

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase-server'
import { BriefInviteFormV5 } from './BriefInviteFormV5'

type Props = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const supabase = createSupabaseServer()
  const { data } = await supabase
    .from('brief_invitations')
    .select('company_name')
    .eq('short_code', code)
    .single()
  return {
    title: `Brief projet — ${data?.company_name ?? 'Propulseo'}`,
    description: 'Complétez votre brief projet en quelques minutes.',
    robots: 'noindex, nofollow',
  }
}

export default async function BriefInvitePage({ params }: Props) {
  const { code } = await params
  const supabase = createSupabaseServer()

  const { data: invitation } = await supabase
    .from('brief_invitations')
    .select('id, short_code, company_name, status')
    .eq('short_code', code)
    .single()

  if (!invitation) notFound()

  if (invitation.status === 'submitted') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, fontFamily: 'Outfit, sans-serif' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');`}</style>
        <div style={{
          maxWidth: 480, width: '100%', textAlign: 'center',
          background: '#fff', borderRadius: 32, padding: 64,
          border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(99,102,241,0.10)',
        }}>
          <div style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: 12 }}>
            Brief reçu
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 16px' }}>
            DÉJÀ TRANSMIS.
          </h1>
          <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: 16, margin: 0 }}>
            Votre brief a bien été reçu par l&apos;équipe Propulseo.<br />
            Nous reviendrons vers vous très prochainement.
          </p>
          <p style={{ marginTop: 40, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.4em' }}>
            Propulseo Studio · Excellence Digitale
          </p>
        </div>
      </div>
    )
  }

  return (
    <BriefInviteFormV5
      code={code}
      companyName={invitation.company_name ?? ''}
    />
  )
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd next-public && npx tsc --noEmit
```

Expected : aucune erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add next-public/app/brief-invite/\[code\]/page.tsx
git commit -m "feat(brief): pointer page.tsx vers BriefInviteFormV5 + page soumis en Bento"
```

---

### Task 3 : Générer les fichiers HTML de preview

**Files:**
- Create: `preview_form_bento_final.html`
- Create: `preview_submitted_bento.html`

- [ ] **Step 1 : Créer la preview du formulaire**

Fichier `preview_form_bento_final.html` à la racine — copie fidèle du rendu de `BriefInviteFormV5` avec toutes les cartes, la grille 3 colonnes, les couleurs Bento. Utilise les CDN Tailwind + Google Fonts.

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview — Formulaire Brief Bento Studio</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Outfit', sans-serif; background: #f8fafc; color: #0f172a; padding: 48px 24px; }
    .container { max-width: 960px; margin: 0 auto; }
    /* Header */
    header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 48px; border-bottom: 2px solid #e2e8f0; padding-bottom: 40px; }
    .logo-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .logo-circle { width: 44px; height: 44px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: 800; }
    .briefing-tag { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; color: #6366f1; text-transform: uppercase; letter-spacing: 0.3em; }
    h1 { font-size: clamp(32px, 5vw, 48px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }
    .gradient-text { background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .progress-label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px; text-align: right; }
    .progress-track { width: 200px; height: 10px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
    .progress-fill { width: 33%; height: 100%; background: linear-gradient(90deg, #6366f1, #a855f7); border-radius: 99px; }
    /* Entreprise card */
    .company-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 28px; display: flex; align-items: center; gap: 24px; margin-bottom: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04); }
    .company-icon { width: 56px; height: 56px; flex-shrink: 0; background: #eef2ff; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
    .company-label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 6px; }
    .company-value { font-size: 22px; font-weight: 700; color: #0f172a; }
    /* Grid */
    .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .col-full { grid-column: span 3 / span 3; }
    .col-2 { grid-column: span 2 / span 2; }
    .col-1 { grid-column: span 1 / span 1; }
    .bento-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04); display: flex; flex-direction: column; min-height: 160px; }
    .bento-card.focused { background: #6366f1; border-color: #6366f1; box-shadow: 0 20px 25px -5px rgba(99,102,241,0.3); }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .card-label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; }
    .focused .card-label { color: rgba(255,255,255,0.6); }
    .badge { font-size: 10px; background: #eef2ff; color: #6366f1; padding: 3px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase; font-family: 'IBM Plex Mono', monospace; }
    .focused .badge { background: rgba(255,255,255,0.2); color: #fff; }
    .card-text { font-size: 16px; color: #94a3b8; line-height: 1.6; }
    .focused .card-text { color: rgba(255,255,255,0.4); }
    /* Submit */
    .btn-submit { display: flex; align-items: center; justify-content: center; gap: 16px; width: 100%; margin-top: 40px; padding: 28px 40px; background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; border: none; border-radius: 28px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; cursor: pointer; font-family: 'Outfit', sans-serif; }
    footer { margin-top: 64px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.4em; }
    @media (max-width: 768px) { .bento-grid { grid-template-columns: 1fr; } .col-full, .col-2, .col-1 { grid-column: span 1; } header { flex-direction: column; align-items: flex-start; gap: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <div class="logo-row">
          <div class="logo-circle">P</div>
          <span class="briefing-tag">Briefing System v3.0</span>
        </div>
        <h1>PARLONS DE VOTRE <span class="gradient-text">PROJET.</span></h1>
      </div>
      <div>
        <div class="progress-label">Complétion : <span style="color:#6366f1">33%</span></div>
        <div class="progress-track"><div class="progress-fill"></div></div>
      </div>
    </header>

    <div class="company-card">
      <div class="company-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/></svg>
      </div>
      <div>
        <div class="company-label">Votre Maison / Entreprise</div>
        <div class="company-value">Acme Corp</div>
      </div>
    </div>

    <div class="bento-grid">
      <div class="bento-card focused col-2">
        <div class="card-header">
          <span class="card-label">01 — Vision & Objectif</span>
          <span class="badge">Requis</span>
        </div>
        <div class="card-text">Refonte complète du site avec focus sur la conversion et l'expérience utilisateur premium...</div>
      </div>
      <div class="bento-card col-1">
        <div class="card-header"><span class="card-label">02 — Audience Cible</span></div>
        <div class="card-text">Placeholder — À qui nous adressons-nous ?</div>
      </div>
      <div class="bento-card col-2">
        <div class="card-header"><span class="card-label">03 — Structure & Fonctionnalités</span></div>
        <div class="card-text">Placeholder — Pages et fonctions clés...</div>
      </div>
      <div class="bento-card col-1">
        <div class="card-header"><span class="card-label">04 — Environnement Techno</span></div>
        <div class="card-text">Placeholder — Stack technique...</div>
      </div>
      <div class="bento-card col-1">
        <div class="card-header"><span class="card-label">05 — Références Visuelles</span></div>
        <div class="card-text">Placeholder — URLs, refs...</div>
      </div>
      <div class="bento-card col-2">
        <div class="card-header"><span class="card-label">06 — Notes Libres</span></div>
        <div class="card-text">Placeholder — Informations supplémentaires...</div>
      </div>
    </div>

    <button class="btn-submit">
      TRANSMETTRE LE BRIEF
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
    </button>

    <footer>Propulseo Studio · Excellence Digitale</footer>
  </div>
</body>
</html>
```

- [ ] **Step 2 : Créer la preview de la page "déjà soumis"**

Fichier `preview_submitted_bento.html` à la racine :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview — Brief Déjà Soumis</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Outfit', sans-serif; background: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px; }
    .card { max-width: 480px; width: 100%; text-align: center; background: #fff; border-radius: 32px; padding: 64px; border: 1px solid #e2e8f0; box-shadow: 0 20px 60px rgba(99,102,241,0.10); }
    .icon { width: 72px; height: 72px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 28px; }
    .tag { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; color: #6366f1; text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 12px; }
    h1 { font-size: 36px; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; margin-bottom: 16px; }
    p { color: #64748b; line-height: 1.7; font-size: 16px; }
    .footer { margin-top: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.4em; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
    </div>
    <div class="tag">Brief reçu</div>
    <h1>DÉJÀ TRANSMIS.</h1>
    <p>Votre brief a bien été reçu par l'équipe Propulseo.<br>Nous reviendrons vers vous très prochainement.</p>
    <div class="footer">Propulseo Studio · Excellence Digitale</div>
  </div>
</body>
</html>
```

- [ ] **Step 3 : Ouvrir les deux previews dans le navigateur**

```bash
open preview_form_bento_final.html
open preview_submitted_bento.html
```

- [ ] **Step 4 : Commit**

```bash
git add preview_form_bento_final.html preview_submitted_bento.html
git commit -m "chore(preview): fichiers HTML de validation design Bento Studio"
```

---

### Task 4 : Nettoyage des fichiers obsolètes

**Files:**
- Delete: `preview_bento.html`
- Delete: `preview_glass.html`
- Delete: `preview_narrative.html`
- Delete: `preview_pdf_render.html`
- Delete: `next-public/app/brief-invite/[code]/BriefInviteFormV1.tsx`
- Delete: `next-public/app/brief-invite/[code]/BriefInviteFormV2.tsx`
- Delete: `next-public/app/brief-invite/[code]/BriefInviteFormV3.tsx`
- Delete: `next-public/app/brief-invite/[code]/BriefInviteFormV4.tsx`
- Delete: `next-public/app/brief-invite/[code]/BriefInviteFormV6.tsx`
- Delete: `next-public/app/brief-invite/[code]/BriefInviteFormV7.tsx`

- [ ] **Step 1 : Supprimer les fichiers HTML de preview d'origine**

```bash
rm preview_bento.html preview_glass.html preview_narrative.html preview_pdf_render.html
```

- [ ] **Step 2 : Supprimer les versions de formulaire obsolètes**

```bash
rm "next-public/app/brief-invite/[code]/BriefInviteFormV1.tsx"
rm "next-public/app/brief-invite/[code]/BriefInviteFormV2.tsx"
rm "next-public/app/brief-invite/[code]/BriefInviteFormV3.tsx"
rm "next-public/app/brief-invite/[code]/BriefInviteFormV4.tsx"
rm "next-public/app/brief-invite/[code]/BriefInviteFormV6.tsx"
rm "next-public/app/brief-invite/[code]/BriefInviteFormV7.tsx"
```

- [ ] **Step 3 : Vérifier qu'aucun fichier restant n'importe les versions supprimées**

```bash
grep -r "BriefInviteFormV[1-4|6-7]" next-public/
```

Expected : aucun résultat.

- [ ] **Step 4 : Commit final**

```bash
git add -A
git commit -m "chore(cleanup): supprimer fichiers preview HTML et versions formulaire obsolètes V1-V4, V6, V7"
```

---

### Task 5 : Push & validation déploiement Vercel

- [ ] **Step 1 : Push sur main**

```bash
git push origin main
```

- [ ] **Step 2 : Vérifier le déploiement Vercel**

Attendre ~2 minutes puis ouvrir l'URL de déploiement brief-propulseo.vercel.app et tester :
- Ouvrir un lien brief valide → formulaire Bento affiché
- Remplir l'objectif → carte passe en indigo au focus
- Soumettre → écran de confirmation Bento
- Ouvrir un lien déjà soumis → page "DÉJÀ TRANSMIS." en Bento
