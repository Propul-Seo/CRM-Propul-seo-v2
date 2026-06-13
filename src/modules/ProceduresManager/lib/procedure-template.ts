import type { TipTapDoc, TipTapNode } from '../types'

export type CalloutKind =
  | 'tip' | 'warning' | 'success' | 'note'
  | 'critical' | 'important' | 'recommended'

const CALLOUT_PREFIX: Record<CalloutKind, string> = {
  tip: '💡 Astuce — ',
  warning: '⚠️ Attention — ',
  success: '✅ Validation — ',
  note: 'ℹ️ Note — ',
  critical: '🟥 Vital — ',
  important: '🟧 Important — ',
  recommended: '🟨 Recommandé — ',
}

export function buildCalloutNode(kind: CalloutKind, text = ''): TipTapNode {
  return {
    type: 'blockquote',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: CALLOUT_PREFIX[kind] + text }],
      },
    ],
  }
}

const h = (level: number, text: string): TipTapNode => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
})

const p = (text: string): TipTapNode => ({
  type: 'paragraph',
  content: text ? [{ type: 'text', text }] : [],
})

/**
 * Squelette par défaut d'une nouvelle fiche procédure.
 * Aligné avec le rendu Doc (h2 numérotés 01/02/03, h3 1.1/1.2,
 * blockquotes 💡/⚠️ devenant des callouts).
 */
export const NEW_PROCEDURE_TEMPLATE: TipTapDoc = {
  type: 'doc',
  content: [
    h(2, 'Contexte'),
    p('Décris en 2-3 phrases le sujet de cette procédure et son utilité pour l\u2019équipe.'),

    h(2, 'Procédure'),
    h(3, 'Étape 1 — intitulé court'),
    p('Décris précisément ce qu\u2019il faut faire à cette étape.'),
    h(3, 'Étape 2 — intitulé court'),
    p('Décris précisément ce qu\u2019il faut faire à cette étape.'),
    h(3, 'Étape 3 — intitulé court'),
    p('Décris précisément ce qu\u2019il faut faire à cette étape.'),

    h(2, 'Astuces & points d\u2019attention'),
    buildCalloutNode('tip', 'le conseil pratique qui fait gagner du temps.'),
    buildCalloutNode('warning', 'le piège classique à éviter absolument.'),

    h(2, 'Validation'),
    buildCalloutNode('success', 'comment vérifier que la procédure a bien fonctionné.'),
  ],
}
