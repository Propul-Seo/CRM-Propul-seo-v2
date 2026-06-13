import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateShortCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => CHARS[b % CHARS.length])
    .join('')
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
