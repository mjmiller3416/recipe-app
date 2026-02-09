"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  ShoppingCart,
  Newspaper,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Logo } from "@/components/layout/Logo";
import { TopNavLink } from "@/components/layout/TopNavLink";
import { TopNavUserMenu } from "@/components/layout/TopNavUserMenu";
import { NavButton } from "@/components/layout/NavButton";
import { FeedbackDialog } from "@/components/common/FeedbackDialog";
import { ChangelogDialog } from "@/components/common/ChangelogDialog";
import { CHANGELOG_TOTAL_ITEMS } from "@/data/changelog";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useShoppingList, useRefreshShoppingList } from "@/hooks/api";

const navigation = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Meal Planner", href: "/meal-planner", icon: CalendarDays },
  { name: "Recipe Browser", href: "/recipes", icon: BookOpen },
  { name: "Shopping List", href: "/shopping-list", icon: ShoppingCart, hasBadge: true },
];

interface TopNavProps {
  onOpenAssistant: () => void;
}

export function TopNav({ onOpenAssistant }: TopNavProps) {
  const pathname = usePathname();

  // Sheet state (hamburger menu for md-to-lg)
  const [sheetOpen, setSheetOpen] = useState(false);

  // Dialog state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [changelogBadgeDismissed, setChangelogBadgeDismissed] = useState(false);
  const [changelogCountReset, setChangelogCountReset] = useState(false);

  // Client-side state (lazy initializers read localStorage without triggering cascading renders)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemPreference = window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
    return stored || systemPreference;
  });
  const [changelogNewItems] = useState(() => {
    if (typeof window === "undefined") return 0;
    const lastSeenCount = parseInt(
      localStorage.getItem("lastSeenChangelogCount") || "0",
      10
    );
    return Math.max(0, CHANGELOG_TOTAL_ITEMS - lastSeenCount);
  });
  const [mounted, setMounted] = useState(false);

  // Shopping list badge
  const { data: shoppingData } = useShoppingList();
  const refreshShoppingList = useRefreshShoppingList();

  const shoppingListRemaining = shoppingData
    ? shoppingData.total_items - shoppingData.checked_items
    : 0;

  // Planner update handler
  const handlePlannerUpdated = useCallback(() => {
    try {
      refreshShoppingList();
    } catch (error) {
      console.error("[TopNav] Failed to refresh shopping count:", error);
    }
  }, [refreshShoppingList]);

  // Client-side initialization (DOM side effects only — state set via lazy initializers above)
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount; theme is stable from lazy init
  }, []);

  // Event listeners
  useEffect(() => {
    window.addEventListener("shopping-list-updated", refreshShoppingList);
    window.addEventListener("planner-updated", handlePlannerUpdated);
    return () => {
      window.removeEventListener("shopping-list-updated", refreshShoppingList);
      window.removeEventListener("planner-updated", handlePlannerUpdated);
    };
  }, [refreshShoppingList, handlePlannerUpdated]);

  // Derived values
  const hasNewUpdates = changelogNewItems > 0 && !changelogBadgeDismissed;
  const newItemCount = changelogCountReset ? 0 : changelogNewItems;

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("light", newTheme === "light");
  };

  const handleChangelogOpenChange = (open: boolean) => {
    if (open) {
      localStorage.setItem("lastSeenChangelogCount", String(CHANGELOG_TOTAL_ITEMS));
      setChangelogBadgeDismissed(true);
    } else {
      setChangelogCountReset(true);
    }
    setChangelogOpen(open);
  };

  const handleSheetNavigate = () => {
    setSheetOpen(false);
  };

  return (
    <>
      {/* Fixed top navigation bar — hidden on mobile, visible on md+ */}
      <header
        className={cn(
          "hidden md:flex",
          "fixed top-0 left-0 right-0 z-30 h-16",
          "items-center gap-2 px-4 lg:px-6",
          "bg-background/95 backdrop-blur-sm border-b border-border",
          "print:hidden"
        )}
      >
        {/* Left section: Logo + App Name + Hamburger */}
        <div className="flex items-center gap-3 mr-2">
          <Logo className="w-8 h-8 text-primary flex-shrink-0" />
          <span className="text-lg font-semibold text-foreground whitespace-nowrap">
            {appConfig.appName}
          </span>

          {/* Hamburger button — visible between md and lg */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden ml-1"
            aria-label="Open navigation menu"
            onClick={() => setSheetOpen(true)}
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </Button>
        </div>

        {/* Center section: Inline nav links — hidden below lg */}
        <nav className="hidden lg:flex items-center gap-1 flex-1" aria-label="Main navigation">
          {navigation.map((item) => (
            <TopNavLink
              key={item.href}
              icon={item.icon}
              label={item.name}
              href={item.href}
              isActive={pathname === item.href}
              badge={item.hasBadge ? shoppingListRemaining : undefined}
            />
          ))}
        </nav>

        {/* Spacer to push right section when nav is hidden */}
        <div className="flex-1 lg:hidden" />

        {/* Right section: Theme toggle, Changelog, Avatar */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle — single icon */}
          {mounted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" strokeWidth={1.5} />
                  ) : (
                    <Moon className="h-5 w-5" strokeWidth={1.5} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Changelog / What's New */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="What's new"
                onClick={() => handleChangelogOpenChange(true)}
                className="relative"
              >
                <Newspaper className="h-5 w-5" strokeWidth={1.5} />
                {hasNewUpdates && (
                  <span className="absolute w-2 h-2 rounded-full top-1.5 right-1.5 bg-primary animate-pulse" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>What&apos;s New</TooltipContent>
          </Tooltip>

          {/* User avatar dropdown */}
          <TopNavUserMenu
            onOpenAssistant={onOpenAssistant}
            onOpenFeedback={() => setFeedbackOpen(true)}
          />
        </div>
      </header>

      {/* Spacer to push content below the fixed nav bar */}
      <div className="hidden md:block h-16 print:hidden" aria-hidden="true" />

      {/* Hamburger Sheet — slides in from left for md-to-lg widths */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-4 pt-6 pb-2">
            <SheetTitle className="flex items-center gap-3">
              <Logo className="w-8 h-8 text-primary" />
              {appConfig.appName}
            </SheetTitle>
          </SheetHeader>
          <nav className="p-3 space-y-1" aria-label="Navigation menu">
            {navigation.map((item) => (
              <NavButton
                key={item.href}
                icon={item.icon}
                label={item.name}
                href={item.href}
                isActive={pathname === item.href}
                badge={item.hasBadge ? shoppingListRemaining : undefined}
                onClick={handleSheetNavigate}
              />
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <ChangelogDialog
        open={changelogOpen}
        onOpenChange={handleChangelogOpenChange}
        newItemCount={newItemCount}
      />
    </>
  );
}
