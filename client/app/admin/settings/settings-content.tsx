"use client";

import { useState, useEffect, useRef } from "react";
import { 
  useGlobalSettings, 
  useUpdateGlobalSettings,
  useReferralLevelSetting,
  useUpdateReferralLevelSetting,
  useCommissionLimits,
  useUpdateCommissionLimits,
  useSecurityRefundDays,
  useUpdateSecurityRefundDays
} from "@/lib/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Globe02Icon, 
  PercentIcon, 
  Loading03Icon,
  Layers01Icon,
  SlidersHorizontalIcon,
  Calendar02Icon
} from "@hugeicons/core-free-icons";

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useGlobalSettings();
  const { data: levelSetting, isLoading: levelsLoading } = useReferralLevelSetting();
  const { data: commissionLimits, isLoading: limitsLoading } = useCommissionLimits();
  const { data: refundDaysData, isLoading: refundDaysLoading } = useSecurityRefundDays();
  const updateSettingsMutation = useUpdateGlobalSettings();
  const updateLevelSettingMutation = useUpdateReferralLevelSetting();
  const updateLimitsMutation = useUpdateCommissionLimits();
  const updateRefundDaysMutation = useUpdateSecurityRefundDays();

  const [rate, setRate] = useState<number>(0);
  const [maxLevels, setMaxLevels] = useState<number>(3);
  const [minRate, setMinRate] = useState<number>(0);
  const [maxRate, setMaxRate] = useState<number>(100);
  const [refundDays, setRefundDays] = useState<number>(30);

  const initialized = useRef({ rate: false, levels: false, limits: false, refundDays: false });

  useEffect(() => {
    if (settings?.rate !== undefined && !initialized.current.rate) {
      setRate(settings.rate);
      initialized.current.rate = true;
    }
  }, [settings]);

  useEffect(() => {
    if (levelSetting && !initialized.current.levels) {
      setMaxLevels(levelSetting.max_levels);
      initialized.current.levels = true;
    }
  }, [levelSetting]);

  useEffect(() => {
    if (commissionLimits && !initialized.current.limits) {
      setMinRate(commissionLimits.min_rate);
      setMaxRate(commissionLimits.max_rate);
      initialized.current.limits = true;
    }
  }, [commissionLimits]);

  useEffect(() => {
    if (refundDaysData?.days && !initialized.current.refundDays) {
      setRefundDays(refundDaysData.days);
      initialized.current.refundDays = true;
    }
  }, [refundDaysData]);

  const handleUpdateGlobal = () => {
    updateSettingsMutation.mutate({ rate });
  };

  const handleUpdateMaxLevels = () => {
    updateLevelSettingMutation.mutate({ max_levels: maxLevels });
  };

  const handleUpdateLimits = () => {
    updateLimitsMutation.mutate({ min_rate: minRate, max_rate: maxRate });
  };

  const handleUpdateRefundDays = () => {
    updateRefundDaysMutation.mutate({ days: refundDays });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Global Commission Card */}
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
              onClick={handleUpdateGlobal}
              disabled={isLoading || updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="mr-2 size-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Commission"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Max Referral Levels Card */}
        <Card className="rounded-2xl border-none shadow-sm bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Layers01Icon} className="size-5" />
              Referral Levels
            </CardTitle>
            <CardDescription>
              Set how many levels of referral commissions are paid out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max-levels">Maximum Levels</Label>
              <Input 
                id="max-levels"
                type="number" 
                value={maxLevels} 
                onChange={(e) => setMaxLevels(parseInt(e.target.value) || 0)}
                className="font-bold text-lg h-12"
                placeholder="3"
                min={0}
                max={10}
              />
              <p className="text-xs text-muted-foreground">
                How many levels up the referral chain should earn commissions (0-10).
              </p>
            </div>
            <Button 
              className="w-full h-11 font-bold" 
              onClick={handleUpdateMaxLevels}
              disabled={levelsLoading || updateLevelSettingMutation.isPending}
            >
              {updateLevelSettingMutation.isPending ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Update Levels"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Commission Limits Card */}
        <Card className="rounded-2xl border-none shadow-sm bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={SlidersHorizontalIcon} className="size-5" />
              Commission Limits
            </CardTitle>
            <CardDescription>
              Default min and max commission rates for new users.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-rate">Min Rate (%)</Label>
                <Input 
                  id="min-rate"
                  type="number" 
                  value={minRate} 
                  onChange={(e) => setMinRate(parseFloat(e.target.value) || 0)}
                  className="font-bold text-lg h-12"
                  placeholder="0"
                  min={0}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-rate">Max Rate (%)</Label>
                <Input 
                  id="max-rate"
                  type="number" 
                  value={maxRate} 
                  onChange={(e) => setMaxRate(parseFloat(e.target.value) || 100)}
                  className="font-bold text-lg h-12"
                  placeholder="100"
                  min={0}
                  max={100}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              These values will be used as default min/max commission rates when new users register.
            </p>
            <Button 
              className="w-full h-11 font-bold" 
              onClick={handleUpdateLimits}
              disabled={limitsLoading || updateLimitsMutation.isPending}
            >
              {updateLimitsMutation.isPending ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Update Limits"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Security Refund Days Card */}
        <Card className="rounded-2xl border-none shadow-sm bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Calendar02Icon} className="size-5" />
              Security Refund Days
            </CardTitle>
            <CardDescription>
              Number of days after which security deposit is refunded automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refund-days">Days</Label>
              <Input 
                id="refund-days"
                type="number" 
                value={refundDays} 
                onChange={(e) => setRefundDays(parseInt(e.target.value) || 30)}
                className="font-bold text-lg h-12"
                placeholder="30"
                min={1}
                max={365}
              />
              <p className="text-xs text-muted-foreground">
                Security deposits will be refunded after this many days (1-365 days).
              </p>
            </div>
            <Button 
              className="w-full h-11 font-bold" 
              onClick={handleUpdateRefundDays}
              disabled={refundDaysLoading || updateRefundDaysMutation.isPending}
            >
              {updateRefundDaysMutation.isPending ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Update Days"
              )}
            </Button>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
