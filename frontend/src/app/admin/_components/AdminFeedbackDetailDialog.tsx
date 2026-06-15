"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useAdminFeedbackDetail, useUpdateFeedback } from "@/hooks/api";
import { toast } from "sonner";
import type { FeedbackStatus } from "@/types/admin";

const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
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

interface AdminFeedbackDetailDialogProps {
  feedbackId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminFeedbackDetailDialog({
  feedbackId,
  open,
  onOpenChange,
}: AdminFeedbackDetailDialogProps) {
  const { data: feedback, isLoading } = useAdminFeedbackDetail(
    open ? feedbackId : null,
  );
  const updateFeedback = useUpdateFeedback();

  const [status, setStatus] = useState<FeedbackStatus>("new");
  const [adminNotes, setAdminNotes] = useState("");
  const [syncedFeedbackId, setSyncedFeedbackId] = useState<number | null>(null);

  // Sync local state when feedback data loads (state-based to satisfy React 19 rules)
  if (feedback && feedback.id !== syncedFeedbackId) {
    setSyncedFeedbackId(feedback.id);
    setStatus(feedback.status);
    setAdminNotes(feedback.admin_notes || "");
  }

  const handleSave = () => {
    if (!feedbackId) return;
    updateFeedback.mutate(
      {
        feedbackId,
        data: { status, admin_notes: adminNotes || undefined },
      },
      {
        onSuccess: () => {
          toast.success("Feedback updated");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const hasChanges =
    feedback &&
    (status !== feedback.status || adminNotes !== (feedback.admin_notes || ""));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Feedback Detail</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={1.5} />
          </div>
        ) : feedback ? (
          <div className="space-y-4">
            {/* User & Meta */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {feedback.user_name || "Unknown User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {feedback.user_email}
                </p>
              </div>
              <Badge variant={getStatusBadgeVariant(feedback.status)}>
                {feedback.status.replace("_", " ")}
              </Badge>
            </div>

            <Separator />

            {/* Category & Date */}
            <div className="flex items-center justify-between">
              <Badge variant="outline">{feedback.category}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(feedback.created_at).toLocaleString()}
              </span>
            </div>

            {/* Message */}
            <div className="bg-elevated rounded-xl p-4 border border-border">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {feedback.message}
              </p>
            </div>

            {/* Metadata */}
            {feedback.metadata_json &&
              Object.keys(feedback.metadata_json).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Context
                  </p>
                  <div className="bg-elevated rounded-lg p-3 border border-border space-y-1">
                    {Object.entries(feedback.metadata_json).map(
                      ([key, value]) => (
                        <div key={key} className="flex gap-2 text-xs">
                          <span className="text-muted-foreground font-medium min-w-20">
                            {key}:
                          </span>
                          <span className="text-foreground break-all">
                            {String(value)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            <Separator />

            {/* Status Update */}
            <div className="space-y-2">
              <Label htmlFor="feedback-status">Status</Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as FeedbackStatus)}
              >
                <SelectTrigger id="feedback-status">
                  <SelectValue />
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

            {/* Admin Notes */}
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes (not visible to user)"
                rows={3}
              />
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={updateFeedback.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateFeedback.isPending || !hasChanges}
          >
            {updateFeedback.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
