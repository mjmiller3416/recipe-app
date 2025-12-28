"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  ShoppingCart,
  Plus,
  Settings,
  MessageSquarePlus,
  Newspaper,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { NavButton } from "@/components/layout/NavButton";
import { RecentRecipesSection } from "@/components/layout/RecentRecipeChip";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { IconButton } from "@/components/common/IconButton";
import { FeedbackDialog } from "@/components/common/FeedbackDialog";
import { ChangelogDialog } from "@/components/common/ChangelogDialog";
import { CHANGELOG_ENTRIES } from "@/data/changelog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { appConfig } from "@/lib/config";
import { shoppingApi } from "@/lib/api";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Meal Planner", href: "/meal-planner", icon: CalendarDays },
  { name: "Recipe Browser", href: "/recipes", icon: BookOpen },
  { name: "Shopping List", href: "/shopping-list", icon: ShoppingCart, hasBadge: true },
  { name: "Add Recipe", href: "/recipes/add", icon: Plus },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [shoppingListRemaining, setShoppingListRemaining] = useState(0);

  // Fetch shopping list count
  const fetchShoppingCount = useCallback(async () => {
    try {
      const data = await shoppingApi.getList();
      setShoppingListRemaining(data.total_items - data.checked_items);
    } catch (error) {
      console.error("[Sidebar] Failed to fetch shopping list:", error);
    }
  }, []);

  useEffect(() => {
    const lastSeen = localStorage.getItem("lastSeenChangelogVersion");
    const latestVersion = CHANGELOG_ENTRIES[0]?.version;
    if (latestVersion && lastSeen !== latestVersion) {
      setHasNewUpdates(true);
    }

    // Fetch shopping count on mount
    fetchShoppingCount();

    // Listen for shopping list updates from other components
    window.addEventListener("shopping-list-updated", fetchShoppingCount);
    return () => {
      window.removeEventListener("shopping-list-updated", fetchShoppingCount);
    };
  }, [fetchShoppingCount]);

  const handleChangelogOpenChange = (open: boolean) => {
    if (open) {
      const latestVersion = CHANGELOG_ENTRIES[0]?.version;
      if (latestVersion) {
        localStorage.setItem("lastSeenChangelogVersion", latestVersion);
      }
      setHasNewUpdates(false);
    }
    setChangelogOpen(open);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-sidebar flex flex-col overflow-x-hidden overflow-y-auto print:hidden">
      {/* Top Section - App Branding */}
      <div className="flex items-center px-4 py-6 pb-8">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Logo className="w-10 h-10 text-primary flex-shrink-0" />
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground whitespace-nowrap">
              {appConfig.appName}
            </h1>
          </div>
        </div>
      </div>

      {/* Middle Section - Navigation Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hidden">
        {navigation.map((item) => (
          <NavButton
            key={item.href}
            icon={item.icon}
            label={item.name}
            href={item.href}
            isActive={pathname === item.href}
            badge={item.hasBadge ? shoppingListRemaining : undefined}
          />
        ))}
      </nav>

      {/* Recent Recipes Section */}
      <RecentRecipesSection />

      {/* Bottom Section - User Profile */}
      <div className="p-4 border-t border-border space-y-3">
        {/* Feedback & Changelog */}
        <div className="flex items-center gap-2">
          <IconButton
            icon={MessageSquarePlus}
            onClick={() => setFeedbackOpen(true)}
            tooltip="Send feedback"
          />
          <IconButton
            icon={Newspaper}
            onClick={() => handleChangelogOpenChange(true)}
            tooltip="What's New"
            badge={hasNewUpdates}
          />
        </div>
        <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
        <ChangelogDialog
          open={changelogOpen}
          onOpenChange={handleChangelogOpenChange}
        />

        {/* User Profile */}
        <div className="flex items-center gap-3 rounded-lg p-3 bg-elevated hover:bg-hover transition-colors">
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={appConfig.user.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {appConfig.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-status-online rounded-full border-2 border-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {appConfig.user.name}
            </p>
            <p className="text-xs text-muted">Online</p>
          </div>
        </div>
      </div>

      {/* Theme Toggle - Bottom */}
      <div className="p-4 pt-0">
        <ThemeToggle />
      </div>
    </aside>
  );
}