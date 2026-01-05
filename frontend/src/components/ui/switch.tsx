"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const switchVariants = cva(
  // Base styles
  [
    "peer inline-flex shrink-0 items-center rounded-full border border-transparent",
    "cursor-pointer shadow-xs outline-none",
    // Transitions
    "transition-all duration-200 ease-in-out",
    // States - checked/unchecked
    "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
    // Hover state
    "hover:data-[state=unchecked]:bg-hover hover:data-[state=checked]:bg-primary-hover",
    // Active/press state
    "active:scale-95",
    // Focus state
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    // Disabled state
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none",
  ],
  {
    variants: {
      size: {
        default: "h-6 w-11",
        sm: "h-5 w-9",
        lg: "h-7 w-14",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const thumbVariants = cva(
  // Base styles
  [
    "pointer-events-none block rounded-full bg-background shadow-sm",
    "transition-transform duration-200 ease-in-out",
    "data-[state=unchecked]:translate-x-0.5",
  ],
  {
    variants: {
      size: {
        default: "size-5 data-[state=checked]:translate-x-[22px]",
        sm: "size-4 data-[state=checked]:translate-x-[18px]",
        lg: "size-6 data-[state=checked]:translate-x-[30px]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {}

function Switch({ className, size, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(switchVariants({ size }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(thumbVariants({ size }))}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch, switchVariants }
