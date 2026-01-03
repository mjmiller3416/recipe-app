"use client";

import { SidebarContent } from "@/components/layout/SidebarContent";

interface SidebarProps {
  onOpenMealGenie?: () => void;
}

/**
 * Desktop sidebar - hidden on mobile, visible on md+ screens.
 * Uses shared SidebarContent component for navigation and user profile.
 */
export function Sidebar({ onOpenMealGenie }: SidebarProps) {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 bg-sidebar flex-col overflow-x-hidden overflow-y-auto print:hidden">
      <SidebarContent onOpenMealGenie={onOpenMealGenie} />
    </aside>
  );
}
