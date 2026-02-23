"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  CHANGELOG_ENTRIES,
  getItemCountBeforeEntry,
  getCategoryIcon,
  getCategoryColor,
} from "@/data/changelog";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChangelogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newItemCount?: number;
  scrollToItem?: number | null;
}

export function ChangelogDialog({
  open,
  onOpenChange,
  newItemCount = 0,
  scrollToItem,
}: ChangelogDialogProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [highlightedEntry, setHighlightedEntry] = useState<number | null>(null);

  // Find which entry index (in CHANGELOG_ENTRIES) contains the target globalIndex
  const getEntryIndexForItem = (globalIndex: number): number => {
    let count = 0;
    for (let i = 0; i < CHANGELOG_ENTRIES.length; i++) {
      count += CHANGELOG_ENTRIES[i].changes.length;
      if (globalIndex < count) return i;
    }
    return 0;
  };

  // Clear highlight when dialog closes or scrollToItem resets
  useEffect(() => {
    if (!open || scrollToItem == null) return;
    return () => setHighlightedEntry(null);
  }, [open, scrollToItem]);

  useEffect(() => {
    if (!open || scrollToItem == null) return;

    const entryIdx = getEntryIndexForItem(scrollToItem);
    const targetEntry = CHANGELOG_ENTRIES[entryIdx];
    const targetDate = targetEntry?.date;

    // Delay to allow dialog animation to complete
    const timer = setTimeout(() => {
      const container = scrollContainerRef.current;
      // Find the date header for this entry's date group
      const dateHeader = container?.querySelector(
        `[data-changelog-date="${targetDate}"]`
      ) as HTMLElement | null;

      if (dateHeader && container) {
        // Scroll so the date header sits at the top of the scroll area
        container.scrollTop = dateHeader.offsetTop - container.offsetTop;
      }

      // Highlight the entry card
      setHighlightedEntry(entryIdx);
    }, 150);

    // Clear highlight after 2 seconds
    const clearTimer = setTimeout(() => {
      setHighlightedEntry(null);
    }, 2150);

    return () => {
      clearTimeout(timer);
      clearTimeout(clearTimer);
    };
  }, [open, scrollToItem]);
  // Collect all new items for the "What's New" section
  const newItems: { change: string; title: string; date: string }[] = [];
  let itemsCounted = 0;

  if (newItemCount > 0) {
    for (const entry of CHANGELOG_ENTRIES) {
      for (const change of entry.changes) {
        if (itemsCounted < newItemCount) {
          newItems.push({
            change,
            title: entry.title,
            date: entry.date,
          });
          itemsCounted++;
        } else {
          break;
        }
      }
      if (itemsCounted >= newItemCount) break;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            What&apos;s New
            {newItemCount > 0 && (
              <Badge variant="default" className="ml-2 bg-primary">
                {newItemCount} new
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          {/* Inner wrapper with padding for shadow room */}
          <div className="space-y-3 px-3">
          {/* NEW ITEMS SECTION - Only show if there are new items */}
          {newItems.length > 0 && (
            <div className="rounded-xl bg-primary/10 p-4 space-y-3 shadow-raised">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">
                  New Since Last Visit
                </span>
              </div>
              <ul className="space-y-2">
                {newItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <span className="text-primary mt-1">•</span>
                    <span>{item.change}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* FULL CHANGELOG - Grouped by date */}
          <div className="space-y-4">
            {(() => {
              // Group entries by date
              const groupedByDate: Record<string, typeof CHANGELOG_ENTRIES> = {};
              for (const entry of CHANGELOG_ENTRIES) {
                if (!groupedByDate[entry.date]) {
                  groupedByDate[entry.date] = [];
                }
                groupedByDate[entry.date].push(entry);
              }

              return Object.entries(groupedByDate).map(
                ([date, entries]) => {
                  // Get the global index of the first entry in this date group
                  const firstEntryGlobalIdx = CHANGELOG_ENTRIES.indexOf(entries[0]);

                  return (
                  <div key={date} className="space-y-2">
                    {/* Date header - subtle inline */}
                    <div
                      data-changelog-date={date}
                      className={cn(
                        "flex items-center gap-2",
                        firstEntryGlobalIdx > 0 && "mt-4 pt-3 border-t border-border/50"
                      )}
                    >
                      <span className="text-xs text-muted-foreground-foreground">
                        {date}
                      </span>
                    </div>

                    {/* Entries for this date */}
                    {entries.map((entry) => {
                      const Icon = getCategoryIcon(entry.title);
                      const colorClass = getCategoryColor(entry.title);
                      const entryGlobalIdx = CHANGELOG_ENTRIES.indexOf(entry);
                      const itemsBefore = getItemCountBeforeEntry(entryGlobalIdx);

                      return (
                        <div
                          key={entryGlobalIdx}
                          className={cn(
                            "rounded-xl surface-raised p-3 space-y-2 transition-all duration-500",
                            highlightedEntry === entryGlobalIdx
                              ? "ring-2 ring-primary shadow-glow-primary"
                              : "ring-0 ring-transparent"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={cn("w-4 h-4", colorClass)} />
                            <h4 className="text-sm font-medium text-foreground">
                              {entry.title}
                            </h4>
                          </div>
                          <ul className="space-y-2 pl-6">
                            {entry.changes.map((change, changeIdx) => {
                              const globalItemIndex = itemsBefore + changeIdx;
                              const isNew = globalItemIndex < newItemCount;

                              return (
                                <li
                                  id={`changelog-item-${globalItemIndex}`}
                                  key={changeIdx}
                                  className={cn(
                                    "text-sm flex items-start gap-2",
                                    isNew
                                      ? "text-foreground"
                                      : "text-muted-foreground-foreground"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "mt-1.5 flex-shrink-0",
                                      isNew ? "text-primary" : "text-muted-foreground/50"
                                    )}
                                  >
                                    •
                                  </span>
                                  <span className="flex-1">
                                    {change}
                                    {isNew && (
                                      <Badge
                                        variant="outline"
                                        className="ml-2 text-[10px] px-1.5 py-0 h-4 border-primary/50 text-primary"
                                      >
                                        NEW
                                      </Badge>
                                    )}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                  );
                }
              );
            })()}
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
