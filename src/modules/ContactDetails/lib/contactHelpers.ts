import {
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle,
  Activity,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { isOverdue, isToday } from '../../../utils/frenchDateUtils';
import type { ContactActivity } from '../types';

export const copyToClipboard = async (text: string, type: string) => {
  const { toast } = await import('sonner');
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${type} copié dans le presse-papiers !`);
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    toast.success(`${type} copié dans le presse-papiers !`);
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'prospect': return 'bg-blue-500/20 text-blue-400';
    case 'presentation_envoyee': return 'bg-purple-500/20 text-purple-400';
    case 'meeting_booke': return 'bg-orange-500/20 text-orange-400';
    case 'offre_envoyee': return 'bg-yellow-500/20 text-yellow-400';
    case 'en_attente': return 'bg-surface-2/50 text-foreground';
    case 'signe': return 'bg-green-500/20 text-green-400';
    default: return 'bg-surface-2/50 text-foreground';
  }
};

export const getActivityIcon = (type: ContactActivity['type']) => {
  switch (type) {
    case 'call': return Phone;
    case 'email': return Mail;
    case 'meeting': return Calendar;
    case 'note': return FileText;
    case 'task': return CheckCircle;
    default: return Activity;
  }
};

export const getActivityStatusIcon = (status: ContactActivity['status']) => {
  switch (status) {
    case 'completed': return CheckCircle;
    case 'scheduled': return Clock;
    case 'cancelled': return AlertCircle;
    default: return Clock;
  }
};

export const getActivityStatusColor = (status: ContactActivity['status']) => {
  switch (status) {
    case 'completed': return 'text-green-600';
    case 'scheduled': return 'text-primary';
    case 'cancelled': return 'text-red-600';
    default: return 'text-muted-foreground';
  }
};

export const getDateColor = (activityDate: string, isCompleted: boolean) => {
  if (isCompleted) return 'text-muted-foreground';

  const today = new Date();
  const activity = new Date(activityDate);

  today.setHours(0, 0, 0, 0);
  activity.setHours(0, 0, 0, 0);

  const diffTime = activity.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'text-red-600 font-semibold';
  if (diffDays === 0) return 'text-green-600 font-semibold';
  return 'text-muted-foreground';
};

export const getDateBadge = (activityDate: string, isCompleted: boolean): { label: string; className: string } | null => {
  if (isCompleted) return null;

  if (isOverdue(activityDate)) {
    return { label: 'En retard', className: 'bg-red-500/20 text-red-400' };
  }

  if (isToday(activityDate)) {
    return { label: "Aujourd'hui", className: 'bg-green-500/20 text-green-400' };
  }

  return null;
};
