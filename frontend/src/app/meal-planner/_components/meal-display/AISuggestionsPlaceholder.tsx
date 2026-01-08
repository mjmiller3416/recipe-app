"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

// ============================================================================
// TYPES
// ============================================================================

interface AISuggestionsPlaceholderProps {
  className?: string;
}

// ============================================================================
// AI SUGGESTIONS PLACEHOLDER COMPONENT
// ============================================================================

/**
 * Placeholder component for the upcoming AI Suggestions feature.
 * Displays a "Coming Soon" message in a purple-tinted card.
 */
export function AISuggestionsPlaceholder({ className }: AISuggestionsPlaceholderProps) {
  return (
    <Card
      className={cn(
        "p-4 bg-primary/10 border-primary/20",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-medium text-primary">AI Suggestions</h4>
      </div>

      {/* Coming Soon Message */}
      <p className="text-sm text-primary/70 leading-relaxed">
        Coming soon! AI-powered suggestions to enhance your meals with perfect pairings and cooking tips.
      </p>
    </Card>
  );
}
