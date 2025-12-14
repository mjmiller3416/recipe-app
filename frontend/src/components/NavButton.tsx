"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";

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
    <Link
      href={href}
      className={cn(
        "flex items-center rounded-lg transition-colors duration-200 ease-in-out relative group px-4 py-3.5",
        "text-muted hover:text-foreground hover:bg-hover",
        isActive && "text-primary bg-hover font-medium rounded-lg"
      )}
      aria-label={label}
    >
      <Icon className="h-5.5 w-5.5 flex-shrink-0" />
      <span className="text-[15px] ml-3 whitespace-nowrap">
        {label}
      </span>
    </Link>
  );
}