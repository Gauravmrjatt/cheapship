"use client";

import * as React from "react";
import { 
  useWithdrawReferralCommissions,
  ReferralCommission
} from "@/lib/hooks/use-franchise";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  AiNetworkIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface YieldLogsProps {
  networkStats: any;
  referralCommissions: any;
}

export function YieldLogs({ networkStats, referralCommissions }: YieldLogsProps) {
  const withdrawReferralMutation = useWithdrawReferralCommissions();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  return (
    <>
      <div className="p-6 border-b bg-muted/10 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Referral Network Commissions</p>
          <p className="text-xs text-muted-foreground">Earnings from your multi-level referral structure</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Available to Cashout</p>
            <p className="text-lg font-black text-green-600">{formatCurrency(networkStats?.pending_withdrawable || 0)}</p>
          </div>
          {(networkStats?.pending_withdrawable || 0) > 0 && (
            <Button size="sm" className="bg-green-600 hover:bg-green-700 h-9" onClick={() => confirm(`Withdraw ${formatCurrency(networkStats?.pending_withdrawable || 0)}?`) && withdrawReferralMutation.mutate()} disabled={withdrawReferralMutation.isPending}>
              {withdrawReferralMutation.isPending ? <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" /> : "CASHOUT"}
            </Button>
          )}
        </div>
      </div>
      
      {!referralCommissions?.commissions?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-3 bg-muted rounded-full mb-4">
            <HugeiconsIcon icon={AiNetworkIcon} size={24} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold">No Network Activity</h3>
          <p className="text-sm text-muted-foreground mt-1">Your multi-level referral commissions will appear here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referralCommissions.commissions.map((c: ReferralCommission) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-bold text-[10px]">
                      L{c.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">#{c.order_id.toString().slice(0, 8)}</TableCell>
                  <TableCell className="text-sm">{c.order?.customer_name || "Shipment Partner"}</TableCell>
                  <TableCell className="text-right font-bold text-green-600">+ {formatCurrency(c.amount)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
