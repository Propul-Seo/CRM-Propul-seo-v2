import { Task } from './types';

interface TaskManagerDetailsProps {
  task: Task;
  onClose: () => void;
}

export const TaskManagerDetails: React.FC<TaskManagerDetailsProps> = ({ task, onClose }) => (
  <div>
    <h2>Détails de la tâche</h2>
    <p><strong>Titre :</strong> {task.title}</p>
    <p><strong>Description :</strong> {task.description || 'N/A'}</p>
    <p><strong>Statut :</strong> {task.status}</p>
    <p><strong>Date limite :</strong> {task.dueDate || 'N/A'}</p>
    <p><strong>Assignée à :</strong> {task.assignedTo || 'N/A'}</p>
    <button onClick={onClose}>Fermer</button>
  </div>
); 