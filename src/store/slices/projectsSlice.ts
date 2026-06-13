import type { StateCreator } from 'zustand';
import { toast } from 'sonner';
import type { Store, ProjectsSlice, Project } from '../types';

export const createProjectsSlice: StateCreator<Store, [], [], ProjectsSlice> = (set) => ({
  projects: [],

  addProject: (project) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
    };
    set((state) => ({ projects: [...state.projects, newProject] }));
    toast.success('Projet ajouté avec succès');
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map(p =>
        p.id === id ? { ...p, ...updates } : p
      )
    }));
    toast.success('Projet mis à jour');
  },

  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter(p => p.id !== id)
    }));
    toast.success('Projet supprimé');
  },

  archiveProject: (id) => {
    set((state) => ({
      projects: state.projects.map(p =>
        p.id === id ? { ...p, isArchived: true } : p
      )
    }));
    toast.success('Projet archivé');
  },
});
