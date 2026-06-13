// src/lib/shortCode.ts
// Alphabet sans caractères ambigus (0/O, I/l, 1 exclus)
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateShortCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => CHARS[b % CHARS.length])
    .join('')
}
