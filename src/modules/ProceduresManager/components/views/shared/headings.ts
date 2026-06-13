import type { TipTapNode } from '../../../types'
import type { HeadingItem } from './types'

export function slugifyHeading(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function extractHeadings(nodes: TipTapNode[] | undefined): HeadingItem[] {
  if (!nodes) return []
  const seen = new Map<string, number>()
  const result: HeadingItem[] = []
  for (const n of nodes) {
    if (n.type !== 'heading') continue
    const level = (n.attrs?.level as number | undefined) ?? 2
    const text = (n.content ?? [])
      .map((c) => c.text ?? '')
      .join('')
      .trim()
    if (!text) continue
    let id = slugifyHeading(text)
    const count = seen.get(id) ?? 0
    if (count > 0) id = `${id}-${count}`
    seen.set(slugifyHeading(text), count + 1)
    result.push({ id, level, text })
  }
  return result
}

export function readingTime(text: string | null | undefined): number {
  if (!text) return 1
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
