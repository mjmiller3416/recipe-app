import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  // Base styles with design system compliance
  "bg-card text-card-foreground flex flex-col rounded-lg border border-border surface-raised transition-all duration-200 ease-in-out",
  {
    variants: {
      size: {
        sm: "",
        default: "",
        lg: "",
      },
      interactive: {
        true: "cursor-pointer hover:border-border-strong hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      interactive: false,
    },
  }
)

type CardProps = React.ComponentProps<"div"> & VariantProps<typeof cardVariants>

function Card({ className, size, interactive, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ size, interactive, className }))}
      {...props}
    />
  )
}

const cardHeaderVariants = cva(
  "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
  {
    variants: {
      size: {
        sm: "gap-1.5 px-4 pt-4",
        default: "gap-2 px-6 pt-6",
        lg: "gap-3 px-8 pt-8",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

type CardHeaderProps = React.ComponentProps<"div"> & VariantProps<typeof cardHeaderVariants>

function CardHeader({ className, size, ...props }: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn(cardHeaderVariants({ size, className }))}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-tight font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

const cardContentVariants = cva("", {
  variants: {
    size: {
      sm: "p-4",
      default: "p-6",
      lg: "p-8",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

type CardContentProps = React.ComponentProps<"div"> & VariantProps<typeof cardContentVariants>

function CardContent({ className, size, ...props }: CardContentProps) {
  return (
    <div
      data-slot="card-content"
      className={cn(cardContentVariants({ size, className }))}
      {...props}
    />
  )
}

const cardFooterVariants = cva("flex items-center [.border-t]:pt-6", {
  variants: {
    size: {
      sm: "px-4",
      default: "px-6",
      lg: "px-8",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

type CardFooterProps = React.ComponentProps<"div"> & VariantProps<typeof cardFooterVariants>

function CardFooter({ className, size, ...props }: CardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      className={cn(cardFooterVariants({ size, className }))}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
}
