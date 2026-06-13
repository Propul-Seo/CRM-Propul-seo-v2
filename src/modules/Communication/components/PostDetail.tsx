import { ArrowLeft, Edit, Trash2, Calendar, Target, Zap, FileText, ExternalLink } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { useSupabasePostAssets, useSupabasePostComments } from '../../../hooks/supabase';
import { CommentThread } from './CommentThread';
import { AssetManager } from './AssetManager';
import { MetricsSection } from './MetricsSection';
import type { PostRow } from '../../../types/supabase-types';
import type { CommunicationData } from '../hooks/useCommunicationData';

interface PostDetailProps {
  post: PostRow;
  data: CommunicationData;
  onBack: () => void;
  onEdit: (post: PostRow) => void;
  onDelete: (id: string) => void;
}

const statusLabels: Record<string, string> = { idea: 'Idee', drafting: 'En redaction', review: 'En validation', scheduled: 'Programme', published: 'Publie' };
const statusColors: Record<string, string> = { idea: 'bg-amber-500/15 text-amber-400', drafting: 'bg-blue-500/15 text-blue-400', review: 'bg-purple-500/15 text-purple-400', scheduled: 'bg-primary/15 text-primary', published: 'bg-green-500/15 text-green-400' };
const typeLabels: Record<string, string> = { agence: 'Agence', perso: 'Personnel', client: 'Client', informatif: 'Informatif' };
const platformLabels: Record<string, string> = { linkedin: 'LinkedIn', instagram: 'Instagram', newsletter: 'Newsletter', multi: 'Multi-plateforme' };

export function PostDetail({ post, data, onBack, onEdit, onDelete }: PostDetailProps) {
  const { data: assets, refetch: refetchAssets } = useSupabasePostAssets(post.id);
  const { data: comments, refetch: refetchComments } = useSupabasePostComments(post.id);
  const currentUserId = data.currentUser?.id || '';

  const formatDate = (date: string | null) => {
    if (!date) return '\u2014';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const responsibleUser = data.users.find(u => u.id === post.responsible_user_id);

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-4 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] active:text-foreground">
          <ArrowLeft className="w-5 h-5 md:w-4 md:h-4" /><span className="text-sm">Retour</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(post)} className="flex items-center gap-1 px-3 py-2 md:py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 active:bg-primary/20 transition-colors min-h-[44px]">
            <Edit className="w-4 h-4 md:w-3.5 md:h-3.5" /> Modifier
          </button>
          <button onClick={() => { if (confirm('Supprimer ce post ?')) onDelete(post.id); }} className="flex items-center gap-1 px-3 py-2 md:py-1.5 text-sm bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 active:bg-red-900/50 transition-colors min-h-[44px]">
            <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" /> Supprimer
          </button>
        </div>
      </div>

      <div className="glass-surface-static rounded-xl p-4 md:p-6">
        <div className="flex items-start justify-between mb-4 gap-3">
          <h1 className="text-lg md:text-xl font-bold text-foreground">{post.title}</h1>
          <Badge className={statusColors[post.status]}>{statusLabels[post.status]}</Badge>
        </div>
        <div className="flex items-center gap-2 md:gap-3 text-sm text-muted-foreground flex-wrap">
          <span>{typeLabels[post.type]}</span><span>·</span><span>{platformLabels[post.platform]}</span>
          {responsibleUser && (<><span>·</span><span>{responsibleUser.name}</span></>)}
          {post.external_url && (
            <>
              <span>·</span>
              <a href={post.external_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                <ExternalLink className="w-3 h-3" /> Voir le post
              </a>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {post.strategic_angle && (
          <div className="glass-surface-static rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-purple-400" /><h3 className="font-semibold text-sm text-foreground">Angle strategique</h3></div>
            <p className="text-sm text-muted-foreground">{post.strategic_angle}</p>
          </div>
        )}
        {post.hook && (
          <div className="glass-surface-static rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-amber-400" /><h3 className="font-semibold text-sm text-foreground">Hook</h3></div>
            <p className="text-sm text-muted-foreground italic">"{post.hook}"</p>
          </div>
        )}
        {post.objective && (
          <div className="glass-surface-static rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-green-400" /><h3 className="font-semibold text-sm text-foreground">Objectif</h3></div>
            <p className="text-sm text-muted-foreground">{post.objective}</p>
          </div>
        )}
        <div className="glass-surface-static rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-primary" /><h3 className="font-semibold text-sm text-foreground">Dates</h3></div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Programme : {formatDate(post.scheduled_at)}</p>
            <p>Publie : {formatDate(post.published_at)}</p>
            <p>Cree : {formatDate(post.created_at)}</p>
          </div>
        </div>
      </div>

      {post.content && (
        <div className="glass-surface-static rounded-xl p-4 md:p-6">
          <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-primary" /><h3 className="font-semibold text-sm text-foreground">Contenu</h3></div>
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      <div className="glass-surface-static rounded-xl p-4">
        <AssetManager assets={assets} onUpload={async (file, type) => { await data.uploadAsset(post.id, file, type); refetchAssets(); }} onAddExternal={async (url, type, fileName) => { await data.addExternalAsset(post.id, url, type, fileName); refetchAssets(); }} onDelete={async (id, storagePath) => { await data.deleteAsset(id, storagePath); refetchAssets(); }} loading={data.crudLoading} />
      </div>

      <div className="glass-surface-static rounded-xl p-4">
        <CommentThread comments={comments} currentUserId={currentUserId} onAddComment={async (comment) => { await data.addComment(post.id, currentUserId, comment); refetchComments(); }} onDeleteComment={async (id) => { await data.deleteComment(id); refetchComments(); }} loading={data.crudLoading} />
      </div>

      {post.status === 'published' && (
        <MetricsSection postId={post.id} />
      )}
    </div>
  );
}
