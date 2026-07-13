"use client";

import { Globe, ImageIcon, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ============================================================================
// Props
// ============================================================================

interface UrlImportStepProps {
  url: string;
  setUrl: (value: string) => void;
  isImporting: boolean;
  error: string | null;
  /** Triggered when the user presses Enter in the URL field. */
  onSubmit: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function UrlImportStep({
  url,
  setUrl,
  isImporting,
  error,
  onSubmit,
}: UrlImportStepProps) {
  return (
    <div className="space-y-6">
      {/* Subtitle only — title comes from the wizard header */}
      <p className="text-sm text-muted-foreground">
        Paste a link to any recipe page and we&apos;ll recreate it here for you
        to review and edit.
      </p>

      {/* URL Input */}
      <div className="space-y-2">
        <Label htmlFor="import-url">Recipe URL</Label>
        <Input
          id="import-url"
          type="url"
          inputMode="url"
          placeholder="https://www.example.com/recipes/banana-bread"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && url.trim() && !isImporting) {
              e.preventDefault();
              onSubmit();
            }
          }}
          disabled={isImporting}
          autoFocus
        />
      </div>

      {/* What to expect */}
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-start gap-3">
            <Globe className="size-4 mt-0.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              Works with most recipe websites. The original link is saved with
              your recipe for reference.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <ImageIcon className="size-4 mt-0.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              We&apos;ll grab the recipe photo from the site too — you can keep
              it, replace it, or generate a new one with AI on the next step.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Sparkles className="size-4 mt-0.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              Ingredients and steps are converted into your app&apos;s format —
              review everything before saving.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div role="alert" aria-live="assertive">
          <Card className="border-destructive">
            <CardContent className="py-3">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
