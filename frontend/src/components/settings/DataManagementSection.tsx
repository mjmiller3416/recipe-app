import { Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "@/app/settings/_components/SectionHeader";
import { BackupRestore } from "./_components/data-management/BackupRestore";
import { ExportImport } from "./_components/data-management/ExportImport";
import { DeleteData } from "./_components/data-management/DeleteData";

export function DataManagementSection() {
  return (
    <Card>
      <CardContent className="pt-6">
        <SectionHeader
          icon={Database}
          title="Data Management"
          description="Back up all your data or import/export recipes"
        />

        <div className="space-y-6">
          <BackupRestore />
          <Separator />
          <ExportImport />
          <Separator />
          <DeleteData />
        </div>
      </CardContent>
    </Card>
  );
}
