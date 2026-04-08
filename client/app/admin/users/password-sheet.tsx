"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useHttp } from "@/lib/hooks/use-http";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Loading03Icon,
  LockPasswordIcon,
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

interface PasswordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string;
}

export function PasswordSheet({
  open,
  onOpenChange,
  userId,
  userName,
}: PasswordSheetProps) {
  const http = useHttp();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const changePasswordMutation = useMutation(
    http.patch(`/admin/users/${userId}/password`, {
      onSuccess: () => {
        sileo.success({ title: "Success", description: "Password updated successfully" });
        setPassword("");
        setConfirmPassword("");
        setError("");
        onOpenChange(false);
      },
      onError: (err: any) => {
        setError(err.message || "Failed to update password");
      }
    })
  );

  const handleSave = () => {
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    changePasswordMutation.mutate({ new_password: password });
  };

  React.useEffect(() => {
    if (!open) {
      setPassword("");
      setConfirmPassword("");
      setError("");
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col min-w-full md:min-w-[400px] p-0">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <HugeiconsIcon icon={LockPasswordIcon} size={20} className="text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Change Password</SheetTitle>
              <SheetDescription>Reset password for {userName}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
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
            disabled={changePasswordMutation.isPending || !password || !confirmPassword}
            className="flex-1"
          >
            {changePasswordMutation.isPending ? (
              <HugeiconsIcon icon={Loading03Icon} className="animate-spin mr-2" size={16} />
            ) : null}
            Save Password
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}