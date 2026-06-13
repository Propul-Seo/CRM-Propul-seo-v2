import { useState } from 'react';
import { MessageCircle, Send, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { portalSupabase } from '@/lib/supabase';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import { AGENCY_NAME, PORTAL_DIALOG_CLASS } from '@/modules/EspaceClient/shared/constants';

interface PortalContactFabProps {
  projectName?: string;
  /** WhatsApp du membre assigné (résolu côté PortalShell). Lien masqué si absent. */
  whatsappNumber?: string | null;
}

// Bulle de contact + petit modal de message. À l'envoi, un email part vers
// l'équipe (edge `portal-contact-message`) avec le message, le contexte client
// et un lien vers le cockpit admin (reply-to = email du client pour répondre).
export function PortalContactFab({ projectName, whatsappNumber }: PortalContactFabProps) {
  const { project, previewMode } = usePortal();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wamePrefill = encodeURIComponent(
    `Bonjour ${AGENCY_NAME}, j'ai une question concernant ${projectName ?? 'mon projet'}.`,
  );
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${wamePrefill}` : null;

  function reset() {
    setMessage(''); setSent(false); setError(null); setSending(false);
  }

  async function handleSend() {
    const text = message.trim();
    if (!text) { setError("Écrivez votre message avant de l'envoyer."); return; }
    if (previewMode) { setError("Aperçu admin — l'envoi est désactivé."); return; }
    setSending(true); setError(null);
    const { data, error: err } = await portalSupabase.functions.invoke('portal-contact-message', {
      body: { project_id: project.id, message: text },
    });
    setSending(false);
    if (err || (data && (data as { ok?: boolean }).ok === false)) {
      setError("Votre message n'a pas pu être envoyé. Réessayez dans un instant.");
      return;
    }
    setSent(true); setMessage('');
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Contacter ${AGENCY_NAME}`}
        aria-haspopup="dialog"
        className="ps-fab ps-fab-button fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full text-white transition-all duration-200 hover:scale-[1.06] active:scale-95 md:bottom-6 md:right-6"
      >
        <MessageCircle className="h-[22px] w-[22px]" strokeWidth={2.1} />
      </button>

      <DialogContent className={`${PORTAL_DIALOG_CLASS} max-w-md`}>
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ps-success-subtle)] text-[var(--ps-success-text)]">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <h2 className="ps-h3 text-[var(--ps-fg)]">Message envoyé</h2>
              <p className="ps-small mt-1">L'équipe {AGENCY_NAME} vous répond en moins d'une heure ouvrée.</p>
            </div>
            <Button
              onClick={() => setOpen(false)}
              className="mt-1 bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
            >
              Fermer
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="text-left">
              <DialogTitle className="text-[var(--ps-fg)]">Contacter {AGENCY_NAME}</DialogTitle>
              <DialogDescription className="text-[var(--ps-fg-secondary)]">
                Une question sur {projectName ?? 'votre projet'} ? Écrivez-nous, on vous répond vite.
              </DialogDescription>
            </DialogHeader>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Votre message…"
              rows={5}
              className="resize-none"
              autoFocus
            />
            {error && <p className="text-[13px] text-[var(--ps-danger-text)]">{error}</p>}

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--ps-success-text)] hover:underline"
                >
                  <MessageSquare className="h-4 w-4" /> ou via WhatsApp
                </a>
              ) : <span />}
              <Button
                onClick={handleSend}
                disabled={sending}
                className="bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
              >
                {sending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
                Envoyer
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
