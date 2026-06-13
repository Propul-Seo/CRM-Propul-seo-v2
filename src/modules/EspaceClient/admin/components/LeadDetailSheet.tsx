import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath, useAdminPortalScope } from '@/modules/EspaceClient/admin/AdminBasePathContext';
import { cn } from '@/lib/utils';
import {
  Phone, Mail, Building2, ExternalLink, CheckCircle2, XCircle, ArrowRight,
  CalendarDays, Layers, Megaphone,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/modules/EspaceClient/shared/components';
import { PROJECT_TYPES } from '@/modules/EspaceClient/qualification/constants';
import { RecapAccordion } from '@/modules/EspaceClient/qualification/components/RecapAccordion';
import type {
  QualificationLeadRow, LeadAdminPatch,
} from '@/modules/EspaceClient/admin/hooks/useQualificationLeads';
import { DisqualifyLeadDialog } from './DisqualifyLeadDialog';

interface LeadDetailSheetProps {
  lead: QualificationLeadRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (id: string, patch: LeadAdminPatch) => Promise<{ error: string | null }>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Libellé FR du type de projet (migration 242 : site | site_erp | erp).
function leadProjectTypeLabel(lead: QualificationLeadRow): string | null {
  if (lead.project_type === null) return null;
  return PROJECT_TYPES.find(t => t.value === lead.project_type)?.label ?? lead.project_type;
}

export function LeadDetailSheet({ lead, open, onOpenChange, onAction }: LeadDetailSheetProps) {
  const [disqOpen, setDisqOpen] = useState(false);
  const navigate = useNavigate();
  const { basePath } = useAdminBasePath();
  const portalScope = useAdminPortalScope();
  if (!lead) return null;

  async function markAsContacted() {
    if (!lead) return;
    await onAction(lead.id, {
      status: 'contacted',
      contacted_at: new Date().toISOString(),
    });
  }

  async function markAsQualified() {
    if (!lead) return;
    await onAction(lead.id, { status: 'qualified' });
  }

  async function confirmDisqualify(reason: string) {
    if (!lead) return;
    const prevNotes = lead.notes ? `${lead.notes}\n\n` : '';
    await onAction(lead.id, {
      status: 'unqualified',
      notes: `${prevNotes}[Disqualifié] ${reason}`,
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={cn(portalScope, 'w-full overflow-y-auto sm:max-w-2xl')}>
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle className="flex-1">{lead.full_name}</SheetTitle>
            <StatusBadge status={lead.status} />
          </div>
          {lead.company_name && (
            <SheetDescription className="inline-flex items-center gap-1 text-[var(--ps-fg-secondary)]">
              <Building2 className="h-3.5 w-3.5" />
              {lead.company_name}
            </SheetDescription>
          )}
        </SheetHeader>

        {/* Méta lead en un coup d'œil : date de réception, type de projet, source. */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-[var(--ps-border-soft)] pb-3 text-[12px] text-[var(--ps-fg-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-[var(--ps-fg-muted)]" />
            Reçu le {formatDate(lead.submitted_at ?? lead.created_at)}
          </span>
          {leadProjectTypeLabel(lead) && (
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[var(--ps-fg-muted)]" />
              {leadProjectTypeLabel(lead)}
            </span>
          )}
          {lead.source && (
            <span className="inline-flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5 text-[var(--ps-fg-muted)]" />
              Source : {lead.source}
            </span>
          )}
        </div>

        <div className="mt-5 space-y-5">
          <section className="grid gap-2 text-[13px]">
            <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-2 text-[var(--ps-primary-text)] hover:underline">
              <Mail className="h-4 w-4" /> {lead.email}
            </a>
            <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-2 text-[var(--ps-primary-text)] hover:underline">
              <Phone className="h-4 w-4" /> {lead.phone}
            </a>
            {lead.existing_site_url && (
              <a href={lead.existing_site_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[var(--ps-primary-text)] hover:underline">
                <ExternalLink className="h-4 w-4" /> {lead.existing_site_url}
              </a>
            )}
          </section>

          <section>
            <p className="ps-eyebrow ps-eyebrow-muted mb-2">Récapitulatif des réponses</p>
            <RecapAccordion draft={lead} />
          </section>

          {lead.notes && (
            <section className="rounded-xl border border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] p-3">
              <p className="ps-eyebrow ps-eyebrow-muted mb-1">Notes internes</p>
              <p className="whitespace-pre-line text-[13px] text-[var(--ps-fg-secondary)]">{lead.notes}</p>
            </section>
          )}

          <section className="flex flex-wrap gap-2 border-t border-[var(--ps-border-soft)] pt-4">
            {lead.converted_to_project_id && (
              <button
                type="button"
                onClick={() => navigate(`${basePath}/clients/${lead.converted_to_project_id}`)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                Ouvrir le portail client
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {lead.status === 'submitted' && (
              <Button onClick={markAsContacted}>
                <ArrowRight className="mr-1.5 h-4 w-4" />
                Marquer comme contacté
              </Button>
            )}
            {(lead.status === 'submitted' || lead.status === 'contacted') && (
              // CTA de progression principal : plein (succès), pas un outline discret.
              <Button
                onClick={markAsQualified}
                className="bg-[var(--ps-success)] text-white hover:bg-[var(--ps-success)] hover:brightness-110"
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Qualifier
              </Button>
            )}
            {lead.status !== 'unqualified' && lead.status !== 'converted' && (
              <Button
                onClick={() => setDisqOpen(true)}
                variant="outline"
                className="border-[var(--ps-danger-subtle)] text-[var(--ps-danger-text)] hover:bg-[var(--ps-danger-subtle)] hover:text-[var(--ps-danger-text)]"
              >
                <XCircle className="mr-1.5 h-4 w-4" />
                Disqualifier
              </Button>
            )}
          </section>
        </div>

        <DisqualifyLeadDialog
          open={disqOpen}
          onOpenChange={setDisqOpen}
          leadName={lead.full_name}
          onConfirm={confirmDisqualify}
        />
      </SheetContent>
    </Sheet>
  );
}
