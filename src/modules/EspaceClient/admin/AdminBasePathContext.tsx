import { createContext, useContext, type ReactNode } from 'react';

interface AdminBasePathValue {
  /** Préfixe d'URL sous lequel l'app admin est montée (ex. '/admin/propulspace' ou '/portails'). */
  basePath: string;
  /** true quand l'app admin est rendue à l'intérieur du shell CRM (thème sombre, pas de top-nav propre). */
  mountedInShell: boolean;
}

const DEFAULT: AdminBasePathValue = {
  basePath: '/admin/propulspace',
  mountedInShell: false,
};

const AdminBasePathContext = createContext<AdminBasePathValue>(DEFAULT);

export function AdminBasePathProvider({
  basePath,
  mountedInShell,
  children,
}: AdminBasePathValue & { children: ReactNode }) {
  return (
    <AdminBasePathContext.Provider value={{ basePath, mountedInShell }}>
      {children}
    </AdminBasePathContext.Provider>
  );
}

export function useAdminBasePath(): AdminBasePathValue {
  return useContext(AdminBasePathContext);
}
