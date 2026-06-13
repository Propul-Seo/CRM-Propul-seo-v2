import { useState } from 'react';
import { Phone, Mail, Calendar, FileText, CheckCircle, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { CRMERPActivity, ActivityType } from '../types';
import { ACTIVITY_TYPES } from '../types';
import { ActivityModal } from './modals/ActivityModal';

const TYPE_ICONS: Record<ActivityType, React.ElementType> = {
  call: Phone, email: Mail, meeting: Calendar, note: FileText, task: CheckCircle,
};

interface Props {
  activities: CRMERPActivity[];
  onAdd: (type: ActivityType, content: string) => Promise<void>;
  onUpdate: (id: string, updates: { type?: ActivityType; content?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function LeadActivities({ activities, onAdd, onUpdate, onDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CRMERPActivity | null>(null);

  const handleOpenNew = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (a: CRMERPActivity) => { setEditing(a); setModalOpen(true); };

  const handleSubmit = async (type: ActivityType, content: string) => {
    if (editing) {
      await onUpdate(editing.id, { type, content });
    } else {
      await onAdd(type, content);
    }
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cette activité ?')) return;
    await onDelete(id);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Activités</CardTitle>
          <Button size="sm" variant="outline" onClick={handleOpenNew}>
            <Plus className="h-3 w-3 mr-1" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucune activité</p>
          ) : (
            <div className="space-y-3">
              {activities.map((a) => {
                const Icon = TYPE_ICONS[a.type] || FileText;
                const typeLabel = ACTIVITY_TYPES.find((t) => t.value === a.type)?.label ?? a.type;
                return (
                  <div key={a.id} className="flex gap-3 p-3 rounded-lg border bg-muted/30">
                    <div className="mt-0.5">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{typeLabel}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                      {a.content && <p className="text-sm mt-1 whitespace-pre-wrap">{a.content}</p>}
                      {a.creator && <p className="text-xs text-muted-foreground mt-1">Par {a.creator.name}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(a)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ActivityModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        activity={editing}
      />
    </>
  );
}
