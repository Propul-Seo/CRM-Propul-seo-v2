import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPage } from '@/modules/EspaceClient/shared/components';
import { CONTACT_EMAIL } from '@/modules/EspaceClient/shared/constants';

export function PortalSuspendedPage() {
  return (
    <StatusPage
      icon={Lock}
      tone="red"
      title="Accès portail suspendu"
      subtitle="Votre espace client est temporairement inaccessible. Contactez votre interlocuteur Propul'SEO pour le réactiver."
      primaryCta={
        <Button asChild className="ps-brand-gradient h-11 w-full text-white">
          <a href={`mailto:${CONTACT_EMAIL}?subject=Réactivation portail client`}>
            Contacter Propul'SEO
          </a>
        </Button>
      }
    />
  );
}
