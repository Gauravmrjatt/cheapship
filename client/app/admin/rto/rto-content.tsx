"use client";

import * as React from "react";
import { useState } from "react";
import { useAdminRTODisputes, useSearchOrdersForRTO, useCreateAdminRTODispute, AdminOrderForRTO, AdminRTODispute, CreateRTOPayload } from "@/lib/hooks/use-admin-dispute";
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
  Clock01Icon,
  Cancel01Icon
} from "@hugeicons/core-free-icons";

function Rtocontent() {
  const [activeTab, setActiveTab] = useState("create");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderForRTO | null>(null);
  const [showOrderSheet, setShowOrderSheet] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  
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
      reason: reason
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
          <Card>
            <CardHeader>
              <CardTitle>RTO History</CardTitle>
              <CardDescription>View all RTO records</CardDescription>
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
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingRTO ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <HugeiconsIcon icon={Loading03Icon} className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : rtoData?.data && rtoData.data.length > 0 ? (
                      rtoData.data.map((rto: AdminRTODispute) => (
                        <TableRow key={rto.id}>
                          <TableCell className="font-medium">{rto.order_id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{rto.user?.name}</div>
                              <div className="text-xs text-muted-foreground">{rto.user?.mobile}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{rto.reason}</TableCell>
                          <TableCell>{getStatusBadge(rto.status)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(rto.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No RTO records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {rtoData?.pagination && rtoData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {rtoData.pagination.totalPages}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= rtoData.pagination.totalPages}>
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
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
