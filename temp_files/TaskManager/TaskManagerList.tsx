import { Task } from './types';

interface TaskManagerListProps {
  tasks: Task[];
  onSelect: (task: Task) => void;
}

export const TaskManagerList: React.FC<TaskManagerListProps> = ({ tasks, onSelect }) => (
  <div>
    <h2>Liste des tâches</h2>
    <ul>
      {tasks.map(task => (
        <li key={task.id}>
          <button onClick={() => onSelect(task)}>{task.title} ({task.status})</button>
        </li>
      ))}
    </ul>
  </div>
); 