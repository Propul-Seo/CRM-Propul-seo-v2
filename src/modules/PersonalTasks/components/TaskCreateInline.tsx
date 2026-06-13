import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { PersonalTaskStatus } from '../../../types/personalTasks';

interface TaskCreateInlineProps {
  status: PersonalTaskStatus;
  onCreateTask: (title: string, status: PersonalTaskStatus) => void;
}

export function TaskCreateInline({ status, onCreateTask }: TaskCreateInlineProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (trimmed) {
      onCreateTask(trimmed, status);
      setTitle('');
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setTitle('');
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-2/50 rounded-md transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Ajouter
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleSubmit}
      placeholder="Titre de la tâche..."
      className="w-full px-2 py-1.5 text-xs bg-surface-2/50 border border-border/30 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
    />
  );
}
