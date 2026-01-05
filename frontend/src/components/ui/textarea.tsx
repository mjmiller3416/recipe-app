import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  // BASE STYLES
  [
    "flex w-full rounded-lg border border-border bg-background px-3 text-sm font-medium shadow-sm",
    "placeholder:text-muted-foreground",
    "hover:border-border-strong hover:bg-input",
    "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none",
    "transition-all duration-150 ease-physical",
    "field-sizing-content",
  ],
  {
    variants: {
      size: {
        // Default matches input field sizing - min-h based on content
        default: "min-h-20 py-2",

        // Small variant - more compact
        sm: "min-h-16 py-1.5 text-sm",

        // Large variant - more spacious
        lg: "min-h-28 py-3 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Textarea({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      data-size={size}
      className={cn(textareaVariants({ size, className }))}
      {...props}
    />
  )
}

export { Textarea, textareaVariants }
