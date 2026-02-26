"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface WizardStepperProps {
  currentStep: number; // 1-5
  totalSteps: number;
  stepLabels: string[];
}

export function WizardStepper({
  currentStep,
  totalSteps,
  stepLabels,
}: WizardStepperProps) {
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full space-y-4">
      {/* Step circles with connecting lines */}
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNumber = i + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isFuture = stepNumber > currentStep;

          return (
            <div key={stepNumber} className="flex items-center flex-1 last:flex-0">
              <div className="flex flex-col items-center gap-1.5">
                {/* Circle */}
                <div
                  className={cn(
                    "flex items-center justify-center size-8 rounded-full text-sm font-medium transition-colors shrink-0",
                    (isCompleted || isCurrent) &&
                      "bg-primary text-primary-foreground",
                    isFuture && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" strokeWidth={1.5} />
                  ) : (
                    stepNumber
                  )}
                </div>

                {/* Step label - hidden on mobile */}
                <span
                  className={cn(
                    "hidden md:block text-xs text-center whitespace-nowrap",
                    isCurrent
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {stepLabels[i]}
                </span>
              </div>

              {/* Connecting line (not after last step) */}
              {stepNumber < totalSteps && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 self-start mt-4 transition-colors",
                    stepNumber < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <Progress value={progressPercent} className="h-1.5" />
    </div>
  );
}
