import { ArrowLeft, Pencil, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CRMERPLead } from '../types';
import { CRMERP_STATUS_LABELS, CRMERP_STATUS_COLORS } from '../types';

interface Props {
  lead: CRMERPLead;
  onBack: () => void;
  onEdit: () => void;
}

export function LeadHeader({ lead, onBack, onEdit }: Props) {
  const colors = CRMERP_STATUS_COLORS[lead.status];

  return (
    <div className="bg-gradient-to-r from-primary via-neon-light to-primary text-white px-6 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{lead.contact_name || lead.company_name || 'Lead sans nom'}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                {lead.company_name && lead.contact_name && (
                  <p className="text-sm text-white/70">{lead.company_name}</p>
                )}
                <Badge className={`${colors.badge} text-xs`}>{CRMERP_STATUS_LABELS[lead.status]}</Badge>
              </div>
            </div>
          </div>
        </div>
        <Button onClick={onEdit} className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg shadow-black/10 rounded-xl px-5">
          <Pencil className="h-4 w-4 mr-1.5" />
          Modifier
        </Button>
      </div>
    </div>
  );
}
