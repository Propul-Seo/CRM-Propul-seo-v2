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
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Chargement...</p>
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
      statusFilter={filters.statusFilter}
      searchQuery={filters.searchQuery}
      sortOrder={filters.sortOrder}
      setTypeFilter={filters.setTypeFilter}
      setPlatformFilter={filters.setPlatformFilter}
      setResponsibleFilter={filters.setResponsibleFilter}
      setStatusFilter={filters.setStatusFilter}
      setSearchQuery={filters.setSearchQuery}
      setSortOrder={filters.setSortOrder}
      resetFilters={filters.resetFilters}
    />
  );
}
