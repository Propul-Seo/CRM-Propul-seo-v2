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

/**
 * Classe de scope à poser sur la racine d'un dialog/sheet admin portalisé
 * (Radix monte au niveau <body>, hors du conteneur de page). En shell CRM,
 * ajoute `ps-theme-dark` pour que les tokens --ps-* passent en sombre et
 * restent lisibles sur le fond sombre du CRM.
 */
export function useAdminPortalScope(): string {
  const { mountedInShell } = useAdminBasePath();
  return mountedInShell ? 'propulspace-portal ps-theme-dark' : 'propulspace-portal';
}
