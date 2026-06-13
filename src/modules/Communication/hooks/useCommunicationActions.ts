import { useState } from 'react';
import type { CommunicationData } from './useCommunicationData';
import type { PostFormData } from '../types';
import type { PostRow } from '../../../types/supabase-types';

interface CommunicationActionsDeps {
  data: CommunicationData;
}

export function useCommunicationActions({ data }: CommunicationActionsDeps) {
  const [selectedPost, setSelectedPost] = useState<PostRow | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingPost, setEditingPost] = useState<PostRow | null>(null);

  const handleCreatePost = async (formData: PostFormData) => {
    const result = await data.createPost({
      title: formData.title,
      type: formData.type,
      platform: formData.platform,
      status: formData.status || 'idea',
      strategic_angle: formData.strategic_angle || null,
      hook: formData.hook || null,
      content: formData.content || null,
      objective: formData.objective || null,
      scheduled_at: formData.scheduled_at || null,
      responsible_user_id: formData.responsible_user_id || data.currentUser?.id || null,
      client_id: formData.client_id || null,
    });

    if (result.success) {
      setShowPostForm(false);
      data.refetchPosts();
    }
    return result;
  };

  const handleUpdatePost = async (id: string, formData: Partial<PostFormData>) => {
    const result = await data.updatePost(id, formData);
    if (result.success) {
      setEditingPost(null);
      data.refetchPosts();
    }
    return result;
  };

  const handleDeletePost = async (id: string) => {
    const result = await data.deletePost(id);
    if (result.success) {
      setSelectedPost(null);
      data.refetchPosts();
    }
    return result;
  };

  return {
    selectedPost, setSelectedPost,
    showPostForm, setShowPostForm,
    editingPost, setEditingPost,
    handleCreatePost,
    handleUpdatePost,
    handleDeletePost,
  };
}
