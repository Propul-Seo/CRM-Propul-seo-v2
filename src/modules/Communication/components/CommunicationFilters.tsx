import { Filter, X, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import type { PostType, PostPlatform, PostStatus } from '../../../types/supabase-types';
import type { SortOrder } from '../hooks/useCommunicationFilters';

interface CommunicationFiltersProps {
  typeFilter: PostType | 'all';
  platformFilter: PostPlatform | 'all';
  responsibleFilter: string;
  statusFilter: PostStatus | 'all';
  searchQuery: string;
  sortOrder: SortOrder;
  users: { id: string; name: string }[];
  onTypeChange: (type: PostType | 'all') => void;
  onPlatformChange: (platform: PostPlatform | 'all') => void;
  onResponsibleChange: (userId: string) => void;
  onStatusChange: (status: PostStatus | 'all') => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: SortOrder) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function CommunicationFilters({
  typeFilter, platformFilter, responsibleFilter, statusFilter, searchQuery, sortOrder, users,
  onTypeChange, onPlatformChange, onResponsibleChange, onStatusChange, onSearchChange, onSortChange, onReset, hasActiveFilters,
}: CommunicationFiltersProps) {
  return (
    <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-1 md:pb-0 md:flex-wrap scrollbar-hide">
      <div className="flex items-center gap-1.5 text-muted-foreground"><Filter className="w-4 h-4" /></div>
      <Input value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder="Rechercher..." className="w-36 md:w-48 h-9 md:h-8 text-sm flex-shrink-0" />
      <NativeSelect value={statusFilter} onChange={(e) => onStatusChange(e.target.value as PostStatus | 'all')} className="h-8 text-sm w-auto">
        <option value="all">Tous statuts</option>
        <option value="idea">Idee</option>
        <option value="drafting">Redaction</option>
        <option value="review">Relecture</option>
        <option value="scheduled">Planifie</option>
        <option value="published">Publie</option>
      </NativeSelect>
      <NativeSelect value={typeFilter} onChange={(e) => onTypeChange(e.target.value as PostType | 'all')} className="h-8 text-sm w-auto">
        <option value="all">Tous types</option>
        <option value="agence">Agence</option>
        <option value="perso">Personnel</option>
        <option value="client">Client</option>
        <option value="informatif">Informatif</option>
      </NativeSelect>
      <NativeSelect value={platformFilter} onChange={(e) => onPlatformChange(e.target.value as PostPlatform | 'all')} className="h-8 text-sm w-auto">
        <option value="all">Toutes plateformes</option>
        <option value="linkedin">LinkedIn</option>
        <option value="instagram">Instagram</option>
        <option value="newsletter">Newsletter</option>
        <option value="multi">Multi</option>
      </NativeSelect>
      <NativeSelect value={responsibleFilter} onChange={(e) => onResponsibleChange(e.target.value)} className="h-8 text-sm w-auto">
        <option value="all">Tous responsables</option>
        {users.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
      </NativeSelect>
      <div className="flex items-center gap-1.5">
        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
        <NativeSelect value={sortOrder} onChange={(e) => onSortChange(e.target.value as SortOrder)} className="h-8 text-sm w-auto">
          <option value="newest">Plus récent</option>
          <option value="oldest">Plus ancien</option>
          <option value="none">Sans tri</option>
        </NativeSelect>
      </div>
      {hasActiveFilters && (
        <button onClick={onReset} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-3 h-3" /> Réinitialiser
        </button>
      )}
    </div>
  );
}
