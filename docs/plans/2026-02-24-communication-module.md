# Communication Module Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full "Communication" module to the ERP for managing agency, personal, and client content production with Kanban, Calendar, and Dashboard views.

**Architecture:** Self-contained module at `src/modules/Communication/` following the CRM module pattern. Three Supabase tables (posts, post_assets, post_comments) with RLS. Supabase hooks for data fetching + CRUD. DnD-kit Kanban (same as ProjectsManager), FullCalendar for calendar view, Recharts for dashboard donut chart.

**Tech Stack:** React 18, TypeScript, Supabase (migration + RLS + Storage), @dnd-kit/core + @dnd-kit/sortable, @fullcalendar/react, Recharts, Tailwind + shadcn/ui, Zustand (navigation only, no new slice), Sonner toasts, date-fns.

---

## Task 1: Apply Supabase Migration

**Files:**
- Remote: Supabase migration via MCP `apply_migration`

**Step 1: Apply the migration**

Use `mcp__plugin_supabase_supabase__apply_migration` with project_id `tbuqctfgjjxnevmsvucl`:

```sql
-- Create posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('agence', 'perso', 'client')),
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'newsletter', 'multi')),
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'drafting', 'review', 'scheduled', 'published')),
  strategic_angle TEXT,
  hook TEXT,
  content TEXT,
  objective TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  responsible_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create post_assets table
CREATE TABLE public.post_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  asset_url TEXT,
  storage_path TEXT,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'document')),
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create post_comments table
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_type ON public.posts(type);
CREATE INDEX idx_posts_scheduled_at ON public.posts(scheduled_at);
CREATE INDEX idx_posts_responsible_user_id ON public.posts(responsible_user_id);
CREATE INDEX idx_posts_client_id ON public.posts(client_id);
CREATE INDEX idx_post_assets_post_id ON public.post_assets(post_id);
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION update_posts_updated_at();

-- RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read posts"
  ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert posts"
  ON public.posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update posts"
  ON public.posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete posts"
  ON public.posts FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read post_assets"
  ON public.post_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert post_assets"
  ON public.post_assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete post_assets"
  ON public.post_assets FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read post_comments"
  ON public.post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert post_comments"
  ON public.post_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete post_comments"
  ON public.post_comments FOR DELETE TO authenticated USING (true);
```

Migration name: `create_communication_tables`

**Step 2: Create storage bucket**

Use `execute_sql`:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-assets', 'post-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload post assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-assets');

CREATE POLICY "Anyone can view post assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-assets');

CREATE POLICY "Authenticated users can delete post assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-assets');
```

**Step 3: Verify tables exist**

Use `list_tables` to confirm `posts`, `post_assets`, `post_comments` appear in public schema.

**Step 4: Commit** (no local files changed in this task)

---

## Task 2: Create TypeScript Types

**Files:**
- Create: `src/modules/Communication/types.ts`
- Modify: `src/types/supabase-types.ts` (add Post types at end)

**Step 1: Add types to supabase-types.ts**

Add after the `MessageUpdate` interface (around line 171):

```typescript
// ===== TYPES POUR LES POSTS (Communication) =====
export type PostType = 'agence' | 'perso' | 'client';
export type PostPlatform = 'linkedin' | 'instagram' | 'newsletter' | 'multi';
export type PostStatus = 'idea' | 'drafting' | 'review' | 'scheduled' | 'published';

