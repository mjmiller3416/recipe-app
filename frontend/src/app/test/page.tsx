"use client";

import { PageLayout } from "@/components/layout/PageLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TestPage() {
  return (
    <PageLayout title="Test Page" description="This is a test page">
      <div className="space-y-4">
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} className="p-4 border rounded-lg bg-card">
            Placeholder block {i + 1}
          </div>
        ))}
      </div>
      <Select value="" 
        onValueChange={(value) => console.log(value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    </PageLayout>
  );
}
