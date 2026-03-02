"use client";

import { PenLine, Upload, Link, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WizardCreationMethod } from "@/types/recipe";

interface MethodSelectionStepProps {
  selectedMethod: WizardCreationMethod | null;
  onSelect: (method: WizardCreationMethod) => void;
}

interface MethodOption {
  method: WizardCreationMethod;
  icon: React.ReactNode;
  title: string;
  description: string;
  isAvailable: boolean;
  isNew?: boolean;
}

const METHOD_OPTIONS: MethodOption[] = [
  {
    method: "manual",
    icon: <PenLine className="size-6" strokeWidth={1.5} />,
    title: "Create New",
    description: "Build your recipe from scratch with our guided wizard.",
    isAvailable: true,
  },
  {
    method: "file-import",
    icon: <Upload className="size-6" strokeWidth={1.5} />,
    title: "Import File",
    description: "Upload a recipe file to import your existing recipes.",
    isAvailable: false,
  },
  {
    method: "url-import",
    icon: <Link className="size-6" strokeWidth={1.5} />,
    title: "Link URL",
    description: "Paste a URL and we will extract the recipe for you.",
    isAvailable: false,
  },
  {
    method: "ai-generate",
    icon: <Sparkles className="size-6" strokeWidth={1.5} />,
    title: "AI Generate",
    description: "Describe what you want and AI will create a full recipe.",
    isAvailable: true,
    isNew: true,
  },
];

export function MethodSelectionStep({
  selectedMethod,
  onSelect,
}: MethodSelectionStepProps) {
  return (
    <div className="space-y-6">
      {/* Subtitle only — title comes from the wizard header */}
      <p className="text-sm text-muted-foreground">
        Choose a method to get started. More options coming soon.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {METHOD_OPTIONS.map((option) => {
          const isSelected = selectedMethod === option.method;
          const isDisabled = !option.isAvailable;

          return (
            <Card
              key={option.method}
              interactive={option.isAvailable}
              className={cn(
                "relative transition-all",
                isSelected &&
                "border-primary ring-2 ring-primary/20 bg-primary-surface",
                isDisabled && "opacity-50 pointer-events-none"
              )}
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              onClick={() => {
                if (option.isAvailable) {
                  onSelect(option.method);
                }
              }}
              onKeyDown={(e) => {
                if (
                  option.isAvailable &&
                  (e.key === "Enter" || e.key === " ")
                ) {
                  e.preventDefault();
                  onSelect(option.method);
                }
              }}
              aria-pressed={isSelected}
              aria-disabled={isDisabled}
            >
              {/* Badges in top-right corner */}
              {(option.isNew || isDisabled) && (
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {option.isNew && <Badge>NEW</Badge>}
                  {isDisabled && (
                    <Badge variant="outline">Coming Soon</Badge>
                  )}
                </div>
              )}

              <CardContent className="flex flex-col items-center text-center gap-3 pt-8 pb-6">
                <div
                  className={cn(
                    "rounded-full p-3",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {option.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">
                    {option.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}