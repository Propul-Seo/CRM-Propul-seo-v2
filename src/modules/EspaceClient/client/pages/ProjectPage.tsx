import { FolderKanban } from 'lucide-react';
import { PlaceholderPage } from './_PlaceholderPage';

export function ProjectPage() {
  return (
    <PlaceholderPage
      eyebrow="Projet"
      title="Mon projet"
      subtitle="Les étapes de votre projet et l’avancement temps réel."
      icon={FolderKanban}
    />
  );
}
