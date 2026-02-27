"use client";

import * as React from "react";
import { 
  useSetUserCommissionBounds 
} from "@/lib/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Loading03Icon,
  PercentIcon,
  MinimizeIcon,
  MaximizeIcon,
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

interface CommissionBoundsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string;
  initialMin?: number;
  initialMax?: number;
}

export function CommissionBoundsSheet({
  open,
  onOpenChange,
  userId,
  userName,
  initialMin = 0,
  initialMax = 100,
}: CommissionBoundsSheetProps) {
  const isMounted = React.useRef(true);
  const [minRate, setMinRate] = React.useState<number>(initialMin);
  const [maxRate, setMaxRate] = React.useState<number>(initialMax);
  const setUserBoundsMutation = useSetUserCommissionBounds(isMounted);

  React.useEffect(() => {
    setMinRate(initialMin);
    setMaxRate(initialMax);
  }, [initialMin, initialMax, open]);

  const handleSave = () => {
    if (userId) {
      setUserBoundsMutation.mutate({
        userId,
        min_rate: minRate,
        max_rate: maxRate
      });
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="min-w-dvw md:min-w-[400px] flex flex-col h-full p-0">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <HugeiconsIcon icon={PercentIcon} size={20} />
            </div>
            <div>
              <SheetTitle className="text-xl">Set Commission Bounds</SheetTitle>
              <SheetDescription>For {userName}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-muted/30 rounded-xl p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-2">What are commission bounds?</p>
            <p>These bounds limit what commission rates {userName} can set for their referred franchises. The user will only be able to assign rates within this range.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-min-rate" className="text-sm font-medium">
                Minimum Rate (%)
              </Label>
              <div className="relative">
                <Input
                  id="admin-min-rate"
                  type="number"
                  value={minRate}
                  onChange={(e) => setMinRate(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min={0}
                  max={100}
                  className="h-12 text-lg font-semibold pr-12 focus-visible:ring-1"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <HugeiconsIcon icon={MinimizeIcon} size={18} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-max-rate" className="text-sm font-medium">
                Maximum Rate (%)
              </Label>
              <div className="relative">
                <Input
                  id="admin-max-rate"
                  type="number"
                  value={maxRate}
                  onChange={(e) => setMaxRate(parseFloat(e.target.value) || 0)}
                  placeholder="100"
                  min={0}
                  max={100}
                  className="h-12 text-lg font-semibold pr-12 focus-visible:ring-1"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <HugeiconsIcon icon={MaximizeIcon} size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="p-6 border-t mt-auto">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-11 font-bold"
              onClick={handleSave}
              disabled={setUserBoundsMutation.isPending}
            >
              {setUserBoundsMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
                  Saving...
                </div>
              ) : (
                "Save Bounds"
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
