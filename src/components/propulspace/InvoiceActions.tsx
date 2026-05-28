import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface InvoiceActionsProps {
  invoice: {
    id: string;
    invoice_number: string;
    amount_total: number;
    due_date: string | null;
    project: {
      portal_client_email: string | null;
      client_first_name: string | null;
    };
    payment_url?: string | null;
  };
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const [sending, setSending] = useState<'sent' | 'reminder' | null>(null);

  const sendEmail = async (kind: 'invoice-sent' | 'invoice-reminder') => {
    if (!invoice.project.portal_client_email) {
      toast.error('Email client manquant sur le projet');
      return;
    }
    setSending(kind === 'invoice-sent' ? 'sent' : 'reminder');

    const todayIso = new Date().toISOString().slice(0, 10);
    const dedupeKey = kind === 'invoice-sent'
      ? `${invoice.id}-sent`
      : `${invoice.id}-reminder-${todayIso}`;

    const params: Record<string, string> = {
      first_name: invoice.project.client_first_name ?? '',
      invoice_number: invoice.invoice_number,
      amount: Number(invoice.amount_total).toFixed(2),
      payment_url: invoice.payment_url ?? '',
    };

    if (kind === 'invoice-sent') {
      params.due_date = invoice.due_date
        ? new Date(invoice.due_date).toLocaleDateString('fr-FR')
        : '';
    } else {
      const due = invoice.due_date ? new Date(invoice.due_date).getTime() : Date.now();
      const daysOverdue = Math.max(0, Math.floor((Date.now() - due) / (1000 * 60 * 60 * 24)));
      params.days_overdue = String(daysOverdue);
      params.contact_url = `mailto:contact@propulseo-site.com?subject=Question%20facture%20${invoice.invoice_number}`;
    }

    const { data, error } = await supabase.functions.invoke('send-portal-email', {
      body: {
        template_key: kind,
        to: { email: invoice.project.portal_client_email, name: invoice.project.client_first_name },
        params,
        dedupe_key: dedupeKey,
      },
    });

    setSending(null);

    type SendResponse = { ok?: boolean; sent?: boolean; error?: string; reason?: string };
    const res = data as SendResponse | null;

    if (error || !res?.ok) {
      toast.error('Envoi échoué', { description: error?.message ?? res?.error });
    } else if (!res.sent) {
      toast.info('Email déjà envoyé', { description: res.reason ?? 'doublon détecté' });
    } else {
      toast.success('Email envoyé', { description: `À ${invoice.project.portal_client_email}` });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="default"
        size="sm"
        disabled={sending !== null}
        onClick={() => sendEmail('invoice-sent')}
      >
        <Mail className="mr-2 h-4 w-4" />
        {sending === 'sent' ? 'Envoi…' : 'Envoyer la facture'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={sending !== null}
        onClick={() => sendEmail('invoice-reminder')}
      >
        <RotateCw className="mr-2 h-4 w-4" />
        {sending === 'reminder' ? 'Envoi…' : 'Relancer'}
      </Button>
    </div>
  );
}
