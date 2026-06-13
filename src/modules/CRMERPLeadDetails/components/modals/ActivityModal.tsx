import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CRMERPActivity, ActivityType } from '../../types';
import { ACTIVITY_TYPES } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (type: ActivityType, content: string) => Promise<void>;
  activity?: CRMERPActivity | null;
  defaultType?: ActivityType;
}

export function ActivityModal({ open, onClose, onSubmit, activity, defaultType }: Props) {
  const [type, setType] = useState<ActivityType>(activity?.type ?? defaultType ?? 'note');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const isEdit = !!activity;

  useEffect(() => {
    if (activity) {
      setType(activity.type);
      setContent(activity.content ?? '');
    } else {
      setType(defaultType ?? 'note');
      setContent('');
    }
  }, [activity, defaultType, open]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(type, content);
      onClose();
    } catch (e) {
      console.error('Erreur activité:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier l\'activité' : 'Nouvelle activité'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Contenu</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Détails de l'activité..." rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
