"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { CalendarDays, BookOpen, Plus, ShoppingCart, Sparkles, LucideIcon } from "lucide-react";
import { SafeLink } from "@/components/common/SafeLink";
import { cn } from "@/lib/utils";
import { shoppingApi } from "@/lib/api";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  hasBadge?: boolean;
}

const navigation: NavItem[] = [
  { name: "Planner", href: "/meal-planner", icon: CalendarDays },
  { name: "Recipes", href: "/recipes", icon: BookOpen },
  { name: "Add", href: "/recipes/add", icon: Plus },
  { name: "Shopping", href: "/shopping-list", icon: ShoppingCart, hasBadge: true },
];

interface MobileBottomNavProps {
  onOpenMealGenie?: () => void;
}

export function MobileBottomNav({ onOpenMealGenie }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [shoppingCount, setShoppingCount] = useState(0);

  const fetchShoppingCount = useCallback(async () => {
    try {
      const data = await shoppingApi.getList();
      setShoppingCount(data.total_items - data.checked_items);
    } catch (error) {
      console.error("[MobileBottomNav] Failed to fetch shopping list:", error);
    }
  }, []);

  useEffect(() => {
    fetchShoppingCount();
    window.addEventListener("shopping-list-updated", fetchShoppingCount);
    return () => {
      window.removeEventListener("shopping-list-updated", fetchShoppingCount);
    };
  }, [fetchShoppingCount]);

  return (
    <nav
      className={cn(
        // Only visible on mobile
        "md:hidden",
        // Fixed at bottom
        "fixed bottom-0 left-0 right-0 z-50",
        // Background and border
        "bg-sidebar border-t border-border",
        // Safe area padding for devices with home indicators
        "pb-[env(safe-area-inset-bottom,0px)]",
        // Hide when printing
        "print:hidden"
      )}
    >
      <div className="flex items-center justify-around h-16">
        {navigation.map((item) => {
          // Special handling: /recipes active on detail pages but NOT on /recipes/add
          const isActive =
            pathname === item.href ||
            (item.href === "/recipes" &&
              pathname.startsWith("/recipes") &&
              pathname !== "/recipes/add");

          return (
            <SafeLink
              key={item.href}
              href={item.href}
              className={cn(
                // Layout
                "flex flex-col items-center justify-center",
                // Touch-friendly size
                "min-w-[56px] h-14 px-1",
                // Transitions
                "transition-colors duration-200",
                // Text color
                isActive ? "text-primary" : "text-muted",
                // Touch feedback
                "active:scale-95"
              )}
            >
              {/* Icon with optional badge */}
              <div className="relative">
                <item.icon
                  className={cn("h-6 w-6", isActive && "text-primary")}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                {/* Badge for shopping list */}
                {item.hasBadge && shoppingCount > 0 && (
                  <div
                    className={cn(
                      "absolute -top-1 -right-2",
                      "min-w-4 h-4 px-1",
                      "flex items-center justify-center",
                      "rounded-full text-[10px] font-semibold",
                      "bg-error text-white"
                    )}
                  >
                    {shoppingCount > 99 ? "99+" : shoppingCount}
                  </div>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] mt-1 font-medium",
                  isActive && "text-primary"
                )}
              >
                {item.name}
              </span>
            </SafeLink>
          );
        })}

        {/* Meal Genie Button */}
        <button
          onClick={onOpenMealGenie}
          className={cn(
            // Layout
            "flex flex-col items-center justify-center",
            // Touch-friendly size
            "min-w-[56px] h-14 px-1",
            // Transitions
            "transition-colors duration-200",
            // Text color
            "text-muted hover:text-primary",
            // Touch feedback
            "active:scale-95"
          )}
        >
          <Sparkles className="h-6 w-6" strokeWidth={1.5} />
          <span className="text-[10px] mt-1 font-medium">Genie</span>
        </button>
      </div>
    </nav>
  );
}
