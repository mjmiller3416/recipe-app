"use client";

import { LucideIcon } from "lucide-react";
import { SafeLink } from "@/components/common/SafeLink";
import { cn } from "@/lib/utils";

interface TopNavLinkProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive?: boolean;
  badge?: number;
}

export function TopNavLink({
  icon: Icon,
  label,
  href,
  isActive = false,
  badge,
}: TopNavLinkProps) {
  return (
    <SafeLink
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
        "transition-colors duration-200",
        isActive
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-hover/50"
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={isActive ? 2 : 1.5} />
      <span>{label}</span>

      {badge !== undefined && badge > 0 && (
        <div
          className={cn(
            "min-w-5 h-5 px-1.5",
            "flex items-center justify-center",
            "rounded-full text-xs font-semibold",
            "bg-error/20 border border-error/30 text-error"
          )}
        >
          {badge > 99 ? "99+" : badge}
        </div>
      )}
    </SafeLink>
  );
}
