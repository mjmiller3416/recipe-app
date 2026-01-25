/**
 * Recipe Icon Component
 *
 * Renders either a custom PNG icon or an emoji fallback
 * for recipe identification throughout the app.
 */

"use client";

import { useState } from "react";

export type RecipeIconData =
  | { type: "icon"; value: string }
  | { type: "emoji"; value: string };

interface RecipeIconProps {
  icon: RecipeIconData;
  className?: string;
}

export function RecipeIcon({ icon, className }: RecipeIconProps) {
  const [hasError, setHasError] = useState(false);

  // If icon failed to load, fall back to emoji
  if (icon.type === "icon" && hasError) {
    return (
      <span className={className ? `inline-flex items-center justify-center ${className}` : "text-xl"}>
        🍽️
      </span>
    );
  }

  if (icon.type === "icon") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/icons/${icon.value}.png`}
        alt=""
        className={className ?? "w-5 h-5"}
        loading="lazy"
        onError={() => setHasError(true)}
      />
    );
  }

  // For emojis, use inline-flex to respect w/h classes, or default to text sizing
  return (
    <span className={className ? `inline-flex items-center justify-center ${className}` : "text-xl"}>
      {icon.value}
    </span>
  );
}