"use client";

import { motion } from "framer-motion";
import { CalendarDays, Library, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

export type MobileTab = "planner" | "library";

interface TabConfig {
  id: MobileTab;
  label: string;
  icon: LucideIcon;
}

const tabs: TabConfig[] = [
  { id: "planner", label: "Planner", icon: CalendarDays },
  { id: "library", label: "Library", icon: Library },
];

interface EnhancedMobileTabNavProps {
  /** Currently active tab */
  activeTab: MobileTab;
  /** Callback when tab changes */
  onTabChange: (tab: MobileTab) => void;
  /** Number of items in planner (for badge) */
  plannerCount?: number;
  /** Number of items in library (for badge) */
  libraryCount?: number;
  /** Enable haptic feedback on tab change */
  enableHaptic?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Enhanced mobile tab navigation with badges and animations
 *
 * @example
 * ```tsx
 * <EnhancedMobileTabNav
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   plannerCount={entries.length}
 *   libraryCount={meals.length}
 * />
 * ```
 */
export function EnhancedMobileTabNav({
  activeTab,
  onTabChange,
  plannerCount = 0,
  libraryCount = 0,
  enableHaptic = true,
  className,
}: EnhancedMobileTabNavProps) {
  const counts: Record<MobileTab, number> = {
    planner: plannerCount,
    library: libraryCount,
  };

  const handleTabChange = (tab: MobileTab) => {
    if (tab !== activeTab) {
      if (enableHaptic) {
        triggerHaptic("light");
      }
      onTabChange(tab);
    }
  };

  return (
    <div
      className={cn(
        "flex bg-elevated rounded-lg p-1 gap-1",
        className
      )}
      role="tablist"
      aria-label="Content navigation"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        const count = counts[tab.id];

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2",
              "py-2.5 px-4 rounded-md",
              "text-sm font-medium transition-colors duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
              isActive
                ? "text-primary-foreground"
                : "text-muted hover:text-foreground"
            )}
          >
            {/* Active background with animation */}
            {isActive && (
              <motion.div
                layoutId="activeTabBg"
                className="absolute inset-0 bg-primary rounded-md shadow-sm"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}

            {/* Tab content */}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>

              {/* Badge */}
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "px-1.5 py-0.5 text-xs rounded-full font-semibold",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-hover text-muted"
                  )}
                >
                  {count > 99 ? "99+" : count}
                </motion.span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Simple version without animations for reduced motion preference
 */
export function MobileTabNavSimple({
  activeTab,
  onTabChange,
  plannerCount = 0,
  libraryCount = 0,
  className,
}: Omit<EnhancedMobileTabNavProps, "enableHaptic">) {
  const counts: Record<MobileTab, number> = {
    planner: plannerCount,
    library: libraryCount,
  };

  return (
    <div
      className={cn("flex bg-elevated rounded-lg p-1 gap-1", className)}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        const count = counts[tab.id];

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2",
              "py-2.5 px-4 rounded-md",
              "text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
            {count > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.5 text-xs rounded-full",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-hover text-muted"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}