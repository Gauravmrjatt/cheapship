"use client";

import { useState, useRef } from "react";
import {
  useWalletPlans,
  useCreateWalletPlan,
  useUpdateWalletPlan,
  useDeleteWalletPlan,
  WalletPlan
} from "@/lib/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  WalletIcon,
  PulseIcon,
  Loading03Icon,
  PencilEditIcon,
  RefreshIcon,
  Delete02Icon,
  SearchIcon
} from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WalletPlansContent() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<WalletPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null);

  const isMounted = useRef(true);
  const { data: plansData, isLoading, refetch } = useWalletPlans(statusFilter);
  const createMutation = useCreateWalletPlan(isMounted);
  const updateMutation = useUpdateWalletPlan(isMounted);
  const deleteMutation = useDeleteWalletPlan(isMounted);

  const [formData, setFormData] = useState({
    name: "",
    recharge_amount: "",
    discount_percentage: ""
  });

  const resetForm = () => {
    setFormData({ name: "", recharge_amount: "", discount_percentage: "" });
    setSelectedPlan(null);
  };

  const handleCreate = () => {
    if (!formData.name || !formData.recharge_amount || !formData.discount_percentage) return;
    createMutation.mutate({
      name: formData.name,
      recharge_amount: parseFloat(formData.recharge_amount),
      discount_percentage: parseFloat(formData.discount_percentage)
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        resetForm();
      }
    });
  };

  const handleEdit = () => {
    if (!selectedPlan || !formData.name || !formData.recharge_amount || !formData.discount_percentage) return;
    updateMutation.mutate({
      id: selectedPlan.id,
      name: formData.name,
      recharge_amount: parseFloat(formData.recharge_amount),
      discount_percentage: parseFloat(formData.discount_percentage)
    }, {
      onSuccess: () => {
        setIsEditOpen(false);
        resetForm();
      }
    });
  };

  const openEditDialog = (plan: WalletPlan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      recharge_amount: plan.recharge_amount.toString(),
      discount_percentage: plan.discount_percentage.toString()
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (plan: WalletPlan) => {
    setSelectedPlan(plan);
    setIsDeleteOpen(true);
  };

  const togglePlanStatus = (plan: WalletPlan) => {
    setUpdatingPlanId(plan.id);
    updateMutation.mutate({
      id: plan.id,
      is_active: !plan.is_active
    }, {
      onSettled: () => {
        setUpdatingPlanId(null);
      }
    });
  };

  const allPlans = plansData?.data || [];
  const filteredPlans = searchQuery
    ? allPlans.filter(plan => 
        plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.recharge_amount.toString().includes(searchQuery)
      )
    : allPlans;

  const plans = filteredPlans;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
          <Select
            value={statusFilter}
            onValueChange={(v) => { if (v) setStatusFilter(v); }}
          >
            <SelectTrigger className="flex w-fit lg:hidden" size="sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v)} className="hidden lg:flex">
            <TabsList>
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <div className="relative w-full sm:w-64 min-w-[150px]">
            <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search plans..."
              className="pl-9 h-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <HugeiconsIcon icon={RefreshIcon} className="size-4" />
          </Button>
          <Button
            className="font-bold"
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
          >
            <HugeiconsIcon icon={PulseIcon} className="mr-2 size-4" />
            Add Plan
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={WalletIcon} className="size-5" />
            Recharge Offers
          </CardTitle>
          <CardDescription>
            Configure discount percentages for different recharge amounts
          </CardDescription>
        </CardHeader>
        <CardContent>

          {isLoading ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Recharge Amount (₹)</TableHead>
                    <TableHead>Discount (%)</TableHead>
                    <TableHead>Bonus Amount (₹)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No plans match your search." : "No wallet plans found. Create one to get started."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Recharge Amount (₹)</TableHead>
                  <TableHead>Discount (%)</TableHead>
                  <TableHead>Bonus Amount (₹)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => {
                  const isUpdating = updatingPlanId === plan.id;
                  return (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>₹{plan.recharge_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          +₹{plan.discount_percentage.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        Equal to recharge amount
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={plan.is_active}
                            onCheckedChange={() => togglePlanStatus(plan)}
                            disabled={isUpdating || updateMutation.isPending}
                          />
                          <span className={plan.is_active ? "text-green-600" : "text-muted-foreground"}>
                            {isUpdating ? (
                              <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                            ) : plan.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(plan)}
                            disabled={updateMutation.isPending}
                          >
                            <HugeiconsIcon icon={PencilEditIcon} className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(plan)}
                            className="text-destructive"
                            disabled={deleteMutation.isPending}
                          >
                            <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Wallet Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input
                placeholder="e.g., Silver Plan, Gold Plan"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Recharge Amount (₹)</Label>
              <Input
                type="number"
                placeholder="e.g., 10000"
                value={formData.recharge_amount}
                onChange={(e) => setFormData({ ...formData, recharge_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Discount Percentage (%)</Label>
              <Input
                type="number"
                placeholder="e.g., 10"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <HugeiconsIcon icon={Loading03Icon} className="mr-2 size-4 animate-spin" />
              ) : null}
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Wallet Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input
                placeholder="e.g., Silver Plan"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Recharge Amount (₹)</Label>
              <Input
                type="number"
                placeholder="e.g., 10000"
                value={formData.recharge_amount}
                onChange={(e) => setFormData({ ...formData, recharge_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Discount Percentage (%)</Label>
              <Input
                type="number"
                placeholder="e.g., 10"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <HugeiconsIcon icon={Loading03Icon} className="mr-2 size-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Wallet Plan</DialogTitle>
          </DialogHeader>
          <p className="py-2">
            Choose how you want to delete this wallet plan:
          </p>
          <div className="flex flex-col gap-3 py-2">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedPlan?.id) {
                  deleteMutation.mutate({ id: selectedPlan.id, permanent: false }, {
                    onSuccess: () => {
                      setIsDeleteOpen(false);
                      resetForm();
                    }
                  });
                }
              }}
              disabled={deleteMutation.isPending}
              className="w-full justify-start"
            >
              <HugeiconsIcon icon={RefreshIcon} className="mr-2 size-4" />
              Deactivate (Can be activated again)
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedPlan?.id) {
                  deleteMutation.mutate({ id: selectedPlan.id, permanent: true }, {
                    onSuccess: () => {
                      setIsDeleteOpen(false);
                      resetForm();
                    }
                  });
                }
              }}
              disabled={deleteMutation.isPending}
              className="w-full justify-start"
            >
              <HugeiconsIcon icon={Delete02Icon} className="mr-2 size-4" />
              Delete Permanently
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}