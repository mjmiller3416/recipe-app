"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          // Base styles with app theme colors
          "z-50 min-w-[8rem] overflow-hidden rounded-lg",
          "bg-elevated border border-border",
          "p-1.5 shadow-lg",
          
          // Subtle glow effect for dark theme
          "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),0_0_0_1px_rgba(139,92,246,0.05)]",
          
          // Animation states
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2",
          "data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2",
          "data-[side=top]:slide-in-from-bottom-2",
          
          // Scroll behavior
          "max-h-(--radix-dropdown-menu-content-available-height)",
          "overflow-x-hidden overflow-y-auto",
          "origin-(--radix-dropdown-menu-content-transform-origin)",
          
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        // Base styles
        "relative flex cursor-default select-none items-center gap-2.5",
        "rounded-md px-2.5 py-2 text-sm outline-none",
        "transition-colors duration-150",
        
        // Default text color
        "text-foreground",
        
        // Icon styling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        "[&_svg:not([class*='size-'])]:size-4",
        "[&_svg:not([class*='text-'])]:text-muted",
        
        // Focus/hover state - purple accent
        "focus:bg-primary/15 focus:text-foreground",
        "focus:[&_svg:not([class*='text-'])]:text-primary-light",
        
        // Disabled state
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        
        // Inset for items with icons in siblings
        "data-[inset]:pl-8",
        
        // Destructive variant
        "data-[variant=destructive]:text-error",
        "data-[variant=destructive]:focus:bg-error/15",
        "data-[variant=destructive]:focus:text-error",
        "data-[variant=destructive]:[&_svg]:text-error",
        
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        // Base styles
        "relative flex cursor-default select-none items-center gap-2.5",
        "rounded-md py-2 pr-2.5 pl-8 text-sm outline-none",
        "transition-colors duration-150",
        
        // Text color
        "text-foreground",
        
        // Focus/hover state
        "focus:bg-primary/15 focus:text-foreground",
        
        // Disabled state
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        
        // Icon styling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        "[&_svg:not([class*='size-'])]:size-4",
        
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2.5 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-primary" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        // Base styles
        "relative flex cursor-default select-none items-center gap-2.5",
        "rounded-md py-2 pr-2.5 pl-8 text-sm outline-none",
        "transition-colors duration-150",
        
        // Text color
        "text-foreground",
        
        // Focus/hover state
        "focus:bg-primary/15 focus:text-foreground",
        
        // Disabled state
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        
        // Icon styling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        "[&_svg:not([class*='size-'])]:size-4",
        
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2.5 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2.5 fill-primary text-primary" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2.5 py-2 text-xs font-semibold uppercase tracking-wider",
        "text-muted",
        "data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn(
        "-mx-1.5 my-1.5 h-px",
        "bg-border",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest",
        "text-muted opacity-70",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        // Base styles
        "flex cursor-default select-none items-center gap-2.5",
        "rounded-md px-2.5 py-2 text-sm outline-none",
        "transition-colors duration-150",
        
        // Text color
        "text-foreground",
        
        // Icon styling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        "[&_svg:not([class*='size-'])]:size-4",
        "[&_svg:not([class*='text-'])]:text-muted",
        
        // Focus/hover state
        "focus:bg-primary/15 focus:text-foreground",
        "focus:[&_svg:not([class*='text-'])]:text-primary-light",
        
        // Open state
        "data-[state=open]:bg-primary/10",
        "data-[state=open]:[&_svg:not([class*='text-'])]:text-primary-light",
        
        // Inset
        "data-[inset]:pl-8",
        
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4 text-muted" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        // Base styles
        "z-50 min-w-[8rem] overflow-hidden rounded-lg",
        "bg-elevated border border-border",
        "p-1.5 shadow-lg",
        
        // Subtle glow effect
        "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),0_0_0_1px_rgba(139,92,246,0.05)]",
        
        // Animation states
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
        
        // Transform origin
        "origin-(--radix-dropdown-menu-content-transform-origin)",
        
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}