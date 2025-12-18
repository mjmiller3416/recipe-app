"use client";

import { Calendar, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export type MobileTab = "planner" | "library";

interface MobileTabNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  plannerCount?: number;
  libraryCount?: number;
}

export function MobileTabNav({
  activeTab,
  onTabChange,
  plannerCount,
  libraryCount,
}: MobileTabNavProps) {
  return (
    <div className="flex rounded-lg border border-border bg-elevated p-1">
      <button
        onClick={() => onTabChange("planner")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
          activeTab === "planner"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted hover:text-foreground hover:bg-hover"
        )}
      >
        <Calendar className="h-4 w-4" />
        <span>Planner</span>
        {plannerCount !== undefined && plannerCount > 0 && (
          <span
            className={cn(
              "ml-1 px-1.5 py-0.5 text-xs rounded-full",
              activeTab === "planner"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted/20 text-muted"
            )}
          >
            {plannerCount}
          </span>
        )}
      </button>
      
      <button
        onClick={() => onTabChange("library")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
          activeTab === "library"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted hover:text-foreground hover:bg-hover"
        )}
      >
        <BookOpen className="h-4 w-4" />
        <span>Library</span>
        {libraryCount !== undefined && libraryCount > 0 && (
          <span
            className={cn(
              "ml-1 px-1.5 py-0.5 text-xs rounded-full",
              activeTab === "library"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted/20 text-muted"
            )}
          >
            {libraryCount}
          </span>
        )}
      </button>
    </div>
  );
}