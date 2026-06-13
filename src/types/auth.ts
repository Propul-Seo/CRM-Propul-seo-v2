import { UserRole } from './index';

// Authentication specific types
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  profile?: UserProfile;
  session?: AuthSession;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: AuthUser;
}

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
  phone?: string;
  company?: string;
  position?: string;
  bio?: string;
  timezone: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  role?: UserRole;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordUpdateRequest {
  currentPassword: string;
  newPassword: string;
}