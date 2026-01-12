import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function PageHeader({ children, className }: PageHeaderProps) {
  return (
    <div className={cn(
      "sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm",
      className
    )}>
      {/* pl-16 on mobile creates space for the hamburger menu button */}
      <div className="max-w-7xl mx-auto pl-16 pr-4 md:px-6 py-4">
        {children}
      </div>
    </div>
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
        <p className="text-sm text-muted-foreground mt-1">
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