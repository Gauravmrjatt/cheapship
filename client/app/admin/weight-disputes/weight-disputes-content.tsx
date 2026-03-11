"use client";

import * as React from "react";
import { useState } from "react";
import { useAdminWeightDisputes, useSearchOrdersForDispute, useCreateAdminWeightDispute, AdminOrderForDispute, AdminWeightDispute, CreateWeightDisputePayload } from "@/lib/hooks/use-admin-dispute";
import { useAuth } from "@/lib/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SearchIcon,
  Loading03Icon,
  WeightScale01Icon,
  InformationCircleIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  WalletIcon,
  Clock01Icon,
  SafeIcon,
  ArrowUpRight01Icon,
  ArrowDownLeft01Icon,
  Cancel01Icon
} from "@hugeicons/core-free-icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
function WeightDisputesContent() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("create");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<AdminOrderForDispute | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [appliedWeight, setAppliedWeight] = useState("");
  const [chargedWeight, setChargedWeight] = useState("");
  const [amount, setAmount] = useState("");
  const [actionReason, setActionReason] = useState("");

  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  const weightDiff = appliedWeight && chargedWeight 
    ? parseFloat(chargedWeight) - parseFloat(appliedWeight) 
    : 0;
  const isDeduct = weightDiff > 0;
  const actionType = appliedWeight && chargedWeight 
    ? (parseFloat(chargedWeight) > parseFloat(appliedWeight) ? "DEDUCT" : "REFUND")
    : null;

  const calculateVolumetricWeight = (length: number | null, width: number | null, height: number | null) => {
    if (!length || !width || !height) return null;
    return (Number(length) * Number(width) * Number(height)) / 5000;
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(orderSearchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [orderSearchQuery]);

  const { data: searchResults, isLoading: isSearchingOrders } = useSearchOrdersForDispute(debouncedSearch);
  const { data: disputesData, isLoading: isLoadingDisputes } = useAdminWeightDisputes(page, pageSize, statusFilter, searchQuery);
  const createDispute = useCreateAdminWeightDispute();

  const handleSelectOrder = (order: AdminOrderForDispute) => {
    setSelectedOrder(order);
    setShowOrderDialog(false);
    setOrderSearchQuery("");
    setDebouncedSearch("");
  };

  const handleSubmitDispute = async () => {
    if (!selectedOrder) return;

    const appliedWeightGrams = parseFloat(appliedWeight);
    const chargedWeightGrams = parseFloat(chargedWeight);
    let amountValue = parseFloat(amount);

    const weightType = chargedWeightGrams > appliedWeightGrams ? "MORE" : "LESS";
    
    if (weightType === "LESS") {
      amountValue = -Math.abs(amountValue);
    }

    const payload: CreateWeightDisputePayload = {
      order_id: selectedOrder.id.toString(),
      weight_type: weightType,
      applied_weight: appliedWeightGrams,
      charged_weight: chargedWeightGrams,
      amount: amountValue,
      action_reason: actionReason,
    };

    try {
      await createDispute.mutateAsync(payload);
      setShowConfirmDialog(false);
      setIsFormSubmitted(true);
      setTimeout(() => {
        setIsFormSubmitted(false);
        resetForm();
      }, 3000);
    } catch (error) {
      console.error("Error creating dispute:", error);
    }
  };

  const resetForm = () => {
    setSelectedOrder(null);
    setAppliedWeight("");
    setChargedWeight("");
    setAmount("");
    setActionReason("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><HugeiconsIcon icon={Clock01Icon} className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "ACCEPTED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-3 h-3 mr-1" /> Accepted</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><HugeiconsIcon icon={Cancel01Icon} className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Weight Disputes</h1>
          <p className="text-muted-foreground">Manage weight disputes for orders</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="create">Create Dispute</TabsTrigger>
          <TabsTrigger value="history">Dispute History</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HugeiconsIcon icon={WeightScale01Icon} className="w-5 h-5" />
                  Select Order
                </CardTitle>
                <CardDescription>Search and select an order for weight dispute</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedOrder ? (
                  <Card className="border bg-muted/30">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">Selected Order</CardTitle>
                        <CardDescription>
                          Order and customer details
                        </CardDescription>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(null)}
                      >
                        Change
                      </Button>
                    </CardHeader>

                    <CardContent className="space-y-4">

                      {/* Order Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">

                        <div className="flex justify-between sm:block">
                          <span className="text-muted-foreground">Order ID</span>
                          <Badge variant="secondary">{selectedOrder.id}</Badge>
                        </div>

                        <div className="flex justify-between sm:block">
                          <span className="text-muted-foreground">Tracking</span>
                          <span className="font-medium">
                            {selectedOrder.tracking_number || "N/A"}
                          </span>
                        </div>

                        <div className="flex justify-between sm:block">
                          <span className="text-muted-foreground">User</span>
                          <span className="font-medium">{selectedOrder.user.name}</span>
                        </div>

                        <div className="flex justify-between sm:block">
                          <span className="text-muted-foreground">Mobile</span>
                          <span className="font-medium">{selectedOrder.user.mobile}</span>
                        </div>

                        <div className="flex justify-between sm:block">
                          <span className="text-muted-foreground">Weight</span>
                          <span className="font-medium">
                            {selectedOrder.weight ? `${selectedOrder.weight} kg` : "N/A"}
                          </span>
                        </div>

                        <div className="flex justify-between sm:block">
                          <span className="text-muted-foreground">Shipping Charged</span>
                          <span className="font-medium">
                            ₹{selectedOrder.shipping_charge}
                          </span>
                        </div>

                        <div className="flex justify-between sm:block">
                          <span className="text-muted-foreground">Security Deposit</span>
                          <span className="font-medium">
                            ₹{selectedOrder.user.security_deposit}
                          </span>
                        </div>

                        <div className="flex justify-between sm:block">
                          <span className="text-muted-foreground">Wallet Balance</span>
                          <span className="font-medium">
                            ₹{selectedOrder.user.wallet_balance}
                          </span>
                        </div>

                      </div>

                      {/* Warning */}
                      {selectedOrder.weight_dispute && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertTitle>Existing Dispute</AlertTitle>
                          <AlertDescription>
                            This order already has a{" "}
                            <span className="font-semibold">
                              {selectedOrder.weight_dispute.status}
                            </span>{" "}
                            dispute of{" "}
                            <span className="font-semibold">
                              ₹{selectedOrder.weight_dispute.difference_amount}
                            </span>.
                          </AlertDescription>
                        </Alert>
                      )}

                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full" onClick={() => setShowOrderDialog(true)}>
                      <HugeiconsIcon icon={SearchIcon} className="w-4 h-4 mr-2" />
                      Search & Select Order
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HugeiconsIcon icon={WeightScale01Icon} className="w-5 h-5" />
                  Weight Dispute
                </CardTitle>
                <CardDescription>Enter weights - system will auto calculate deduct or refund</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appliedWeight">Original Weight (grams)</Label>
                    <Input
                      id="appliedWeight"
                      type="number"
                      placeholder="e.g., 500"
                      value={appliedWeight}
                      onChange={(e) => setAppliedWeight(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Weight you declared</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chargedWeight">Courier Charged (grams)</Label>
                    <Input
                      id="chargedWeight"
                      type="number"
                      placeholder="e.g., 1000"
                      value={chargedWeight}
                      onChange={(e) => setChargedWeight(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Weight charged by courier</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Weight Difference:</span>
                    <span className="font-medium">
                      {appliedWeight && chargedWeight 
                        ? `${parseFloat(chargedWeight) - parseFloat(appliedWeight)} grams`
                        : "-"
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Action:</span>
                    <Badge variant={appliedWeight && chargedWeight && parseFloat(chargedWeight) > parseFloat(appliedWeight) ? "destructive" : "default"}>
                      {appliedWeight && chargedWeight 
                        ? (parseFloat(chargedWeight) > parseFloat(appliedWeight) ? "DEDUCT" : "REFUND")
                        : "-"
                      }
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Amount to deduct or refund"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actionReason">Reason</Label>
                  <Textarea
                    id="actionReason"
                    placeholder="Reason for dispute"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    rows={2}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={!selectedOrder || !appliedWeight || !chargedWeight || !amount || !actionReason || createDispute.isPending}
                >
                  {createDispute.isPending ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isFormSubmitted ? (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4 mr-2" />
                      Dispute Created Successfully!
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={WeightScale01Icon} className="w-4 h-4 mr-2" />
                      Create Weight Dispute
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dispute History</CardTitle>
              <CardDescription>View all weight disputes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="Search by order ID, user name, email, or mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
                <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Volumetric Wt</TableHead>
                      <TableHead>Weight (kg)</TableHead>
                      <TableHead>Difference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingDisputes ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <HugeiconsIcon icon={Loading03Icon} className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : disputesData?.data && disputesData.data.length > 0 ? (
                      disputesData.data.map((dispute: AdminWeightDispute) => {
                        const volumetricWeight = calculateVolumetricWeight(
                          dispute.order?.length ?? null,
                          dispute.order?.width ?? null,
                          dispute.order?.height ?? null
                        );
                        return (
                        <TableRow key={dispute.id}>
                          <TableCell className="font-medium">{dispute.order_id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{dispute.user?.name}</div>
                              <div className="text-xs text-muted-foreground">{dispute.user?.mobile}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {volumetricWeight ? `${volumetricWeight.toFixed(2)} kg` : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Applied: {dispute.applied_weight} kg</div>
                              <div className="text-muted-foreground">Charged: {dispute.charged_weight} kg</div>
                            </div>
                          </TableCell>
                          <TableCell className={dispute.difference_amount >= 0 ? "text-red-600" : "text-green-600"}>
                            {dispute.difference_amount >= 0 ? "-" : "+"}₹{dispute.difference_amount}
                          </TableCell>
                          <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(dispute.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      )})
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No disputes found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {disputesData?.pagination && disputesData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {disputesData.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= disputesData.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <SheetContent
          side="right"
          className="flex flex-col min-w-full  md:min-w-[600px] p-0"
        >
          <SheetHeader>
            <SheetTitle>Search Order</SheetTitle>
            <SheetDescription>
              Search by Order ID, Tracking Number, Mobile, or Email
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-4 p-4">
            <Input
              placeholder="Enter search term (min 2 characters)..."
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              autoFocus
            />

            <div className="rounded-md border max-h-[65vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isSearchingOrders ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        <HugeiconsIcon
                          icon={Loading03Icon}
                          className="w-5 h-5 mx-auto animate-spin text-muted-foreground"
                        />
                      </TableCell>
                    </TableRow>
                  ) : searchResults?.data && searchResults.data.length > 0 ? (
                    searchResults.data.map((order: AdminOrderForDispute) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>

                        <TableCell className="text-sm">
                          {order.tracking_number || "N/A"}
                        </TableCell>

                        <TableCell>
                          <div>
                            <div className="font-medium">{order.user.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {order.user.mobile}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {order.weight ? `${order.weight} kg` : "N/A"}
                        </TableCell>

                        <TableCell>
                          {order.weight_dispute ? (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                            >
                              Has Dispute
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 text-xs"
                            >
                              Available
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          <Button
                            size="sm"
                            variant={order.weight_dispute ? "secondary" : "default"}
                            onClick={() => handleSelectOrder(order)}
                            disabled={!!order.weight_dispute}
                          >
                            {order.weight_dispute ? "Has Dispute" : "Select"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : orderSearchQuery.length >= 2 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        Enter at least 2 characters to search
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Weight Dispute</DialogTitle>
            <DialogDescription>
              Please review the details before submitting
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Order ID:</span>
                <p className="font-medium">{selectedOrder?.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">User:</span>
                <p className="font-medium">{selectedOrder?.user.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Original Weight:</span>
                <p className="font-medium">{appliedWeight} grams</p>
              </div>
              <div>
                <span className="text-muted-foreground">Charged Weight:</span>
                <p className="font-medium">{chargedWeight} grams</p>
              </div>
              <div>
                <span className="text-muted-foreground">Action:</span>
                <Badge variant={actionType === "DEDUCT" ? "destructive" : "default"}>
                  {actionType}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Amount:</span>
                <p className="font-medium">₹{amount}</p>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-muted border border-amber-200/10 text-amber-800 text-sm">
              {actionType === "DEDUCT" 
                ? `₹${amount} will be deducted from user's security deposit (first) or wallet balance.`
                : `₹${amount} will be added to user's wallet balance as refund.`
              }
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitDispute} disabled={createDispute.isPending}>
              {createDispute.isPending ? "Processing..." : "Confirm & Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WeightDisputesContent;
