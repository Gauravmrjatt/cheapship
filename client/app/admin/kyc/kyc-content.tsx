"use client";

import * as React from "react";
import { useAdminKyc, AdminKycUser } from "@/lib/hooks/use-admin";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SearchIcon,
  ArrowLeftDoubleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  FilterIcon,
  LeftToRightListBulletIcon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";

import { KycTable } from "./kyc-table";
import { KycDetailsSheet } from "./kyc-details-sheet";

export default function AdminKycPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  const { data, isLoading } = useAdminKyc(page, pageSize, statusFilter, search);

  const [selectedUser, setSelectedUser] = React.useState<AdminKycUser | null>(null);
  const [detailsSheetOpen, setDetailsSheetOpen] = React.useState(false);

  const handleViewDetails = (user: AdminKycUser) => {
    setSelectedUser(user);
    setDetailsSheetOpen(true);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">

      <Tabs
        value={statusFilter}
        onValueChange={handleStatusChange}
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between ">
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="flex w-fit lg:hidden" size="sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">All KYC</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <TabsList className="hidden lg:flex **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
              <TabsTrigger value="ALL">All KYC</TabsTrigger>
              <TabsTrigger value="SUBMITTED">Submitted</TabsTrigger>
              <TabsTrigger value="VERIFIED">Verified</TabsTrigger>
              <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden w-64 lg:block">
              <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search KYC records..."
                className="pl-9 h-8"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            <Button variant="outline" size="sm">
              <HugeiconsIcon icon={FilterIcon} strokeWidth={2} />
              <span className="hidden lg:inline">Filters</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                <HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={2} data-icon="inline-start" />
                <span className="hidden lg:inline">Columns</span>
                <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuCheckboxItem checked={true}>User Details</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={true}>Contact</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={true}>KYC Status</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={true}>Documents</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="relative flex flex-col gap-4">
          <KycTable 
            data={data?.data || []}
            isLoading={isLoading}
            pageSize={pageSize}
            onViewDetails={handleViewDetails}
          />

          <div className="flex items-center justify-between px-4">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
              Total {data?.pagination?.total || 0} KYC records found.
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium">Rows per page</Label>
                <Select value={`${pageSize}`} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectGroup>
                      {[10, 20, 50].map((size) => (
                        <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Page {page} of {data?.pagination?.totalPages || 1}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button variant="outline" className="size-8" size="icon" onClick={() => setPage(1)} disabled={page === 1}>
                  <HugeiconsIcon icon={ArrowLeftDoubleIcon} strokeWidth={2} />
                </Button>
                <Button variant="outline" className="size-8" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
                </Button>
                <Button variant="outline" className="size-8" size="icon" onClick={() => setPage(p => Math.min(data?.pagination?.totalPages || 1, p + 1))} disabled={page === (data?.pagination?.totalPages || 1)}>
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                </Button>
                <Button variant="outline" className="size-8" size="icon" onClick={() => setPage(data?.pagination?.totalPages || 1)} disabled={page === (data?.pagination?.totalPages || 1)}>
                  <HugeiconsIcon icon={ArrowRightDoubleIcon} strokeWidth={2} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Tabs>

      <KycDetailsSheet 
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
        user={selectedUser}
      />
    </div>
  );
}
