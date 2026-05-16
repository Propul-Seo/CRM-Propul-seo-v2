import { LayoutDashboard } from 'lucide-react';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import { PlaceholderPage } from './_PlaceholderPage';

export function DashboardPage() {
  const { userRow, project } = usePortal();
  const firstName = userRow.email.split('@')[0] ?? 'Client';
  return (
    <PlaceholderPage
      eyebrow="Tableau de bord"
      title={`Bon retour, ${firstName}`}
      subtitle={`Voici un aperçu de ${project.name ?? 'votre projet'} aujourd’hui.`}
      icon={LayoutDashboard}
    />
  );
}
