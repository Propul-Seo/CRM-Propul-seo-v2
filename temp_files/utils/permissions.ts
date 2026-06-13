// Permission management utilities
import React from 'react';
import { UserRole } from '../types';
import { ROLE_PERMISSIONS } from './constants';

export function hasPermission(userRole: UserRole, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

export function hasAnyPermission(userRole: UserRole, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: UserRole, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

export function filterByPermission<T extends { requiredPermission?: string }>(
  items: T[],
  userRole: UserRole
): T[] {
  return items.filter(item => 
    !item.requiredPermission || hasPermission(userRole, item.requiredPermission)
  );
}

// HOC for permission-based component rendering
export function withPermission(
  permission: string,
  fallback?: React.ReactNode
) {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function PermissionWrapper(props: P & { userRole: UserRole }) {
      const { userRole, ...componentProps } = props;
      
      if (!hasPermission(userRole, permission)) {
        return fallback || null;
      }
      
      return React.createElement(Component, componentProps as P);
    };
  };
}