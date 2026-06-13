import type { TipTapDoc, TipTapNode } from '../types'

/**
 * Walker récursif TipTap JSON → texte plat.
 * Utilisé pour remplir procedures.content_text (indexé en FTS).
 */
export function extractPlainText(doc: TipTapDoc | null | undefined): string {
  if (!doc || !doc.content) return ''
  const parts: string[] = []
  walk(doc.content, parts)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function walk(nodes: TipTapNode[], parts: string[]): void {
  for (const node of nodes) {
    if (typeof node.text === 'string') {
      parts.push(node.text)
    }
    if (node.content && node.content.length > 0) {
      walk(node.content, parts)
    }
    // Ajout d'un saut logique après chaque bloc
    if (isBlock(node.type)) {
      parts.push(' ')
    }
  }
}

function isBlock(type: string): boolean {
  return [
    'paragraph',
    'heading',
    'bulletList',
    'orderedList',
    'listItem',
    'blockquote',
    'codeBlock',
  ].includes(type)
}
