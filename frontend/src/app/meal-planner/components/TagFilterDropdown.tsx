"use client";

import { useState } from "react";
import { Tag, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface TagFilterDropdownProps {
  allTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagFilterDropdown({
  allTags,
  selectedTags,
  onTagsChange,
}: TagFilterDropdownProps) {
  const [open, setOpen] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const clearAll = () => {
    onTagsChange([]);
  };

  const hasSelectedTags = selectedTags.length > 0;

  // Don't render if no tags available
  if (allTags.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={hasSelectedTags ? "default" : "outline"}
          size="sm"
          className={cn(
            "gap-2 h-8",
            hasSelectedTags && "bg-primary/20 text-primary hover:bg-primary/30 border-primary/30"
          )}
        >
          <Tag className="h-3.5 w-3.5" />
          {hasSelectedTags ? `${selectedTags.length} Tag${selectedTags.length > 1 ? "s" : ""}` : "Tags"}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1 max-h-[280px] overflow-y-auto">
          {allTags.map((tag) => (
            <label
              key={tag}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors",
                "hover:bg-hover",
                selectedTags.includes(tag) && "bg-primary/10"
              )}
            >
              <Checkbox
                checked={selectedTags.includes(tag)}
                onCheckedChange={() => toggleTag(tag)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-sm text-foreground flex-1 truncate">
                {tag}
              </span>
            </label>
          ))}
        </div>
        
        {hasSelectedTags && (
          <>
            <Separator className="my-2" />
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-muted hover:text-foreground"
              onClick={clearAll}
            >
              <X className="h-3.5 w-3.5 mr-2" />
              Clear All
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}