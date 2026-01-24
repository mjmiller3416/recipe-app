/**
 * Recipe Icon Component
 *
 * Renders either a custom PNG icon or an emoji fallback
 * for recipe identification throughout the app.
 */

export type RecipeIconData =
  | { type: "icon"; value: string }
  | { type: "emoji"; value: string };

interface RecipeIconProps {
  icon: RecipeIconData;
  className?: string;
}

export function RecipeIcon({ icon, className }: RecipeIconProps) {
  if (icon.type === "icon") {
    return (
      <img
        src={`/icons/${icon.value}.png`}
        alt=""
        className={className ?? "w-5 h-5"}
        loading="lazy"
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
