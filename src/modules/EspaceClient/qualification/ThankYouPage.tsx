import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatusPage } from '@/modules/EspaceClient/shared/components';
import { useForceLightTheme } from '@/modules/EspaceClient/shared/hooks/useForceLightTheme';
import '@/modules/EspaceClient/shared/layouts/portal-theme.css';

export function ThankYouPage() {
  useForceLightTheme();
  const navigate = useNavigate();
  return (
    <div className="propulspace-portal min-h-screen">
      <StatusPage
        icon={CheckCircle2}
        tone="green"
        title="Merci, votre diagnostic est enregistré"
        subtitle="L'équipe Propul'SEO l'examine et vous recontacte sous 24h ouvrées. Un email de confirmation vient d'être envoyé."
        primaryCta={
          <Button onClick={() => navigate('/')} className="ps-brand-gradient h-11 w-full text-white">
            Retour à l'accueil
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        }
        footnote="Pensez à vérifier vos spams si l'email n'arrive pas."
      />
    </div>
  );
}
