import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const skeletonVariants = cva(
  // Base styles - using design system tokens
  "bg-accent animate-pulse",
  {
    variants: {
      // Size variants for common use cases
      size: {
        default: "h-4 w-full",      // Default text line skeleton
        sm: "h-3 w-full",           // Small text line
        lg: "h-6 w-full",           // Large text line / heading
        avatar: "h-10 w-10",        // Avatar placeholder (matches h-10 standard)
        "avatar-sm": "h-8 w-8",     // Small avatar
        "avatar-lg": "h-12 w-12",   // Large avatar
        card: "h-32 w-full",        // Card placeholder
        button: "h-10 w-24",        // Button placeholder
        "button-sm": "h-8 w-20",    // Small button placeholder
      },
      // Shape variants
      shape: {
        default: "rounded-lg",      // Standard radius from design system
        circle: "rounded-full",     // For avatars and circular elements
        none: "rounded-none",       // Sharp edges when needed
      },
    },
    defaultVariants: {
      size: "default",
      shape: "default",
    },
  }
)

interface SkeletonProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, size, shape, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(skeletonVariants({ size, shape }), className)}
      {...props}
    />
  )
}

export { Skeleton, skeletonVariants }
