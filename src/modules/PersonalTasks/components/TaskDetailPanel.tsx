import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trash2, Calendar as CalendarIcon, Plus, X,
  CircleDot, Flame, Tag, AlignLeft, Clock,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../components/ui/sheet';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { PRIORITY_LABELS, PRIORITY_COLORS, STATUS_LABELS, getTagColor } from '../types';
import type { PersonalTask, PersonalTaskStatus, PersonalTaskPriority, PersonalTaskUpdate } from '../../../types/personalTasks';

interface TaskDetailPanelProps {
  task: PersonalTask | null;
  open: boolean;
  allTags: string[];
  onClose: () => void;
  onUpdate: (id: string, updates: PersonalTaskUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<boolean>;
}

// ---------------------------------------------------------------------------
// PropertyRow — Notion-style icon + label + value
// ---------------------------------------------------------------------------
function PropertyRow({ icon: Icon, label, children }: {
  icon: typeof CircleDot; label: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 min-h-[36px] group/prop">
      <div className="flex items-center gap-2 w-[110px] shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
        <span className="text-xs text-muted-foreground/70 font-medium">{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ===========================================================================

export function TaskDetailPanel({ task, open, allTags, onClose, onUpdate, onDelete }: TaskDetailPanelProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<PersonalTaskStatus>('todo');
  const [priority, setPriority] = useState<PersonalTaskPriority>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const newTagRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setTags(task.tags || []);
      setDeadline(task.deadline || '');
      setConfirmDelete(false);
    }
  }, [task]);

  const handleSave = useCallback(async (updates: PersonalTaskUpdate) => {
    if (task) await onUpdate(task.id, updates);
  }, [task, onUpdate]);

  if (!task) return null;

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) handleSave({ title: title.trim() });
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
  };

  const handleDescriptionBlur = () => {
    if (description !== (task.description || '')) handleSave({ description: description || null });
  };

  const toggleTag = (tag: string) => {
    const newTags = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag];
    setTags(newTags);
    handleSave({ tags: newTags });
  };

  const handleAddNewTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      const newTags = [...tags, trimmed];
      setTags(newTags);
      handleSave({ tags: newTags });
    }
    setNewTagInput('');
    setShowNewTagInput(false);
  };

  const suggestedTags = allTags.filter(t => !tags.includes(t));

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const deleted = await onDelete(task.id);
    if (deleted) onClose();
  };

  const isOverdue = deadline && new Date(deadline) < new Date() && status !== 'done';

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) { onClose(); setConfirmDelete(false); } }}>
      <SheetContent side="right" className="w-[420px] sm:w-[460px] bg-surface-1 border-border/20 overflow-y-auto p-0">
        {/* Priority accent bar */}
        <div className={`h-[3px] w-full ${PRIORITY_COLORS[priority]}`} style={{ opacity: 0.7 }} />

        <SheetHeader className="sr-only">
          <SheetTitle>Detail de la tache</SheetTitle>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Title — large editable */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="text-lg font-semibold bg-transparent border-none shadow-none px-0 h-auto focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/40"
            placeholder="Titre de la tache"
          />

          {/* Properties block */}
          <div className="space-y-1 py-3 border-y border-border/15">
            {/* Status */}
            <PropertyRow icon={CircleDot} label="Statut">
              <Select value={status} onValueChange={(v: PersonalTaskStatus) => { setStatus(v); handleSave({ status: v }); }}>
                <SelectTrigger className="h-8 text-sm bg-transparent border-none shadow-none hover:bg-surface-2/50 transition-colors px-2 -ml-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PropertyRow>

            {/* Priority */}
            <PropertyRow icon={Flame} label="Priorite">
              <Select value={priority} onValueChange={(v: PersonalTaskPriority) => { setPriority(v); handleSave({ priority: v }); }}>
                <SelectTrigger className="h-8 text-sm bg-transparent border-none shadow-none hover:bg-surface-2/50 transition-colors px-2 -ml-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[priority]}`} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[key]}`} />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PropertyRow>

            {/* Deadline */}
            <PropertyRow icon={CalendarIcon} label="Echeance">
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => { setDeadline(e.target.value); handleSave({ deadline: e.target.value || null }); }}
                  className={`h-8 text-sm bg-transparent border-none shadow-none hover:bg-surface-2/50 transition-colors px-2 -ml-2 ${
                    isOverdue ? 'text-red-400' : ''
                  }`}
                />
                {deadline && (
                  <button
                    onClick={() => { setDeadline(''); handleSave({ deadline: null }); }}
                    className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </PropertyRow>

            {/* Tags */}
            <PropertyRow icon={Tag} label="Tags">
              <div className="flex flex-wrap items-center gap-1.5 py-1">
                {tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={`text-[11px] px-2 py-0.5 border ${getTagColor(tag)} flex items-center gap-1 cursor-default`}
                  >
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                      onClick={() => toggleTag(tag)}
                    />
                  </Badge>
                ))}
                {showNewTagInput ? (
                  <Input
                    ref={newTagRef}
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddNewTag();
                      if (e.key === 'Escape') { setNewTagInput(''); setShowNewTagInput(false); }
                    }}
                    onBlur={handleAddNewTag}
                    placeholder="Tag..."
                    className="h-6 w-20 text-xs bg-surface-2/50 border-border/30 px-1.5"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => { setShowNewTagInput(true); setTimeout(() => newTagRef.current?.focus(), 50); }}
                    className="flex items-center gap-0.5 text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-surface-2/50"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </div>
            </PropertyRow>

            {/* Created at */}
            <PropertyRow icon={Clock} label="Creee le">
              <span className="text-sm text-muted-foreground/60">
                {new Date(task.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </PropertyRow>
          </div>

          {/* Suggested tags */}
          {suggestedTags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-medium">Tags suggeres</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedTags.map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer text-[10px] px-2 py-0.5 border bg-transparent text-muted-foreground/40 border-border/20 hover:bg-surface-2/50 hover:text-muted-foreground transition-all"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlignLeft className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground/70 font-medium">Description</span>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Ajouter une description..."
              className="min-h-[120px] bg-surface-2/30 border-border/15 resize-none text-sm leading-relaxed placeholder:text-muted-foreground/25 focus:bg-surface-2/50 transition-colors"
            />
          </div>

          {/* Delete — with confirmation */}
          <div className="pt-3 border-t border-border/10">
            <Button
              variant="ghost"
              className={`w-full transition-all ${
                confirmDelete
                  ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300'
                  : 'text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/5'
              }`}
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {confirmDelete ? 'Confirmer la suppression' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
