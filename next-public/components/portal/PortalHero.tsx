'use client'

import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { PortalCard } from './PortalCard'
import { formatDate } from '@/lib/utils'

interface HeroProps {
  projectName: string
  clientName: string | null
  prestaType: string | null
  progress: number
  nextActionLabel: string | null
  nextActionDue: string | null
}

const PRESTA_LABELS: Record<string, string> = {
  site_internet: 'Site internet',
  erp: 'ERP sur mesure',
  communication: 'Communication',
}

function daysUntil(iso: string): string {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
  if (diff < 0) return `en retard de ${Math.abs(diff)} j`
  if (diff === 0) return "aujourd'hui"
  if (diff === 1) return 'demain'
  if (diff < 14) return `dans ${diff} jours`
  return formatDate(iso)
}

export function PortalHero({
  projectName,
  clientName,
  prestaType,
  progress,
  nextActionLabel,
  nextActionDue,
}: HeroProps) {
  const safeProgress = Math.max(0, Math.min(100, progress))
  const prestaLabel = prestaType ? PRESTA_LABELS[prestaType] ?? prestaType : null

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center', marginBottom: 28 }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#1a1a2e',
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          {projectName}
        </h1>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#6b7280',
            fontSize: 14,
          }}
        >
          {clientName && <span>{clientName}</span>}
          {prestaLabel && (
            <>
              {clientName && <span style={{ opacity: 0.4 }}>·</span>}
              <span
                style={{
                  color: '#7c3aed',
                  background: 'rgba(124,58,237,0.08)',
                  padding: '2px 10px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {prestaLabel}
              </span>
            </>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <PortalCard style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: '#6b7280', fontSize: 13, fontWeight: 600, letterSpacing: '0.02em' }}>
              Avancement global
            </span>
            <span style={{ color: '#1a1a2e', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
              {safeProgress}%
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: 'rgba(124,58,237,0.08)',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${safeProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
                borderRadius: 999,
                boxShadow: '0 0 12px rgba(124,58,237,0.3)',
              }}
            />
          </div>

          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: '1px solid rgba(124,58,237,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: nextActionLabel ? '#1a1a2e' : '#9ca3af',
              fontSize: 13,
            }}
          >
            <Clock size={14} style={{ color: '#7c3aed', flexShrink: 0 }} />
            {nextActionLabel ? (
              <>
                <span style={{ fontWeight: 500 }}>Prochaine étape :</span>
                <span>{nextActionLabel}</span>
                {nextActionDue && (
                  <span style={{ color: '#6b7280', fontSize: 12 }}>· {daysUntil(nextActionDue)}</span>
                )}
              </>
            ) : (
              <span style={{ fontStyle: 'italic' }}>
                Prochaine étape à définir — votre chef de projet vous tiendra informé.
              </span>
            )}
          </div>
        </PortalCard>
      </motion.div>
    </section>
  )
}
