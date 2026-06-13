import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { PostRow } from '../../../types/supabase-types';
import type { PostFormData } from '../types';

interface PostFormProps {
  post?: PostRow | null;
  defaultDate?: string;
  users: { id: string; name: string }[];
  clients: { id: string; name: string; company: string }[];
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const defaultFormData: PostFormData = {
  title: '', type: 'agence', platform: 'linkedin', status: 'idea',
  strategic_angle: '', hook: '', content: '', objective: '',
  scheduled_at: '', responsible_user_id: '', client_id: '', external_url: '',
};

export function PostForm({ post, defaultDate, users, clients, onSubmit, onCancel, loading }: PostFormProps) {
  const [formData, setFormData] = useState<PostFormData>(() => {
    if (defaultDate) {
      return { ...defaultFormData, scheduled_at: defaultDate };
    }
    return defaultFormData;
  });

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title, type: post.type, platform: post.platform, status: post.status,
        strategic_angle: post.strategic_angle || '', hook: post.hook || '',
        content: post.content || '', objective: post.objective || '',
        scheduled_at: post.scheduled_at ? post.scheduled_at.slice(0, 16) : '',
        responsible_user_id: post.responsible_user_id || '', client_id: post.client_id || '',
        external_url: post.external_url || '',
      });
    }
  }, [post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    await onSubmit(formData);
  };

  const update = (field: keyof PostFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] md:max-w-2xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-3 border-b border-border-subtle">
          <DialogTitle>{post ? 'Modifier le post' : 'Nouveau post'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Titre *</Label>
            <Input value={formData.title} onChange={(e) => update('title', e.target.value)} placeholder="Titre du post" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <NativeSelect value={formData.type} onChange={(e) => update('type', e.target.value)}>
                <option value="agence">Agence</option>
                <option value="perso">Personnel</option>
                <option value="client">Client</option>
                <option value="informatif">Informatif</option>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label>Plateforme *</Label>
              <NativeSelect value={formData.platform} onChange={(e) => update('platform', e.target.value)}>
                <option value="linkedin">LinkedIn</option>
                <option value="instagram">Instagram</option>
                <option value="newsletter">Newsletter</option>
                <option value="multi">Multi-plateforme</option>
              </NativeSelect>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Responsable</Label>
              <NativeSelect value={formData.responsible_user_id} onChange={(e) => update('responsible_user_id', e.target.value)}>
                <option value="">Non assigne</option>
                {users.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
              </NativeSelect>
            </div>
            {formData.type === 'client' && (
              <div className="space-y-1.5">
                <Label>Client</Label>
                <NativeSelect value={formData.client_id} onChange={(e) => update('client_id', e.target.value)}>
                  <option value="">Selectionner un client</option>
                  {clients.map(c => (<option key={c.id} value={c.id}>{c.name} - {c.company}</option>))}
                </NativeSelect>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Angle strategique</Label>
            <Input value={formData.strategic_angle} onChange={(e) => update('strategic_angle', e.target.value)} placeholder="Ex: Positionnement expertise SEO" />
          </div>
          <div className="space-y-1.5">
            <Label>Hook</Label>
            <Input value={formData.hook} onChange={(e) => update('hook', e.target.value)} placeholder="L'accroche du post" />
          </div>
          <div className="space-y-1.5">
            <Label>Contenu</Label>
            <Textarea value={formData.content} onChange={(e) => update('content', e.target.value)} rows={5} placeholder="Contenu complet du post..." />
          </div>
          <div className="space-y-1.5">
            <Label>Objectif</Label>
            <Input value={formData.objective} onChange={(e) => update('objective', e.target.value)} placeholder="Ex: Generer 10 leads qualifies" />
          </div>
          <div className="space-y-1.5">
            <Label>Date de publication</Label>
            <Input type="datetime-local" value={formData.scheduled_at} onChange={(e) => update('scheduled_at', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Lien du post (LinkedIn / Instagram)</Label>
            <Input type="url" value={formData.external_url} onChange={(e) => update('external_url', e.target.value)} placeholder="https://www.linkedin.com/feed/update/..." />
          </div>
          <DialogFooter className="pt-4 border-t border-border-subtle">
            <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
            <Button type="submit" disabled={!formData.title.trim() || loading}>
              {loading ? 'En cours...' : post ? 'Mettre a jour' : 'Creer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
