/**
 * Transforme un titre en slug URL-friendly ASCII.
 * Pour unicité, on laisse le soin à l'appelant de suffixer si collision.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'procedure'
}
