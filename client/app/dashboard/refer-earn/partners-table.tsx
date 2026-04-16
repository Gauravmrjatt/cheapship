"use client";

import * as React from "react";
import { 
  Franchise,
  useUpdateFranchiseRate,
  useWithdrawCommission,
} from "@/lib/hooks/use-franchise";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Mail01Icon, 
  SmartPhone01Icon, 
  Package01Icon, 
  PercentIcon,
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
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { sileo } from "sileo";

interface PartnersTableProps {
  franchises: Franchise[];
  onViewOrders: (id: string) => void;
  onEditRate: (f: Franchise) => void;
}

export function PartnersTable({ franchises, onViewOrders, onEditRate }: PartnersTableProps) {
  const withdrawMutation = useWithdrawCommission();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const handleWithdraw = (id: string, balance: number) => {
    if (balance <= 0) {
      sileo.error({ title: "Zero Balance" , description : "No funds available for withdrawal" });
      return;
    }
    if (confirm(`Withdraw ${formatCurrency(balance)} to your wallet?`)) {
      withdrawMutation.mutate({ franchiseId: id, amount: balance });
    }
  };

  if (franchises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-3 bg-muted rounded-full mb-4">
          <HugeiconsIcon icon={UserGroupIcon} size={24} className="text-muted-foreground" />
        </div>
        <h3 className="font-semibold">No Franchise Partners</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Share your referral link to start onboarding partners
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Partner Details</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-center">Shipments</TableHead>
            <TableHead className="text-center">Rate (%)</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {franchises.map((f: Franchise) => (
            <TableRow key={f.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                    {f.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{f.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">{f.referer_code}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs space-y-0.5">
                  <div className="flex items-center gap-1.5"><HugeiconsIcon icon={Mail01Icon} size={12} className="opacity-50" />{f.email}</div>
                  <div className="flex items-center gap-1.5"><HugeiconsIcon icon={SmartPhone01Icon} size={12} className="opacity-50" />{f.mobile}</div>
                </div>
              </TableCell>
              <TableCell className="text-center font-medium">{f._count?.orders || 0}</TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className="font-bold">
                  {Number(f.commission_rate) || 0}%
                </Badge>
              </TableCell>
              <TableCell className="text-right font-bold text-green-600">
                {formatCurrency(Number(f.balance || 0))}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => onViewOrders(f.id)} title="Order Logs">
                    <HugeiconsIcon icon={Package01Icon} size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => onEditRate(f)} title="Edit Yield Rate">
                    <HugeiconsIcon icon={PercentIcon} size={16} />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase px-2" onClick={() => handleWithdraw(f.id, f.balance)} disabled={withdrawMutation.isPending || !f.balance || f.balance <= 0}>
                    Payout
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
