export interface ProcedureCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
  sort_order: number
  created_at: string
}

export interface Procedure {
  id: string
  title: string
  slug: string
  category_id: string | null
  tags: string[]
  content: TipTapDoc
  content_text: string | null
  summary: string | null
  author_id: string | null
  updated_by: string | null
  is_pinned: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface ProcedureRevision {
  id: string
  procedure_id: string
  title: string
  content: TipTapDoc
  content_text: string | null
  summary: string | null
  change_note: string | null
  edited_by: string | null
  edited_at: string
}

export interface TipTapDoc {
  type: 'doc'
  content?: TipTapNode[]
}

export interface TipTapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TipTapNode[]
  text?: string
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}

export type ProcedureView = 'list' | 'detail' | 'edit' | 'revisions'
