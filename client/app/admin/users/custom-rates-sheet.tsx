"use client";

import * as React from "react";
import { 
  useSetUserCustomRates 
} from "@/lib/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Loading03Icon,
  DeliveryTruck01Icon,
  Add01Icon,
  Delete01Icon,
  PercentIcon,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CustomRatesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string;
  initialRates?: any;
}

export function CustomRatesSheet({
  open,
  onOpenChange,
  userId,
  userName,
  initialRates = {},
}: CustomRatesSheetProps) {
  const isMounted = React.useRef(true);
  const [customRates, setCustomRates] = React.useState<Record<string, { rate: number; slab: number }>>(initialRates || {});
  const [newCourierKey, setNewCourierKey] = React.useState("");
  const setUserCustomRatesMutation = useSetUserCustomRates(isMounted);

  React.useEffect(() => {
    setCustomRates(initialRates || {});
  }, [initialRates, open]);

  const handleAddCustomRate = () => {
    if (newCourierKey && !customRates[newCourierKey]) {
      setCustomRates(prev => ({
        ...prev,
        [newCourierKey]: { rate: 0, slab: 0 }
      }));
      setNewCourierKey("");
    }
  };

  const handleRemoveCustomRate = (key: string) => {
    const next = { ...customRates };
    delete next[key];
    setCustomRates(next);
  };

  const updateCustomRate = (key: string, field: 'rate' | 'slab', value: number) => {
    setCustomRates(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const handleSave = () => {
    if (userId) {
      setUserCustomRatesMutation.mutate({
        userId,
        assigned_rates: customRates
      });
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col min-w-full  md:min-w-[600px] p-0">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
              <HugeiconsIcon icon={DeliveryTruck01Icon} size={20} />
            </div>
            <div>
              <SheetTitle className="text-xl">Service Custom Overrides</SheetTitle>
              <SheetDescription>Set specific rates for {userName}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-muted/30 rounded-xl p-4 text-sm text-muted-foreground">
            <p>Define custom commission rates or fixed slabs for specific courier services. These will <span className="text-foreground font-semibold">override</span> any global or franchise-level commissions.</p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Service Key (e.g. SHIPROCKET, VYOM)"
                value={newCourierKey}
                onChange={(e) => setNewCourierKey(e.target.value.toUpperCase())}
                className="h-10 uppercase font-bold text-xs"
              />
              <Button size="sm" onClick={handleAddCustomRate} disabled={!newCourierKey}>
                <HugeiconsIcon icon={Add01Icon} size={16} className="mr-2" />
                Add
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              {Object.keys(customRates).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                  No custom overrides set.
                </div>
              ) : (
                Object.entries(customRates).map(([key, data]: [string, any]) => (
                  <div key={key} className="p-4 rounded-xl border bg-background space-y-4 shadow-sm relative group">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-black text-[10px] tracking-widest uppercase py-1">
                        {key}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveCustomRate(key)}
                      >
                        <HugeiconsIcon icon={Delete01Icon} size={14} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Override Rate (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={data.rate}
                            onChange={(e) => updateCustomRate(key, 'rate', parseFloat(e.target.value) || 0)}
                            className="h-9 font-bold pr-8"
                          />
                          <HugeiconsIcon icon={PercentIcon} size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Fixed Slab (₹)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={data.slab}
                            onChange={(e) => updateCustomRate(key, 'slab', parseFloat(e.target.value) || 0)}
                            className="h-9 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
              className="flex-1 h-11 font-bold bg-orange-600 hover:bg-orange-700"
              onClick={handleSave}
              disabled={setUserCustomRatesMutation.isPending}
            >
              {setUserCustomRatesMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
                  Saving...
                </div>
              ) : (
                "Apply Overrides"
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
