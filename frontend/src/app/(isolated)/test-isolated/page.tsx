"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Test with FIXED positioning instead of sticky
// Fixed is immune to scroll container changes
export default function IsolatedTestPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* FIXED header - always at viewport top, immune to scroll changes */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white p-4 border-b">
        <h1 className="text-2xl font-bold">FIXED HEADER (Not Sticky)</h1>
        <p>Testing if fixed positioning is immune to the Select bug</p>
      </div>

      {/* Spacer to push content below the fixed header */}
      <div className="h-20" />

      <div className="px-4 py-6 mx-auto space-y-4 max-w-4xl">
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} className="p-4 border rounded-lg bg-card">
            Placeholder block {i + 1}
          </div>
        ))}

        <Select value="" onValueChange={(value) => console.log(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
            <SelectItem value="option3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
