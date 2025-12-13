"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavButtonProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive?: boolean;
  isCollapsed?: boolean;
}

export function NavButton({
  icon: Icon,
  label,
  href,
  isActive = false,
  isCollapsed = false,
}: NavButtonProps) {
  const button = (
    <Link
      href={href}
      className={cn(
        "flex items-center rounded-lg transition-colors duration-200 ease-in-out relative group",
        "text-muted hover:text-foreground hover:bg-hover",
        isActive && "text-primary font-medium",
        isCollapsed ? "justify-center px-3 py-3" : "px-4 py-3"
      )}
      aria-label={label}
    >
      {/* Icon - always in the same position */}
      <Icon className="h-5 w-5 flex-shrink-0" />

      {/* Text - fades in/out, always rendered but with opacity */}
      <span
        className={cn(
          "text-sm ml-3 whitespace-nowrap transition-opacity duration-300",
          isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
        )}
      >
        {label}
      </span>
    </Link>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
