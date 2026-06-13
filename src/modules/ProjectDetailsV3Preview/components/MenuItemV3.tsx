import { cn } from '@/lib/utils'

interface Props {
  icon: React.ElementType
  label: string
  onClick: () => void
  destructive?: boolean
  trailing?: React.ReactNode
}

/**
 * Élément de menu déroulant V3 (dropdown maison).
 * Utilisé dans ContactCardV3 et potentiellement d'autres menus contextuels.
 */
export function MenuItemV3({ icon: Icon, label, onClick, destructive, trailing }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors',
        destructive
          ? 'text-red-300 hover:bg-red-500/10 hover:text-red-200'
          : 'text-[#ede9fe] hover:bg-[rgba(139,92,246,0.1)]',
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="flex-1">{label}</span>
      {trailing}
    </button>
  )
}
