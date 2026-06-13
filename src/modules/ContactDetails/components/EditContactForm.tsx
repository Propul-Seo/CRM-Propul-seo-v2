import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import type { Contact } from '../../../hooks/useContacts';
import type { EditFormState } from '../types';

interface EditContactFormProps {
  editForm: EditFormState;
  setEditForm: (form: EditFormState) => void;
  crmUsers: Array<{ id: string; name: string }> | undefined;
  onSave: () => void;
  onCancel: () => void;
}

export function EditContactForm({ editForm, setEditForm, crmUsers, onSave, onCancel }: EditContactFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Modifier le contact</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={editForm.contact_name}
                onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="website">Site Web</Label>
              <Input
                id="website"
                type="url"
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="company">Entreprise</Label>
              <Input
                id="company"
                value={editForm.company_name}
                onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select
                value={editForm.no_show === 'Oui' ? '__no_show__' : (editForm.status as Contact['status'])}
                onValueChange={(value) => {
                  if (value === '__no_show__') {
                    setEditForm({ ...editForm, no_show: 'Oui' });
                  } else {
                    setEditForm({ ...editForm, status: value as Contact['status'], no_show: 'Non' });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospects</SelectItem>
                  <SelectItem value="presentation_envoyee">Présentation Envoyée</SelectItem>
                  <SelectItem value="meeting_booke">Meeting Booké</SelectItem>
                  <SelectItem value="offre_envoyee">Offre Envoyée</SelectItem>
                  <SelectItem value="en_attente">En Attente</SelectItem>
                  <SelectItem value="signe">Signés</SelectItem>
                  <SelectItem value="__no_show__">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="project_price">Prix du projet ({'\u20AC'})</Label>
              <Input
                id="project_price"
                type="number"
                value={editForm.project_price || ''}
                onChange={(e) => setEditForm({ ...editForm, project_price: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div>
              <Label htmlFor="assigned_to">Assigné à</Label>
              <Select
                value={editForm.assigned_to}
                onValueChange={(value) => setEditForm({ ...editForm, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun utilisateur assigné</SelectItem>
                  {crmUsers && crmUsers.length > 0 && crmUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Sauvegarder</Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
