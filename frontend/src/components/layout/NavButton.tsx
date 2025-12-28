"use client";

import { LucideIcon } from "lucide-react";
import { SafeLink } from "@/components/common/SafeLink";
import { cn } from "@/lib/utils";

interface NavButtonProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive?: boolean;
  badge?: number;
}

export function NavButton({
  icon: Icon,
  label,
  href,
  isActive = false,
  badge,
}: NavButtonProps) {
  return (
    <SafeLink
      href={href}
      className={cn(
        // Base layout
        "flex items-center gap-3 px-3 py-2.5 rounded-xl relative group",
        // Transitions for smooth interactions
        "transition-all duration-200 ease-physical",
        // Text colors
        "text-muted hover:text-foreground",
        // Hover background
        "hover:bg-hover/70",
        // Hover micro-interaction: slide right
        "hover:translate-x-1",
        // Press feedback
        "active:scale-[0.98]",
        // Active state
        isActive && "text-primary-light bg-primary/20 font-medium"
      )}
    >
      {/* Active indicator bar */}
      <div
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2",
          "w-1 rounded-full bg-primary",
          "transition-all duration-200",
          isActive ? "h-6 opacity-100" : "h-0 opacity-0"
        )}
      />

      {/* Icon container with hover background */}
      <div
        className={cn(
          "relative p-1.5 rounded-lg",
          "transition-colors duration-200",
          isActive
            ? "bg-primary/30"
            : "group-hover:bg-hover/50"
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
        {/* Glow effect when active */}
        {isActive && (
          <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm" />
        )}
      </div>

      {/* Label */}
      <span className="text-sm font-medium">{label}</span>

      {/* Badge (count) */}
      {badge !== undefined && badge > 0 && (
        <div
          className={cn(
            "ml-auto min-w-5 h-5 px-1.5",
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