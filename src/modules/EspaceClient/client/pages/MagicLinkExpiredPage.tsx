import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatusPage } from '@/modules/EspaceClient/shared/components';

export function MagicLinkExpiredPage() {
  const navigate = useNavigate();
  return (
    <StatusPage
      icon={Clock}
      tone="orange"
      title="Lien de connexion expiré"
      subtitle="Pour des raisons de sécurité, les liens magiques expirent après 1 heure. Demandez-en un nouveau, on vous le renvoie immédiatement."
      primaryCta={
        <Button onClick={() => navigate('/espace-client/login')} className="ps-brand-gradient h-11 w-full text-white">
          Recevoir un nouveau lien
        </Button>
      }
      footnote="Besoin d'aide ? Contactez-nous via le bouton flottant."
    />
  );
}
