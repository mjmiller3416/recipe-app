"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  ShoppingCart,
  Plus,
  ChevronRight,
  MessageSquarePlus,
  Newspaper,
  Sparkles,
  Settings,
} from "lucide-react";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
} from "@clerk/nextjs";
import { Logo } from "@/components/layout/Logo";
import { NavButton } from "@/components/layout/NavButton";
import { RecentRecipesSection } from "@/components/layout/RecentRecipeChip";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { IconButton } from "@/components/common/IconButton";
import { FeedbackDialog } from "@/components/common/FeedbackDialog";
import { ChangelogDialog } from "@/components/common/ChangelogDialog";
import { CHANGELOG_TOTAL_ITEMS } from "@/data/changelog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { appConfig } from "@/lib/config";
import { useSettings } from "@/hooks/useSettings";
import { shoppingApi } from "@/lib/api";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Meal Planner", href: "/meal-planner", icon: CalendarDays },
  { name: "Recipe Browser", href: "/recipes", icon: BookOpen },
  { name: "Shopping List", href: "/shopping-list", icon: ShoppingCart, hasBadge: true },
  { name: "Add Recipe", href: "/recipes/add", icon: Plus },
];

interface SidebarContentProps {
  /** Callback when a navigation action occurs (used by mobile to close sheet) */
  onNavigate?: () => void;
  /** Callback to open Meal Genie chat popup */
  onOpenMealGenie?: () => void;
}

/**
 * Shared sidebar content used by both desktop Sidebar and mobile MobileSidebar.
 * Contains navigation, recent recipes, user profile, and theme toggle.
 */
export function SidebarContent({ onNavigate, onOpenMealGenie }: SidebarContentProps) {
  const pathname = usePathname();
  const { settings } = useSettings();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [newItemCount, setNewItemCount] = useState(0);
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

  // Handle planner updates: regenerate shopping list then refresh count
  const handlePlannerUpdated = useCallback(async () => {
    try {
      await shoppingApi.generateFromPlanner();
      await fetchShoppingCount();
    } catch (error) {
      console.error("[Sidebar] Failed to regenerate shopping list:", error);
    }
  }, [fetchShoppingCount]);

  useEffect(() => {
    // Check for new changelog items by comparing counts
    const lastSeenCount = parseInt(
      localStorage.getItem("lastSeenChangelogCount") || "0",
      10
    );
    const newItems = CHANGELOG_TOTAL_ITEMS - lastSeenCount;
    if (newItems > 0) {
      setHasNewUpdates(true);
      setNewItemCount(newItems);
    }

    // Fetch shopping count on mount
    fetchShoppingCount();

    // Listen for shopping list updates from other components
    window.addEventListener("shopping-list-updated", fetchShoppingCount);
    // Listen for planner updates to regenerate shopping list
    window.addEventListener("planner-updated", handlePlannerUpdated);
    return () => {
      window.removeEventListener("shopping-list-updated", fetchShoppingCount);
      window.removeEventListener("planner-updated", handlePlannerUpdated);
    };
  }, [fetchShoppingCount, handlePlannerUpdated]);

  const handleChangelogOpenChange = (open: boolean) => {
    if (open) {
      // Save current total count as "seen"
      localStorage.setItem("lastSeenChangelogCount", String(CHANGELOG_TOTAL_ITEMS));
      setHasNewUpdates(false);
      // Keep newItemCount for highlighting until dialog closes
    } else {
      // Reset new item count when dialog closes
      setNewItemCount(0);
    }
    setChangelogOpen(open);
  };

  return (
    <>
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
            onClick={onNavigate}
          />
        ))}
      </nav>

      {/* Recent Recipes Section */}
      <RecentRecipesSection onNavigate={onNavigate} />

      {/* Bottom Section - User Profile */}
      <div className="p-4 border-t border-border space-y-3">
        {/* Meal Genie, Feedback & Changelog */}
        <div className="flex items-center gap-2">
          {onOpenMealGenie && (
            <IconButton
              icon={Sparkles}
              onClick={onOpenMealGenie}
              tooltip="Ask Meal Genie"
            />
          )}
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
          newItemCount={newItemCount}
        />

        {/* User Profile - Clerk Authentication */}
        <SignedIn>
          <div className="flex items-center gap-3 rounded-lg p-3 bg-elevated">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10",
                  userButtonPopoverCard: "bg-card border border-border shadow-lg",
                  userButtonPopoverActions: "text-foreground",
                  userButtonPopoverActionButton: "text-foreground hover:bg-accent",
                  userButtonPopoverFooter: "hidden",
                },
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Account
              </p>
              <p className="text-xs text-muted-foreground">
                Manage profile
              </p>
            </div>
            <Link
              href="/settings"
              onClick={onNavigate}
              className="p-2 rounded-md hover:bg-hover transition-colors"
            >
              <Settings className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Link>
          </div>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="flex items-center gap-3 rounded-lg p-3 bg-elevated hover:bg-hover transition-colors w-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  ?
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground">
                  Sign In
                </p>
                <p className="text-xs text-muted-foreground">
                  Access your account
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </SignInButton>
        </SignedOut>
      </div>

      {/* Theme Toggle - Bottom */}
      <div className="p-4 pt-0">
        <ThemeToggle />
      </div>
    </>
  );
}
