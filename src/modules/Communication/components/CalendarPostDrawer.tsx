import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Linkedin, Instagram, Mail, Globe, Calendar, Target, Zap, FileText, Edit, Trash2, Eye } from 'lucide-react';
import type { PostRow, PostType, PostStatus, PostPlatform } from '../../../types/supabase-types';

type PlatformIdentity = 'instagram' | 'linkedin-agency' | 'linkedin-perso' | 'newsletter' | 'multi';

function getPlatformIdentity(platform: PostPlatform, type: PostType): PlatformIdentity {
  if (platform === 'linkedin') return type === 'perso' ? 'linkedin-perso' : 'linkedin-agency';
  if (platform === 'instagram') return 'instagram';
  if (platform === 'newsletter') return 'newsletter';
  return 'multi';
}

const platformConfig: Record<PlatformIdentity, { label: string; icon: typeof Linkedin; gradient: string; bg: string; text: string }> = {
  instagram:         { label: 'Instagram',       icon: Instagram, gradient: 'linear-gradient(90deg, #E4405F, #F56040)',  bg: 'rgba(228, 64, 95, 0.15)',  text: '#F06292' },
  'linkedin-agency': { label: 'LinkedIn Agence', icon: Linkedin,  gradient: 'linear-gradient(90deg, #0A66C2, #0077B5)',  bg: 'rgba(10, 102, 194, 0.15)', text: '#4AA3DF' },
  'linkedin-perso':  { label: 'LinkedIn Perso',  icon: Linkedin,  gradient: 'linear-gradient(90deg, #2D9CDB, #56CCF2)',  bg: 'rgba(45, 156, 219, 0.15)', text: '#7EC8E3' },
  newsletter:        { label: 'Newsletter',      icon: Mail,      gradient: 'linear-gradient(90deg, #8B5CF6, #A78BFA)',  bg: 'rgba(139, 92, 246, 0.15)', text: '#A78BFA' },
  multi:             { label: 'Multi-plateforme', icon: Globe,     gradient: 'linear-gradient(90deg, #F59E0B, #D97706)',  bg: 'rgba(245, 158, 11, 0.15)', text: '#FCD34D' },
};

const statusConfig: Record<PostStatus, { label: string; badgeClass: string }> = {
  idea: { label: 'Idee', badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  drafting: { label: 'Redaction', badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  review: { label: 'Relecture', badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  scheduled: { label: 'Planifie', badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
  published: { label: 'Publie', badgeClass: 'bg-green-500/15 text-green-400 border-green-500/20' },
};

const typeLabels: Record<string, string> = { agence: 'Agence', perso: 'Personnel', client: 'Client', informatif: 'Informatif' };

interface CalendarPostDrawerProps {
  post: PostRow | null;
  users: { id: string; name: string }[];
  onClose: () => void;
  onViewFull: (post: PostRow) => void;
  onEdit: (post: PostRow) => void;
  onDelete: (postId: string) => void;
}

function Section({ icon: Icon, iconColor, title, content, italic }: {
  icon: typeof Target; iconColor: string; title: string; content: string; italic?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</span>
      </div>
      <p className={`text-sm text-muted-foreground leading-relaxed ${italic ? 'italic' : ''}`}>{content}</p>
    </div>
  );
}

export function CalendarPostDrawer({ post, users, onClose, onViewFull, onEdit, onDelete }: CalendarPostDrawerProps) {
  if (!post) return null;

  const identity = getPlatformIdentity(post.platform, post.type);
  const platform = platformConfig[identity];
  const status = statusConfig[post.status];
  const responsible = users.find(u => u.id === post.responsible_user_id);
  const PlatformIcon = platform.icon;

  return (
    <Sheet open={!!post} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="sm:max-w-lg p-0 flex flex-col overflow-hidden">
        {/* Platform colored header band */}
        <div className="h-1.5 shrink-0" style={{ background: platform.gradient }} />

        <SheetHeader className="p-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: platform.bg }}>
              <PlatformIcon className="w-5 h-5" style={{ color: platform.text }} />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="truncate">{post.title}</SheetTitle>
              <SheetDescription>{platform.label} · {typeLabels[post.type]}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="px-6 pb-6 space-y-4 overflow-y-auto flex-1">
          {/* Status + meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={status.badgeClass}>{status.label}</Badge>
            {responsible && (
              <span className="text-sm text-muted-foreground">
                {responsible.name}
              </span>
            )}
          </div>

          {post.scheduled_at && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.scheduled_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          <div className="border-t border-border-subtle" />

          {/* Content sections */}
          {post.strategic_angle && (
            <Section icon={Target} iconColor="text-purple-400" title="Angle strategique" content={post.strategic_angle} />
          )}
          {post.hook && (
            <Section icon={Zap} iconColor="text-amber-400" title="Hook" content={`"${post.hook}"`} italic />
          )}
          {post.content && (
            <Section
              icon={FileText}
              iconColor="text-primary"
              title="Contenu"
              content={post.content.length > 250 ? post.content.slice(0, 250) + '...' : post.content}
            />
          )}
          {post.objective && (
            <Section icon={Target} iconColor="text-green-400" title="Objectif" content={post.objective} />
          )}
        </div>

        {/* Actions footer */}
        <div className="p-4 border-t border-border-subtle space-y-2 shrink-0">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { onClose(); onViewFull(post); }}>
              <Eye className="w-4 h-4 mr-2" /> Voir détails
            </Button>
            <Button className="flex-1" onClick={() => { onClose(); onEdit(post); }}>
              <Edit className="w-4 h-4 mr-2" /> Modifier
            </Button>
          </div>
          <Button
            variant="ghost"
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
            onClick={() => { if (confirm('Supprimer ce post ?')) { onDelete(post.id); onClose(); } }}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Supprimer
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
