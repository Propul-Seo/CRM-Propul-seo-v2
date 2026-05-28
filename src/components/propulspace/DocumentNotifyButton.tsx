import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { DocBucket } from '@/modules/ProjectDetailsV3Preview/tabs/documents/constants';

interface DocumentNotifyButtonProps {
  document: {
    id: string;
    name: string;
    document_type: string | null;
    file_path: string | null;
    bucket: DocBucket;
    project: {
      name: string;
      portal_client_email: string | null;
      client_first_name?: string | null;
    };
  };
}

type SendResponse = {
  ok: boolean;
  sent: boolean;
  reason?: string;
  error?: string;
};

export function DocumentNotifyButton({ document: doc }: DocumentNotifyButtonProps) {
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!doc.project.portal_client_email) {
      toast.error('Email client manquant sur le projet');
      return;
    }
    setSending(true);

    // Générer un lien signé (60 s) pour le téléchargement
    let downloadUrl = '';
    if (doc.file_path && doc.bucket !== 'external') {
      const { data: signed, error: signError } = await supabase.storage
        .from(doc.bucket)
        .createSignedUrl(doc.file_path, 60);
      if (signError || !signed?.signedUrl) {
        setSending(false);
        toast.error('Impossible de générer le lien de téléchargement', {
          description: signError?.message,
        });
        return;
      }
      downloadUrl = signed.signedUrl;
    } else if (doc.file_path && doc.bucket === 'external') {
      downloadUrl = doc.file_path;
    }

    const { data, error } = await supabase.functions.invoke('send-portal-email', {
      body: {
        template_key: 'new-deliverable',
        to: {
          email: doc.project.portal_client_email,
          name: doc.project.client_first_name,
        },
        params: {
          first_name: doc.project.client_first_name ?? '',
          doc_title: doc.name,
          doc_type: doc.document_type ?? '',
          project_name: doc.project.name,
          download_url: downloadUrl,
        },
        dedupe_key: doc.id,
      },
    });

    setSending(false);
    const res = data as SendResponse | null;
    if (error || !res?.ok) {
      toast.error('Envoi échoué', { description: error?.message ?? res?.error });
    } else if (!res.sent) {
      toast.info('Déjà notifié', { description: 'Le client a déjà reçu cette notification.' });
    } else {
      toast.success('Client notifié');
    }
  };

  return (
    <Button variant="secondary" size="sm" disabled={sending} onClick={send}>
      <Bell className="mr-2 h-4 w-4" />
      {sending ? 'Envoi…' : 'Notifier le client'}
    </Button>
  );
}
