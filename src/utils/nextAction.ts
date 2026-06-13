import { differenceInDays, parseISO } from 'date-fns'

/**
 * Retourne les classes Tailwind pour colorer la date d'échéance.
 * - Rouge  : échéance dépassée ou aujourd'hui
 * - Orange : dans 1-3 jours
 * - Vert   : dans plus de 3 jours
 * - Gris   : pas de date
 */
export function getActionDueColor(due: string | null): string {
  if (!due) return 'text-muted-foreground'
  const days = differenceInDays(parseISO(due), new Date())
  if (days < 0) return 'text-red-400 bg-red-500/10'
  if (days <= 3) return 'text-amber-400 bg-amber-500/10'
  return 'text-green-400 bg-green-500/10'
}
