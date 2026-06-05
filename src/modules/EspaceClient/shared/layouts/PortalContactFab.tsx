import { useState } from 'react';
import { MessageCircle, Mail, MessageSquare } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  WHATSAPP_NUMBER,
  CONTACT_EMAIL,
  AGENCY_NAME,
} from '@/modules/EspaceClient/shared/constants';

interface PortalContactFabProps {
  projectName?: string;
}

export function PortalContactFab({ projectName }: PortalContactFabProps) {
  const [open, setOpen] = useState(false);

  const wamePrefill = encodeURIComponent(
    `Bonjour ${AGENCY_NAME}, j'ai une question concernant ${projectName ?? 'mon projet'}.`,
  );
  const mailtoPrefill = encodeURIComponent(
    `Question sur ${projectName ?? 'mon projet'}`,
  );
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${wamePrefill}`;
  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${mailtoPrefill}`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Contacter Propul'SEO"
          aria-haspopup="dialog"
          className="ps-fab ps-fab-button fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full text-white transition-all duration-200 hover:scale-[1.06] active:scale-95 md:bottom-6 md:right-6"
        >
          <MessageCircle className="h-[22px] w-[22px]" strokeWidth={2.1} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="propulspace-portal rounded-t-2xl border-t border-[var(--ps-border-soft)] bg-white"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-[var(--ps-fg)]">
            Contacter {AGENCY_NAME}
          </SheetTitle>
          <SheetDescription className="text-[var(--ps-fg-secondary)]">
            Une question ? Choisissez votre moyen préféré — on répond en moins d'une heure ouvrée.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-3 pb-4">
          <Button
            asChild
            size="lg"
            className="h-14 justify-start gap-3 rounded-xl bg-[#25D366] text-white shadow-sm hover:bg-[#1da851]"
          >
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="h-5 w-5" />
              <span className="flex flex-col items-start text-left">
                <span className="font-semibold">WhatsApp</span>
                <span className="text-xs opacity-90">Réponse en quelques minutes</span>
              </span>
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-14 justify-start gap-3 rounded-xl border-[var(--ps-border)]"
          >
            <a href={mailtoHref}>
              <Mail className="h-5 w-5 text-[var(--ps-primary)]" />
              <span className="flex flex-col items-start text-left">
                <span className="font-semibold text-[var(--ps-fg)]">Email</span>
                <span className="text-xs text-[var(--ps-fg-secondary)]">{CONTACT_EMAIL}</span>
              </span>
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
