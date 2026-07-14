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
      <div className={cn("flex flex-1 flex-col gap-1.5", className)}>
        <h1 className="text-2xl font-semibold text-foreground">
          {title}
        </h1>
        <p className="text-md text-muted-foreground">
          {description}
        </p>
      </div>
    );
  }

  return (
    <h1 className={cn("flex-1 text-2xl leading-none font-semibold text-foreground", className)}>
      {title}
    </h1>
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