export interface PostRow {
  id: string;
  title: string;
  type: PostType;
  platform: PostPlatform;
  status: PostStatus;
  strategic_angle: string | null;
  hook: string | null;
  content: string | null;
  objective: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  responsible_user_id: string | null;
  client_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostInsert {
  id?: string;
  title: string;
  type: PostType;
  platform: PostPlatform;
  status?: PostStatus;
  strategic_angle?: string | null;
  hook?: string | null;
  content?: string | null;
  objective?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  responsible_user_id?: string | null;
  client_id?: string | null;
}

export interface PostUpdate {
  title?: string;
  type?: PostType;
  platform?: PostPlatform;
  status?: PostStatus;
  strategic_angle?: string | null;
  hook?: string | null;
  content?: string | null;
  objective?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  responsible_user_id?: string | null;
  client_id?: string | null;
}

export interface PostAssetRow {
  id: string;
  post_id: string;
  asset_url: string | null;
  storage_path: string | null;
  asset_type: 'image' | 'video' | 'document';
  file_name: string | null;
  created_at: string;
}

export interface PostCommentRow {
  id: string;
  post_id: string;
  author_id: string;
  comment: string;
  created_at: string;
  author?: {
    name: string;
    email: string;
  };
}
```

**Step 2: Create module types file**

Create `src/modules/Communication/types.ts`:

```typescript
import type { PostRow, PostStatus } from '../../types/supabase-types';

export type { PostRow, PostStatus };

export interface KanbanColumn {
  id: PostStatus;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  textColor: string;
  posts: PostRow[];
}

export type ViewMode = 'kanban' | 'calendar' | 'dashboard';

export interface PostFormData {
  title: string;
  type: 'agence' | 'perso' | 'client';
  platform: 'linkedin' | 'instagram' | 'newsletter' | 'multi';
  status: PostStatus;
  strategic_angle: string;
  hook: string;
  content: string;
  objective: string;
  scheduled_at: string;
  responsible_user_id: string;
  client_id: string;
}
```

**Step 3: Commit**

```bash
git add src/modules/Communication/types.ts src/types/supabase-types.ts
git commit -m "feat(communication): add TypeScript types for posts, assets, comments"
```

---

## Task 3: Create Supabase Hooks (Query + CRUD)

**Files:**
- Create: `src/hooks/supabase/usePostsQuery.ts`
- Create: `src/hooks/supabase/usePostsCRUD.ts`
- Modify: `src/hooks/supabase/index.ts` (add exports)

**Step 1: Create usePostsQuery.ts**

```typescript
import { useSupabaseData } from './useSupabaseQuery';
import type { PostRow, PostAssetRow, PostCommentRow } from '../../types/supabase-types';

export function useSupabasePosts() {
  return useSupabaseData<PostRow>({
    table: 'posts',
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });
}

export function useSupabasePostAssets(postId?: string) {
  return useSupabaseData<PostAssetRow>({
    table: 'post_assets',
    select: '*',
    filters: postId ? { post_id: postId } : {},
    orderBy: { column: 'created_at', ascending: false }
  });
}

export function useSupabasePostComments(postId?: string) {
  return useSupabaseData<PostCommentRow>({
    table: 'post_comments',
    select: '*, users(name, email)',
    filters: postId ? { post_id: postId } : {},
    orderBy: { column: 'created_at', ascending: true }
  });
}
```

**Step 2: Create usePostsCRUD.ts**

Follow the exact pattern from `useProjectsCRUD.ts`:

```typescript
import { useState } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import type {
  PostRow, PostInsert, PostUpdate,
  PostAssetRow, PostCommentRow,
  CRUDResult
} from '../../types/supabase-types';

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
      toast.error('Erreur lors de l\'ajout du commentaire');
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
      toast.error('Erreur lors de l\'upload');
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
      toast.error('Erreur lors de l\'ajout du lien');
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
```

**Step 3: Update barrel export index.ts**

Add at the end of `src/hooks/supabase/index.ts`:

```typescript
// Communication hooks
export { useSupabasePosts, useSupabasePostAssets, useSupabasePostComments } from './usePostsQuery';
export { usePostsCRUD } from './usePostsCRUD';
```

**Step 4: Commit**

```bash
git add src/hooks/supabase/usePostsQuery.ts src/hooks/supabase/usePostsCRUD.ts src/hooks/supabase/index.ts
git commit -m "feat(communication): add Supabase query and CRUD hooks for posts"
```

---

## Task 4: Create Module Hooks (Data + Filters + Actions + DragDrop)

**Files:**
- Create: `src/modules/Communication/hooks/useCommunicationData.ts`
- Create: `src/modules/Communication/hooks/useCommunicationFilters.ts`
- Create: `src/modules/Communication/hooks/useCommunicationActions.ts`
- Create: `src/modules/Communication/hooks/usePostDragDrop.ts`

**Step 1: Create useCommunicationData.ts**

```typescript
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
```

**Step 2: Create useCommunicationFilters.ts**

```typescript
import { useState, useMemo } from 'react';
import type { PostRow, PostType, PostPlatform, PostStatus } from '../../../types/supabase-types';

export function useCommunicationFilters(posts: PostRow[]) {
  const [typeFilter, setTypeFilter] = useState<PostType | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<PostPlatform | 'all'>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (typeFilter !== 'all' && post.type !== typeFilter) return false;
      if (platformFilter !== 'all' && post.platform !== platformFilter) return false;
      if (responsibleFilter !== 'all' && post.responsible_user_id !== responsibleFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = post.title.toLowerCase().includes(q);
        const matchesContent = post.content?.toLowerCase().includes(q);
        const matchesHook = post.hook?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesHook) return false;
      }
      return true;
    });
  }, [posts, typeFilter, platformFilter, responsibleFilter, searchQuery]);

  const resetFilters = () => {
    setTypeFilter('all');
    setPlatformFilter('all');
    setResponsibleFilter('all');
    setSearchQuery('');
  };

  return {
    typeFilter, setTypeFilter,
    platformFilter, setPlatformFilter,
    responsibleFilter, setResponsibleFilter,
    searchQuery, setSearchQuery,
    filteredPosts,
    resetFilters,
  };
}
```

**Step 3: Create useCommunicationActions.ts**

```typescript
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
```

**Step 4: Create usePostDragDrop.ts**

Follow the exact pattern from `useProjectDragDrop.ts`:

```typescript
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { Lightbulb, PenLine, CheckCircle, Clock, Send } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import type { PostRow, PostStatus } from '../../../types/supabase-types';
import type { KanbanColumn } from '../types';

interface UsePostDragDropProps {
  initialPosts: PostRow[];
  onUpdate?: () => void;
}

const COLUMN_CONFIG = [
  {
    id: 'idea' as PostStatus,
    title: 'Idée',
    icon: Lightbulb,
    color: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
    textColor: 'text-amber-800 dark:text-amber-300',
  },
  {
    id: 'drafting' as PostStatus,
    title: 'En rédaction',
    icon: PenLine,
    color: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-800 dark:text-blue-300',
  },
  {
    id: 'review' as PostStatus,
    title: 'En validation',
    icon: CheckCircle,
    color: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
    textColor: 'text-purple-800 dark:text-purple-300',
  },
  {
    id: 'scheduled' as PostStatus,
    title: 'Programmé',
    icon: Clock,
    color: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800',
    textColor: 'text-indigo-800 dark:text-indigo-300',
  },
  {
    id: 'published' as PostStatus,
    title: 'Publié',
    icon: Send,
    color: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    textColor: 'text-green-800 dark:text-green-300',
  },
];

export { COLUMN_CONFIG };

