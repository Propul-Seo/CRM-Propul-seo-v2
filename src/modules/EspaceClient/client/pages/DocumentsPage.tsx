import { FileText } from 'lucide-react';
import { PlaceholderPage } from './_PlaceholderPage';

export function DocumentsPage() {
  return (
    <PlaceholderPage
      eyebrow="Documents"
      title="Vos documents"
      subtitle="Tous vos livrables et documents en un seul endroit."
      icon={FileText}
    />
  );
}
