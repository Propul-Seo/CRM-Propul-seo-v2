import { useState } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import type {
  PostRow, PostInsert, PostUpdate,
  PostAssetRow, PostCommentRow,
  CRUDResult
} from '../../types/supabase-types';

// Hook CRUD pour les posts de communication
export function usePostsCRUD() {
  const [loading, setLoading] = useState(false);

  const createPost = async (postData: PostInsert): Promise<CRUDResult<PostRow>> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();

      if (error) throw error;
      toast.success('Post créé avec succès');
      return { success: true, data: data as PostRow };
    } catch (error) {
      const err = error as Error;
      logger.error('Error creating post:', err);
      toast.error('Erreur lors de la création du post');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updatePost = async (id: string, updates: PostUpdate): Promise<CRUDResult<PostRow>> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Post mis à jour');
      return { success: true, data: data as PostRow };
    } catch (error) {
      const err = error as Error;
      logger.error('Error updating post:', err);
      toast.error('Erreur lors de la mise à jour');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id: string): Promise<CRUDResult<void>> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Post supprimé');
      return { success: true };
    } catch (error) {
      const err = error as Error;
      logger.error('Error deleting post:', err);
      toast.error('Erreur lors de la suppression');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (postId: string, authorId: string, comment: string): Promise<CRUDResult<PostCommentRow>> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert([{ post_id: postId, author_id: authorId, comment }])
        .select('*, users(name, email)')
        .single();

      if (error) throw error;
      toast.success('Commentaire ajouté');
      return { success: true, data: data as PostCommentRow };
    } catch (error) {
      const err = error as Error;
      logger.error('Error adding comment:', err);
      toast.error("Erreur lors de l'ajout du commentaire");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (id: string): Promise<CRUDResult<void>> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      const err = error as Error;
      logger.error('Error deleting comment:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const uploadAsset = async (
    postId: string,
    file: File,
    assetType: 'image' | 'video' | 'document'
  ): Promise<CRUDResult<PostAssetRow>> => {
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${postId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('post-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('post-assets')
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('post_assets')
        .insert([{
          post_id: postId,
          asset_url: urlData.publicUrl,
          storage_path: filePath,
          asset_type: assetType,
          file_name: file.name,
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Fichier uploadé');
      return { success: true, data: data as PostAssetRow };
    } catch (error) {
      const err = error as Error;
      logger.error('Error uploading asset:', err);
      toast.error("Erreur lors de l'upload");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const addExternalAsset = async (
    postId: string,
    url: string,
    assetType: 'image' | 'video' | 'document',
    fileName?: string
  ): Promise<CRUDResult<PostAssetRow>> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('post_assets')
        .insert([{
          post_id: postId,
          asset_url: url,
          asset_type: assetType,
          file_name: fileName || url.split('/').pop() || 'Fichier externe',
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Lien ajouté');
      return { success: true, data: data as PostAssetRow };
    } catch (error) {
      const err = error as Error;
      logger.error('Error adding external asset:', err);
      toast.error("Erreur lors de l'ajout du lien");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteAsset = async (id: string, storagePath?: string | null): Promise<CRUDResult<void>> => {
    setLoading(true);
    try {
      if (storagePath) {
        await supabase.storage.from('post-assets').remove([storagePath]);
      }

      const { error } = await supabase
        .from('post_assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Fichier supprimé');
      return { success: true };
    } catch (error) {
      const err = error as Error;
      logger.error('Error deleting asset:', err);
      toast.error('Erreur lors de la suppression');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    createPost, updatePost, deletePost,
    addComment, deleteComment,
    uploadAsset, addExternalAsset, deleteAsset,
    loading
  };
}
