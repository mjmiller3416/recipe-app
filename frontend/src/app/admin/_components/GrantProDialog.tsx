"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface GrantProDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string | null;
  onConfirm: (grantedProUntil: string, grantedBy: string) => void;
  isLoading?: boolean;
}

export function GrantProDialog({
  open,
  onOpenChange,
  userName,
  onConfirm,
  isLoading = false,
}: GrantProDialogProps) {
  // Default to 30 days from now
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 30);
  const defaultDateStr = defaultDate.toISOString().split("T")[0];

  const [expirationDate, setExpirationDate] = useState(defaultDateStr);
  const [grantedBy, setGrantedBy] = useState("Admin");

  const handleConfirm = () => {
    // Convert date to ISO datetime string (end of day)
    const datetime = new Date(`${expirationDate}T23:59:59Z`).toISOString();
    onConfirm(datetime, grantedBy);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grant Pro Access</DialogTitle>
          <DialogDescription>
            Grant temporary pro access to {userName || "this user"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="expiration-date">Access expires on</Label>
            <Input
              id="expiration-date"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="granted-by">Granted by</Label>
            <Input
              id="granted-by"
              value={grantedBy}
              onChange={(e) => setGrantedBy(e.target.value)}
              placeholder="Admin name or reason"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !expirationDate || !grantedBy}
          >
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />
            )}
            Grant Access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
