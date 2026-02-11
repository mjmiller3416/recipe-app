import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function PageHeader({ children, className }: PageHeaderProps) {
  return (
    <div className={cn("bg-background", className)}>
      <div className="pt-6 px-4 mx-auto max-w-7xl md:px-6">
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
  if (description) {
    return (
      <div className={cn("flex flex-1 items-baseline gap-3", className)}>
        <h2 className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    );
  }

  return (
    <h2 className={cn("flex-1 self-stretch flex items-center text-lg font-semibold text-foreground", className)}>
      {title}
    </h2>
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