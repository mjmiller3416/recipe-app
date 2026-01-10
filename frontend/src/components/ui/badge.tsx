import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Base styles with proper transitions and focus states
  [
    "inline-flex items-center justify-center",
    "rounded-lg border font-medium whitespace-nowrap shrink-0",
    "transition-all duration-200 ease-in-out",
    // Icon sizing
    "[&>svg]:size-3 [&>svg]:pointer-events-none gap-1",
    // Focus states with proper ring offset
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    // Disabled states
    "disabled:opacity-50 disabled:pointer-events-none",
    // Aria-invalid styling
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  ],
  {
    variants: {
      variant: {
        default: [
          "border-transparent bg-primary text-primary-foreground",
          "hover:bg-primary-hover active:bg-primary-active",
        ],
        secondary: [
          "border-transparent bg-secondary text-secondary-foreground",
          "hover:bg-secondary-hover active:bg-secondary-active",
        ],
        destructive: [
          "border-transparent bg-destructive text-destructive-foreground",
          "hover:bg-destructive/90 active:bg-destructive/80",
          "focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        ],
        outline: [
          "border-border bg-transparent text-foreground",
          "hover:bg-accent hover:text-accent-foreground",
          "active:bg-accent/80",
        ],
        // Additional semantic variants using design tokens
        success: [
          "border-transparent bg-success/20 text-white",
        ],
        warning: [
          "border-transparent bg-warning text-white",
          "hover:bg-warning/90 active:bg-warning/80",
        ],
        info: [
          "border-transparent bg-info text-info-foreground",
          "hover:bg-info/90 active:bg-info/80",
        ],
        muted: [
          "border-transparent bg-muted text-muted-foreground",
          "hover:bg-muted/80 active:bg-muted/70",
        ],
      },
      size: {
        sm: "h-5 px-2 text-xs",        // 20px height, 12px text
        default: "h-6 px-2.5 text-xs", // 24px height, 12px text
        lg: "h-7 px-3 text-sm",        // 28px height, 14px text
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
