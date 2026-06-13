import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import type { ContactActivity, ActivityFormState } from '../types';

interface ActivityFormModalProps {
  editingActivity: ContactActivity | null;
  activityForm: ActivityFormState;
  setActivityForm: (form: ActivityFormState) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function ActivityFormModal({
  editingActivity,
  activityForm,
  setActivityForm,
  onSubmit,
  onClose,
}: ActivityFormModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 pt-8">
      <div className="glass-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {editingActivity ? 'Modifier l\'activité' : 'Nouvelle activité'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <span className="sr-only">Fermer</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="activity_type">Type d'activité</Label>
              <Select
                value={activityForm.type}
                onValueChange={(value) => setActivityForm({ ...activityForm, type: value as ContactActivity['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Appel</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Rendez-vous</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="task">Tâche</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="activity_status">Statut</Label>
              <Select
                value={activityForm.status}
                onValueChange={(value) => setActivityForm({ ...activityForm, status: value as ContactActivity['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Planifié</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="activity_title">Titre *</Label>
              <Input
                id="activity_title"
                value={activityForm.title}
                onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="activity_date">Date et heure</Label>
              <Input
                id="activity_date"
                type="datetime-local"
                value={activityForm.activity_date}
                onChange={(e) => setActivityForm({ ...activityForm, activity_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="activity_description">Description</Label>
            <Textarea
              id="activity_description"
              value={activityForm.description}
              onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">{editingActivity ? 'Modifier l\'activité' : 'Ajouter l\'activité'}</Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
