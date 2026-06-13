// Raccourcis clavier globaux pour la page V3.
// Inactif si l'utilisateur tape dans un input/textarea/contenteditable.
import { useEffect } from 'react'

interface Options {
  onSwitchTab?: (direction: 1 | -1) => void
  onNewDecision?: () => void
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true
  return false
}

function isDialogOpen(): boolean {
  // Radix Dialog / Select expose data-state="open" sur le root du portail.
  return !!document.querySelector('[role="dialog"][data-state="open"]')
}

export function useV3Keyboard({ onSwitchTab, onNewDecision }: Options) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      if (isDialogOpen()) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        onNewDecision?.()
        return
      }
      if (e.key === 'ArrowRight' && e.shiftKey) {
        e.preventDefault()
        onSwitchTab?.(1)
        return
      }
      if (e.key === 'ArrowLeft' && e.shiftKey) {
        e.preventDefault()
        onSwitchTab?.(-1)
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onSwitchTab, onNewDecision])
}
