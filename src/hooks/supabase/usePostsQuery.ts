import { useSupabaseData } from './useSupabaseQuery';
import type { PostRow, PostAssetRow, PostCommentRow } from '../../types/supabase-types';

// Hook pour les posts de communication
export function useSupabasePosts() {
  return useSupabaseData<PostRow>({
    table: 'posts',
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });
}

// Hook pour les assets d'un post
export function useSupabasePostAssets(postId?: string) {
  return useSupabaseData<PostAssetRow>({
    table: 'post_assets',
    select: '*',
    filters: postId ? { post_id: postId } : {},
    orderBy: { column: 'created_at', ascending: false }
  });
}

// Hook pour les commentaires d'un post
export function useSupabasePostComments(postId?: string) {
  return useSupabaseData<PostCommentRow>({
    table: 'post_comments',
    select: '*, users(name, email)',
    filters: postId ? { post_id: postId } : {},
    orderBy: { column: 'created_at', ascending: true }
  });
}
