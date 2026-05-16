import type { LucideIcon } from 'lucide-react';
import { Hammer } from 'lucide-react';
import { Hero, EmptyState } from '@/modules/EspaceClient/shared/components';

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  bodyTitle?: string;
  bodyText?: string;
}

// Placeholder commun aux pages /espace-client/* en attendant l'Étape 3
// (Sub-phase D). Affiche le Hero final + un EmptyState qui annonce la suite.
export function PlaceholderPage({
  eyebrow,
  title,
  subtitle,
  icon = Hammer,
  bodyTitle = 'Bientôt disponible',
  bodyText = 'Cette section est en cours de développement. Les fonctionnalités complètes arrivent à l’étape 3 du chantier Propul’Space.',
}: PlaceholderPageProps) {
  return (
    <div className="ps-fade-in space-y-6">
      <Hero eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <EmptyState icon={icon} title={bodyTitle} body={bodyText} />
    </div>
  );
}
