import { HelpCircle } from 'lucide-react';
import { PlaceholderPage } from './_PlaceholderPage';

export function HelpPage() {
  return (
    <PlaceholderPage
      eyebrow="Aide"
      title="Aide & FAQ"
      subtitle="Tout ce qu’il faut savoir pour profiter de votre espace."
      icon={HelpCircle}
    />
  );
}
