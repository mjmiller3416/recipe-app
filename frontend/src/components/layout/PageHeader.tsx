import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function PageHeader({ children, className }: PageHeaderProps) {
  // Using fixed positioning instead of sticky to avoid Radix UI Select scroll-lock bug.
  // Fixed headers are immune to body-level scroll changes that break sticky positioning.
  return (
    <>
      {/* Fixed header - positioned relative to viewport, respects sidebar on desktop */}
      <div className={cn(
        "fixed top-0 left-0 md:left-72 right-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm",
        className
      )}>
        {/* pl-16 on mobile creates space for the hamburger menu button */}
        <div className="py-4 pl-16 pr-4 mx-auto max-w-7xl md:px-6">
          {children}
        </div>
      </div>
      {/* Spacer to push content below fixed header */}
      <div className="h-[89px]" aria-hidden="true" />
    </>
  );
}

interface PageHeaderContentProps {
  children: React.ReactNode;
  className?: string;
}

export function PageHeaderContent({ children, className }: PageHeaderContentProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {children}
    </div>
  );
}

interface PageHeaderTitleProps {
  title: string;
  description?: string;
  className?: string;
}

export function PageHeaderTitle({ title, description, className }: PageHeaderTitleProps) {
  return (
    <div className={cn("flex-1", className)}>
      <h1 className="text-2xl font-semibold text-foreground">
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

interface PageHeaderActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function PageHeaderActions({ children, className }: PageHeaderActionsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {children}
    </div>
  );
}