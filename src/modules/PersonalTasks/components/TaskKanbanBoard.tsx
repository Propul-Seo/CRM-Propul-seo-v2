import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, MeasuringStrategy } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { TaskKanbanColumn } from './TaskKanbanColumn';
import { TaskCard } from './TaskCard';
import { usePersonalTasksDragDrop } from '../hooks/usePersonalTasksDragDrop';
import type { PersonalTask, PersonalTaskStatus } from '../../../types/personalTasks';

interface TaskKanbanBoardProps {
  tasks: PersonalTask[];
  onRefresh: () => void;
  onClickTask: (task: PersonalTask) => void;
  onCreateTask: (title: string, status: PersonalTaskStatus) => void;
  onToggleStatus: (id: string, done: boolean) => void;
}

export function TaskKanbanBoard({ tasks, onRefresh, onClickTask, onCreateTask, onToggleStatus }: TaskKanbanBoardProps) {
  const { columns, activeTask, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel } = usePersonalTasksDragDrop({ initialTasks: tasks, onUpdate: onRefresh });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const measuring = { droppable: { strategy: MeasuringStrategy.Always } };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} measuring={measuring} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <div className="flex gap-3 overflow-x-auto pb-4 h-full">
        {columns.map(column => (
          <TaskKanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            icon={column.icon}
            color={column.color}
            textColor={column.textColor}
            tasks={column.tasks}
            onClickTask={onClickTask}
            onCreateTask={onCreateTask}
            onToggleStatus={onToggleStatus}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
