import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Receipt,
  PenLine,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import type { PortalTab } from '@/modules/EspaceClient/shared/constants';

export interface PortalNavItem {
  key: PortalTab;
  label: string;
  icon: LucideIcon;
  /** Affiché dans la barre mobile (limitée aux entrées principales). */
  primary: boolean;
}

/** Source unique de la navigation du portail (sidebar desktop + barre mobile). */
export const PORTAL_NAV: PortalNavItem[] = [
  { key: 'dashboard',  label: 'Accueil',    icon: LayoutDashboard, primary: true },
  { key: 'project',    label: 'Projet',     icon: FolderKanban,    primary: true },
  { key: 'documents',  label: 'Documents',  icon: FileText,        primary: true },
  { key: 'invoices',   label: 'Factures',   icon: Receipt,         primary: true },
  { key: 'signatures', label: 'Signatures', icon: PenLine,         primary: false },
  { key: 'help',       label: 'Aide',       icon: HelpCircle,      primary: false },
];
