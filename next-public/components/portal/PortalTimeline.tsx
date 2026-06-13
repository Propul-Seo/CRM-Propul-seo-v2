'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Circle, Loader2, Briefcase } from 'lucide-react'
import { PortalCard } from './PortalCard'

type ChecklistStatus = 'done' | 'in_progress' | 'blocked' | 'todo'

interface Item {
  id: string
  title: string
  phase: string | null
  status: string
}

interface TimelineProps {
  items: Item[]
}

type PhaseStatus = 'done' | 'active' | 'todo'

function groupByPhase(items: Item[]): { title: string; items: Item[] }[] {
  const map = new Map<string, Item[]>()
  for (const it of items) {
    const key = it.phase ?? 'Étapes'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(it)
  }
  return Array.from(map.entries()).map(([title, items]) => ({ title, items }))
}

function phaseStatus(items: Item[]): PhaseStatus {
  if (items.every(i => i.status === 'done')) return 'done'
  if (items.some(i => i.status === 'done' || i.status === 'in_progress')) return 'active'
  return 'todo'
}

function StatusIcon({ status }: { status: string }) {
  switch (status as ChecklistStatus) {
    case 'done':
      return <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
    case 'in_progress':
      return <Loader2 size={16} style={{ color: '#7c3aed', flexShrink: 0 }} className="animate-spin" />
    case 'blocked':
      return <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
    default:
      return <Circle size={16} style={{ color: '#cbd5e1', flexShrink: 0 }} />
  }
}

function PhaseBadge({ status }: { status: PhaseStatus }) {
  const map: Record<PhaseStatus, { label: string; fg: string; bg: string }> = {
    done: { label: 'Terminée', fg: '#10b981', bg: 'rgba(16,185,129,0.10)' },
    active: { label: 'En cours', fg: '#7c3aed', bg: 'rgba(124,58,237,0.10)' },
    todo: { label: 'À venir', fg: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
  }
  const { label, fg, bg } = map[status]
  return (
    <span
      style={{
        color: fg,
        background: bg,
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </span>
  )
}

export function PortalTimeline({ items }: TimelineProps) {
  const phases = groupByPhase(items)

  return (
    <section>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
        <PortalCard style={{ padding: '24px 28px' }}>
          <h2
            style={{
              color: '#1a1a2e',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Briefcase size={14} style={{ color: '#7c3aed' }} />
            Étapes du projet
          </h2>

          {items.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: 13, fontStyle: 'italic' }}>
              Les étapes seront affichées dès que votre projet sera cadré.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {phases.map((phase, pi) => (
                <div key={phase.title}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <h3 style={{ color: '#1a1a2e', fontSize: 14, fontWeight: 600 }}>{phase.title}</h3>
                    <PhaseBadge status={phaseStatus(phase.items)} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 2 }}>
                    {phase.items.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + pi * 0.05 + i * 0.03 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                      >
                        <StatusIcon status={item.status} />
                        <span
                          style={{
                            fontSize: 13,
                            color: item.status === 'done' ? '#9ca3af' : '#1a1a2e',
                            textDecoration: item.status === 'done' ? 'line-through' : 'none',
                          }}
                        >
                          {item.title}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PortalCard>
      </motion.div>
    </section>
  )
}
