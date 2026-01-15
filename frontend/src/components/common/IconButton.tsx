"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IconButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  tooltip: string;
  badge?: boolean;
  ariaLabel?: string;
}

export function IconButton({
  icon: Icon,
  onClick,
  tooltip,
  badge,
  ariaLabel,
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "relative p-2 rounded-lg bg-elevated group",
            "interactive-subtle"
          )}
          aria-label={ariaLabel ?? tooltip}
        >
          <Icon className="w-5 h-5 transition-colors text-foreground group-hover:text-primary" />
          {badge && (
            <span className="absolute w-2 h-2 rounded-full top-1 right-1 bg-primary animate-pulse" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