export function usePostDragDrop({ initialPosts, onUpdate }: UsePostDragDropProps) {
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);
  const [activePost, setActivePost] = useState<PostRow | null>(null);
  const [activeColumn, setActiveColumn] = useState<PostStatus | null>(null);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const columns = useMemo<KanbanColumn[]>(() => {
    return COLUMN_CONFIG.map(col => ({
      ...col,
      posts: posts.filter(p => p.status === col.id),
    }));
  }, [posts]);

  const findColumn = useCallback((postId: UniqueIdentifier): PostStatus | null => {
    const post = posts.find(p => p.id === postId);
    return post ? post.status as PostStatus : null;
  }, [posts]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const post = posts.find(p => p.id === active.id);
    if (post) {
      setActivePost(post);
      setActiveColumn(post.status as PostStatus);
    }
  }, [posts]);

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // No optimistic updates
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    setActivePost(null);
    setActiveColumn(null);

    if (!over) {
      onUpdate?.();
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumnId = activeColumn;
    let overColumnId = findColumn(overId);

    if (!overColumnId && COLUMN_CONFIG.some(col => col.id === overId)) {
      overColumnId = overId as PostStatus;
    }

    if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) {
      return;
    }

    try {
      const updateData: Record<string, unknown> = {
        status: overColumnId,
        updated_at: new Date().toISOString(),
      };

      if (overColumnId === 'published') {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', activeId);

      if (error) {
        toast.error('Erreur lors du changement de statut');
        onUpdate?.();
        return;
      }

      toast.success('Statut du post mis à jour');
      onUpdate?.();
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
      onUpdate?.();
    }
  }, [activeColumn, findColumn, onUpdate]);

  const handleDragCancel = useCallback(() => {
    setActivePost(null);
    setActiveColumn(null);
    onUpdate?.();
  }, [onUpdate]);

  return {
    columns,
    activePost,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
```

**Step 5: Commit**

```bash
git add src/modules/Communication/hooks/
git commit -m "feat(communication): add module hooks (data, filters, actions, drag-drop)"
```

---

## Task 5: Create Kanban Components (Board + Column + Card)

**Files:**
- Create: `src/modules/Communication/components/KanbanBoard.tsx`
- Create: `src/modules/Communication/components/KanbanColumn.tsx`
- Create: `src/modules/Communication/components/KanbanCard.tsx`
- Create: `src/modules/Communication/components/SortablePostCard.tsx`

**Step 1: Create KanbanCard.tsx**

```typescript
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
};

const typeColors: Record<string, string> = {
  agence: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  perso: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
  client: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
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
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <Card
      className={`
        bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700
        cursor-grab active:cursor-grabbing
        transition-all duration-200
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
        ${isDragging ? 'shadow-xl rotate-2 scale-105 opacity-90' : ''}
      `}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
              {post.title}
            </h4>

            {post.hook && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 italic">
                "{post.hook}"
              </p>
            )}

            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${typeColors[post.type]}`}>
                {typeLabels[post.type]}
              </Badge>
              <div className="flex items-center gap-0.5 text-gray-400">
                <PlatformIcon className="w-3 h-3" />
              </div>
              {post.scheduled_at && (
                <div className="flex items-center gap-0.5 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(post.scheduled_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {(onView || onEdit || onDelete) && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            {onView && (
              <button
                onClick={(e) => { e.stopPropagation(); onView(post); }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                title="Voir"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(post); }}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title="Modifier"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(post); }}
                className="text-red-600 dark:text-red-400 hover:text-red-800 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
```

**Step 2: Create SortablePostCard.tsx**

Same pattern as `SortableProjectCard.tsx`:

```typescript
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KanbanCard } from './KanbanCard';
import type { PostRow } from '../../../types/supabase-types';

interface SortablePostCardProps {
  post: PostRow;
  onView?: (post: PostRow) => void;
  onEdit?: (post: PostRow) => void;
  onDelete?: (post: PostRow) => void;
}

export function SortablePostCard({ post, onView, onEdit, onDelete }: SortablePostCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: post.id,
    data: { type: 'post', post },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard post={post} isDragging={isDragging} onView={onView} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
```

**Step 3: Create KanbanColumn.tsx**

Same pattern as `ProjectColumn.tsx`:

