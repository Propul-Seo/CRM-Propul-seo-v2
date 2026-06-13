import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  Calendar,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { useTasks, Task, TaskFormData } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import { useProjects } from '../../hooks/useProjects';

export default function TaskManager() {
  const { 
    tasks, 
    loading: tasksLoading, 
    error: tasksError, 
    createTask, 
    updateTask, 
    deleteTask, 
    completeTask,
    clearError: clearTasksError 
  } = useTasks();

  const { users, loading: usersLoading, error: usersError } = useUsers();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  
  // État de chargement global
  const loading = tasksLoading || usersLoading || projectsLoading;
  
  // Gestion des erreurs
  const error = tasksError || usersError || projectsError;
  const clearError = () => {
    clearTasksError();
    // Les autres hooks n'ont pas de clearError pour l'instant
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    assigned_to: 'none',
    project_id: 'none'
  });

  const filteredTasks = tasks.filter(task => {
    // Exclure les tâches terminées de l'affichage
    if (task.status === 'completed') return false;
    
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Clock;
      case 'pending': return Clock;
      case 'cancelled': return AlertCircle;
      default: return Clock;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error('Le titre est obligatoire');
      return;
    }

    try {
      if (editingTask) {
        // Mise à jour via Supabase
        await updateTask(editingTask.id, formData);
        toast.success('Tâche mise à jour avec succès !');
        setEditingTask(null);
      } else {
        // Création via Supabase
        await createTask(formData);
        toast.success('Tâche créée avec succès !');
      }
      
      resetForm();
      setShowCreateForm(false);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'opération: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      due_date: '',
      assigned_to: '',
      project_id: ''
    });
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || '',
      assigned_to: task.assigned_to || 'none',
      project_id: task.project_id || 'none'
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (taskId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        await deleteTask(taskId);
        toast.success('Tâche supprimée avec succès !');
      } catch (error) {
        console.error('Erreur suppression:', error);
        toast.error('Erreur lors de la suppression: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
      }
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      await completeTask(taskId);
      toast.success('Tâche marquée comme terminée avec succès !');
    } catch (error) {
      console.error('Erreur marquage comme terminée:', error);
      toast.error('Erreur lors du marquage comme terminée: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    resetForm();
    setShowCreateForm(false);
  };

  const getTasksForUser = (userId: string) => {
    return filteredTasks.filter(task => task.assigned_to === userId);
  };

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Tâches</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredTasks.length} tâche{filteredTasks.length !== 1 ? 's' : ''} trouvée{filteredTasks.length !== 1 ? 's' : ''}
          </p>
          {error && (
            <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm">
              {error}
              <Button 
                variant="link" 
                size="sm" 
                className="text-red-700 p-0 h-auto ml-2"
                onClick={clearError}
              >
                ✕
              </Button>
            </div>
          )}
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      {/* Filtres et recherche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher une tâche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="completed">Terminé</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Élevée</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="low">Faible</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filtres
        </Button>
      </div>

      {/* Indicateur des tâches terminées */}
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <span className="text-sm text-green-800">
          Les tâches terminées sont automatiquement archivées et ne sont plus visibles dans cette liste
        </span>
      </div>

      {/* Formulaire de création/édition */}
      {(showCreateForm || editingTask) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as Task['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priorité</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="low">Faible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="due_date">Date limite</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="assigned_to">Assignée à</Label>
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un utilisateur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun utilisateur assigné</SelectItem>
                      {usersLoading ? (
                        <SelectItem value="loading" disabled>Chargement des utilisateurs...</SelectItem>
                      ) : users && users.length > 0 ? (
                        users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || user.email}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-users" disabled>Aucun utilisateur disponible</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {usersError && (
                    <p className="text-sm text-red-600 mt-1">Erreur chargement utilisateurs</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="project_id">Projet</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun projet</SelectItem>
                      {projectsLoading ? (
                        <SelectItem value="loading" disabled>Chargement des projets...</SelectItem>
                      ) : projects && projects.length > 0 ? (
                        projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-projects" disabled>Aucun projet disponible</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {projectsError && (
                    <p className="text-sm text-red-600 mt-1">Erreur chargement projets</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Chargement...' : editingTask ? 'Mettre à jour' : 'Créer'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={editingTask ? handleCancelEdit : () => setShowCreateForm(false)}
                  disabled={loading}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des tâches */}
      <div className="grid gap-4 h-[calc(100vh-400px)] overflow-y-auto" style={{
        gridTemplateColumns: `repeat(${users?.length || 1}, 1fr)`
      }}>
        {/* Colonnes par utilisateur */}
        {users?.map((user) => (
          <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex flex-col h-full min-w-0">
            {/* Header de la colonne */}
            <div className="bg-blue-500 dark:bg-blue-600 text-white rounded-t-lg p-3 -mt-3 -mx-3 mb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm truncate">{user.name}</h3>
                <div className="flex items-center space-x-2">
                  <span className="bg-white text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                    {getTasksForUser(user.id).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Liste des tâches de l'utilisateur */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {getTasksForUser(user.id).map((task) => (
                <div key={task.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 hover:shadow-sm transition-shadow">
                  {/* Titre de la tâche */}
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
                      {task.title}
                    </h4>
                    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(task)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                        title="Modifier"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleComplete(task.id)}
                        className="text-green-600 hover:text-green-700 p-1"
                        title="Marquer comme terminée"
                        disabled={task.status === 'completed'}
                      >
                        <CheckCircle className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Description de la tâche */}
                  {task.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 leading-tight">
                      {task.description}
                    </p>
                  )}

                  {/* Métadonnées de la tâche */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      {/* Priorité */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>
                      
                      {/* Statut */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'pending' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {task.status === 'pending' ? 'En attente' : task.status === 'in_progress' ? 'En cours' : 'Terminée'}
                      </span>
                    </div>
                    
                    {/* Date d'échéance */}
                    {task.due_date && (
                      <span className="text-gray-500 dark:text-gray-400">
                        {new Date(task.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Message si aucune tâche */}
              {getTasksForUser(user.id).length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">Aucune tâche</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Message si aucune tâche */}
      {filteredTasks.length === 0 && !loading && (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
              ? 'Aucune tâche trouvée' 
              : 'Aucune tâche disponible'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Essayez de modifier vos critères de recherche'
              : 'Les tâches seront chargées depuis Supabase une fois la connexion établie'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une tâche
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
