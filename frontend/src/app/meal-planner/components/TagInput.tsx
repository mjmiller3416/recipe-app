"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  existingTags?: string[];
  placeholder?: string;
  maxTagLength?: number;
  disabled?: boolean;
  error?: string;
}

export function TagInput({
  tags,
  onTagsChange,
  existingTags = [],
  placeholder = "Add tags...",
  maxTagLength = 30,
  disabled = false,
  error,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!inputValue.trim()) {
      return { existing: [] as string[], canCreate: false, createValue: "" };
    }

    const searchLower = inputValue.toLowerCase().trim();

    // Get existing tags that match and aren't already selected
    const matchingExisting = existingTags.filter(
      (tag) =>
        tag.toLowerCase().includes(searchLower) &&
        !tags.includes(tag)
    );

    // Check if input exactly matches an existing tag (case-insensitive)
    const exactMatch = existingTags.some(
      (tag) => tag.toLowerCase() === searchLower
    );

    // Check if input is already in selected tags
    const alreadySelected = tags.some(
      (tag) => tag.toLowerCase() === searchLower
    );

    // Include "Create new" option if input doesn't exactly match existing tag
    // and isn't already selected
    const canCreate = !exactMatch && !alreadySelected && inputValue.trim().length > 0;

    return {
      existing: matchingExisting.slice(0, 5), // Limit to 5 suggestions
      canCreate,
      createValue: inputValue.trim(),
    };
  }, [inputValue, existingTags, tags]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add a tag
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    
    // Validate
    if (!trimmedTag) return;
    if (trimmedTag.length > maxTagLength) return;
    if (tags.some((t) => t.toLowerCase() === trimmedTag.toLowerCase())) return;
    
    onTagsChange([...tags, trimmedTag]);
    setInputValue("");
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  // Remove a tag
  const removeTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(value.trim().length > 0);
    setSelectedSuggestionIndex(-1);
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalSuggestions =
      suggestions.existing.length + (suggestions.canCreate ? 1 : 0);

    switch (e.key) {
      case "Enter":
      case ",":
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          // Select highlighted suggestion
          if (selectedSuggestionIndex < suggestions.existing.length) {
            addTag(suggestions.existing[selectedSuggestionIndex]);
          } else if (suggestions.canCreate) {
            addTag(suggestions.createValue);
          }
        } else if (inputValue.trim()) {
          // Add input as new tag
          addTag(inputValue);
        }
        break;
        
      case "Backspace":
        if (!inputValue && tags.length > 0) {
          removeTag(tags.length - 1);
        }
        break;
        
      case "ArrowDown":
        e.preventDefault();
        if (showSuggestions && totalSuggestions > 0) {
          setSelectedSuggestionIndex((prev) =>
            prev < totalSuggestions - 1 ? prev + 1 : 0
          );
        }
        break;
        
      case "ArrowUp":
        e.preventDefault();
        if (showSuggestions && totalSuggestions > 0) {
          setSelectedSuggestionIndex((prev) =>
            prev > 0 ? prev - 1 : totalSuggestions - 1
          );
        }
        break;
        
      case "Escape":
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const hasSuggestions =
    suggestions.existing.length > 0 || suggestions.canCreate;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">Tags</label>
      
      <div ref={containerRef} className="relative">
        {/* Tags and input container */}
        <div
          className={cn(
            "flex flex-wrap gap-1.5 p-2 rounded-md border min-h-[42px]",
            "bg-input border-border",
            "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50",
            disabled && "opacity-60 cursor-not-allowed",
            error && "border-error focus-within:ring-error/20"
          )}
          onClick={() => inputRef.current?.focus()}
        >
          {/* Existing tags */}
          {tags.map((tag, index) => (
            <Badge
              key={`${tag}-${index}`}
              variant="secondary"
              className={cn(
                "gap-1 px-2 py-0.5 text-xs",
                "bg-primary/20 text-primary hover:bg-primary/30"
              )}
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(index);
                  }}
                  className="ml-0.5 hover:text-error transition-colors"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {tag}</span>
                </button>
              )}
            </Badge>
          ))}
          
          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue.trim() && setShowSuggestions(true)}
            placeholder={tags.length === 0 ? placeholder : ""}
            disabled={disabled}
            className={cn(
              "flex-1 min-w-[100px] bg-transparent border-none outline-none",
              "text-sm text-foreground placeholder:text-muted",
              disabled && "cursor-not-allowed"
            )}
          />
        </div>
        
        {/* Suggestions dropdown */}
        {showSuggestions && hasSuggestions && (
          <div
            className={cn(
              "absolute z-50 w-full mt-1 py-1 rounded-md border",
              "bg-elevated border-border shadow-lg"
            )}
          >
            {/* Existing tag suggestions */}
            {suggestions.existing.map((tag, index) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm",
                  "hover:bg-hover transition-colors",
                  selectedSuggestionIndex === index && "bg-hover"
                )}
              >
                {tag}
              </button>
            ))}
            
            {/* Create new option */}
            {suggestions.canCreate && (
              <button
                type="button"
                onClick={() => addTag(suggestions.createValue)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm",
                  "hover:bg-hover transition-colors",
                  "text-primary",
                  selectedSuggestionIndex === suggestions.existing.length &&
                    "bg-hover"
                )}
              >
                Create &quot;{suggestions.createValue}&quot;
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Helper text */}
      <p className="text-xs text-muted">
        Press Enter or comma to add a tag
      </p>
      
      {/* Error message */}
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  );
}