```typescript
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortablePostCard } from './SortablePostCard';
import { Badge } from '../../../components/ui/badge';
import type { PostRow, PostStatus } from '../../../types/supabase-types';

interface KanbanColumnProps {
  id: PostStatus;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  textColor: string;
  posts: PostRow[];
  onViewPost?: (post: PostRow) => void;
  onEditPost?: (post: PostRow) => void;
  onDeletePost?: (post: PostRow) => void;
}

export function KanbanColumn({
  id,
  title,
  icon: Icon,
  color,
  textColor,
  posts,
  onViewPost,
  onEditPost,
  onDeletePost,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: 'column', columnId: id },
  });

  const postIds = posts.map(p => p.id);

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col rounded-lg border min-w-[260px] lg:min-w-0 lg:flex-1 max-w-[320px]
        transition-all duration-200
        ${color}
        ${isOver ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 scale-[1.01]' : ''}
      `}
    >
      <div className="flex items-center justify-between p-3 border-b border-inherit">
        <div className="flex items-center space-x-2">
          <Icon className={`h-4 w-4 ${textColor}`} />
          <h3 className={`font-semibold text-sm ${textColor}`}>{title}</h3>
        </div>
        <Badge variant="secondary" className="bg-white/50 dark:bg-gray-800/50 dark:text-gray-200 text-xs">
          {posts.length}
        </Badge>
      </div>

      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        <SortableContext items={postIds} strategy={verticalListSortingStrategy}>
          {posts.length === 0 ? (
            <div
              className={`
                flex items-center justify-center h-20
                border-2 border-dashed rounded-lg
                ${isOver ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}
                transition-colors duration-200
              `}
            >
              <p className="text-gray-400 dark:text-gray-500 text-xs">
                {isOver ? 'Déposer ici' : 'Aucun post'}
              </p>
            </div>
          ) : (
            posts.map(post => (
              <SortablePostCard
                key={post.id}
                post={post}
                onView={onViewPost}
                onEdit={onEditPost}
                onDelete={onDeletePost}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
```

**Step 4: Create KanbanBoard.tsx**

Same pattern as `ProjectKanban.tsx`:

```typescript
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { usePostDragDrop } from '../hooks/usePostDragDrop';
import type { PostRow } from '../../../types/supabase-types';

interface KanbanBoardProps {
  posts: PostRow[];
  onRefresh: () => void;
  onViewPost: (post: PostRow) => void;
  onEditPost: (post: PostRow) => void;
  onDeletePost: (post: PostRow) => void;
}

export function KanbanBoard({ posts, onRefresh, onViewPost, onEditPost, onDeletePost }: KanbanBoardProps) {
  const {
    columns,
    activePost,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = usePostDragDrop({ initialPosts: posts, onUpdate: onRefresh });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const measuring = {
    droppable: { strategy: MeasuringStrategy.Always },
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 h-full">
        {columns.map(column => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            icon={column.icon}
            color={column.color}
            textColor={column.textColor}
            posts={column.posts}
            onViewPost={onViewPost}
            onEditPost={onEditPost}
            onDeletePost={onDeletePost}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activePost ? <KanbanCard post={activePost} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

**Step 5: Commit**

```bash
git add src/modules/Communication/components/KanbanBoard.tsx src/modules/Communication/components/KanbanColumn.tsx src/modules/Communication/components/KanbanCard.tsx src/modules/Communication/components/SortablePostCard.tsx
git commit -m "feat(communication): add Kanban board with drag & drop"
```

---

## Task 6: Create Calendar View

**Files:**
- Create: `src/modules/Communication/components/CalendarView.tsx`

**Step 1: Create CalendarView.tsx**

Uses FullCalendar (already installed) following same patterns as existing calendar usage:

```typescript
import { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { PostRow } from '../../../types/supabase-types';

interface CalendarViewProps {
  posts: PostRow[];
  onPostClick: (post: PostRow) => void;
}

const typeColors: Record<string, string> = {
  agence: '#3b82f6',
  perso: '#8b5cf6',
  client: '#10b981',
};

const statusOpacity: Record<string, number> = {
  idea: 0.4,
  drafting: 0.6,
  review: 0.8,
  scheduled: 1,
  published: 0.5,
};

export function CalendarView({ posts, onPostClick }: CalendarViewProps) {
  const events = useMemo(() => {
    return posts
      .filter(post => post.scheduled_at)
      .map(post => ({
        id: post.id,
        title: post.title,
        date: post.scheduled_at!,
        backgroundColor: typeColors[post.type] || '#6b7280',
        borderColor: typeColors[post.type] || '#6b7280',
        textColor: '#ffffff',
        extendedProps: { post },
        classNames: [`opacity-${Math.round((statusOpacity[post.status] || 1) * 100)}`],
      }));
  }, [posts]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="fr"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek',
        }}
        events={events}
        eventClick={(info) => {
          const post = info.event.extendedProps.post as PostRow;
          onPostClick(post);
        }}
        height="auto"
        dayMaxEvents={3}
        buttonText={{
          today: "Aujourd'hui",
          month: 'Mois',
          week: 'Semaine',
        }}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/modules/Communication/components/CalendarView.tsx
git commit -m "feat(communication): add calendar view with FullCalendar"
```

---

## Task 7: Create Dashboard View

**Files:**
- Create: `src/modules/Communication/components/DashboardView.tsx`

**Step 1: Create DashboardView.tsx**

Uses Recharts (already installed) for the donut chart:

```typescript
import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar, AlertTriangle, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import type { PostRow } from '../../../types/supabase-types';
import { isThisWeek, isPast, parseISO } from 'date-fns';

interface DashboardViewProps {
  posts: PostRow[];
  onPostClick: (post: PostRow) => void;
}

const TYPE_COLORS = {
  agence: '#3b82f6',
  perso: '#8b5cf6',
  client: '#10b981',
};

const TYPE_LABELS: Record<string, string> = {
  agence: 'Agence',
  perso: 'Personnel',
  client: 'Client',
};

export function DashboardView({ posts, onPostClick }: DashboardViewProps) {
  const postsThisWeek = useMemo(() => {
    return posts.filter(p =>
      p.scheduled_at && isThisWeek(parseISO(p.scheduled_at), { weekStartsOn: 1 })
    );
  }, [posts]);

  const overduePosts = useMemo(() => {
    return posts.filter(p =>
      p.scheduled_at &&
      isPast(parseISO(p.scheduled_at)) &&
      p.status !== 'published'
    );
  }, [posts]);

  const recentPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
  }, [posts]);

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = { agence: 0, perso: 0, client: 0 };
    posts.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: TYPE_LABELS[name] || name,
      value,
      color: TYPE_COLORS[name as keyof typeof TYPE_COLORS] || '#6b7280',
    }));
  }, [posts]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Posts cette semaine */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4 text-blue-600" />
            Posts cette semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          {postsThisWeek.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun post prévu cette semaine</p>
          ) : (
            <div className="space-y-2">
              {postsThisWeek.map(post => (
                <div
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{post.title}</p>
                    <p className="text-xs text-gray-500">{post.scheduled_at ? formatDate(post.scheduled_at) : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Posts en retard */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Posts en retard
            {overduePosts.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                {overduePosts.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overduePosts.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun post en retard</p>
          ) : (
            <div className="space-y-2">
              {overduePosts.slice(0, 5).map(post => (
                <div
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{post.title}</p>
                    <p className="text-xs text-red-500">{post.scheduled_at ? formatDate(post.scheduled_at) : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Derniers posts modifiés */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-indigo-600" />
            Derniers modifiés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentPosts.map(post => (
              <div
                key={post.id}
                onClick={() => onPostClick(post)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{post.title}</p>
                  <p className="text-xs text-gray-500">{formatDate(post.updated_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Répartition par type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-purple-600" />
            Répartition par type
          </CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune donnée</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    dataKey="value"
                    strokeWidth={2}
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {typeDistribution.map(entry => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{entry.name}</span>
                    <span className="text-sm font-semibold">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/modules/Communication/components/DashboardView.tsx
git commit -m "feat(communication): add dashboard view with stats and donut chart"
```

---

## Task 8: Create Post Detail Panel + Post Form + Comment Thread + Asset Manager

**Files:**
- Create: `src/modules/Communication/components/PostDetail.tsx`
- Create: `src/modules/Communication/components/PostForm.tsx`
- Create: `src/modules/Communication/components/CommentThread.tsx`
- Create: `src/modules/Communication/components/AssetManager.tsx`

**Step 1: Create CommentThread.tsx**

```typescript
import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import type { PostCommentRow } from '../../../types/supabase-types';

interface CommentThreadProps {
  comments: PostCommentRow[];
  currentUserId: string;
  onAddComment: (comment: string) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
  loading?: boolean;
}

export function CommentThread({
  comments,
  currentUserId,
  onAddComment,
  onDeleteComment,
  loading,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await onAddComment(newComment.trim());
    setNewComment('');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
        Commentaires ({comments.length})
      </h4>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {comments.map(comment => (
          <div key={comment.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {comment.author?.name || 'Utilisateur'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                {comment.author_id === currentUserId && (
                  <button
                    onClick={() => onDeleteComment(comment.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{comment.comment}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ajouter un commentaire..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || loading}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
```

**Step 2: Create AssetManager.tsx**

```typescript
import { useState, useRef } from 'react';
import { Upload, Link, Trash2, Image, Video, FileText } from 'lucide-react';
import type { PostAssetRow } from '../../../types/supabase-types';

interface AssetManagerProps {
  assets: PostAssetRow[];
  onUpload: (file: File, type: 'image' | 'video' | 'document') => Promise<void>;
  onAddExternal: (url: string, type: 'image' | 'video' | 'document', fileName?: string) => Promise<void>;
  onDelete: (id: string, storagePath?: string | null) => Promise<void>;
  loading?: boolean;
}

const assetTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  image: Image,
  video: Video,
  document: FileText,
};

export function AssetManager({ assets, onUpload, onAddExternal, onDelete, loading }: AssetManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [externalType, setExternalType] = useState<'image' | 'video' | 'document'>('image');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let type: 'image' | 'video' | 'document' = 'document';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';

    await onUpload(file, type);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddExternal = async () => {
    if (!externalUrl.trim()) return;
    await onAddExternal(externalUrl.trim(), externalType);
    setExternalUrl('');
    setShowUrlInput(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
          Assets ({assets.length})
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <Upload className="w-3 h-3" />
            Upload
          </button>
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <Link className="w-3 h-3" />
            URL
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,.pdf,.doc,.docx"
      />

      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <select
            value={externalType}
            onChange={(e) => setExternalType(e.target.value as 'image' | 'video' | 'document')}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="image">Image</option>
            <option value="video">Vidéo</option>
            <option value="document">Document</option>
          </select>
          <button
            onClick={handleAddExternal}
            disabled={!externalUrl.trim() || loading}
            className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Ajouter
          </button>
        </div>
      )}

      <div className="space-y-1">
        {assets.map(asset => {
          const Icon = assetTypeIcons[asset.asset_type] || FileText;
          return (
            <div
              key={asset.id}
              className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-700/50"
            >
              <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm truncate flex-1 text-gray-700 dark:text-gray-300">
                {asset.file_name || asset.asset_url || 'Fichier'}
              </span>
              {asset.asset_url && (
                <a
                  href={asset.asset_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex-shrink-0"
                >
                  Voir
                </a>
              )}
              <button
                onClick={() => onDelete(asset.id, asset.storage_path)}
                className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 3: Create PostForm.tsx**

```typescript
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { PostRow, PostType, PostPlatform, PostStatus } from '../../../types/supabase-types';
import type { PostFormData } from '../types';

interface PostFormProps {
  post?: PostRow | null;
  users: { id: string; name: string }[];
  clients: { id: string; name: string; company: string }[];
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const defaultFormData: PostFormData = {
  title: '',
  type: 'agence',
  platform: 'linkedin',
  status: 'idea',
  strategic_angle: '',
  hook: '',
  content: '',
  objective: '',
  scheduled_at: '',
  responsible_user_id: '',
  client_id: '',
};

export function PostForm({ post, users, clients, onSubmit, onCancel, loading }: PostFormProps) {
  const [formData, setFormData] = useState<PostFormData>(defaultFormData);

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        type: post.type,
        platform: post.platform,
        status: post.status,
        strategic_angle: post.strategic_angle || '',
        hook: post.hook || '',
        content: post.content || '',
        objective: post.objective || '',
        scheduled_at: post.scheduled_at ? post.scheduled_at.slice(0, 16) : '',
        responsible_user_id: post.responsible_user_id || '',
        client_id: post.client_id || '',
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {post ? 'Modifier le post' : 'Nouveau post'}
          </h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => update('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Titre du post"
              required
            />
          </div>

          {/* Type + Plateforme */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => update('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="agence">Agence</option>
                <option value="perso">Personnel</option>
                <option value="client">Client</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plateforme *</label>
              <select
                value={formData.platform}
                onChange={(e) => update('platform', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="linkedin">LinkedIn</option>
                <option value="instagram">Instagram</option>
                <option value="newsletter">Newsletter</option>
                <option value="multi">Multi-plateforme</option>
              </select>
            </div>
          </div>

          {/* Responsable + Client */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsable</label>
              <select
                value={formData.responsible_user_id}
                onChange={(e) => update('responsible_user_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Non assigné</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            {formData.type === 'client' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => update('client_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.company}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Angle stratégique */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Angle stratégique</label>
            <input
              type="text"
              value={formData.strategic_angle}
              onChange={(e) => update('strategic_angle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ex: Positionnement expertise SEO"
            />
          </div>

          {/* Hook */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hook</label>
            <input
              type="text"
              value={formData.hook}
              onChange={(e) => update('hook', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="L'accroche du post"
            />
          </div>

          {/* Contenu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenu</label>
            <textarea
              value={formData.content}
              onChange={(e) => update('content', e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Contenu complet du post..."
            />
          </div>

          {/* Objectif */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Objectif</label>
            <input
              type="text"
              value={formData.objective}
              onChange={(e) => update('objective', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ex: Générer 10 leads qualifiés"
            />
          </div>

          {/* Date programmation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date de publication</label>
            <input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => update('scheduled_at', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim() || loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'En cours...' : post ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 4: Create PostDetail.tsx**

```typescript
import { useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, Calendar, Target, Zap, FileText, MessageSquare } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { useSupabasePostAssets, useSupabasePostComments } from '../../../hooks/supabase';
import { CommentThread } from './CommentThread';
import { AssetManager } from './AssetManager';
import type { PostRow } from '../../../types/supabase-types';
import type { CommunicationData } from '../hooks/useCommunicationData';

interface PostDetailProps {
  post: PostRow;
  data: CommunicationData;
  onBack: () => void;
  onEdit: (post: PostRow) => void;
  onDelete: (id: string) => void;
}

const statusLabels: Record<string, string> = {
  idea: 'Idée',
  drafting: 'En rédaction',
  review: 'En validation',
  scheduled: 'Programmé',
  published: 'Publié',
};

const statusColors: Record<string, string> = {
  idea: 'bg-amber-100 text-amber-700',
  drafting: 'bg-blue-100 text-blue-700',
  review: 'bg-purple-100 text-purple-700',
  scheduled: 'bg-indigo-100 text-indigo-700',
  published: 'bg-green-100 text-green-700',
};

const typeLabels: Record<string, string> = {
  agence: 'Agence',
  perso: 'Personnel',
  client: 'Client',
};

const platformLabels: Record<string, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  newsletter: 'Newsletter',
  multi: 'Multi-plateforme',
};

export function PostDetail({ post, data, onBack, onEdit, onDelete }: PostDetailProps) {
  const { data: assets, refetch: refetchAssets } = useSupabasePostAssets(post.id);
  const { data: comments, refetch: refetchComments } = useSupabasePostComments(post.id);

  const currentUserId = data.currentUser?.id || '';

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const responsibleUser = data.users.find(u => u.id === post.responsible_user_id);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Retour</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(post)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            Modifier
          </button>
          <button
            onClick={() => {
              if (confirm('Supprimer ce post ?')) onDelete(post.id);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Title + Meta */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{post.title}</h1>
          <Badge className={statusColors[post.status]}>
            {statusLabels[post.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{typeLabels[post.type]}</span>
          <span>·</span>
          <span>{platformLabels[post.platform]}</span>
          {responsibleUser && (
            <>
              <span>·</span>
              <span>{responsibleUser.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Content sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Angle stratégique */}
        {post.strategic_angle && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Angle stratégique</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{post.strategic_angle}</p>
          </div>
        )}

        {/* Hook */}
        {post.hook && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Hook</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{post.hook}"</p>
          </div>
        )}

        {/* Objectif */}
        {post.objective && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-600" />
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Objectif</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{post.objective}</p>
          </div>
        )}

        {/* Dates */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Dates</h3>
          </div>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <p>Programmé : {formatDate(post.scheduled_at)}</p>
            <p>Publié : {formatDate(post.published_at)}</p>
            <p>Créé : {formatDate(post.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Contenu complet */}
      {post.content && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Contenu</h3>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{post.content}</p>
          </div>
        </div>
      )}

      {/* Assets */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <AssetManager
          assets={assets}
          onUpload={async (file, type) => {
            await data.uploadAsset(post.id, file, type);
            refetchAssets();
          }}
          onAddExternal={async (url, type, fileName) => {
            await data.addExternalAsset(post.id, url, type, fileName);
            refetchAssets();
          }}
          onDelete={async (id, storagePath) => {
            await data.deleteAsset(id, storagePath);
            refetchAssets();
          }}
          loading={data.crudLoading}
        />
      </div>

      {/* Comments */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <CommentThread
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={async (comment) => {
            await data.addComment(post.id, currentUserId, comment);
            refetchComments();
          }}
          onDeleteComment={async (id) => {
            await data.deleteComment(id);
            refetchComments();
          }}
          loading={data.crudLoading}
        />
      </div>
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add src/modules/Communication/components/PostDetail.tsx src/modules/Communication/components/PostForm.tsx src/modules/Communication/components/CommentThread.tsx src/modules/Communication/components/AssetManager.tsx
git commit -m "feat(communication): add post detail, form, comments and asset manager"
```

---

## Task 9: Create Module Header + Filters + Page + Index

**Files:**
- Create: `src/modules/Communication/components/CommunicationHeader.tsx`
- Create: `src/modules/Communication/components/CommunicationFilters.tsx`
- Create: `src/modules/Communication/CommunicationPage.tsx`
- Create: `src/modules/Communication/index.tsx`

**Step 1: Create CommunicationHeader.tsx**

```typescript
import { Plus, LayoutGrid, Calendar, BarChart3 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { ViewMode } from '../types';

interface CommunicationHeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onNewPost: () => void;
  postCount: number;
}

export function CommunicationHeader({
  currentView,
  onViewChange,
  onNewPost,
  postCount,
}: CommunicationHeaderProps) {
  const views = [
    { id: 'kanban' as ViewMode, label: 'Kanban', icon: LayoutGrid },
    { id: 'calendar' as ViewMode, label: 'Calendrier', icon: Calendar },
    { id: 'dashboard' as ViewMode, label: 'Dashboard', icon: BarChart3 },
  ];

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Communication</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {postCount} post{postCount !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* View switcher */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {views.map(view => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => onViewChange(view.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                  currentView === view.id
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{view.label}</span>
              </button>
            );
          })}
        </div>

        {/* New post button */}
        <button
          onClick={onNewPost}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau post</span>
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Create CommunicationFilters.tsx**

```typescript
import { Filter, X } from 'lucide-react';
import type { PostType, PostPlatform } from '../../../types/supabase-types';

interface CommunicationFiltersProps {
  typeFilter: PostType | 'all';
  platformFilter: PostPlatform | 'all';
  responsibleFilter: string;
  searchQuery: string;
  users: { id: string; name: string }[];
  onTypeChange: (type: PostType | 'all') => void;
  onPlatformChange: (platform: PostPlatform | 'all') => void;
  onResponsibleChange: (userId: string) => void;
  onSearchChange: (query: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function CommunicationFilters({
  typeFilter, platformFilter, responsibleFilter, searchQuery,
  users,
  onTypeChange, onPlatformChange, onResponsibleChange, onSearchChange, onReset,
  hasActiveFilters,
}: CommunicationFiltersProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-gray-500">
        <Filter className="w-4 h-4" />
      </div>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Rechercher..."
        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-48"
      />

      <select
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value as PostType | 'all')}
        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="all">Tous types</option>
        <option value="agence">Agence</option>
        <option value="perso">Personnel</option>
        <option value="client">Client</option>
      </select>

      <select
        value={platformFilter}
        onChange={(e) => onPlatformChange(e.target.value as PostPlatform | 'all')}
        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="all">Toutes plateformes</option>
        <option value="linkedin">LinkedIn</option>
        <option value="instagram">Instagram</option>
        <option value="newsletter">Newsletter</option>
        <option value="multi">Multi</option>
      </select>

      <select
        value={responsibleFilter}
        onChange={(e) => onResponsibleChange(e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="all">Tous responsables</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-3 h-3" />
          Réinitialiser
        </button>
      )}
    </div>
  );
}
```

**Step 3: Create CommunicationPage.tsx**

```typescript
import { useState } from 'react';
import { CommunicationHeader } from './components/CommunicationHeader';
import { CommunicationFilters } from './components/CommunicationFilters';
import { KanbanBoard } from './components/KanbanBoard';
import { CalendarView } from './components/CalendarView';
import { DashboardView } from './components/DashboardView';
import { PostDetail } from './components/PostDetail';
import { PostForm } from './components/PostForm';
import type { CommunicationData } from './hooks/useCommunicationData';
import type { ViewMode, PostFormData } from './types';
import type { PostRow } from '../../types/supabase-types';

interface CommunicationPageProps {
  data: CommunicationData;
  filteredPosts: PostRow[];
  typeFilter: any;
  platformFilter: any;
  responsibleFilter: string;
  searchQuery: string;
  setTypeFilter: (v: any) => void;
  setPlatformFilter: (v: any) => void;
  setResponsibleFilter: (v: string) => void;
  setSearchQuery: (v: string) => void;
  resetFilters: () => void;
}

export function CommunicationPage({
  data,
  filteredPosts,
  typeFilter, platformFilter, responsibleFilter, searchQuery,
  setTypeFilter, setPlatformFilter, setResponsibleFilter, setSearchQuery,
  resetFilters,
}: CommunicationPageProps) {
  const [currentView, setCurrentView] = useState<ViewMode>('kanban');
  const [selectedPost, setSelectedPost] = useState<PostRow | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingPost, setEditingPost] = useState<PostRow | null>(null);

  const hasActiveFilters = typeFilter !== 'all' || platformFilter !== 'all' || responsibleFilter !== 'all' || searchQuery !== '';

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
  };

  const handleUpdatePost = async (formData: PostFormData) => {
    if (!editingPost) return;
    const result = await data.updatePost(editingPost.id, {
      title: formData.title,
      type: formData.type,
      platform: formData.platform,
      strategic_angle: formData.strategic_angle || null,
      hook: formData.hook || null,
      content: formData.content || null,
      objective: formData.objective || null,
      scheduled_at: formData.scheduled_at || null,
      responsible_user_id: formData.responsible_user_id || null,
      client_id: formData.client_id || null,
    });
    if (result.success) {
      setEditingPost(null);
      data.refetchPosts();
    }
  };

  const handleDeletePost = async (id: string) => {
    const result = await data.deletePost(id);
    if (result.success) {
      setSelectedPost(null);
      data.refetchPosts();
    }
  };

  // If a post is selected, show detail view
  if (selectedPost) {
    // Re-fetch the post from current data to get latest version
    const currentPost = data.posts.find(p => p.id === selectedPost.id) || selectedPost;
    return (
      <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <PostDetail
          post={currentPost}
          data={data}
          onBack={() => setSelectedPost(null)}
          onEdit={(post) => { setSelectedPost(null); setEditingPost(post); }}
          onDelete={handleDeletePost}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <CommunicationHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        onNewPost={() => setShowPostForm(true)}
        postCount={data.posts.length}
      />

      <CommunicationFilters
        typeFilter={typeFilter}
        platformFilter={platformFilter}
        responsibleFilter={responsibleFilter}
        searchQuery={searchQuery}
        users={data.users.map(u => ({ id: u.id, name: u.name }))}
        onTypeChange={setTypeFilter}
        onPlatformChange={setPlatformFilter}
        onResponsibleChange={setResponsibleFilter}
        onSearchChange={setSearchQuery}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Views */}
      {currentView === 'kanban' && (
        <KanbanBoard
          posts={filteredPosts}
          onRefresh={data.refetchPosts}
          onViewPost={setSelectedPost}
          onEditPost={(post) => setEditingPost(post)}
          onDeletePost={(post) => {
            if (confirm('Supprimer ce post ?')) handleDeletePost(post.id);
          }}
        />
      )}

      {currentView === 'calendar' && (
        <CalendarView
          posts={filteredPosts}
          onPostClick={setSelectedPost}
        />
      )}

      {currentView === 'dashboard' && (
        <DashboardView
          posts={filteredPosts}
          onPostClick={setSelectedPost}
        />
      )}

      {/* Post Form Modal */}
      {(showPostForm || editingPost) && (
        <PostForm
          post={editingPost}
          users={data.users.map(u => ({ id: u.id, name: u.name }))}
          clients={data.contacts.map(c => ({ id: c.id, name: c.name, company: c.company }))}
          onSubmit={editingPost ? handleUpdatePost : handleCreatePost}
          onCancel={() => { setShowPostForm(false); setEditingPost(null); }}
          loading={data.crudLoading}
        />
      )}
    </div>
  );
}
```

**Step 4: Create index.tsx**

Follow the CRM module pattern:

```typescript
import { useCommunicationData } from './hooks/useCommunicationData';
import { useCommunicationFilters } from './hooks/useCommunicationFilters';
import { CommunicationPage } from './CommunicationPage';
import { Loader2 } from 'lucide-react';

export function Communication() {
  const data = useCommunicationData();
  const filters = useCommunicationFilters(data.posts);

  if (data.postsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <CommunicationPage
      data={data}
      filteredPosts={filters.filteredPosts}
      typeFilter={filters.typeFilter}
      platformFilter={filters.platformFilter}
      responsibleFilter={filters.responsibleFilter}
      searchQuery={filters.searchQuery}
      setTypeFilter={filters.setTypeFilter}
      setPlatformFilter={filters.setPlatformFilter}
      setResponsibleFilter={filters.setResponsibleFilter}
      setSearchQuery={filters.setSearchQuery}
      resetFilters={filters.resetFilters}
    />
  );
}
```

**Step 5: Commit**

```bash
git add src/modules/Communication/
git commit -m "feat(communication): add module page, header, filters and index"
```

---

## Task 10: Integrate into Layout + Sidebar

**Files:**
- Modify: `src/components/layout/Layout.tsx` (add lazy import + switch case + permission)
- Modify: `src/components/layout/Sidebar.tsx` (add Communication section)

**Step 1: Add to Layout.tsx**

Add lazy import after line 24:
```typescript
const Communication = lazy(() => import('../../modules/Communication').then(m => ({ default: m.Communication })));
```

Add to `modulePermissions` object (around line 108):
```typescript
'communication': 'can_view_communication',
```

Add to switch statement (before default, around line 168):
```typescript
case 'communication':
  return wrappedComponent(Communication);
```

**Step 2: Add to Sidebar.tsx**

Import `MessageSquare` icon (add to imports at line 1):
```typescript
import { ..., MessageSquare } from 'lucide-react';
```

Add new section in `navigationItems` array (after the `projects` section, before `finance`):
```typescript
{
  section: 'communication',
  title: 'Communication',
  icon: MessageSquare,
  priority: 4,
  color: 'from-orange-500 to-orange-600',
  items: [
    { id: 'communication', label: 'Communication', icon: MessageSquare, permission: 'can_view_communication', description: 'Gestion de contenu' }
  ]
},
```

**Step 3: Commit**

```bash
git add src/components/layout/Layout.tsx src/components/layout/Sidebar.tsx
git commit -m "feat(communication): integrate module into Layout and Sidebar navigation"
```

---

## Task 11: Add permission column + verify build

**Files:**
- Remote: Supabase migration for permission column

**Step 1: Add permission column**

Use `apply_migration` with:
```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS can_view_communication BOOLEAN DEFAULT true;
```

Migration name: `add_communication_permission`

**Step 2: Run build**

```bash
npm run build
```

Fix any TypeScript errors that arise.

**Step 3: Test dev server**

```bash
npm run dev
```

Navigate to Communication module, verify:
- Sidebar shows Communication section
- Kanban view renders with 5 columns
- Can create a post
- Can drag & drop between columns
- Can switch to Calendar view
- Can switch to Dashboard view
- Post detail panel works

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(communication): add permission and fix build issues"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Supabase migration (3 tables + indexes + RLS + storage) | Remote |
| 2 | TypeScript types | 2 files |
| 3 | Supabase hooks (query + CRUD) | 3 files |
| 4 | Module hooks (data + filters + actions + drag-drop) | 4 files |
| 5 | Kanban components (board + column + card + sortable) | 4 files |
| 6 | Calendar view | 1 file |
| 7 | Dashboard view | 1 file |
| 8 | Post detail + form + comments + assets | 4 files |
| 9 | Page composition + header + filters + index | 4 files |
| 10 | Layout + Sidebar integration | 2 files |
| 11 | Permission column + build verification | Remote + verify |

**Total: ~25 files, 0 new dependencies (all already installed)**
