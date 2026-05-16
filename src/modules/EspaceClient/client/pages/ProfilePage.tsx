import { UserRound } from 'lucide-react';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import { PlaceholderPage } from './_PlaceholderPage';

export function ProfilePage() {
  const { userRow } = usePortal();
  return (
    <PlaceholderPage
      eyebrow="Profil"
      title="Mon profil"
      subtitle={`Compte connecté : ${userRow.email}`}
      icon={UserRound}
    />
  );
}
