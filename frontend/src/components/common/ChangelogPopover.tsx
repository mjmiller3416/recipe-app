"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  getFlattenedChanges,
  parseChangeText,
  getCategoryIcon,
  getCategoryColor,
} from "@/data/changelog";

const POPOVER_ITEM_COUNT = 5;

interface ChangelogPopoverProps {
  newItemCount: number;
  hasNewUpdates: boolean;
  onOpen: () => void;
  onViewAll: () => void;
  onViewItem: (globalIndex: number) => void;
}

export function ChangelogPopover({
  newItemCount,
  hasNewUpdates,
  onOpen,
  onViewAll,
  onViewItem,
}: ChangelogPopoverProps) {
  const recentItems = getFlattenedChanges(POPOVER_ITEM_COUNT);
  const [dismissedItems, setDismissedItems] = useState<Set<number>>(new Set());
  const [popoverOpen, setPopoverOpen] = useState(false);

  const effectiveNewCount = Math.max(0, newItemCount - dismissedItems.size);

  const handleItemClick = (globalIndex: number) => {
    if (
      globalIndex < newItemCount &&
      !dismissedItems.has(globalIndex)
    ) {
      setDismissedItems((prev) => new Set(prev).add(globalIndex));
    }
    setPopoverOpen(false);
    onViewItem(globalIndex);
  };

  return (
    <Popover
      open={popoverOpen}
      onOpenChange={(open) => {
        setPopoverOpen(open);
        if (open) onOpen();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="What's new"
          className="relative"
        >
          <Bell className="size-5" strokeWidth={1.5} />
          {hasNewUpdates && (
            <span className="absolute w-2 h-2 rounded-full top-1.5 right-1.5 bg-primary animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold text-foreground">
            What&apos;s New
          </span>
          {effectiveNewCount > 0 && (
            <Badge variant="default" size="sm">
              {effectiveNewCount} NEW
            </Badge>
          )}
        </div>

        {/* Items */}
        <div className="max-h-80 overflow-y-auto">
          {recentItems.map((item, idx) => {
            const { title, description } = parseChangeText(item.change);
            const Icon = getCategoryIcon(item.category);
            const colorClass = getCategoryColor(item.category);
            const isUnread =
              item.globalIndex < newItemCount &&
              !dismissedItems.has(item.globalIndex);

            return (
              <div
                key={idx}
                role="button"
                tabIndex={0}
                onClick={() => handleItemClick(item.globalIndex)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleItemClick(item.globalIndex);
                  }
                }}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50",
                  idx < recentItems.length - 1 && "border-b border-border/50"
                )}
              >
                {/* Category icon */}
                <div
                  className={cn(
                    "flex-shrink-0 size-9 rounded-full flex items-center justify-center",
                    "bg-primary/10"
                  )}
                >
                  <Icon
                    className={cn("size-4", colorClass)}
                    strokeWidth={1.5}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      {title}
                    </p>
                    {isUnread && (
                      <span className="flex-shrink-0 mt-1.5 block size-2 rounded-full bg-primary" />
                    )}
                  </div>
                  {description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(item.rawDate + "T00:00:00")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border">
          <Button
            variant="ghost"
            className="w-full h-12 text-center text-primary hover:text-primary rounded-none rounded-b-lg"
            onClick={onViewAll}
          >
            View all updates
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
