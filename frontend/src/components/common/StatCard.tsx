import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  colorClass: "purple" | "pink" | "teal" | "amber" | "green" | "indigo";
  isLoading?: boolean;
}

const colorStyles = {
  purple: "bg-chart-1/20 text-chart-1",
  pink: "bg-chart-4/20 text-chart-4",
  teal: "bg-chart-2/20 text-chart-2",
  amber: "bg-chart-3/20 text-chart-3",
  green: "bg-chart-5/20 text-chart-5",
  indigo: "bg-chart-6/20 text-chart-6",
};

export function StatCard({
  icon: Icon,
  value,
  label,
  colorClass,
  isLoading = false,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="rounded-xl p-4 flex flex-row items-center gap-4 shadow-raised">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl p-4 flex flex-row items-center gap-4 shadow-raised">
      <div className={cn("p-3 rounded-lg", colorStyles[colorClass])}>
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}
