import { useState, useMemo } from 'react';
import type { PostRow, PostType, PostPlatform, PostStatus } from '../../../types/supabase-types';

export type SortOrder = 'newest' | 'oldest' | 'none';

function getPostDate(post: PostRow): number {
  const date = post.scheduled_at || post.published_at || post.created_at;
  return new Date(date).getTime();
}

export function useCommunicationFilters(posts: PostRow[]) {
  const [typeFilter, setTypeFilter] = useState<PostType | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<PostPlatform | 'all'>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const filteredPosts = useMemo(() => {
    const filtered = posts.filter(post => {
      if (typeFilter !== 'all' && post.type !== typeFilter) return false;
      if (platformFilter !== 'all' && post.platform !== platformFilter) return false;
      if (responsibleFilter !== 'all' && post.responsible_user_id !== responsibleFilter) return false;
      if (statusFilter !== 'all' && post.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = post.title.toLowerCase().includes(q);
        const matchesContent = post.content?.toLowerCase().includes(q);
        const matchesHook = post.hook?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesHook) return false;
      }
      return true;
    });

    if (sortOrder === 'none') return filtered;

    return [...filtered].sort((a, b) => {
      const dateA = getPostDate(a);
      const dateB = getPostDate(b);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [posts, typeFilter, platformFilter, responsibleFilter, statusFilter, searchQuery, sortOrder]);

  const resetFilters = () => {
    setTypeFilter('all');
    setPlatformFilter('all');
    setResponsibleFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setSortOrder('newest');
  };

  return {
    typeFilter, setTypeFilter,
    platformFilter, setPlatformFilter,
    responsibleFilter, setResponsibleFilter,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    sortOrder, setSortOrder,
    filteredPosts,
    resetFilters,
  };
}
