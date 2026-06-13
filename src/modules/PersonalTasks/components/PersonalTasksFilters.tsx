import { Search, X, ArrowUpDown, CalendarClock } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { PRIORITY_LABELS } from '../types';
import type { PersonalTaskPriority } from '../../../types/personalTasks';
import type { SortBy, DeadlineFilter } from '../hooks/usePersonalTasksFilters';

interface PersonalTasksFiltersProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  tagFilter: string;
  setTagFilter: (v: string) => void;
  priorityFilter: PersonalTaskPriority | 'all';
  setPriorityFilter: (v: PersonalTaskPriority | 'all') => void;
  deadlineFilter: DeadlineFilter;
  setDeadlineFilter: (v: DeadlineFilter) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
  allTags: string[];
  hasActiveFilters: boolean;
  resetFilters: () => void;
}

const SORT_OPTIONS: Record<SortBy, string> = {
  none: 'Aucun tri',
  deadline: 'Date d\'échéance',
  tag: 'Tag (A→Z)',
  priority: 'Priorité (urgent→basse)',
};

const DEADLINE_OPTIONS: Record<DeadlineFilter, string> = {
  all: 'Toutes les dates',
  overdue: 'En retard',
  this_week: 'Cette semaine',
  this_month: 'Ce mois',
  no_deadline: 'Sans échéance',
};

export function PersonalTasksFilters({
  searchQuery, setSearchQuery,
  tagFilter, setTagFilter,
  priorityFilter, setPriorityFilter,
  deadlineFilter, setDeadlineFilter,
  sortBy, setSortBy,
  allTags, hasActiveFilters, resetFilters,
}: PersonalTasksFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-surface-2 border-border/30"
        />
      </div>

      {/* Tag filter */}
      <Select value={tagFilter} onValueChange={setTagFilter}>
        <SelectTrigger className="w-[150px] bg-surface-2 border-border/30">
          <SelectValue placeholder="Tag" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les tags</SelectItem>
          {allTags.map(tag => (
            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority filter */}
      <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PersonalTaskPriority | 'all')}>
        <SelectTrigger className="w-[150px] bg-surface-2 border-border/30">
          <SelectValue placeholder="Priorité" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes</SelectItem>
          {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Deadline filter */}
      <Select value={deadlineFilter} onValueChange={(v) => setDeadlineFilter(v as DeadlineFilter)}>
        <SelectTrigger className="w-[160px] bg-surface-2 border-border/30">
          <CalendarClock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
          <SelectValue placeholder="Échéance" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(DEADLINE_OPTIONS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
        <SelectTrigger className="w-[180px] bg-surface-2 border-border/30">
          <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
          <SelectValue placeholder="Trier par" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SORT_OPTIONS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4 mr-1" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
