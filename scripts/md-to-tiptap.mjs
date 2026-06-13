// Markdown → TipTap JSON converter for the Procédures module.
// Supports the subset of nodes the renderer enables (no tables, no taskList):
// heading (1-3), paragraph, bulletList, orderedList, listItem, codeBlock,
// blockquote, horizontalRule, hardBreak. Marks: bold, italic, strike, code, link.
// Tables are flattened to a bullet list of "<header>: <cell>" lines.

import { marked } from 'marked'

const MAX_HEADING_LEVEL = 3

function text(t, marks) {
  const node = { type: 'text', text: t }
  if (marks && marks.length) node.marks = marks
  return node
}

function inlineTokens(tokens, marks = []) {
  const out = []
  for (const tok of tokens) {
    switch (tok.type) {
      case 'text': {
        if (tok.tokens) out.push(...inlineTokens(tok.tokens, marks))
        else out.push(text(decodeEntities(tok.text), marks))
        break
      }
      case 'escape':
        out.push(text(tok.text, marks))
        break
      case 'strong':
        out.push(...inlineTokens(tok.tokens, [...marks, { type: 'bold' }]))
        break
      case 'em':
        out.push(...inlineTokens(tok.tokens, [...marks, { type: 'italic' }]))
        break
      case 'del':
        out.push(...inlineTokens(tok.tokens, [...marks, { type: 'strike' }]))
        break
      case 'codespan':
        out.push(text(decodeEntities(tok.text), [...marks, { type: 'code' }]))
        break
      case 'link': {
        const linkMark = {
          type: 'link',
          attrs: { href: tok.href, target: '_blank', rel: 'noopener noreferrer' },
        }
        if (tok.tokens && tok.tokens.length) {
          out.push(...inlineTokens(tok.tokens, [...marks, linkMark]))
        } else {
          out.push(text(tok.text || tok.href, [...marks, linkMark]))
        }
        break
      }
      case 'br':
        out.push({ type: 'hardBreak' })
        break
      case 'image':
        // Images inline → on garde juste le texte alt
        out.push(text(tok.text || '', marks))
        break
      case 'html':
        // Strip raw HTML tags, keep inner text
        out.push(text(stripHtml(tok.text), marks))
        break
      default:
        if (tok.text) out.push(text(decodeEntities(tok.text), marks))
    }
  }
  return out
}

function decodeEntities(s) {
  if (!s) return ''
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripHtml(s) {
  return decodeEntities(s.replace(/<[^>]+>/g, ''))
}

function paragraph(tokens) {
  const content = inlineTokens(tokens)
  return { type: 'paragraph', content: content.length ? content : [] }
}

function listItemFromToken(item, asTaskItem = false) {
  // marked list item has `tokens` (block-level children)
  const children = []
  let inlineBuf = null

  for (const tok of item.tokens || []) {
    if (tok.type === 'text') {
      // text token at list-item level usually wraps inline tokens
      const inline = inlineTokens(tok.tokens || [{ type: 'text', text: tok.text }])
      if (!inlineBuf) inlineBuf = []
      inlineBuf.push(...inline)
    } else if (tok.type === 'list') {
      if (inlineBuf) {
        children.push({ type: 'paragraph', content: inlineBuf })
        inlineBuf = null
      }
      children.push(blockFromToken(tok))
    } else if (tok.type === 'paragraph') {
      if (inlineBuf) {
        children.push({ type: 'paragraph', content: inlineBuf })
        inlineBuf = null
      }
      children.push(paragraph(tok.tokens))
    } else {
      if (inlineBuf) {
        children.push({ type: 'paragraph', content: inlineBuf })
        inlineBuf = null
      }
      const block = blockFromToken(tok)
      if (block) children.push(block)
    }
  }
  if (inlineBuf) children.push({ type: 'paragraph', content: inlineBuf })
  if (!children.length) children.push({ type: 'paragraph', content: [] })
  if (asTaskItem) {
    return { type: 'taskItem', attrs: { checked: !!item.checked }, content: children }
  }
  return { type: 'listItem', content: children }
}

function blockFromToken(tok) {
  switch (tok.type) {
    case 'heading': {
      const level = Math.min(Math.max(tok.depth, 1), MAX_HEADING_LEVEL)
      return {
        type: 'heading',
        attrs: { level },
        content: inlineTokens(tok.tokens),
      }
    }
    case 'paragraph':
      return paragraph(tok.tokens)
    case 'space':
      return null
    case 'hr':
      return { type: 'horizontalRule' }
    case 'blockquote': {
      const inner = (tok.tokens || []).map(blockFromToken).filter(Boolean)
      return { type: 'blockquote', content: inner.length ? inner : [{ type: 'paragraph', content: [] }] }
    }
    case 'code':
      return {
        type: 'codeBlock',
        content: tok.text ? [{ type: 'text', text: tok.text }] : [],
      }
    case 'list': {
      const items = tok.items || []
      // Si tous les items sont task items → taskList
      const isTaskList = items.length > 0 && items.every((it) => it.task === true)
      if (isTaskList) {
        return {
          type: 'taskList',
          content: items.map((it) => listItemFromToken(it, true)),
        }
      }
      const type = tok.ordered ? 'orderedList' : 'bulletList'
      const node = { type, content: items.map((it) => listItemFromToken(it, false)) }
      if (tok.ordered && tok.start && tok.start !== 1) node.attrs = { start: tok.start }
      return node
    }
    case 'table': {
      // Flatten to a bulletList: each row → list item with header:value lines
      const headers = (tok.header || []).map((h) => decodeEntities(h.text || ''))
      const rows = tok.rows || []
      const items = rows.map((row) => {
        const cells = row.map((cell, idx) => {
          const head = headers[idx] || ''
          const cellText = decodeEntities((cell.text || '').replace(/\n/g, ' '))
          return { head, cellText }
        })
        const inline = []
        cells.forEach((c, i) => {
          if (i > 0) inline.push(text(' — '))
          if (c.head) inline.push(text(`${c.head}: `, [{ type: 'bold' }]))
          inline.push(text(c.cellText))
        })
        return {
          type: 'listItem',
          content: [{ type: 'paragraph', content: inline }],
        }
      })
      return { type: 'bulletList', content: items.length ? items : [{ type: 'listItem', content: [{ type: 'paragraph', content: [] }] }] }
    }
    case 'html': {
      const stripped = stripHtml(tok.text).trim()
      if (!stripped) return null
      return { type: 'paragraph', content: [text(stripped)] }
    }
    default:
      if (tok.text) return paragraph([{ type: 'text', text: tok.text, tokens: [{ type: 'text', text: tok.text }] }])
      return null
  }
}

export function markdownToTiptap(md) {
  const tokens = marked.lexer(md, { gfm: true })
  const content = tokens.map(blockFromToken).filter(Boolean)
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph', content: [] }] }
}

export function plainText(md) {
  // strip markdown to derive content_text for FTS
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_>~|\[\]\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
