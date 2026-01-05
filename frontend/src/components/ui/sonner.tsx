"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={4000}
      icons={{
        success: <CircleCheckIcon className="size-4" strokeWidth={1.5} />,
        info: <InfoIcon className="size-4" strokeWidth={1.5} />,
        warning: <TriangleAlertIcon className="size-4" strokeWidth={1.5} />,
        error: <OctagonXIcon className="size-4" strokeWidth={1.5} />,
        loading: <Loader2Icon className="size-4 animate-spin" strokeWidth={1.5} />,
      }}
      toastOptions={{
        className: "text-sm font-medium",
        classNames: {
          toast:
            "group-[.toaster]:bg-elevated group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-elevated group-[.toaster]:rounded-lg",
          title: "text-sm font-medium",
          description: "text-sm text-muted-foreground",
          actionButton:
            "bg-primary text-primary-foreground text-sm font-medium h-8 px-3 rounded-lg shadow-sm hover:bg-primary-hover hover:-translate-y-px active:translate-y-0 active:shadow-inset-sm transition-all duration-150 ease-physical focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none",
          cancelButton:
            "bg-muted text-muted-foreground text-sm font-medium h-8 px-3 rounded-lg hover:bg-hover transition-all duration-150",
          success: "group-[.toaster]:border-success/30 [&>svg]:text-success",
          error: "group-[.toaster]:border-error/30 [&>svg]:text-error",
          warning: "group-[.toaster]:border-warning/30 [&>svg]:text-warning",
          info: "group-[.toaster]:border-info/30 [&>svg]:text-info",
        },
      }}
      style={
        {
          "--normal-bg": "var(--elevated)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--elevated)",
          "--success-text": "var(--foreground)",
          "--success-border": "var(--success)",
          "--error-bg": "var(--elevated)",
          "--error-text": "var(--foreground)",
          "--error-border": "var(--error)",
          "--warning-bg": "var(--elevated)",
          "--warning-text": "var(--foreground)",
          "--warning-border": "var(--warning)",
          "--info-bg": "var(--elevated)",
          "--info-text": "var(--foreground)",
          "--info-border": "var(--info)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
