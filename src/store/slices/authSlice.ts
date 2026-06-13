import type { StateCreator } from 'zustand';
import type { Store, AuthSlice } from '../types';

export const createAuthSlice: StateCreator<Store, [], [], AuthSlice> = (set, get) => ({
  // Security - Initial state (kept for backward compatibility)
  accessCode: '0000',
  isAccessGranted: true, // Always granted when using Supabase auth
  currentUser: null,

  // Security actions
  setAccessCode: (code) => set({ accessCode: code }),
  grantAccess: () => set({ isAccessGranted: true }),
  verifyAccessCode: (code) => {
    const state = get();
    return code === state.accessCode;
  },

  // User management
  setCurrentUser: (user) => set({ currentUser: user }),

  // Logout
  logout: () => set({
    currentUser: null,
    isAccessGranted: false,
  }),
});
