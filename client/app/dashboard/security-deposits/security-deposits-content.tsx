"use client";

import { useState } from "react";
import { useSecurityDeposits, SecurityDepositFilters } from "@/lib/hooks/use-security-deposits";
import { SecurityDepositsDataTable } from "@/components/security-deposits-data-table";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { SearchIcon } from "@hugeicons/core-free-icons";

export default function SecurityDepositsContent() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [filters, setFilters] = useState<SecurityDepositFilters>({
    status: "ALL",
    from: "",
    to: "",
    search: "",
  });

  const { data, isLoading, isError } = useSecurityDeposits(page, pageSize, filters);

  const handleFilterChange = (newFilters: SecurityDepositFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSearchSubmit = () => {
    setFilters((prev) => ({ ...prev, search: sidebarSearch }));
    setPage(1);
    setShowSearchDialog(false);
  };

  if (isError) return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <p className="text-destructive">Error fetching security deposits</p>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-9">
          <SecurityDepositsDataTable
            data={data?.data ?? []}
            isLoading={isLoading}
            filters={filters}
            onFilterChange={handleFilterChange}
            pagination={{
              currentPage: page,
              pageSize,
              totalPages: data?.pagination?.totalPages ?? 1,
              total: data?.pagination?.total ?? 0,
            }}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search Deposits</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="relative">
              <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID..."
                className="pl-10"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchSubmit();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSearchDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSearchSubmit}>
                Search
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
