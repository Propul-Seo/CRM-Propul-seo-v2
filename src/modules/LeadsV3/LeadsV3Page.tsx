import { Construction, Sparkles } from 'lucide-react'

/**
 * Placeholder du module Leads V3.
 * L'implémentation réelle (CRM Principal + CRM ERP fusionnés en 2 onglets,
 * 3 variantes UX comparables via toggle) arrive dans la phase 4 du chantier V3.
 */
export function LeadsV3Page() {
  return (
    <div className="flex items-center justify-center h-full px-6">
      <div className="max-w-md text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgba(139,92,246,0.12)] border border-[rgba(139,92,246,0.25)] mb-5">
          <Construction className="h-8 w-8 text-[#A78BFA]" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Leads V3</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Module en cours de construction. Il regroupera les pipelines{' '}
          <strong>Site web</strong> et <strong>ERP</strong> dans une expérience unifiée
          avec 3 variantes UX comparables.
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#8B5CF6]/15 to-[#EC4899]/15 border border-[rgba(139,92,246,0.3)]">
          <Sparkles className="h-3.5 w-3.5 text-[#A78BFA]" />
          <span className="text-xs font-semibold text-[#A78BFA]">Phase 4 du chantier V3</span>
        </div>
      </div>
    </div>
  )
}
