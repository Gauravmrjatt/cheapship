"use client";

import { useState, useEffect } from "react";
import { useGlobalSettings, useUpdateGlobalSettings } from "@/lib/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { Globe02Icon, PercentIcon, Loading03Icon } from "@hugeicons/core-free-icons";

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useGlobalSettings();
  const updateSettingsMutation = useUpdateGlobalSettings();
  const [rate, setRate] = useState<number>(0);

  useEffect(() => {
    if (settings) {
      setRate(settings.rate);
    }
  }, [settings]);

  const handleUpdate = () => {
    updateSettingsMutation.mutate({ rate });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl border-none shadow-sm bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Globe02Icon} className="size-5" />
              Global Commission
            </CardTitle>
            <CardDescription>
              This percentage is added to the base courier rates for ALL users.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commission-rate">Commission Rate (%)</Label>
              <div className="relative">
                <Input 
                  id="commission-rate"
                  type="number" 
                  value={rate} 
                  onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                  className="pl-9 font-bold text-lg h-12"
                  placeholder="0"
                />
                <HugeiconsIcon icon={PercentIcon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Example: If courier rate is ₹100 and global commission is 10%, the base rate shown to users (before their own markup) will be ₹110.
              </p>
            </div>
            <Button 
              className="w-full h-11 font-bold" 
              onClick={handleUpdate}
              disabled={isLoading || updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="mr-2 size-4 animate-spin" />
                  Updating...
                </>
              ) : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
