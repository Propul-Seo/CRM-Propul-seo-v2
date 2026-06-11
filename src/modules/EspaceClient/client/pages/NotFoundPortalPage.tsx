import { Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatusPage } from '@/modules/EspaceClient/shared/components';
import { portalRoot } from '@/modules/EspaceClient/shared/portalHost';

export function NotFoundPortalPage() {
  const navigate = useNavigate();
  return (
    <StatusPage
      icon={Compass}
      tone="gray"
      title="Page introuvable"
      subtitle="Cette page n'existe pas ou a été déplacée. Revenez à votre tableau de bord."
      primaryCta={
        <Button onClick={() => navigate(portalRoot())} className="ps-brand-gradient h-11 w-full text-white">
          Retour au tableau de bord
        </Button>
      }
    />
  );
}
