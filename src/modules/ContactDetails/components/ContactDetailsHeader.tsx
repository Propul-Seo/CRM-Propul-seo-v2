import { ArrowLeft, Edit, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { Contact } from '../../../hooks/useContacts';

interface ContactDetailsHeaderProps {
  contact: Contact;
  onBack: () => void;
  onEdit: () => void;
  onNewActivity: () => void;
  onDelete?: () => void;
}

export function ContactDetailsHeader({ contact, onBack, onEdit, onNewActivity, onDelete }: ContactDetailsHeaderProps) {
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
        {onDelete && (
          <Button
            variant="outline"
            onClick={onDelete}
            className="border-border text-red-500 hover:bg-red-500/10 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}
