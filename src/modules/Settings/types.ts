import { User as UserType } from '../../hooks/useUsers';

export type { UserType };

export interface PasswordModalState {
  isOpen: boolean;
  userId: string;
  userEmail: string;
}

export interface DeleteModalState {
  isOpen: boolean;
  userId: string;
  userName: string;
  userEmail: string;
}

export interface SettingsProfileReturn {
  currentUserData: UserType | null;
  isLoading: boolean;
  isSaving: boolean;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  loadCurrentUserData: () => Promise<void>;
  saveUserData: () => Promise<void>;
  updateField: (field: keyof UserType, value: UserType[keyof UserType]) => void;
  users: UserType[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  isAdmin: boolean;
}

export interface SettingsAdminReturn {
  updatingPermissions: Set<string>;
  passwordModal: PasswordModalState | null;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  isUpdatingPassword: boolean;
  showOwnPasswordModal: boolean;
  setShowOwnPasswordModal: (v: boolean) => void;
  ownNewPassword: string;
  setOwnNewPassword: (v: string) => void;
  ownConfirmPassword: string;
  setOwnConfirmPassword: (v: string) => void;
  isUpdatingOwnPassword: boolean;
  deleteModal: DeleteModalState | null;
  isDeleting: boolean;
  updateUserPermission: (userId: string, permission: string, value: boolean) => Promise<void>;
  updateUserPassword: () => Promise<void>;
  openPasswordModal: (userId: string, userEmail: string) => void;
  closePasswordModal: () => void;
  updateOwnPassword: () => Promise<void>;
  closeOwnPasswordModal: () => void;
  openDeleteModal: (userId: string, userName: string, userEmail: string) => void;
  closeDeleteModal: () => void;
  handleDeleteUser: () => Promise<void>;
}
