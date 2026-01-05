import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // BASE STYLES
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-raised hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-elevated active:translate-y-0 active:shadow-inset-sm transition-all duration-150 ease-physical",
        destructive:
          "bg-destructive text-white shadow-raised hover:bg-destructive/90 hover:-translate-y-0.5 hover:shadow-elevated active:translate-y-0 active:shadow-inset-sm transition-all duration-150 ease-physical focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-border bg-button-outline-bg text-foreground shadow-sm hover:bg-hover hover:border-border-strong hover:-translate-y-px hover:shadow-raised active:translate-y-0 active:shadow-inset-sm transition-all duration-150 ease-physical",
        secondary:
          "bg-secondary text-secondary-foreground shadow-raised hover:bg-secondary-hover hover:-translate-y-0.5 hover:shadow-elevated active:translate-y-0 active:shadow-inset-sm transition-all duration-150 ease-physical",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 transition-colors duration-150",
        link: "text-primary underline-offset-4 hover:underline transition-colors duration-150",
        dashed: 
          "border border-dashed border-primary/40 bg-primary/5 text-muted-foreground shadow-sm hover:border-primary hover:text-primary hover:bg-primary/10 transition-all duration-150 ease-physical",
      },
      size: {
        // Default is now 40px (h-10) to match inputs
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        
        sm: "h-8 px-3 has-[>svg]:px-2.5",
        
        // Large bumped to 48px (h-12) to stay distinct from default
        lg: "h-12 px-8 has-[>svg]:px-6 text-base", 
        
        icon: "size-10", // Matched to default height
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
      shape: {
        default: "rounded-lg",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }