"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

const collapsibleTriggerVariants = cva(
  [
    // Base layout
    "flex w-full items-center justify-between",
    // Typography
    "text-sm font-medium",
    // Border radius
    "rounded-lg",
    // Transitions
    "transition-all duration-200 ease-in-out",
    // Focus states
    "outline-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    // Hover state
    "hover:bg-accent hover:text-accent-foreground",
    // Active/Press state
    "active:scale-[0.98]",
    // Disabled state
    "disabled:opacity-50 disabled:pointer-events-none",
  ],
  {
    variants: {
      size: {
        default: "min-h-10 px-3 py-2",
        sm: "min-h-8 px-2 py-1.5 text-xs",
        lg: "min-h-12 px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

interface CollapsibleTriggerProps
  extends React.ComponentProps<typeof CollapsiblePrimitive.Trigger>,
    VariantProps<typeof collapsibleTriggerVariants> {}

function CollapsibleTrigger({
  className,
  size,
  ...props
}: CollapsibleTriggerProps) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn(collapsibleTriggerVariants({ size }), className)}
      {...props}
    />
  )
}

function CollapsibleContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Content>) {
  return (
    <CollapsiblePrimitive.Content
      data-slot="collapsible-content"
      className={cn(
        "overflow-hidden",
        "transition-all duration-200 ease-in-out",
        "data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down",
        className
      )}
      {...props}
    >
      {children}
    </CollapsiblePrimitive.Content>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent, collapsibleTriggerVariants }