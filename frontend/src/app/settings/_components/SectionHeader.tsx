import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  description: string;
  accentColor?: "primary" | "secondary";
}

export function SectionHeader({
  icon: Icon,
  title,
  description,
  accentColor = "primary",
}: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div
        className={cn(
          "p-2.5 rounded-xl",
          accentColor === "primary" ? "bg-primary/10" : "bg-secondary/10"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            accentColor === "primary" ? "text-primary" : "text-secondary"
          )}
        />
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted mt-0.5">{description}</p>
      </div>
    </div>
  );
}
