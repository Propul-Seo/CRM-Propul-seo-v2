import { memo } from 'react';
import { GripVertical, Calendar, Linkedin, Instagram, Mail, Globe, Eye, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import type { PostRow } from '../../../types/supabase-types';

interface KanbanCardProps {
  post: PostRow;
  isDragging?: boolean;
  onView?: (post: PostRow) => void;
  onEdit?: (post: PostRow) => void;
  onDelete?: (post: PostRow) => void;
}

const typeLabels: Record<string, string> = {
  agence: 'Agence',
  perso: 'Perso',
  client: 'Client',
  informatif: 'Informatif',
};

const typeColors: Record<string, string> = {
  agence: 'bg-blue-900/50 text-blue-300',
  perso: 'bg-violet-900/50 text-violet-300',
  client: 'bg-emerald-900/50 text-emerald-300',
  informatif: 'bg-sky-900/50 text-sky-300',
};

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  instagram: Instagram,
  newsletter: Mail,
  multi: Globe,
};

export const KanbanCard = memo(function KanbanCard({
  post,
  isDragging = false,
  onView,
  onEdit,
  onDelete,
}: KanbanCardProps) {
  const PlatformIcon = platformIcons[post.platform] || Globe;

  const formatDate = (date?: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <Card className={`cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md hover:border-border ${isDragging ? 'shadow-xl rotate-2 scale-105 opacity-90' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground text-sm line-clamp-2">{post.title}</h4>
            {post.hook && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">"{post.hook}"</p>
            )}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${typeColors[post.type]}`}>
                {typeLabels[post.type]}
              </Badge>
              <div className="flex items-center gap-0.5 text-muted-foreground">
                <PlatformIcon className="w-3 h-3" />
              </div>
              {post.scheduled_at && (
                <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(post.scheduled_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {(onView || onEdit || onDelete) && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
            {onView && (
              <button onClick={(e) => { e.stopPropagation(); onView(post); }} className="text-primary hover:text-primary/80 p-2 md:p-1 rounded hover:bg-primary/10 active:bg-primary/15 transition-colors" title="Voir">
                <Eye className="h-4 w-4 md:h-3.5 md:w-3.5" />
              </button>
            )}
            {onEdit && (
              <button onClick={(e) => { e.stopPropagation(); onEdit(post); }} className="text-muted-foreground hover:text-foreground p-2 md:p-1 rounded hover:bg-surface-3 active:bg-surface-3 transition-colors" title="Modifier">
                <Edit className="h-4 w-4 md:h-3.5 md:w-3.5" />
              </button>
            )}
            {onDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(post); }} className="text-red-400 hover:text-red-300 p-2 md:p-1 rounded hover:bg-red-900/20 active:bg-red-900/20 transition-colors" title="Supprimer">
                <Trash2 className="h-4 w-4 md:h-3.5 md:w-3.5" />
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
