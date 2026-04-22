"use client";

import * as React from "react";
import { useState } from "react";
import { useAdminRTODisputes, useSearchOrdersForRTO, useCreateAdminRTODispute, AdminOrderForRTO, CreateRTOPayload } from "@/lib/hooks/use-admin-dispute";
import { AdminRTODisputesDataTable } from "@/components/admin-rto-disputes-data-table";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SearchIcon,
  Loading03Icon,
  DeliveryReturnIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";

function Rtocontent() {
  const [activeTab, setActiveTab] = useState("create");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<AdminOrderForRTO | null>(null);
  const [showOrderSheet, setShowOrderSheet] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [rtoAwb, setRtoAwb] = useState("");

  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(orderSearchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [orderSearchQuery]);

  const { data: searchResults, isLoading: isSearchingOrders } = useSearchOrdersForRTO(debouncedSearch);
  const { data: rtoData, isLoading: isLoadingRTO } = useAdminRTODisputes(page, pageSize, statusFilter, searchQuery);
  const createRTO = useCreateAdminRTODispute();

  const handleFilterChange = (newFilters: { status?: string; search?: string }) => {
    setStatusFilter(newFilters.status || "ALL");
    setSearchQuery(newFilters.search || "");
    setPage(1);
  };

  const handleSelectOrder = (order: AdminOrderForRTO) => {
    setSelectedOrder(order);
    setShowOrderSheet(false);
    setOrderSearchQuery("");
    setDebouncedSearch("");
  };

  const handleSubmitRTO = async () => {
    if (!selectedOrder) return;

    const payload: CreateRTOPayload = {
      order_id: selectedOrder.id.toString(),
      amount: parseFloat(amount),
      reason: reason,
      rto_awb: rtoAwb || undefined
    };

    try {
      await createRTO.mutateAsync(payload);
      setShowConfirmDialog(false);
      setIsFormSubmitted(true);
      setTimeout(() => {
        setIsFormSubmitted(false);
        resetForm();
      }, 3000);
    } catch (error) {
      console.error("Error creating RTO:", error);
    }
  };

  const resetForm = () => {
    setSelectedOrder(null);
    setAmount("");
    setReason("");
    setRtoAwb("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">RTO Management</h1>
          <p className="text-muted-foreground">Manage RTO (Return to Origin) charges</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="create">Create RTO</TabsTrigger>
          <TabsTrigger value="history">RTO History</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HugeiconsIcon icon={SearchIcon} className="w-5 h-5" />
                  Select Order
                </CardTitle>
                <CardDescription>Search and select an order for RTO</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedOrder ? (
                  <Card className="border bg-muted/30">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">Selected Order</CardTitle>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                        Change
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div><span className="text-muted-foreground">Order ID:</span> <span className="font-medium">{selectedOrder.id}</span></div>
                        <div><span className="text-muted-foreground">Tracking:</span> <span className="font-medium">{selectedOrder.tracking_number || "N/A"}</span></div>
                        <div><span className="text-muted-foreground">User:</span> <span className="font-medium">{selectedOrder.user.name}</span></div>
                        <div><span className="text-muted-foreground">Mobile:</span> <span className="font-medium">{selectedOrder.user.mobile}</span></div>
                        <div><span className="text-muted-foreground">Security Deposit:</span> <span className="font-medium">₹{selectedOrder.user.security_deposit}</span></div>
                        <div><span className="text-muted-foreground">Wallet Balance:</span> <span className="font-medium">₹{selectedOrder.user.wallet_balance}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => setShowOrderSheet(true)}>
                    <HugeiconsIcon icon={SearchIcon} className="w-4 h-4 mr-2" />
                    Search & Select Order
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HugeiconsIcon icon={DeliveryReturnIcon} className="w-5 h-5" />
                  RTO Details
                </CardTitle>
                <CardDescription>Enter RTO charge amount</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter RTO amount to deduct"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Amount will be deducted from security deposit first, then from wallet
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Reason for RTO"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rtoAwb">RTO AWB (Optional)</Label>
                  <Input
                    id="rtoAwb"
                    placeholder="Enter RTO tracking AWB"
                    value={rtoAwb}
                    onChange={(e) => setRtoAwb(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the AWB number for the RTO shipment to track it
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={!selectedOrder || !amount || !reason || createRTO.isPending}
                >
                  {createRTO.isPending ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isFormSubmitted ? (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4 mr-2" />
                      RTO Created Successfully!
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={DeliveryReturnIcon} className="w-4 h-4 mr-2" />
                      Create RTO
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">

          <AdminRTODisputesDataTable
            data={rtoData?.data ?? []}
            isLoading={isLoadingRTO}
            filters={{ status: statusFilter, search: searchQuery }}
            onFilterChange={handleFilterChange}
            pagination={{
              currentPage: page,
              pageSize,
              totalPages: rtoData?.pagination?.totalPages ?? 1,
              total: rtoData?.pagination?.total ?? 0,
            }}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />

        </TabsContent>
      </Tabs>

      <Sheet open={showOrderSheet} onOpenChange={setShowOrderSheet}>
        <SheetContent className="flex flex-col min-w-full  md:min-w-[600px] p-0">
          <SheetHeader>
            <SheetTitle>Search Order</SheetTitle>
            <SheetDescription>
              Search by Order ID, Tracking Number, Mobile, or Email
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4 px-4">
            <Input
              placeholder="Enter search term (min 2 characters)..."
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="rounded-md border max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isSearchingOrders ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        <HugeiconsIcon icon={Loading03Icon} className="w-5 h-5 mx-auto animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : searchResults?.data && searchResults.data.length > 0 ? (
                    searchResults.data.map((order: AdminOrderForRTO) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell className="text-sm">{order.tracking_number || "N/A"}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.user.name}</div>
                            <div className="text-xs text-muted-foreground">{order.user.mobile}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.rto_dispute ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                              Has RTO
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                              Available
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={order.rto_dispute ? "secondary" : "default"}
                            onClick={() => handleSelectOrder(order)}
                            disabled={!!order.rto_dispute}
                          >
                            {order.rto_dispute ? "Has RTO" : "Select"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : orderSearchQuery.length >= 2 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
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
            <DialogTitle>Confirm RTO</DialogTitle>
            <DialogDescription>
              Please review before submitting
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
                <span className="text-muted-foreground">Amount:</span>
                <p className="font-medium">₹{amount}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              ₹{amount} will be deducted from user's security deposit (first) or wallet balance.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRTO} disabled={createRTO.isPending}>
              {createRTO.isPending ? "Processing..." : "Confirm & Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Rtocontent;