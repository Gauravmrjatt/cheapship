"use client";

import { useState, useEffect } from "react";
import { 
  useGlobalSettings, 
  useUpdateGlobalSettings,
  useReferralLevelSetting,
  useUpdateReferralLevelSetting,
  useNetworkCommissionStats
} from "@/lib/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Globe02Icon, 
  PercentIcon, 
  Loading03Icon,
  AiNetworkIcon,
  Layers01Icon,
  MoneyReceiveCircleIcon
} from "@hugeicons/core-free-icons";

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useGlobalSettings();
  const { data: levelSetting, isLoading: levelsLoading } = useReferralLevelSetting();
  const { data: networkStats, isLoading: statsLoading } = useNetworkCommissionStats();
  const updateSettingsMutation = useUpdateGlobalSettings();
  const updateLevelSettingMutation = useUpdateReferralLevelSetting();

  const [rate, setRate] = useState<number>(settings?.rate ?? 0);
  const [maxLevels, setMaxLevels] = useState<number>(3);

  useEffect(() => {
    if (settings?.rate !== undefined) {
      setRate(settings.rate);
    }
  }, [settings]);

  useEffect(() => {
    if (levelSetting) {
      setMaxLevels(levelSetting.max_levels);
    }
  }, [levelSetting]);

  const handleUpdateGlobal = () => {
    updateSettingsMutation.mutate({ rate });
  };

  const handleUpdateMaxLevels = () => {
    updateLevelSettingMutation.mutate({ max_levels: maxLevels });
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

        {/* Network Commission Stats Card */}
        <Card className="rounded-2xl border-none shadow-sm bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={AiNetworkIcon} className="size-5" />
              Network Commissions
            </CardTitle>
            <CardDescription>
              Overview of multi-level referral commission payouts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {statsLoading ? '-' : `₹${Number(networkStats?.total_commission || 0).toLocaleString()}`}
                </p>
                <p className="text-xs text-muted-foreground">Total Commissions</p>
              </div>
              <div className="bg-green-500/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {statsLoading ? '-' : `₹${Number(networkStats?.withdrawn_commission || 0).toLocaleString()}`}
                </p>
                <p className="text-xs text-muted-foreground">Withdrawn</p>
              </div>
            </div>
            <div className="bg-amber-500/5 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">
                {statsLoading ? '-' : `₹${Number(networkStats?.pending_commission || 0).toLocaleString()}`}
              </p>
              <p className="text-xs text-muted-foreground">Pending Withdrawal</p>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {statsLoading ? '-' : `${networkStats?.total_count || 0} commission records total`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How It Works Card */}
      <Card className="rounded-2xl border-none shadow-sm bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={MoneyReceiveCircleIcon} className="size-5" />
            How Multi-Level Commissions Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-muted/30 rounded-xl p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-2">Cascading Commission Structure</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Each user sets their own commission rate for their franchises</li>
                <li>Level 1 referrer earns their commission rate % of the order value</li>
                <li>Level 2 referrer earns their commission rate % of Level 1&apos;s profit</li>
                <li>Level 3 referrer earns their commission rate % of Level 2&apos;s profit</li>
                <li>This continues for the configured number of levels</li>
              </ul>
            </div>
            <div className="bg-primary/5 rounded-xl p-4 text-sm">
              <p className="font-semibold text-foreground mb-2">Example Calculation</p>
              <div className="space-y-2 text-muted-foreground">
                <p><Badge variant="secondary">Order Value</Badge> ₹100 shipping charge</p>
                <p><Badge variant="secondary">Level 1</Badge> User C has 10% rate → earns ₹10</p>
                <p><Badge variant="secondary">Level 2</Badge> User B has 10% rate → earns 10% of ₹10 = ₹1</p>
                <p><Badge variant="secondary">Level 3</Badge> User A has 10% rate → earns 10% of ₹1 = ₹0.10</p>
                <p className="text-xs pt-2 border-t">Each referrer&apos;s commission rate is applied to the previous level&apos;s earnings</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
