import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-border bg-background px-3 py-1 text-base shadow-sm transition-colors outline-none",
        "placeholder:text-muted",
        "selection:bg-primary selection:text-primary-foreground",
        "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }