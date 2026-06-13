import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { fr } from 'date-fns/locale';

export const PARIS_TZ = 'Europe/Paris';

export function toParisTime(dateUtc: string | Date) {
  return toZonedTime(dateUtc, PARIS_TZ);
}

export function formatParis(dateUtc: string | Date, fmt = 'dd/MM/yyyy HH:mm') {
  return format(toParisTime(dateUtc), fmt, { timeZone: PARIS_TZ, locale: fr });
}

export function parisToUtc(dateInParis: string | Date) {
  return fromZonedTime(dateInParis, PARIS_TZ);
} 