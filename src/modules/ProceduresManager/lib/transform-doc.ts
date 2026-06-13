/**
 * Post-traitement DOM partagé entre la vue Doc et l'éditeur :
 *  - injection d'ids sur les headings (anchors)
 *  - transformation des blockquotes commençant par un emoji marqueur
 *    en callouts colorés (data-callout=*)
 *
 * Réutilisé par Prose (vue lecture seule) ET ProcedureEditor (édition WYSIWYG)
 * pour que l'éditeur ressemble pixel-perfect à la vue Doc.
 */
import { slugifyHeading } from '../components/views/shared/headings'

export type CalloutVariant =
  | 'tip'         // 💡  violet
  | 'warning'     // ⚠️   ambre
  | 'success'     // ✅  vert
  | 'note'        // ℹ️   cyan
  | 'critical'    // 🟥  rouge       — niveau VITAL (bloquant)
  | 'important'   // 🟧  orange      — niveau IMPORTANT
  | 'recommended' // 🟨  jaune       — niveau RECOMMANDÉ

export const CALLOUT_PATTERNS: Array<{ regex: RegExp; variant: CalloutVariant }> = [
  { regex: /^\s*💡/, variant: 'tip' },
  { regex: /^\s*⚠️/, variant: 'warning' },
  { regex: /^\s*✅/, variant: 'success' },
  { regex: /^\s*ℹ️/, variant: 'note' },
  { regex: /^\s*🟥/, variant: 'critical' },
  { regex: /^\s*🟧/, variant: 'important' },
  { regex: /^\s*🟨/, variant: 'recommended' },
]

export const CALLOUT_LABELS: Record<CalloutVariant, string> = {
  tip:         'Astuce',
  warning:     'Attention',
  success:     'Validation',
  note:        'Note',
  critical:    'Vital',
  important:   'Important',
  recommended: 'Recommandé',
}

const CALLOUT_EMOJI_STRIP = /^\s*(💡|⚠️|✅|ℹ️|🟥|🟧|🟨)\s*/

export function injectHeadingIds(root: HTMLElement) {
  const seen = new Map<string, number>()
  root.querySelectorAll('h1, h2, h3, h4').forEach((el) => {
    const text = el.textContent?.trim() ?? ''
    if (!text) return
    let id = slugifyHeading(text)
    const count = seen.get(id) ?? 0
    if (count > 0) id = `${id}-${count}`
    seen.set(slugifyHeading(text), count + 1)
    el.setAttribute('id', id)
    el.classList.add('scroll-mt-24')
  })
}

export type CalloutStyle = 'docs' | 'magazine' | 'github'

/**
 * Détecte les blockquotes dont le 1er paragraphe commence par un emoji marqueur,
 * pose les data-attributes pour le style CSS, et strip l'emoji du texte.
 */
export function transformCallouts(root: HTMLElement, style: CalloutStyle = 'docs') {
  root.querySelectorAll('blockquote').forEach((bq) => {
    const firstP = bq.querySelector('p')
    if (!firstP) return
    const firstText = firstP.textContent ?? ''
    let matchedVariant: CalloutVariant | null = null
    for (const { regex, variant } of CALLOUT_PATTERNS) {
      if (regex.test(firstText)) { matchedVariant = variant; break }
    }
    if (!matchedVariant) return

    bq.setAttribute('data-callout', matchedVariant)
    bq.setAttribute('data-callout-style', style)
    bq.setAttribute('data-callout-label', CALLOUT_LABELS[matchedVariant])

    // Strip leading emoji from first text node — visuellement remplacé par
    // le label coloré (::before).
    if (firstP.firstChild && firstP.firstChild.nodeType === Node.TEXT_NODE) {
      const t = firstP.firstChild.textContent ?? ''
      firstP.firstChild.textContent = t.replace(CALLOUT_EMOJI_STRIP, '')
    }
  })
}

/** Applique toutes les transformations Doc (headings + callouts). */
export function applyDocTransforms(root: HTMLElement, calloutStyle: CalloutStyle = 'docs') {
  injectHeadingIds(root)
  transformCallouts(root, calloutStyle)
}
