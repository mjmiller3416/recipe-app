"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: "2024-12-27",
    date: "December 27, 2024",
    title: "Latest Updates",
    changes: [
      "Drag-and-drop reordering of ingredients when adding or editing recipes",
      "Fixed ingredient autocomplete for multi-word ingredients like 'olive oil'",
      "Removed duplicate 'Ranch Seasoning' ingredient from database",
    ],
  },
];

interface ChangelogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangelogDialog({ open, onOpenChange }: ChangelogDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            What&apos;s New
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-2">
          {CHANGELOG_ENTRIES.map((entry) => (
            <div key={entry.version} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">{entry.title}</h3>
                <span className="text-xs text-muted">{entry.date}</span>
              </div>
              <ul className="space-y-1.5">
                {entry.changes.map((change, index) => (
                  <li
                    key={index}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-primary text-xs leading-none mt-0.5">•</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
