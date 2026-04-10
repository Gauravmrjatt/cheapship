"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useHttp } from "@/lib/hooks/use-http";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Loading03Icon,
  MailSendIcon,
} from "@hugeicons/core-free-icons";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter 
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sileo } from "sileo";

interface EmailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string;
  currentEmail: string;
}

export function EmailSheet({
  open,
  onOpenChange,
  userId,
  userName,
  currentEmail,
}: EmailSheetProps) {
  const http = useHttp();
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const changeEmailMutation = useMutation(
    http.patch(`/admin/users/${userId}/email`, {
      onSuccess: () => {
        sileo.success({ title: "Success", description: "Email updated successfully" });
        setEmail("");
        setError("");
        onOpenChange(false);
      },
      onError: (err: any) => {
        setError(err.message || "Failed to update email");
      }
    })
  );

  const handleSave = () => {
    if (!email) {
      setError("Email is required");
      return;
    }
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (email.toLowerCase() === currentEmail.toLowerCase()) {
      setError("New email must be different from current email");
      return;
    }
    setError("");
    changeEmailMutation.mutate({ email });
  };

  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setError("");
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col min-w-full md:min-w-[400px] p-0">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <HugeiconsIcon icon={MailSendIcon} size={20} className="text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Change Email</SheetTitle>
              <SheetDescription>Update email for {userName}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="current-email">Current Email</Label>
            <Input
              id="current-email"
              value={currentEmail}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-email">New Email</Label>
            <Input
              id="new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter new email address"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <SheetFooter className="p-6 border-t mt-auto">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={changeEmailMutation.isPending || !email}
            className="flex-1"
          >
            {changeEmailMutation.isPending ? (
              <HugeiconsIcon icon={Loading03Icon} className="animate-spin mr-2" size={16} />
            ) : null}
            Save Email
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}