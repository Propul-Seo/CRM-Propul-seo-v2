import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter } from 'lucide-react';
import type { PeriodFilter, PlatformFilter, TypeFilter } from '../types';

interface KPIFiltersBarProps {
  period: PeriodFilter;
  platform: PlatformFilter;
  type: TypeFilter;
  responsibleUserId: string | null;
  users: Array<{ id: string; name: string }>;
  onPeriodChange: (v: PeriodFilter) => void;
  onPlatformChange: (v: PlatformFilter) => void;
  onTypeChange: (v: TypeFilter) => void;
  onResponsibleChange: (v: string | null) => void;
}

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: '12m', label: '12 mois' },
];

const platformOptions: { value: PlatformFilter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'multi', label: 'Multi' },
];

const typeOptions: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'agence', label: 'Agence' },
  { value: 'perso', label: 'Perso' },
  { value: 'client', label: 'Client' },
  { value: 'informatif', label: 'Informatif' },
];

export function KPIFiltersBar({
  period, platform, type, responsibleUserId, users,
  onPeriodChange, onPlatformChange, onTypeChange, onResponsibleChange,
}: KPIFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3 p-3 md:p-4 bg-surface-2 rounded-xl border border-border">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filtres
      </div>

      <Select value={period} onValueChange={(v) => onPeriodChange(v as PeriodFilter)}>
        <SelectTrigger className="w-[110px] md:w-[130px] h-9">
          <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={platform} onValueChange={(v) => onPlatformChange(v as PlatformFilter)}>
        <SelectTrigger className="w-[110px] md:w-[140px] h-9">
          <SelectValue placeholder="Plateforme" />
        </SelectTrigger>
        <SelectContent>
          {platformOptions.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={type} onValueChange={(v) => onTypeChange(v as TypeFilter)}>
        <SelectTrigger className="w-[100px] md:w-[120px] h-9">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {typeOptions.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={responsibleUserId || 'all'}
        onValueChange={(v) => onResponsibleChange(v === 'all' ? null : v)}
      >
        <SelectTrigger className="w-[120px] md:w-[160px] h-9">
          <SelectValue placeholder="Responsable" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          {users.map(u => (
            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
