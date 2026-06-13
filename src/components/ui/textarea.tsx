import * as React from "react"

import { cn } from "../../lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-border/50 bg-input-bg text-foreground caret-foreground px-3 py-2 text-sm shadow-sm transition-all placeholder:text-placeholder focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-glow-sm focus-visible:border-[var(--neon-muted)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }