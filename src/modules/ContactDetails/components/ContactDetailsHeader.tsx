import { ArrowLeft, Edit, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { Contact } from '../../../hooks/useContacts';

interface ContactDetailsHeaderProps {
  contact: Contact;
  onBack: () => void;
  onEdit: () => void;
  onNewActivity: () => void;
}

export function ContactDetailsHeader({ contact, onBack, onEdit, onNewActivity }: ContactDetailsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-border text-foreground hover:bg-surface-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{contact.name}</h1>
          <p className="text-muted-foreground">{contact.company}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onEdit}
          className="border-border text-foreground hover:bg-surface-3"
        >
          <Edit className="w-4 h-4 mr-2" />
          Modifier
        </Button>
        <Button onClick={onNewActivity}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle activité
        </Button>
      </div>
    </div>
  );
}
