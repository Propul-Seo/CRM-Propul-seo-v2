import type { TipTapDoc, TipTapNode } from '../types'
import { resignProcedurePath } from './upload-image'

/**
 * Parcours récursif appliquant une transformation sur chaque noeud.
 * Renvoie un nouveau doc (immutable).
 */
function mapNodes(doc: TipTapDoc, fn: (n: TipTapNode) => TipTapNode): TipTapDoc {
  const walk = (nodes: TipTapNode[] | undefined): TipTapNode[] | undefined => {
    if (!nodes) return undefined
    return nodes.map((n) => {
      const next = fn(n)
      if (next.content) {
        return { ...next, content: walk(next.content) }
      }
      return next
    })
  }
  return { ...doc, content: walk(doc.content) }
}

function isHttpUrl(src: string): boolean {
  return /^https?:\/\//i.test(src) || src.startsWith('data:') || src.startsWith('blob:')
}

/**
 * Transforme le contenu pour le stockage : pour chaque image ayant une signed URL,
 * on conserve uniquement le `storagePath` dans `src`. Si l'image n'a pas de
 * storagePath (image externe collée par l'utilisateur), on laisse telle quelle.
 */
export function serializeImagesToPath(doc: TipTapDoc): TipTapDoc {
  return mapNodes(doc, (node) => {
    if (node.type !== 'image') return node
    const attrs = node.attrs ?? {}
    const storagePath = attrs.storagePath as string | undefined
    if (!storagePath) return node
    return {
      ...node,
      attrs: { ...attrs, src: storagePath },
    }
  })
}

/**
 * Transforme le contenu pour l'affichage : pour chaque image dont le `src`
 * n'est pas une URL http(s), on re-signe le path et on remplace le src par
 * l'URL signée fraîche. Les images externes sont laissées intactes.
 */
export async function resolveImagePaths(doc: TipTapDoc): Promise<TipTapDoc> {
  const paths = new Set<string>()
  mapNodes(doc, (node) => {
    if (node.type === 'image') {
      const src = (node.attrs?.src as string | undefined) ?? ''
      if (src && !isHttpUrl(src)) paths.add(src)
    }
    return node
  })
  if (paths.size === 0) return doc

  const entries = await Promise.all(
    Array.from(paths).map(async (p) => [p, await resignProcedurePath(p)] as const)
  )
  const resolved = new Map(entries.filter(([, url]) => !!url) as [string, string][])

  return mapNodes(doc, (node) => {
    if (node.type !== 'image') return node
    const src = (node.attrs?.src as string | undefined) ?? ''
    if (!src || isHttpUrl(src)) return node
    const signed = resolved.get(src)
    if (!signed) return node
    return {
      ...node,
      attrs: { ...node.attrs, src: signed, storagePath: src },
    }
  })
}
