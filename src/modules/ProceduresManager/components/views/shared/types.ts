import type { Procedure, ProcedureCategory } from '../../../types'

export interface ProcedureViewProps {
  procedure: Procedure
  category: ProcedureCategory | null
  authorName: string | null
  authorAvatarUrl: string | null
}

export interface HeadingItem {
  id: string
  level: number
  text: string
}
