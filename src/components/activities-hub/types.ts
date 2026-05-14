import type { ElementType } from 'react'

export interface ActionDef<T extends string = string> {
  type: T
  label: string
  icon: ElementType
  /** Tailwind classes appliquées au hover du bouton */
  colorClass: string
  /** Tailwind classes appliquées à l'icône au repos (couleur d'icône) */
  iconColorClass?: string
  /** Texte affiché en tooltip au survol */
  description?: string
}

export interface ActivityRecord<T extends string = string> {
  id: string
  type: T
  content: string
  created_at: string
  author_name?: string | null
  is_auto?: boolean
}
