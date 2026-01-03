import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  colorClass: "purple" | "pink" | "teal" | "amber";
  isLoading?: boolean;
}

const colorStyles = {
  purple: "bg-primary/20 text-primary",
  pink: "bg-chart-4/20 text-chart-4",
  teal: "bg-secondary/20 text-secondary",
  amber: "bg-chart-3/20 text-chart-3",
};

export function DashboardStatCard({
  icon: Icon,
  value,
  label,
  colorClass,
  isLoading = false,
}: DashboardStatCardProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-5 flex items-center gap-4 border border-border shadow-raised">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-5 flex items-center gap-4 border border-border shadow-raised">
      <div className={cn("p-3 rounded-lg", colorStyles[colorClass])}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
