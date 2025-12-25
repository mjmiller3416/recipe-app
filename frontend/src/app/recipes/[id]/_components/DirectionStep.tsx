"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DirectionStepProps {
  step: string;
  index: number;
  completed: boolean;
  onToggle: () => void;
}

export function DirectionStep({ step, index, completed, onToggle }: DirectionStepProps) {
  return (
    <>
      {/* Web version - interactive step */}
      <button
        onClick={onToggle}
        className={cn(
          "flex gap-4 w-full text-left p-4 rounded-lg transition-all",
          "hover:bg-hover group print:hidden",
          completed && "opacity-50"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm transition-all",
          completed
            ? "bg-primary text-primary-foreground"
            : "bg-elevated text-muted group-hover:bg-primary/20 group-hover:text-primary"
        )}>
          {completed ? <Check className="h-4 w-4" /> : index + 1}
        </div>
        <p className={cn(
          "flex-1 text-foreground leading-relaxed pt-1",
          completed && "line-through"
        )}>
          {step}
        </p>
      </button>

      {/* Print version - numbered text */}
      <div className="hidden print:block py-1 text-sm text-black leading-relaxed">
        <span className="font-semibold mr-2">{index + 1}.</span>
        {step}
      </div>
    </>
  );
}
