import { UserCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User { id: string; name: string; email: string }

interface Props {
  assigneeId: string | null;
  users: User[];
  onAssign: (userId: string | null) => void;
}

export function LeadAssign({ assigneeId, users, onAssign }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          Assignation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select
          value={assigneeId || 'none'}
          onValueChange={(v) => onAssign(v === 'none' ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Non assigné" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Non assigné</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
