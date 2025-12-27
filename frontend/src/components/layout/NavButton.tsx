"use client";

import { LucideIcon } from "lucide-react";
import { SafeLink } from "@/components/common/SafeLink";
import { cn } from "@/lib/utils";

interface NavButtonProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive?: boolean;
}

export function NavButton({
  icon: Icon,
  label,
  href,
  isActive = false,
}: NavButtonProps) {
  return (
    <SafeLink
      href={href}
      className={cn(
        "flex items-center rounded-lg transition-colors duration-200 ease-in-out relative group px-4 py-4",
        "text-muted hover:text-foreground hover:bg-hover",
        isActive && "text-primary bg-hover font-medium rounded-lg"
      )}
    >
      <Icon className="h-6 w-6 flex-shrink-0" />
      <span className="text-base ml-3 whitespace-nowrap">
        {label}
      </span>
    </SafeLink>
  );
}