"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Bug, Zap, Star } from "lucide-react";
import { CHANGELOG_ENTRIES, getItemCountBeforeEntry } from "@/data/changelog";
import { cn } from "@/lib/utils";

interface ChangelogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newItemCount?: number;
}

// Get icon based on changelog section title
function getTitleIcon(title: string) {
  if (title.toLowerCase().includes("feature")) return Star;
  if (title.toLowerCase().includes("fix")) return Bug;
  if (title.toLowerCase().includes("improvement")) return Zap;
  return Sparkles;
}

// Get accent color based on changelog section title
function getTitleColor(title: string) {
  if (title.toLowerCase().includes("feature")) return "text-primary";
  if (title.toLowerCase().includes("fix")) return "text-secondary";
  if (title.toLowerCase().includes("improvement")) return "text-muted-foreground";
  return "text-muted";
}

export function ChangelogDialog({
  open,
  onOpenChange,
  newItemCount = 0,
}: ChangelogDialogProps) {
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

        <div className="flex-1 overflow-y-auto">
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
                ([date, entries], dateIdx) => (
                  <div key={date} className="space-y-2">
                    {/* Date header - subtle inline */}
                    <div
                      className={cn(
                        "flex items-center gap-2",
                        dateIdx > 0 && "mt-4 pt-3 border-t border-border/50"
                      )}
                    >
                      <span className="text-xs text-muted-foreground">
                        {date}
                      </span>
                    </div>

                    {/* Entries for this date */}
                    {entries.map((entry) => {
                      const Icon = getTitleIcon(entry.title);
                      const colorClass = getTitleColor(entry.title);
                      const entryGlobalIdx = CHANGELOG_ENTRIES.findIndex(
                        (e) =>
                          e.version === entry.version && e.title === entry.title
                      );
                      const itemsBefore = getItemCountBeforeEntry(entryGlobalIdx);

                      return (
                        <div
                          key={`${entry.version}-${entry.title}`}
                          className="rounded-xl surface-raised p-3 space-y-2"
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
                                  key={changeIdx}
                                  className={cn(
                                    "text-sm flex items-start gap-2",
                                    isNew
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "mt-1.5 flex-shrink-0",
                                      isNew ? "text-primary" : "text-muted/50"
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
                )
              );
            })()}
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
