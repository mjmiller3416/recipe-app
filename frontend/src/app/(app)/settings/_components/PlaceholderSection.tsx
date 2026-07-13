import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "./SectionHeader";

interface PlaceholderSectionProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

export function PlaceholderSection({
  icon: Icon,
  title,
  description,
}: PlaceholderSectionProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <SectionHeader icon={Icon} title={title} description={description} />
        <div className="bg-elevated rounded-xl p-8 text-center border border-dashed border-border">
          <div className="p-4 bg-secondary/10 rounded-full inline-flex mb-4">
            <Icon className="h-8 w-8 text-secondary" />
          </div>
          <p className="text-muted-foreground text-sm">
            Settings for this section coming soon.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            This feature is currently under development.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
