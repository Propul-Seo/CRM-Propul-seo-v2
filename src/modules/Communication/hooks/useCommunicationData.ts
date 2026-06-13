import { useSupabasePosts } from '../../../hooks/supabase';
import { usePostsCRUD } from '../../../hooks/supabase';
import { useSupabaseUsers } from '../../../hooks/supabase';
import { useSupabaseContacts } from '../../../hooks/supabase';
import { useStore } from '../../../store';

export function useCommunicationData() {
  const { currentUser } = useStore();
  const { data: posts, loading: postsLoading, error: postsError, refetch: refetchPosts } = useSupabasePosts();
  const {
    createPost, updatePost, deletePost,
    addComment, deleteComment,
    uploadAsset, addExternalAsset, deleteAsset,
    loading: crudLoading
  } = usePostsCRUD();
  const { data: users } = useSupabaseUsers();
  const { data: contacts } = useSupabaseContacts();

  return {
    posts,
    postsLoading,
    postsError,
    refetchPosts,
    createPost, updatePost, deletePost,
    addComment, deleteComment,
    uploadAsset, addExternalAsset, deleteAsset,
    crudLoading,
    users,
    contacts,
    currentUser,
  };
}

export type CommunicationData = ReturnType<typeof useCommunicationData>;
