"use client";

import { useState } from "react";
import { MessageSquareMore } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "./SectionHeader";
import { AdminFeedbackDetailDialog } from "./AdminFeedbackDetailDialog";
import { useAdminFeedback } from "@/hooks/api";
import type { FeedbackStatus } from "@/types/admin";

const ALL = "all";

const CATEGORY_OPTIONS = [
  { value: ALL, label: "All Categories" },
  { value: "Feature Request", label: "Feature Request" },
  { value: "Bug Report", label: "Bug Report" },
  { value: "General Feedback", label: "General Feedback" },
  { value: "Question", label: "Question" },
];

const STATUS_OPTIONS = [
  { value: ALL, label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

function getStatusBadgeVariant(
  status: FeedbackStatus,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "new":
      return "default";
    case "read":
      return "secondary";
    case "in_progress":
      return "outline";
    case "resolved":
      return "secondary";
    default:
      return "default";
  }
}

function getCategoryBadgeVariant(
  category: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (category) {
    case "Bug Report":
      return "destructive";
    case "Feature Request":
      return "default";
    case "Question":
      return "outline";
    default:
      return "secondary";
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminFeedbackSection() {
  const [page, setPage] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);
  const limit = 20;

  const filters = {
    skip: page * limit,
    limit,
    ...(categoryFilter !== ALL && { category: categoryFilter }),
    ...(statusFilter !== ALL && { status: statusFilter as FeedbackStatus }),
  };

  const { data, isLoading } = useAdminFeedback(filters);
  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  // Reset page when filters change
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setPage(0);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(0);
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <SectionHeader
            icon={MessageSquareMore}
            title="Feedback Dashboard"
            description="Review and manage user feedback submissions"
          />

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-border space-y-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {data?.items.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => setSelectedFeedbackId(item.id)}
                  className="w-full h-auto text-left p-4 rounded-xl border border-border hover:bg-hover justify-start items-start flex-col"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <div className="flex items-center gap-2">
                      <Badge variant={getCategoryBadgeVariant(item.category)}>
                        {item.category}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(item.status)}>
                        {item.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  <p className="text-sm text-foreground line-clamp-2 w-full">
                    {item.message_preview}
                  </p>

                  <p className="text-xs text-muted-foreground mt-1 w-full">
                    {item.user_name || item.user_email}
                  </p>
                </Button>
              ))}

              {data?.items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No feedback found.
                </p>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">
                      {data?.total} feedback items total
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= totalPages - 1}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AdminFeedbackDetailDialog
        feedbackId={selectedFeedbackId}
        open={selectedFeedbackId !== null}
        onOpenChange={(open) => !open && setSelectedFeedbackId(null)}
      />
    </>
  );
}
