import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PostCommentRow } from '../../../types/supabase-types';

interface CommentThreadProps {
  comments: PostCommentRow[];
  currentUserId: string;
  onAddComment: (comment: string) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
  loading?: boolean;
}

export function CommentThread({ comments, currentUserId, onAddComment, onDeleteComment, loading }: CommentThreadProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await onAddComment(newComment.trim());
    setNewComment('');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm text-foreground">Commentaires ({comments.length})</h4>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {comments.map(comment => (
          <div key={comment.id} className="bg-input-bg rounded-lg p-3 border border-border-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">{comment.author?.name || 'Utilisateur'}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                {comment.author_id === currentUserId && (
                  <button onClick={() => onDeleteComment(comment.id)} className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-foreground mt-1">{comment.comment}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Ajouter un commentaire..." className="flex-1" />
        <Button type="submit" disabled={!newComment.trim() || loading} size="sm" className="px-3">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
