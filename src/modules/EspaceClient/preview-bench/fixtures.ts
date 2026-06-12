/**
 * BANC D'ESSAI JETABLE — variantes V3 du portail client.
 * Données factices réalistes pour comparer les variantes sans Supabase.
 * À SUPPRIMER une fois les variantes gagnantes câblées (cf. mémoire
 * « variant-previews-react-in-project »).
 */
import type { InvoiceStatus, ProjectStepStatus } from '@/modules/EspaceClient/shared/types/portal.types';

export interface BenchStep {
  id: string;
  title: string;
  description: string;
  status: ProjectStepStatus;
  /** Date d'échéance ou de complétion (ISO) selon le statut. */
  date: string | null;
}

export interface BenchInvoice {
  id: string;
  invoice_number: string;
  label: string;
  amount_ttc: number;
  status: InvoiceStatus;
  issued_at: string;
  due_date: string | null;
  paid_at: string | null;
}

export interface BenchData {
  project: {
    name: string;
    presta: string;
    /** Avancement global 0-100. */
    progress: number;
    startedAt: string;
    estimatedEnd: string;
  };
  referent: { name: string; role: string };
  steps: BenchStep[];
  invoices: BenchInvoice[];
  counts: { documents: number; pendingSignatures: number };
  /** Prochaine action attendue côté client (cœur de la promesse produit). */
  nextAction: { title: string; detail: string; cta: string };
}

export const BENCH_DATA: BenchData = {
  project: {
    name: 'Refonte site + SEO local',
    presta: 'Site vitrine & référencement',
    progress: 62,
    startedAt: '2026-04-14',
    estimatedEnd: '2026-07-30',
  },
  referent: { name: 'Clément Mariotte', role: 'Chef de projet' },
  steps: [
    { id: 's1', title: 'Cadrage & brief', description: 'Atelier de lancement et collecte des contenus.', status: 'completed', date: '2026-04-21' },
    { id: 's2', title: 'Maquettes', description: 'Direction artistique et maquettes des pages clés.', status: 'completed', date: '2026-05-12' },
    { id: 's3', title: 'Développement', description: 'Intégration du site et des parcours.', status: 'in_progress', date: '2026-06-24' },
    { id: 's4', title: 'Contenus & SEO', description: 'Rédaction optimisée et maillage interne.', status: 'upcoming', date: '2026-07-08' },
    { id: 's5', title: 'Recette & mise en ligne', description: 'Tests, corrections et lancement.', status: 'upcoming', date: '2026-07-28' },
  ],
  invoices: [
    { id: 'f1', invoice_number: 'F-2026-0412', label: 'Acompte 40 % — refonte site', amount_ttc: 3840, status: 'paid', issued_at: '2026-04-15', due_date: '2026-04-30', paid_at: '2026-04-18' },
    { id: 'f2', invoice_number: 'F-2026-0518', label: 'Jalon maquettes validées', amount_ttc: 2880, status: 'paid', issued_at: '2026-05-15', due_date: '2026-05-31', paid_at: '2026-05-29' },
    { id: 'f3', invoice_number: 'F-2026-0610', label: 'Jalon développement', amount_ttc: 1920, status: 'sent', issued_at: '2026-06-10', due_date: '2026-06-25', paid_at: null },
  ],
  counts: { documents: 12, pendingSignatures: 1 },
  nextAction: {
    title: 'Valider les contenus de la page Services',
    detail: 'Clément vous a partagé la rédaction le 10 juin — votre validation débloque l\'intégration.',
    cta: 'Relire et valider',
  },
};

/** Libellés FR des statuts de facture (dot + label, conformes DA). */
export const INVOICE_STATUS_FR: Record<InvoiceStatus, string> = {
  draft: 'Brouillon',
  sent: 'À régler',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
};

export const fmtEUR = (n: number) =>
  n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export const fmtDateFR = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
