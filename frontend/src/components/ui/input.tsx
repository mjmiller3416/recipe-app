import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  [
    // Base styles
    "w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm font-medium shadow-sm outline-none",
    // Transitions
    "transition-all duration-200 ease-in-out",
    // Placeholder
    "placeholder:text-muted-foreground placeholder:font-normal",
    // Selection
    "selection:bg-primary selection:text-primary-foreground",
    // Hover state
    "hover:border-border-strong",
    // Focus state
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary",
    // Disabled state
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    // File input styles
    "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
  ],
  {
    variants: {
      size: {
        default: "h-10 py-2",
        sm: "h-8 py-1 text-xs",
        lg: "h-12 py-3",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  /** Optional icon to display on the left side of the input */
  icon?: LucideIcon;
}

function Input({ className, type, size, icon: Icon, ...props }: InputProps) {
  if (Icon) {
    return (
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          type={type}
          data-slot="input"
          className={cn(inputVariants({ size }), "pl-10", className)}
          {...props}
        />
      </div>
    )
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }