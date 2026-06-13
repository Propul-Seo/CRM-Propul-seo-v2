'use client'

import { motion } from 'framer-motion'
import { Euro, Receipt } from 'lucide-react'
import { PortalCard } from './PortalCard'
import { formatDate } from '@/lib/utils'

export interface PortalInvoice {
  id: string
  label: string
  amount: number
  status: string
  date: string | null
  due_date: string | null
}

const STATUS_CONFIG: Record<string, { label: string; fg: string; bg: string }> = {
  sent: { label: 'Envoyée', fg: '#3b82f6', bg: 'rgba(59,130,246,0.10)' },
  paid: { label: 'Payée', fg: '#10b981', bg: 'rgba(16,185,129,0.10)' },
  overdue: { label: 'En retard', fg: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
}

export function PortalInvoices({ invoices }: { invoices: PortalInvoice[] }) {
  if (invoices.length === 0) return null

  return (
    <section>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
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
            <Receipt size={14} style={{ color: '#7c3aed' }} />
            Facturation
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {invoices.map(inv => {
              const status = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.sent
              return (
                <div
                  key={inv.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'rgba(124,58,237,0.04)',
                    border: '1px solid rgba(124,58,237,0.08)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ color: '#1a1a2e', fontSize: 13, fontWeight: 500 }}>{inv.label}</p>
                    {inv.date && (
                      <p style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>{formatDate(inv.date)}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ color: '#1a1a2e', fontSize: 14, fontWeight: 700 }}>
                      {inv.amount.toLocaleString('fr-FR')} €
                    </span>
                    <span
                      style={{
                        color: status.fg,
                        background: status.bg,
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </PortalCard>
      </motion.div>
    </section>
  )
}
